use tauri::{AppHandle, Manager, SystemTray, SystemTrayEvent};

#[cfg(not(target_os = "macos"))]
use tauri::{CustomMenuItem, SystemTrayMenu, SystemTrayMenuItem};

/// 创建系统托盘（Windows/Linux 用）
pub fn create_tray() -> SystemTray {
    // 在 Windows/Linux 上创建带菜单的托盘
    // 在 macOS 上只创建简单的托盘图标（菜单在应用菜单栏）
    #[cfg(not(target_os = "macos"))]
    {
        create_tray_with_menu()
    }

    #[cfg(target_os = "macos")]
    {
        // macOS：托盘图标不需要菜单，只用于显示/隐藏窗口
        SystemTray::new()
    }
}

/// 创建带菜单的托盘（Windows/Linux）
#[cfg(not(target_os = "macos"))]
fn create_tray_with_menu() -> SystemTray {
    let show = CustomMenuItem::new("show".to_string(), "显示主窗口");
    let status = CustomMenuItem::new("status".to_string(), "服务器：已停止").disabled();
    let start = CustomMenuItem::new("start".to_string(), "启动服务");
    let stop = CustomMenuItem::new("stop".to_string(), "停止服务").disabled();
    let restart = CustomMenuItem::new("restart".to_string(), "重启服务").disabled();
    let logs = CustomMenuItem::new("logs".to_string(), "查看日志");
    let settings = CustomMenuItem::new("settings".to_string(), "设置");
    let quit = CustomMenuItem::new("quit".to_string(), "退出");

    let tray_menu = SystemTrayMenu::new()
        .add_item(show)
        .add_native_item(SystemTrayMenuItem::Separator)
        .add_item(status)
        .add_item(start)
        .add_item(stop)
        .add_item(restart)
        .add_item(logs)
        .add_native_item(SystemTrayMenuItem::Separator)
        .add_item(settings)
        .add_item(quit);

    SystemTray::new().with_menu(tray_menu)
}

/// 更新托盘菜单状态（仅 Windows/Linux）
pub fn update_tray_menu(app: &AppHandle, running: bool, port: Option<u16>) {
    #[cfg(not(target_os = "macos"))]
    {
        let status_text = if running {
            if let Some(p) = port {
                format!("服务器：运行中 ({})", p)
            } else {
                "服务器：运行中".to_string()
            }
        } else {
            "服务器：已停止".to_string()
        };
        let _ = app.tray_handle().get_item("status").set_title(&status_text);

        // 更新启动按钮状态
        let _ = app.tray_handle().get_item("start").set_enabled(!running);

        // 更新停止和重启按钮状态
        let _ = app.tray_handle().get_item("stop").set_enabled(running);
        let _ = app.tray_handle().get_item("restart").set_enabled(running);
    }

    // macOS: 更新应用菜单（通过 app state 或其他方式）
    #[cfg(target_os = "macos")]
    {
        // macOS 的菜单更新会在 main.rs 中通过应用菜单处理
        let _ = (app, running, port); // 避免未使用警告
    }
}

/// 处理托盘事件
pub fn handle_tray_event(app: &AppHandle, event: SystemTrayEvent) {
    match event {
        SystemTrayEvent::LeftClick { .. } => {
            // 所有平台：左键点击切换窗口显示/隐藏
            if let Some(window) = app.get_window("main") {
                if window.is_visible().unwrap_or(false) {
                    let _ = window.hide();
                } else {
                    let _ = window.show();
                    let _ = window.set_focus();
                }
            }
        }
        SystemTrayEvent::MenuItemClick { id, .. } => {
            // Windows/Linux：处理右键菜单点击
            match id.as_str() {
                "show" => {
                    if let Some(window) = app.get_window("main") {
                        let _ = window.show();
                        let _ = window.set_focus();
                    }
                }
                "start" => {
                    let _ = app.emit_all("tray-start-server", ());
                }
                "stop" => {
                    let _ = app.emit_all("tray-stop-server", ());
                }
                "restart" => {
                    let _ = app.emit_all("tray-restart-server", ());
                }
                "logs" => {
                    if let Some(window) = app.get_window("main") {
                        let _ = window.show();
                        let _ = window.set_focus();
                        let _ = app.emit_all("navigate-to", "/logs");
                    }
                }
                "settings" => {
                    if let Some(window) = app.get_window("main") {
                        let _ = window.show();
                        let _ = window.set_focus();
                        let _ = app.emit_all("navigate-to", "/settings");
                    }
                }
                "quit" => {
                    std::process::exit(0);
                }
                _ => {}
            }
        }
        _ => {}
    }
}
