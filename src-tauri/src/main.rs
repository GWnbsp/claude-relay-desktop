// Prevents additional console window on Windows in release, DO NOT REMOVE!!
#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

mod commands;
mod server;

use commands::AppState;
use std::path::PathBuf;
use tauri::Manager;

/// 获取默认配置文件路径
fn get_default_config_path(app: &tauri::App) -> String {
    // 优先使用应用数据目录中的配置
    let app_data_dir = app
        .path_resolver()
        .app_data_dir()
        .unwrap_or_else(|| PathBuf::from("."));

    let config_path = app_data_dir.join("config.toml");

    // 如果不存在，尝试使用当前目录的 config.toml
    if !config_path.exists() {
        if let Ok(current_dir) = std::env::current_dir() {
            let current_config = current_dir.join("config.toml");
            if current_config.exists() {
                return current_config.to_string_lossy().to_string();
            }
        }
    }

    config_path.to_string_lossy().to_string()
}

fn main() {
    tauri::Builder::default()
        .setup(|app| {
            // 获取配置文件路径
            let config_path = get_default_config_path(app);
            println!("Using config file: {}", config_path);

            // 初始化应用状态
            app.manage(AppState::new(config_path));

            Ok(())
        })
        .invoke_handler(tauri::generate_handler![
            commands::start_server,
            commands::stop_server,
            commands::get_server_status,
            commands::read_config,
            commands::write_config,
            commands::get_config_path,
            commands::set_config_path,
            commands::validate_config,
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
