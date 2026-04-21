use std::sync::Mutex;
use tauri::{AppHandle, Manager, RunEvent, WindowEvent};
use tauri_plugin_shell::ShellExt;

struct ModelServerState(Mutex<Option<tauri_plugin_shell::process::CommandChild>>);

#[tauri::command]
async fn start_model_server(app: AppHandle) -> Result<(), String> {
    let state = app.state::<ModelServerState>();
    let mut guard = state.0.lock().unwrap();

    // Already running
    if guard.is_some() {
        return Ok(());
    }

    let resource_dir = app
        .path()
        .resource_dir()
        .map_err(|e| e.to_string())?;
    let model_path = resource_dir.join("resources/models/Qwen3-4B-Instruct-2507-Q8_0.gguf");

    let (_, child) = app
        .shell()
        .sidecar("llama-server")
        .map_err(|e| e.to_string())?
        .args([
            "--model",
            model_path.to_str().ok_or("invalid model path")?,
            "--port",
            "11434",
            "-ngl",
            "99",
            "--no-mmap",
        ])
        .spawn()
        .map_err(|e| e.to_string())?;

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
        .invoke_handler(tauri::generate_handler![start_model_server, stop_model_server])
        .build(tauri::generate_context!())
        .expect("error while running tauri application")
        .run(|app, event| {
            if let RunEvent::WindowEvent { event: WindowEvent::Destroyed, .. } = event {
                kill_model_server(app);
            }
        });
}
