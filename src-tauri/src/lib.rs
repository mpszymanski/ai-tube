use std::{path::PathBuf, sync::Mutex};
use futures_util::StreamExt;
use tauri::{AppHandle, Emitter, Manager, RunEvent, WindowEvent};
use tauri_plugin_shell::ShellExt;
use tokio::io::AsyncWriteExt;

const MODEL_FILENAME: &str = "Qwen3-4B-Instruct-2507-Q8_0.gguf";
const MODEL_URL: &str = "https://huggingface.co/ggml-org/Qwen3-4B-Instruct-2507-Q8_0-GGUF/resolve/main/qwen3-4b-instruct-2507-q8_0.gguf?download=true";

struct ModelServerState(Mutex<Option<tauri_plugin_shell::process::CommandChild>>);

fn model_path(app: &AppHandle) -> Result<PathBuf, String> {
    #[cfg(debug_assertions)]
    {
        let dev_path = app
            .path()
            .resource_dir()
            .map_err(|e| e.to_string())?
            .join("resources/models")
            .join(MODEL_FILENAME);
        if dev_path.exists() {
            return Ok(dev_path);
        }
    }
    let data_dir = app.path().app_data_dir().map_err(|e| e.to_string())?;
    Ok(data_dir.join("models").join(MODEL_FILENAME))
}

#[tauri::command]
async fn get_debug_info(app: AppHandle) -> serde_json::Value {
    let resource_dir = app.path().resource_dir().map(|p| p.to_string_lossy().to_string()).unwrap_or_else(|e| e.to_string());
    let app_data_dir = app.path().app_data_dir().map(|p| p.to_string_lossy().to_string()).unwrap_or_else(|e| e.to_string());
    let model = model_path(&app).map(|p| p.to_string_lossy().to_string()).unwrap_or_else(|e| e);
    let model_exists = model_path(&app).map(|p| p.exists()).unwrap_or(false);
    serde_json::json!({
        "resource_dir": resource_dir,
        "app_data_dir": app_data_dir,
        "model_path": model,
        "model_exists": model_exists,
    })
}

#[tauri::command]
async fn model_exists(app: AppHandle) -> Result<bool, String> {
    Ok(model_path(&app)?.exists())
}

#[tauri::command]
async fn download_model(app: AppHandle) -> Result<(), String> {
    let path = model_path(&app)?;
    if let Some(parent) = path.parent() {
        tokio::fs::create_dir_all(parent).await.map_err(|e| e.to_string())?;
    }

    let client = reqwest::Client::new();
    let response = client.get(MODEL_URL).send().await.map_err(|e| e.to_string())?;
    let total = response.content_length().unwrap_or(0);

    let mut file = tokio::fs::File::create(&path).await.map_err(|e| e.to_string())?;
    let mut downloaded: u64 = 0;
    let mut stream = response.bytes_stream();

    while let Some(chunk) = stream.next().await {
        let chunk = chunk.map_err(|e| e.to_string())?;
        file.write_all(&chunk).await.map_err(|e| e.to_string())?;
        downloaded += chunk.len() as u64;
        app.emit("model-download-progress", serde_json::json!({ "downloaded": downloaded, "total": total })).ok();
    }

    Ok(())
}

#[tauri::command]
async fn start_model_server(app: AppHandle) -> Result<(), String> {
    let state = app.state::<ModelServerState>();
    let mut guard = state.0.lock().unwrap();

    if guard.is_some() {
        return Ok(());
    }

    let model = model_path(&app)?;
    let resource_dir = app.path().resource_dir().map_err(|e| e.to_string())?;

    // Strip \\?\ extended-path prefix — it breaks DLL search via PATH on Windows
    let resource_dir_str = resource_dir.to_str().unwrap_or("").trim_start_matches(r"\\?\");
    let dll_dirs = format!("{};{}", resource_dir_str, std::env::var("PATH").unwrap_or_default());

    let (mut rx, child) = app
        .shell()
        .sidecar("llama-server")
        .map_err(|e| e.to_string())?
        .env("PATH", dll_dirs)
        .args([
            "--model",
            model.to_str().ok_or("invalid model path")?,
            "--port",
            "11434",
            "-ngl",
            "99",
            "--no-mmap",
        ])
        .spawn()
        .map_err(|e| e.to_string())?;

    // Forward sidecar stdout/stderr to frontend for debugging
    let app_clone = app.clone();
    tokio::spawn(async move {
        use tauri_plugin_shell::process::CommandEvent;
        while let Some(event) = rx.recv().await {
            match event {
                CommandEvent::Stdout(line) => {
                    app_clone.emit("llama-server-log", String::from_utf8_lossy(&line).to_string()).ok();
                }
                CommandEvent::Stderr(line) => {
                    app_clone.emit("llama-server-log", String::from_utf8_lossy(&line).to_string()).ok();
                }
                CommandEvent::Terminated(status) => {
                    app_clone.emit("llama-server-log", format!("[terminated] code: {:?}", status.code)).ok();
                    break;
                }
                _ => {}
            }
        }
    });

    *guard = Some(child);
    Ok(())
}

fn kill_model_server(app: &AppHandle) {
    let child = {
        let state = app.state::<ModelServerState>();
        state.0.lock().ok().and_then(|mut g| g.take())
    };
    if let Some(c) = child {
        let _ = c.kill();
    }
}

#[tauri::command]
fn stop_model_server(app: AppHandle) {
    kill_model_server(&app);
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .manage(ModelServerState(Mutex::new(None)))
        .plugin(tauri_plugin_opener::init())
        .plugin(tauri_plugin_fs::init())
        .plugin(tauri_plugin_shell::init())
        .invoke_handler(tauri::generate_handler![
            get_debug_info,
            model_exists,
            download_model,
            start_model_server,
            stop_model_server
        ])
        .build(tauri::generate_context!())
        .expect("error while running tauri application")
        .run(|app, event| {
            if let RunEvent::WindowEvent { event: WindowEvent::Destroyed, .. } = event {
                kill_model_server(app);
            }
        });
}
