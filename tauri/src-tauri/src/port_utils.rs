use serde::{Deserialize, Serialize};
use std::process::Command;

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ProcessInfo {
    pub pid: u32,
    pub name: String,
    pub command: String,
}

/// 检测占用指定端口的进程
pub fn find_process_by_port(port: u16) -> Result<Option<ProcessInfo>, String> {
    #[cfg(target_os = "windows")]
    {
        find_process_by_port_windows(port)
    }

    #[cfg(target_os = "linux")]
    {
        find_process_by_port_linux(port)
    }

    #[cfg(target_os = "macos")]
    {
        find_process_by_port_macos(port)
    }
}

#[cfg(target_os = "windows")]
fn find_process_by_port_windows(port: u16) -> Result<Option<ProcessInfo>, String> {
    // 使用 netstat 查找占用端口的进程
    let output = Command::new("netstat")
        .args(&["-ano"])
        .output()
        .map_err(|e| format!("Failed to run netstat: {}", e))?;

    let stdout = String::from_utf8_lossy(&output.stdout);

    // 查找占用指定端口的行
    for line in stdout.lines() {
        if line.contains(&format!(":{}", port)) && line.contains("LISTENING") {
            // 提取 PID（最后一列）
            let parts: Vec<&str> = line.split_whitespace().collect();
            if let Some(pid_str) = parts.last() {
                if let Ok(pid) = pid_str.parse::<u32>() {
                    // 使用 tasklist 获取进程名称
                    let task_output = Command::new("tasklist")
                        .args(&["/FI", &format!("PID eq {}", pid), "/FO", "CSV", "/NH"])
                        .output()
                        .map_err(|e| format!("Failed to run tasklist: {}", e))?;

                    let task_stdout = String::from_utf8_lossy(&task_output.stdout);
                    if let Some(first_line) = task_stdout.lines().next() {
                        // CSV 格式: "进程名","PID","...
                        let parts: Vec<&str> = first_line.split(',').collect();
                        if !parts.is_empty() {
                            let name = parts[0].trim_matches('"').to_string();
                            return Ok(Some(ProcessInfo {
                                pid,
                                name: name.clone(),
                                command: name,
                            }));
                        }
                    }

                    return Ok(Some(ProcessInfo {
                        pid,
                        name: "Unknown".to_string(),
                        command: "Unknown".to_string(),
                    }));
                }
            }
        }
    }

    Ok(None)
}

#[cfg(target_os = "linux")]
fn find_process_by_port_linux(port: u16) -> Result<Option<ProcessInfo>, String> {
    // 使用 lsof 或 ss 查找占用端口的进程
    let output = Command::new("lsof")
        .args(&["-i", &format!(":{}", port), "-sTCP:LISTEN", "-t"])
        .output();

    if let Ok(output) = output {
        let stdout = String::from_utf8_lossy(&output.stdout);
        if let Some(pid_str) = stdout.lines().next() {
            if let Ok(pid) = pid_str.parse::<u32>() {
                // 获取进程名称
                if let Ok(ps_output) = Command::new("ps")
                    .args(&["-p", &pid.to_string(), "-o", "comm="])
                    .output()
                {
                    let name = String::from_utf8_lossy(&ps_output.stdout)
                        .trim()
                        .to_string();

                    return Ok(Some(ProcessInfo {
                        pid,
                        name: name.clone(),
                        command: name,
                    }));
                }

                return Ok(Some(ProcessInfo {
                    pid,
                    name: "Unknown".to_string(),
                    command: "Unknown".to_string(),
                }));
            }
        }
    }

    Ok(None)
}

#[cfg(target_os = "macos")]
fn find_process_by_port_macos(port: u16) -> Result<Option<ProcessInfo>, String> {
    // macOS 使用 lsof
    let output = Command::new("lsof")
        .args(&["-i", &format!(":{}", port), "-sTCP:LISTEN", "-t"])
        .output()
        .map_err(|e| format!("Failed to run lsof: {}", e))?;

    let stdout = String::from_utf8_lossy(&output.stdout);
    if let Some(pid_str) = stdout.lines().next() {
        if let Ok(pid) = pid_str.parse::<u32>() {
            // 获取进程名称
            if let Ok(ps_output) = Command::new("ps")
                .args(&["-p", &pid.to_string(), "-o", "comm="])
                .output()
            {
                let name = String::from_utf8_lossy(&ps_output.stdout)
                    .trim()
                    .to_string();

                return Ok(Some(ProcessInfo {
                    pid,
                    name: name.clone(),
                    command: name,
                }));
            }

            return Ok(Some(ProcessInfo {
                pid,
                name: "Unknown".to_string(),
                command: "Unknown".to_string(),
            }));
        }
    }

    Ok(None)
}

/// 终止指定进程
pub fn kill_process(pid: u32) -> Result<(), String> {
    #[cfg(target_os = "windows")]
    {
        Command::new("taskkill")
            .args(&["/F", "/PID", &pid.to_string()])
            .output()
            .map_err(|e| format!("Failed to kill process: {}", e))?;
    }

    #[cfg(not(target_os = "windows"))]
    {
        Command::new("kill")
            .args(&["-9", &pid.to_string()])
            .output()
            .map_err(|e| format!("Failed to kill process: {}", e))?;
    }

    Ok(())
}
