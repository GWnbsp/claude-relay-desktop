use crate::config::Config;
use crate::logger::LogManager;
use std::path::PathBuf;
use std::process::Stdio;
use tauri::{AppHandle, Manager};
use tokio::io::BufReader;
use tokio::process::{Child, Command};
use tokio::task::JoinHandle;
use tokio::net::TcpListener;
use tokio::time::{sleep, Duration};

pub struct ServerHandle {
    child: Child,
    port: u16,
    log_tasks: Vec<JoinHandle<()>>,
    stderr_buffer: std::sync::Arc<tokio::sync::Mutex<Vec<String>>>,
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

/// 检查端口是否可用
async fn is_port_available(port: u16) -> bool {
    TcpListener::bind(format!("127.0.0.1:{}", port))
        .await
        .is_ok()
}

/// 等待端口被占用（服务启动）
async fn wait_for_port_listening(port: u16, max_wait_secs: u64) -> Result<(), String> {
    let check_interval = Duration::from_millis(100);
    let max_attempts = (max_wait_secs * 1000) / 100;

    for attempt in 0..max_attempts {
        // 尝试连接端口，如果失败说明还没启动
        if tokio::net::TcpStream::connect(format!("127.0.0.1:{}", port)).await.is_ok() {
            return Ok(());
        }

        if attempt < max_attempts - 1 {
            sleep(check_interval).await;
        }
    }

    Err(format!("Server did not start listening on port {} within {} seconds", port, max_wait_secs))
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

        // 检查端口是否已被占用
        if !is_port_available(port).await {
            let err_msg = format!(
                "Port {} is already in use. Please check if another cc-relay-server instance is running, or change the port in config.",
                port
            );
            log_manager.log(err_msg.clone());
            return Err(err_msg);
        }

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

        // 创建一个共享的 stderr 缓冲区，用于在启动失败时提供详细错误信息
        let stderr_buffer = std::sync::Arc::new(tokio::sync::Mutex::new(Vec::new()));

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

        // 启动任务来读取 stderr，同时保存到缓冲区
        if let Some(stderr) = stderr {
            let log_mgr = log_manager.clone();
            let app_handle = tauri_app.clone();
            let buffer = stderr_buffer.clone();
            let task = tokio::spawn(async move {
                use tokio::io::AsyncBufReadExt;
                let reader = BufReader::new(stderr);
                let mut lines = reader.lines();
                while let Ok(Some(line)) = lines.next_line().await {
                    // 清理可能的 ANSI 转义序列
                    let clean_line = strip_ansi_escapes::strip_str(&line);
                    log_mgr.log(format!("[stderr] {}", clean_line));

                    // 保存到缓冲区（最多保留最近 20 行）
                    let mut buf = buffer.lock().await;
                    buf.push(clean_line.clone());
                    if buf.len() > 20 {
                        buf.remove(0);
                    }
                    drop(buf);

                    // 通过 Tauri 事件发送到前端
                    let _ = app_handle.emit_all("server-log", clean_line);
                }
            });
            log_tasks.push(task);
        }

        log_manager.log("Server process spawned, waiting for port to be ready...".to_string());

        // 等待服务器真正启动并监听端口（最多等待 10 秒）
        // 这样可以检测到启动失败的情况（例如配置错误、权限问题等）
        match wait_for_port_listening(port, 10).await {
            Ok(_) => {
                log_manager.log(format!("Server successfully started and listening on port {}", port));
            }
            Err(e) => {
                // 服务启动失败，获取 stderr 缓冲区中的错误信息
                let stderr_lines = stderr_buffer.lock().await;
                let stderr_output = stderr_lines.join("\n");
                drop(stderr_lines);

                // 构建详细的错误消息
                let err_msg = if !stderr_output.is_empty() {
                    // 提取最关键的错误信息
                    if stderr_output.contains("At least one account must be configured") {
                        "At least one account must be configured".to_string()
                    } else if stderr_output.contains("Failed to load config") {
                        format!("Config error: {}", stderr_output.lines().next().unwrap_or(&stderr_output))
                    } else {
                        format!("Server failed to start: {}", stderr_output.lines().next().unwrap_or(&stderr_output))
                    }
                } else {
                    format!("Server process started but failed to listen on port: {}", e)
                };

                log_manager.log(err_msg.clone());

                // 尝试杀死进程
                let _ = child.kill().await;

                // 中止日志任务
                for task in log_tasks {
                    task.abort();
                }

                return Err(err_msg);
            }
        }

        Ok(ServerHandle { child, port, log_tasks, stderr_buffer })
    }

    pub async fn stop(mut self) {
        use tokio::time::{timeout, Duration};

        eprintln!("[ServerHandle::stop] Stopping server (PID: {:?})", self.child.id());

        // 第一步：发送 kill 信号
        if let Err(e) = self.child.kill().await {
            eprintln!("[ServerHandle::stop] Failed to kill process: {}", e);
        } else {
            eprintln!("[ServerHandle::stop] Kill signal sent");
        }

        // 第二步：等待进程真正退出（最多等待 5 秒）
        match timeout(Duration::from_secs(5), self.child.wait()).await {
            Ok(Ok(status)) => {
                eprintln!("[ServerHandle::stop] Process exited with status: {:?}", status);
            }
            Ok(Err(e)) => {
                eprintln!("[ServerHandle::stop] Failed to wait for process: {}", e);
            }
            Err(_) => {
                eprintln!("[ServerHandle::stop] Timeout waiting for process to exit");
                eprintln!("[ServerHandle::stop] Process may still be running - manual cleanup may be required");
            }
        }

        // 第三步：中止日志任务（不再等待它们完成）
        eprintln!("[ServerHandle::stop] Aborting {} log tasks", self.log_tasks.len());
        for task in &self.log_tasks {
            task.abort();
        }

        eprintln!("[ServerHandle::stop] Stop completed");
    }

    pub fn port(&self) -> u16 {
        self.port
    }
}

impl Drop for ServerHandle {
    fn drop(&mut self) {
        eprintln!("[ServerHandle::drop] Cleaning up server process (PID: {:?})", self.child.id());

        // 尝试 kill 子进程
        match self.child.start_kill() {
            Ok(_) => {
                eprintln!("[ServerHandle::drop] Kill signal sent successfully");
            }
            Err(e) => {
                eprintln!("[ServerHandle::drop] Failed to kill process: {}", e);
            }
        }

        // 中止所有日志任务
        for task in &self.log_tasks {
            task.abort();
        }

        eprintln!("[ServerHandle::drop] Cleanup completed");
    }
}
