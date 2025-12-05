use crate::config::Config;
use crate::logger::LogManager;
use std::path::PathBuf;
use std::process::Stdio;
use tauri::{AppHandle, Manager};
use tokio::io::{AsyncBufReadExt, BufReader};
use tokio::process::{Child, Command};
use tokio::task::JoinHandle;

pub struct ServerHandle {
    child: Child,
    port: u16,
    log_tasks: Vec<JoinHandle<()>>,
}

/// 尝试解析 cc-relay-server 可执行路径：
/// 1) 环境变量 CC_RELAY_BIN_PATH
/// 2) 相对于 src-tauri 的 ../target/release/cc-relay-server
/// 3) 相对于 src-tauri 的 ../target/debug/cc-relay-server
/// 4) 当前工作目录 ./target/release/cc-relay-server
/// 5) 当前工作目录 ./target/debug/cc-relay-server
/// 6) Tauri 资源目录（打包后）
/// 7) PATH 中的 cc-relay-server
fn resolve_binary(app: &AppHandle) -> Option<PathBuf> {
    use std::env;

    // 1. 环境变量
    if let Ok(p) = env::var("CC_RELAY_BIN_PATH") {
        let pb = PathBuf::from(p);
        if pb.exists() {
            eprintln!("[resolve_binary] Found via CC_RELAY_BIN_PATH: {:?}", pb);
            return Some(pb);
        }
    }

    // 2-3. 相对于 src-tauri 的路径（开发模式最常见）
    if let Ok(exe_path) = env::current_exe() {
        if let Some(exe_dir) = exe_path.parent() {
            // 从 src-tauri/target/debug 回到项目根目录
            for ancestor_count in 0..4 {
                let mut base = exe_dir.to_path_buf();
                for _ in 0..ancestor_count {
                    if let Some(parent) = base.parent() {
                        base = parent.to_path_buf();
                    }
                }

                for rel in [
                    "target/release/cc-relay-server.exe",
                    "target/release/cc-relay-server",
                    "target/debug/cc-relay-server.exe",
                    "target/debug/cc-relay-server",
                ] {
                    let candidate = base.join(rel);
                    if candidate.exists() {
                        eprintln!("[resolve_binary] Found via exe ancestor: {:?}", candidate);
                        return Some(candidate);
                    }
                }
            }
        }
    }

    // 4-5. 当前工作目录
    if let Ok(cwd) = env::current_dir() {
        for rel in [
            "target/release/cc-relay-server.exe",
            "target/release/cc-relay-server",
            "target/debug/cc-relay-server.exe",
            "target/debug/cc-relay-server",
        ] {
            let candidate = cwd.join(rel);
            if candidate.exists() {
                eprintln!("[resolve_binary] Found via cwd: {:?}", candidate);
                return Some(candidate);
            }
        }
    }

    // 6. Tauri 资源目录（打包后）
    if let Some(res_dir) = app.path_resolver().resource_dir() {
        for name in ["cc-relay-server", "cc-relay-server.exe"] {
            let candidate = res_dir.join(name);
            if candidate.exists() {
                eprintln!("[resolve_binary] Found via resource_dir: {:?}", candidate);
                return Some(candidate);
            }
        }
    }

    // 7. 系统 PATH
    if let Ok(path) = which::which("cc-relay-server") {
        eprintln!("[resolve_binary] Found via PATH: {:?}", path);
        return Some(path);
    }

    eprintln!("[resolve_binary] Not found anywhere");
    None
}

impl ServerHandle {
    pub async fn start(
        app: &AppHandle,
        config_path: String,
        port_hint: Option<u16>,
        log_manager: LogManager,
        tauri_app: tauri::AppHandle,
    ) -> Result<Self, String> {
        // 读取配置获取端口；暂不支持动态覆盖端口，沿用配置
        let config = Config::load(&config_path)
            .map_err(|e| format!("Failed to load config: {}", e))?;
        let port = port_hint.unwrap_or(config.server.port);

        let bin_path = resolve_binary(app).ok_or_else(|| "cc-relay-server not found; ensure packaged externalBin or set CC_RELAY_BIN_PATH".to_string())?;

        log_manager.log(format!("Starting cc-relay-server from: {:?}", bin_path));
        log_manager.log(format!("Using config: {}", config_path));
        log_manager.log(format!("Server will run on port: {}", port));

        let mut cmd = Command::new(&bin_path);
        cmd.arg("--config").arg(&config_path);

        // 设置环境变量，强制使用 UTF-8 输出（避免 Windows 乱码）
        cmd.env("RUST_LOG_STYLE", "never");  // 禁用 ANSI 颜色代码
        #[cfg(target_os = "windows")]
        {
            cmd.env("CHCP", "65001");  // Windows 代码页设置为 UTF-8
        }

        // 捕获 stdout 和 stderr
        cmd.stdout(Stdio::piped());
        cmd.stderr(Stdio::piped());

        let mut child = cmd
            .spawn()
            .map_err(|e| {
                let err_msg = format!("Failed to spawn cc-relay-server: {}", e);
                log_manager.log(err_msg.clone());
                err_msg
            })?;

        // 获取 stdout 和 stderr 的句柄
        let stdout = child.stdout.take();
        let stderr = child.stderr.take();

        let mut log_tasks = Vec::new();

        // 启动任务来读取 stdout
        if let Some(stdout) = stdout {
            let log_mgr = log_manager.clone();
            let app_handle = tauri_app.clone();
            let task = tokio::spawn(async move {
                use tokio::io::AsyncBufReadExt;
                let reader = BufReader::new(stdout);
                let mut lines = reader.lines();
                while let Ok(Some(line)) = lines.next_line().await {
                    // 清理可能的 ANSI 转义序列
                    let clean_line = strip_ansi_escapes::strip_str(&line);
                    log_mgr.log(format!("[stdout] {}", clean_line));
                    // 通过 Tauri 事件发送到前端
                    let _ = app_handle.emit_all("server-log", clean_line);
                }
            });
            log_tasks.push(task);
        }

        // 启动任务来读取 stderr
        if let Some(stderr) = stderr {
            let log_mgr = log_manager.clone();
            let app_handle = tauri_app.clone();
            let task = tokio::spawn(async move {
                use tokio::io::AsyncBufReadExt;
                let reader = BufReader::new(stderr);
                let mut lines = reader.lines();
                while let Ok(Some(line)) = lines.next_line().await {
                    // 清理可能的 ANSI 转义序列
                    let clean_line = strip_ansi_escapes::strip_str(&line);
                    log_mgr.log(format!("[stderr] {}", clean_line));
                    // 通过 Tauri 事件发送到前端
                    let _ = app_handle.emit_all("server-log", clean_line);
                }
            });
            log_tasks.push(task);
        }

        log_manager.log("Server process started successfully".to_string());

        Ok(ServerHandle { child, port, log_tasks })
    }

    pub async fn stop(self) {
        let mut child = self.child;
        let log_tasks = self.log_tasks;

        // 尝试优雅退出（向进程发送终止信号）
        let _ = child.kill().await;

        // 等待日志读取任务完成
        for task in log_tasks {
            let _ = task.await;
        }
    }

    pub fn port(&self) -> u16 {
        self.port
    }
}
