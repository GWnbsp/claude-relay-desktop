use tauri::{CustomMenuItem, Menu, MenuItem, Submenu, WindowMenuEvent, Manager};

/// 创建 macOS 应用菜单栏
pub fn create_app_menu() -> Menu {
    // App 菜单（macOS 标准）
    let app_menu = Submenu::new(
        "Claude Code Relay",
        Menu::new()
            .add_native_item(MenuItem::About("Claude Code Relay".to_string(), Default::default()))
            .add_native_item(MenuItem::Separator)
            .add_item(CustomMenuItem::new("settings".to_string(), "设置...").accelerator("Cmd+,"))
            .add_native_item(MenuItem::Separator)
            .add_native_item(MenuItem::Hide)
            .add_native_item(MenuItem::HideOthers)
            .add_native_item(MenuItem::ShowAll)
            .add_native_item(MenuItem::Separator)
            .add_native_item(MenuItem::Quit),
    );

    // 服务器菜单
    let server_menu = Submenu::new(
        "服务器",
        Menu::new()
            .add_item(CustomMenuItem::new("server_status".to_string(), "状态: 已停止").disabled())
            .add_native_item(MenuItem::Separator)
            .add_item(CustomMenuItem::new("start_server".to_string(), "启动服务"))
            .add_item(CustomMenuItem::new("stop_server".to_string(), "停止服务").disabled())
            .add_item(CustomMenuItem::new("restart_server".to_string(), "重启服务").disabled()),
    );

    // 窗口菜单
    let window_menu = Submenu::new(
        "窗口",
        Menu::new()
            .add_item(CustomMenuItem::new("logs".to_string(), "日志"))
            .add_native_item(MenuItem::Separator)
            .add_native_item(MenuItem::Minimize)
            .add_native_item(MenuItem::Zoom),
    );

    // 帮助菜单
    let help_menu = Submenu::new(
        "帮助",
        Menu::new()
            .add_item(CustomMenuItem::new("github".to_string(), "GitHub 仓库")),
    );

    Menu::new()
        .add_submenu(app_menu)
        .add_submenu(server_menu)
        .add_submenu(window_menu)
        .add_submenu(help_menu)
}

/// 更新应用菜单状态
pub fn update_app_menu(app: &tauri::AppHandle, running: bool, port: Option<u16>) {
    let status_text = if running {
        if let Some(p) = port {
            format!("状态: 运行中 ({})", p)
        } else {
            "状态: 运行中".to_string()
        }
    } else {
        "状态: 已停止".to_string()
    };

    if let Some(window) = app.get_window("main") {
        let _ = window.menu_handle().get_item("server_status").set_title(&status_text);
        let _ = window.menu_handle().get_item("start_server").set_enabled(!running);
        let _ = window.menu_handle().get_item("stop_server").set_enabled(running);
        let _ = window.menu_handle().get_item("restart_server").set_enabled(running);
    }
}

/// 处理菜单事件
pub fn handle_menu_event(event: WindowMenuEvent) {
    match event.menu_item_id() {
        "settings" => {
            let _ = event.window().app_handle().emit_all("navigate-to", "/settings");
        }
        "start_server" => {
            let _ = event.window().app_handle().emit_all("tray-start-server", ());
        }
        "stop_server" => {
            let _ = event.window().app_handle().emit_all("tray-stop-server", ());
        }
        "restart_server" => {
            let _ = event.window().app_handle().emit_all("tray-restart-server", ());
        }
        "logs" => {
            let _ = event.window().app_handle().emit_all("navigate-to", "/logs");
        }
        "github" => {
            let _ = event.window().shell_scope().open("https://github.com/anthropics/anthropic-sdk-rust", None);
        }
        _ => {}
    }
}
