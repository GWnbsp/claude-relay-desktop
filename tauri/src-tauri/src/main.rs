// Prevents additional console window on Windows in release, DO NOT REMOVE!!
#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

mod app_menu;
mod app_settings;
mod commands;
mod config;
mod logger;
mod server;
mod tray;

use app_settings::AppSettings;
use commands::AppState;
use logger::LogManager;
use std::path::PathBuf;
use std::sync::Mutex;
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
    let tray = tray::create_tray();

    // macOS: 创建应用菜单
    #[cfg(target_os = "macos")]
    let menu = app_menu::create_app_menu();

    // 根据平台配置自动启动
    // 注意: 即使在非 macOS 平台上,也需要提供 MacosLauncher 参数(虽然不会被使用)
    let autostart_config = tauri_plugin_autostart::MacosLauncher::LaunchAgent;

    let mut builder = tauri::Builder::default()
        .plugin(tauri_plugin_autostart::init(
            autostart_config,
            Some(vec!["--minimized"]), // 启动时最小化（可选）
        ))
        .system_tray(tray)
        .on_system_tray_event(tray::handle_tray_event);

    // macOS: 设置应用菜单和菜单事件处理
    #[cfg(target_os = "macos")]
    {
        builder = builder
            .menu(menu)
            .on_menu_event(app_menu::handle_menu_event);
    }

    builder
        .setup(|app| {
            // 获取配置文件路径
            let config_path = get_default_config_path(app);
            println!("Using config file: {}", config_path);

            // 获取日志文件路径（在应用数据目录）
            let log_file_path = app
                .path_resolver()
                .app_data_dir()
                .map(|dir| dir.join("logs").join("app.log"));

            // 创建日志管理器（保留最近 1000 条日志）
            let log_manager = LogManager::new(1000, log_file_path);
            log_manager.log("Application started".to_string());
            log_manager.log(format!("Config path: {}", config_path));

            // 加载应用设置
            let app_settings = AppSettings::load(&app.handle())
                .unwrap_or_else(|e| {
                    log_manager.log(format!("Failed to load app settings: {}, using defaults", e));
                    AppSettings::default()
                });
            log_manager.log(format!("App settings loaded: {:?}", app_settings));

            // 将应用设置保存到状态中
            app.manage(Mutex::new(app_settings.clone()));

            // 初始化应用状态
            app.manage(AppState::new(config_path, log_manager.clone()));

            // 如果启用了自动启动服务，则启动服务器
            let app_handle = app.handle();
            if app_settings.autostart_server {
                log_manager.log("Auto-starting server...".to_string());
                tauri::async_runtime::spawn(async move {
                    let state: tauri::State<AppState> = app_handle.state();
                    if let Err(e) = commands::start_server(state, app_handle.clone()).await {
                        eprintln!("Failed to auto-start server: {}", e);
                    }
                });
            }

            Ok(())
        })
        .on_window_event(|event| {
            if let tauri::WindowEvent::CloseRequested { api, .. } = event.event() {
                let app_handle = event.window().app_handle();

                // 读取应用设置
                if let Some(settings_mutex) = app_handle.try_state::<Mutex<AppSettings>>() {
                    if let Ok(settings) = settings_mutex.lock() {
                        if settings.minimize_to_tray {
                            // 最小化到托盘：隐藏窗口但不退出
                            event.window().hide().unwrap();
                            api.prevent_close();
                            return;
                        }
                    }
                }

                // 默认行为：正常退出
                // 不需要额外操作，让窗口正常关闭
            }
        })
        .invoke_handler(tauri::generate_handler![
            commands::start_server,
            commands::stop_server,
            commands::restart_server,
            commands::get_server_status,
            commands::read_config,
            commands::write_config,
            commands::get_config_path,
            commands::set_config_path,
            commands::validate_config,
            commands::get_account_models,
            commands::tail_logs,
            commands::clear_logs,
            commands::get_dashboard_stats,
            commands::get_app_settings,
            commands::update_app_settings,
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
