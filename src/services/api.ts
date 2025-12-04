import { invoke } from '@tauri-apps/api/tauri'

export interface ServerStatus {
  running: boolean
  port?: number
}

export interface AccountSummary {
  id: string
  name: string
  account_type: string
  platform: string
  priority: number
  enabled: boolean
}

export const TauriAPI = {
  startServer: () => invoke<number>('start_server'),
  stopServer: () => invoke<void>('stop_server'),
  getServerStatus: () => invoke<ServerStatus>('get_server_status'),
  readConfig: () => invoke<string>('read_config'),
  writeConfig: (content: string) => invoke<void>('write_config', { content }),
  validateConfig: (content: string) => invoke<boolean>('validate_config', { content }),
  getConfigPath: () => invoke<string>('get_config_path'),
  setConfigPath: (path: string) => invoke<void>('set_config_path', { path }),
  getAccountModels: () => invoke<AccountSummary[]>('get_account_models'),
  tailLogs: () => invoke<string[]>('tail_logs'),
}
