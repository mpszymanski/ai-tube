# Downloads the pinned llama.cpp Vulkan Windows release into src-tauri/binaries/.
# Run this once after cloning, and again whenever LLAMA_CPP_TAG is bumped.
#
# Usage:
#   powershell -ExecutionPolicy Bypass -File scripts/fetch-llama-binaries.ps1

$LLAMA_CPP_TAG = "b8871"

$zip_name = "llama-$LLAMA_CPP_TAG-bin-win-vulkan-x64.zip"
$url = "https://github.com/ggml-org/llama.cpp/releases/download/$LLAMA_CPP_TAG/$zip_name"
$tmp = Join-Path $env:TEMP "llama-binaries-$LLAMA_CPP_TAG"
$dest = Join-Path $PSScriptRoot "..\src-tauri\binaries"
$dest = [System.IO.Path]::GetFullPath($dest)

Write-Host "Fetching llama.cpp $LLAMA_CPP_TAG..."
Write-Host "  -> $dest"

New-Item -ItemType Directory -Force -Path $tmp  | Out-Null
New-Item -ItemType Directory -Force -Path $dest | Out-Null

$zip_path = Join-Path $tmp $zip_name
if (-not (Test-Path $zip_path)) {
    Write-Host "Downloading $url ..."
    Invoke-WebRequest -Uri $url -OutFile $zip_path -UseBasicParsing
} else {
    Write-Host "Zip already cached at $zip_path, skipping download."
}

Write-Host "Extracting..."
$extract_dir = Join-Path $tmp "extracted"
Remove-Item -Recurse -Force $extract_dir -ErrorAction SilentlyContinue
Expand-Archive -Path $zip_path -DestinationPath $extract_dir -Force

# llama.cpp changed its zip layout across releases:
#   older: files at zip root
#   newer: files under build/bin/
$bin_dir = $extract_dir
$nested = Join-Path $extract_dir "build\bin"
if (Test-Path $nested) {
    $bin_dir = $nested
}

$server_src = Join-Path $bin_dir "llama-server.exe"
if (-not (Test-Path $server_src)) {
    Write-Error "llama-server.exe not found in extracted archive. Check $bin_dir"
    exit 1
}

$server_dst = Join-Path $dest "llama-server-x86_64-pc-windows-msvc.exe"
Copy-Item $server_src $server_dst -Force
Write-Host "  Copied llama-server.exe"

$dll_count = 0
Get-ChildItem $bin_dir -Filter "*.dll" | ForEach-Object {
    Copy-Item $_.FullName (Join-Path $dest $_.Name) -Force
    $dll_count++
}
Write-Host "  Copied $dll_count DLL(s)"

Write-Host "Done. src-tauri/binaries/ is ready."
