use std::collections::VecDeque;
use std::fs::{File, OpenOptions};
use std::io::Write;
use std::path::PathBuf;
use std::sync::{Arc, Mutex};
use chrono::Local;

/// 日志管理器：同时保存到内存和文件
#[derive(Clone)]
pub struct LogManager {
    inner: Arc<Mutex<LogManagerInner>>,
}

struct LogManagerInner {
    /// 内存中的日志缓冲区（最多保留最近的 N 条）
    buffer: VecDeque<String>,
    /// 最大缓冲区大小
    max_buffer_size: usize,
    /// 日志文件
    log_file: Option<File>,
}

impl LogManager {
    /// 创建新的日志管理器
    pub fn new(max_buffer_size: usize, log_file_path: Option<PathBuf>) -> Self {
        let log_file = log_file_path.and_then(|path| {
            // 确保父目录存在
            if let Some(parent) = path.parent() {
                std::fs::create_dir_all(parent).ok()?;
            }

            OpenOptions::new()
                .create(true)
                .append(true)
                .open(&path)
                .ok()
        });

        Self {
            inner: Arc::new(Mutex::new(LogManagerInner {
                buffer: VecDeque::with_capacity(max_buffer_size),
                max_buffer_size,
                log_file,
            })),
        }
    }

    /// 添加日志行
    pub fn log(&self, line: String) {
        if let Ok(mut inner) = self.inner.lock() {
            let timestamp = Local::now().format("%Y-%m-%d %H:%M:%S");
            let log_line = format!("[{}] {}", timestamp, line);

            // 添加到内存缓冲区
            if inner.buffer.len() >= inner.max_buffer_size {
                inner.buffer.pop_front();
            }
            inner.buffer.push_back(log_line.clone());

            // 写入文件
            if let Some(ref mut file) = inner.log_file {
                let _ = writeln!(file, "{}", log_line);
                let _ = file.flush();
            }
        }
    }

    /// 获取最近的 N 条日志
    pub fn get_recent_logs(&self, count: usize) -> Vec<String> {
        if let Ok(inner) = self.inner.lock() {
            inner.buffer
                .iter()
                .rev()
                .take(count)
                .rev()
                .cloned()
                .collect()
        } else {
            vec![]
        }
    }

    /// 获取所有日志
    pub fn get_all_logs(&self) -> Vec<String> {
        if let Ok(inner) = self.inner.lock() {
            inner.buffer.iter().cloned().collect()
        } else {
            vec![]
        }
    }

    /// 清空日志缓冲区
    pub fn clear(&self) {
        if let Ok(mut inner) = self.inner.lock() {
            inner.buffer.clear();
        }
    }
}
