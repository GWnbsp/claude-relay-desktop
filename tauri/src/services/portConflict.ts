import { invoke } from '@tauri-apps/api/tauri'

export interface ProcessInfo {
  pid: number
  name: string
  command: string
}

export class PortConflictAPI {
  /**
   * 检查端口是否被占用
   */
  static async checkPortConflict(port: number): Promise<ProcessInfo | null> {
    return invoke('check_port_conflict', { port })
  }

  /**
   * 终止指定进程
   */
  static async killProcess(pid: number): Promise<void> {
    return invoke('kill_process_by_pid', { pid })
  }
}
