use serde::{Deserialize, Serialize};
use std::sync::Mutex;
use tauri::State;

use crate::server::ServerHandle;

/// 应用全局状态
pub struct AppState {
    pub server_handle: Mutex<Option<ServerHandle>>,
    pub server_port: Mutex<Option<u16>>,
    pub config_path: Mutex<String>,
}

impl AppState {
    pub fn new(config_path: String) -> Self {
        Self {
            server_handle: Mutex::new(None),
            server_port: Mutex::new(None),
            config_path: Mutex::new(config_path),
        }
    }
}

/// 服务器状态
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ServerStatus {
    pub running: bool,
    pub port: Option<u16>,
}

/// 测试结果
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct TestResult {
    pub success: bool,
    pub message: String,
    pub details: Option<String>,
}

/// 启动服务器
#[tauri::command]
pub async fn start_server(state: State<'_, AppState>) -> Result<u16, String> {
    let config_path = state.config_path.lock().unwrap().clone();

    // 启动服务
    let handle = ServerHandle::start(config_path).await?;
    let port = handle.port();

    // 保存状态
    *state.server_port.lock().unwrap() = Some(port);
    *state.server_handle.lock().unwrap() = Some(handle);

    Ok(port)
}

/// 停止服务器
#[tauri::command]
pub async fn stop_server(state: State<'_, AppState>) -> Result<(), String> {
    if let Some(handle) = state.server_handle.lock().unwrap().take() {
        handle.stop().await;
    }
    *state.server_port.lock().unwrap() = None;
    Ok(())
}

/// 获取服务器状态
#[tauri::command]
pub async fn get_server_status(state: State<'_, AppState>) -> Result<ServerStatus, String> {
    let is_running = state.server_handle.lock().unwrap().is_some();
    let port = *state.server_port.lock().unwrap();

    Ok(ServerStatus {
        running: is_running,
        port,
    })
}

/// 读取配置文件
#[tauri::command]
pub async fn read_config(state: State<'_, AppState>) -> Result<String, String> {
    let path = state.config_path.lock().unwrap().clone();
    std::fs::read_to_string(&path)
        .map_err(|e| format!("Failed to read config from {}: {}", path, e))
}

/// 写入配置文件
#[tauri::command]
pub async fn write_config(
    content: String,
    state: State<'_, AppState>,
) -> Result<(), String> {
    let path = state.config_path.lock().unwrap().clone();

    // 写入配置文件
    std::fs::write(&path, &content)
        .map_err(|e| format!("Failed to write config to {}: {}", path, e))?;

    // 重启服务以应用新配置
    stop_server(state.clone()).await?;
    start_server(state).await?;

    Ok(())
}

/// 获取配置文件路径
#[tauri::command]
pub async fn get_config_path(state: State<'_, AppState>) -> Result<String, String> {
    Ok(state.config_path.lock().unwrap().clone())
}

/// 设置配置文件路径
#[tauri::command]
pub async fn set_config_path(
    path: String,
    state: State<'_, AppState>,
) -> Result<(), String> {
    // 验证路径是否存在
    if !std::path::Path::new(&path).exists() {
        return Err(format!("Config file not found: {}", path));
    }

    *state.config_path.lock().unwrap() = path;
    Ok(())
}

/// 验证配置
#[tauri::command]
pub async fn validate_config(content: String) -> Result<bool, String> {
    // TODO: 实现配置验证逻辑
    // 暂时只检查是否为有效的 TOML
    match toml::from_str::<toml::Value>(&content) {
        Ok(_) => Ok(true),
        Err(e) => Err(format!("Invalid TOML: {}", e)),
    }
}
