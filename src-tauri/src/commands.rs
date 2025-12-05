use serde::{Deserialize, Serialize};
use std::sync::Mutex;
use tauri::{State, api::notification::Notification};

use crate::{app_settings::AppSettings, config::Config, logger::LogManager, server::ServerHandle};

/// 应用全局状态
pub struct AppState {
    pub server_handle: Mutex<Option<ServerHandle>>,
    pub server_port: Mutex<Option<u16>>,
    pub config_path: Mutex<String>,
    pub log_manager: LogManager,
}

impl AppState {
    pub fn new(config_path: String, log_manager: LogManager) -> Self {
        Self {
            server_handle: Mutex::new(None),
            server_port: Mutex::new(None),
            config_path: Mutex::new(config_path),
            log_manager,
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
    let log_manager = state.log_manager.clone();

    // 记录启动日志
    log_manager.log("User requested server start".to_string());

    // ⚠️ 关键修复：检查是否已经有服务器在运行
    let existing_handle = {
        let mut guard = state.server_handle.lock().unwrap();
        guard.take()
    };

    if let Some(old_handle) = existing_handle {
        log_manager.log("Stopping existing server before starting new one".to_string());
        old_handle.stop().await;
    }

    // 启动服务
    match ServerHandle::start(&app, config_path, None, log_manager.clone(), app.clone()).await {
        Ok(handle) => {
            let port = handle.port();

            // 保存状态
            *state.server_port.lock().unwrap() = Some(port);
            *state.server_handle.lock().unwrap() = Some(handle);

            log_manager.log(format!("Server started on port {}", port));

            // 更新托盘菜单
            crate::tray::update_tray_menu(&app, true, Some(port));

            // macOS: 更新应用菜单
            #[cfg(target_os = "macos")]
            crate::app_menu::update_app_menu(&app, true, Some(port));

            // 发送成功通知
            let _ = Notification::new(&app.config().tauri.bundle.identifier)
                .title("Server Started")
                .body(&format!("Claude Code Relay server is now running on port {}", port))
                .show();

            Ok(port)
        }
        Err(e) => {
            log_manager.log(format!("Failed to start server: {}", e));

            // 发送失败通知
            let _ = Notification::new(&app.config().tauri.bundle.identifier)
                .title("Server Start Failed")
                .body(&e)
                .show();

            Err(e)
        }
    }
}

/// 停止服务器
#[tauri::command]
pub async fn stop_server(state: State<'_, AppState>, app: tauri::AppHandle) -> Result<(), String> {
    state.log_manager.log("User requested server stop".to_string());

    let handle_opt = {
        let mut guard = state.server_handle.lock().unwrap();
        guard.take()
    };

    if let Some(handle) = handle_opt {
        handle.stop().await;
        state.log_manager.log("Server stopped successfully".to_string());

        // 发送停止通知
        let _ = Notification::new(&app.config().tauri.bundle.identifier)
            .title("Server Stopped")
            .body("Claude Code Relay server has been stopped")
            .show();
    } else {
        state.log_manager.log("No server running to stop".to_string());
    }
    *state.server_port.lock().unwrap() = None;

    // 更新托盘菜单
    crate::tray::update_tray_menu(&app, false, None);

    // macOS: 更新应用菜单
    #[cfg(target_os = "macos")]
    crate::app_menu::update_app_menu(&app, false, None);

    Ok(())
}

/// 重启服务器
#[tauri::command]
pub async fn restart_server(state: State<'_, AppState>, app: tauri::AppHandle) -> Result<u16, String> {
    state.log_manager.log("User requested server restart".to_string());

    // 发送重启通知
    let _ = Notification::new(&app.config().tauri.bundle.identifier)
        .title("Server Restarting")
        .body("Claude Code Relay server is restarting...")
        .show();

    // 先停止现有服务器
    stop_server(state.clone(), app.clone()).await?;

    // 等待一小段时间确保端口释放
    tokio::time::sleep(tokio::time::Duration::from_millis(500)).await;

    // 启动新服务器（通知已在 start_server 中处理）
    start_server(state, app).await
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
    app: tauri::AppHandle,
) -> Result<(), String> {
    let path = state.config_path.lock().unwrap().clone();
    let log_manager = state.log_manager.clone();

    // 检查服务器是否正在运行
    let was_running = state.server_handle.lock().unwrap().is_some();
    let previous_port = *state.server_port.lock().unwrap();

    log_manager.log(format!("Writing config, server was running: {}", was_running));

    // 写入配置文件
    std::fs::write(&path, &content)
        .map_err(|e| format!("Failed to write config to {}: {}", path, e))?;

    log_manager.log("Config file written successfully".to_string());

    // 如果服务器之前在运行，则停止并重启以应用新配置
    if was_running {
        log_manager.log("Restarting server to apply new configuration...".to_string());

        // 发送重启通知
        let _ = tauri::api::notification::Notification::new(&app.config().tauri.bundle.identifier)
            .title("Server Restarting")
            .body("Applying new configuration...")
            .show();

        // 停止服务器
        stop_server(state.clone(), app.clone()).await?;

        // 重新启动服务器（使用新配置）
        match start_server(state.clone(), app.clone()).await {
            Ok(new_port) => {
                log_manager.log(format!("Server restarted successfully on port {}", new_port));
                Ok(())
            }
            Err(e) => {
                log_manager.log(format!("Failed to restart server: {}", e));
                Err(format!("Config saved, but failed to restart server: {}", e))
            }
        }
    } else {
        log_manager.log("Server was not running, no restart needed".to_string());
        Ok(())
    }
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

    eprintln!("[get_account_models] Found {} accounts", config.accounts.len());

    let accounts = config
        .accounts
        .iter()
        .enumerate()
        .map(|(idx, acc)| {
            let summary = match acc {
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
            };
            eprintln!("[get_account_models] Account {}: id='{}', name='{}', type='{}'",
                idx, summary.id, summary.name, summary.account_type);
            summary
        })
        .collect();

    Ok(accounts)
}

/// 获取最近的日志
#[tauri::command]
pub async fn tail_logs(state: State<'_, AppState>, count: Option<usize>) -> Result<Vec<String>, String> {
    let count = count.unwrap_or(100);
    Ok(state.log_manager.get_recent_logs(count))
}

/// 清空日志缓冲区
#[tauri::command]
pub async fn clear_logs(state: State<'_, AppState>) -> Result<(), String> {
    state.log_manager.clear();
    state.log_manager.log("Logs cleared by user".to_string());
    Ok(())
}

/// 仪表盘统计数据（仅从配置文件读取）
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct DashboardStats {
    pub active_accounts: i64,
    pub total_accounts: i64,
}

/// 获取仪表盘统计数据
#[tauri::command]
pub async fn get_dashboard_stats(state: State<'_, AppState>) -> Result<DashboardStats, String> {
    let config_path = state.config_path.lock().unwrap().clone();
    let config = Config::load(&config_path).map_err(|e| format!("Failed to load config: {}", e))?;

    let total_accounts = config.accounts.len() as i64;
    let active_accounts = config.accounts.iter().filter(|acc| match acc {
        crate::config::AccountConfig::ClaudeOauth { enabled, .. } => *enabled,
        crate::config::AccountConfig::ClaudeApi { enabled, .. } => *enabled,
        crate::config::AccountConfig::Gemini { enabled, .. } => *enabled,
        crate::config::AccountConfig::OpenaiResponses { enabled, .. } => *enabled,
    }).count() as i64;

    Ok(DashboardStats {
        active_accounts,
        total_accounts,
    })
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

/// 获取应用设置
#[tauri::command]
pub async fn get_app_settings(app: tauri::AppHandle) -> Result<AppSettings, String> {
    AppSettings::load(&app)
}

/// 更新应用设置
#[tauri::command]
pub async fn update_app_settings(
    settings: AppSettings,
    app: tauri::AppHandle,
    settings_state: State<'_, Mutex<AppSettings>>,
) -> Result<(), String> {
    // 保存到文件
    settings.save(&app)?;

    // 更新内存中的状态
    if let Ok(mut state) = settings_state.lock() {
        *state = settings;
    }

    Ok(())
}
