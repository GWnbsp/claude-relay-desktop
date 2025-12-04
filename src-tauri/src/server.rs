use crate::config::Config;
use std::path::PathBuf;
use tauri::AppHandle;
use tokio::process::{Child, Command};

pub struct ServerHandle {
    child: Child,
    port: u16,
}

/// 尝试解析 cc-relay-server 可执行路径：
/// 1) 打包资源目录 externalBin（tauri resource_dir）
/// 2) 环境变量 CC_RELAY_BIN_PATH
/// 3) 当前工作目录 ./target/release/cc-relay-server
/// 4) 当前工作目录 ./target/debug/cc-relay-server
/// 5) PATH 中的 cc-relay-server
fn resolve_binary(app: &AppHandle) -> Option<PathBuf> {
    if let Some(res_dir) = app.path_resolver().resource_dir() {
        for name in ["cc-relay-server", "cc-relay-server.exe"] {
            let candidate = res_dir.join(name);
            if candidate.exists() {
                return Some(candidate);
            }
        }
    }

    if let Ok(p) = std::env::var("CC_RELAY_BIN_PATH") {
        let pb = PathBuf::from(p);
        if pb.exists() {
            return Some(pb);
        }
    }

    if let Ok(cwd) = std::env::current_dir() {
        for rel in ["target/release/cc-relay-server", "target/debug/cc-relay-server"] {
            let candidate = cwd.join(rel);
            if candidate.exists() {
                return Some(candidate);
            }
        }
    }

    which::which("cc-relay-server").ok()
}

impl ServerHandle {
    pub async fn start(app: &AppHandle, config_path: String, port_hint: Option<u16>) -> Result<Self, String> {
        // 读取配置获取端口；暂不支持动态覆盖端口，沿用配置
        let config = Config::load(&config_path)
            .map_err(|e| format!("Failed to load config: {}", e))?;
        let port = port_hint.unwrap_or(config.server.port);

        let bin_path = resolve_binary(app).ok_or_else(|| "cc-relay-server not found; ensure packaged externalBin or set CC_RELAY_BIN_PATH".to_string())?;

        let mut cmd = Command::new(bin_path);
        cmd.arg("--config").arg(&config_path);
        // 如果需要端口覆盖，可在未来通过临时生成 config 文件实现

        let child = cmd
            .spawn()
            .map_err(|e| format!("Failed to spawn cc-relay-server: {}", e))?;

        Ok(ServerHandle { child, port })
    }

    pub async fn stop(self) {
        let mut child = self.child;
        // 尝试优雅退出（向进程发送终止信号）
        let _ = child.kill().await;
    }

    pub fn port(&self) -> u16 {
        self.port
    }
}
