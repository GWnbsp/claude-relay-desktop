use std::net::TcpListener;
use tokio::task::JoinHandle;

pub struct ServerHandle {
    handle: JoinHandle<()>,
    port: u16,
}

impl ServerHandle {
    pub async fn start(config_path: String) -> Result<Self, String> {
        // 查找可用端口
        let port = find_available_port()
            .ok_or_else(|| "No available port found".to_string())?;

        // 克隆配置路径以便在异步任务中使用
        let config_for_task = config_path.clone();

        // 启动异步服务
        let handle = tokio::spawn(async move {
            // 注意：这里需要等 relay-server 暴露一个可以指定端口的函数
            // 目前我们先用一个占位实现
            eprintln!("Server would start on port {} with config {}", port, config_for_task);

            // TODO: 调用 relay_server::run_server(config, port).await
            // 暂时用一个长时间运行的任务来模拟
            loop {
                tokio::time::sleep(tokio::time::Duration::from_secs(1)).await;
            }
        });

        Ok(ServerHandle { handle, port })
    }

    pub async fn stop(self) {
        self.handle.abort();
    }

    pub fn port(&self) -> u16 {
        self.port
    }
}

/// 查找可用端口（3000-4000 范围）
fn find_available_port() -> Option<u16> {
    (3000..4000).find(|port| {
        TcpListener::bind(("127.0.0.1", *port)).is_ok()
    })
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_find_available_port() {
        let port = find_available_port();
        assert!(port.is_some());
        assert!(port.unwrap() >= 3000 && port.unwrap() < 4000);
    }
}
