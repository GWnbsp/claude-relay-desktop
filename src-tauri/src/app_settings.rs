use serde::{Deserialize, Serialize};
use std::fs;
use std::path::PathBuf;

/// 应用设置结构
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct AppSettings {
    /// 开机自启动应用
    pub autostart_on_boot: bool,
    /// 启动时自动运行服务
    pub autostart_server: bool,
    /// 最小化到托盘
    pub minimize_to_tray: bool,
}

impl Default for AppSettings {
    fn default() -> Self {
        Self {
            autostart_on_boot: false,
            autostart_server: false,
            minimize_to_tray: false,
        }
    }
}

impl AppSettings {
    /// 获取设置文件路径
    pub fn get_settings_path(app: &tauri::AppHandle) -> PathBuf {
        app.path_resolver()
            .app_data_dir()
            .unwrap_or_else(|| PathBuf::from("."))
            .join("app_settings.json")
    }

    /// 加载设置文件
    pub fn load(app: &tauri::AppHandle) -> Result<Self, String> {
        let path = Self::get_settings_path(app);

        if !path.exists() {
            // 文件不存在，创建默认设置
            let settings = Self::default();
            settings.save(app)?;
            return Ok(settings);
        }

        let content = fs::read_to_string(&path)
            .map_err(|e| format!("Failed to read app settings: {}", e))?;

        serde_json::from_str(&content)
            .map_err(|e| format!("Failed to parse app settings: {}", e))
    }

    /// 保存设置文件
    pub fn save(&self, app: &tauri::AppHandle) -> Result<(), String> {
        let path = Self::get_settings_path(app);

        // 确保父目录存在
        if let Some(parent) = path.parent() {
            fs::create_dir_all(parent)
                .map_err(|e| format!("Failed to create settings directory: {}", e))?;
        }

        let content = serde_json::to_string_pretty(self)
            .map_err(|e| format!("Failed to serialize settings: {}", e))?;

        fs::write(&path, content)
            .map_err(|e| format!("Failed to write settings file: {}", e))?;

        Ok(())
    }
}
