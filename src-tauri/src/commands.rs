use serde::{Deserialize, Serialize};
use std::sync::Mutex;
use tauri::State;

use crate::{config::Config, server::ServerHandle};

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

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct AccountSummary {
    pub id: String,
    pub name: String,
    pub account_type: String,
    pub platform: String,
    pub priority: u32,
    pub enabled: bool,
}

/// 启动服务器
#[tauri::command]
pub async fn start_server(state: State<'_, AppState>, app: tauri::AppHandle) -> Result<u16, String> {
    let config_path = state.config_path.lock().unwrap().clone();

    // 启动服务
    let handle = ServerHandle::start(&app, config_path, None).await?;
    let port = handle.port();

    // 保存状态
    *state.server_port.lock().unwrap() = Some(port);
    *state.server_handle.lock().unwrap() = Some(handle);

    Ok(port)
}

/// 停止服务器
#[tauri::command]
pub async fn stop_server(state: State<'_, AppState>) -> Result<(), String> {
    let handle_opt = {
        let mut guard = state.server_handle.lock().unwrap();
        guard.take()
    };

    if let Some(handle) = handle_opt {
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
    load_or_create_config(&path)
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
    // 需要 app handle，写 config 后由前端触发 start_server

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
    match Config::load_from_str(&content) {
        Ok(_) => Ok(true),
        Err(e) => Err(format!("Config invalid: {}", e)),
    }
}

/// 获取账户摘要列表（用于前端展示）
#[tauri::command]
pub async fn get_account_models(state: State<'_, AppState>) -> Result<Vec<AccountSummary>, String> {
    let path = state.config_path.lock().unwrap().clone();
    let config = Config::load(&path).map_err(|e| format!("Failed to load config: {}", e))?;

    let accounts = config
        .accounts
        .iter()
        .map(|acc| match acc {
            crate::config::AccountConfig::ClaudeOauth { id, name, priority, enabled, .. } => AccountSummary {
                id: id.clone(),
                name: name.clone(),
                account_type: "claude-oauth".to_string(),
                platform: "claude".to_string(),
                priority: *priority,
                enabled: *enabled,
            },
            crate::config::AccountConfig::ClaudeApi { id, name, priority, enabled, .. } => AccountSummary {
                id: id.clone(),
                name: name.clone(),
                account_type: "claude-api".to_string(),
                platform: "claude".to_string(),
                priority: *priority,
                enabled: *enabled,
            },
            crate::config::AccountConfig::Gemini { id, name, priority, enabled, .. } => AccountSummary {
                id: id.clone(),
                name: name.clone(),
                account_type: "gemini".to_string(),
                platform: "gemini".to_string(),
                priority: *priority,
                enabled: *enabled,
            },
            crate::config::AccountConfig::OpenaiResponses { id, name, priority, enabled, .. } => AccountSummary {
                id: id.clone(),
                name: name.clone(),
                account_type: "openai-responses".to_string(),
                platform: "codex".to_string(),
                priority: *priority,
                enabled: *enabled,
            },
        })
        .collect();

    Ok(accounts)
}

/// 简单返回最近日志占位（未来可改为文件 tail）
#[tauri::command]
pub async fn tail_logs() -> Result<Vec<String>, String> {
    Ok(vec![
        "[log] 功能待实现".to_string(),
        "如果需要实时日志，请在 Tauri 后端接入文件 tail".to_string(),
    ])
}

fn load_or_create_config(path: &str) -> Result<String, String> {
    if std::path::Path::new(path).exists() {
        return std::fs::read_to_string(path)
            .map_err(|e| format!("Failed to read config from {}: {}", path, e));
    }

    // 尝试从当前目录的 config.example.toml 复制
    if let Ok(cwd) = std::env::current_dir() {
        let example = cwd.join("config.example.toml");
        if example.exists() {
            let content = std::fs::read_to_string(&example)
                .map_err(|e| format!("Failed to read example config: {}", e))?;
            std::fs::create_dir_all(
                std::path::Path::new(path)
                    .parent()
                    .unwrap_or(std::path::Path::new(".")),
            )
            .map_err(|e| format!("Failed to create config dir: {}", e))?;
            std::fs::write(path, &content)
                .map_err(|e| format!("Failed to write config to {}: {}", path, e))?;
            return Ok(content);
        }
    }

    // 默认模板
    let default = r#"[server]
host = "127.0.0.1"
port = 3000
database_path = "data/relay.db"
log_level = "info"

api_keys = []

[session]
sticky_ttl_seconds = 3600
renewal_threshold_seconds = 300

[[accounts]]
type = "claude-api"
id = "claude-api-1"
name = "Sample Claude API"
priority = 100
enabled = false
api_key = "replace-me"
"#;

    std::fs::create_dir_all(
        std::path::Path::new(path)
            .parent()
            .unwrap_or(std::path::Path::new(".")),
    )
    .map_err(|e| format!("Failed to create config dir: {}", e))?;
    std::fs::write(path, default)
        .map_err(|e| format!("Failed to write default config to {}: {}", path, e))?;
    Ok(default.to_string())
}
