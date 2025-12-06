import { invoke } from '@tauri-apps/api/tauri'

export interface AccountUsageSummary {
  account_id: string
  total_input: number
  total_output: number
  total_requests: number
}

export interface UsageStats {
  account_id: string
  model: string
  total_input: number
  total_output: number
  total_cache_creation: number
  total_cache_read: number
  total_requests: number
}

export interface DatabaseInfo {
  path: string
  exists: boolean
  size_bytes: number
  size_readable: string
}

export class StatsAPI {
  /**
   * 获取使用量统计（按账户聚合）
   * @param dbPath 数据库文件路径
   * @param days 查询天数（可选，默认7天）
   */
  static async getUsageStats(
    dbPath: string,
    days?: number
  ): Promise<AccountUsageSummary[]> {
    return invoke('get_usage_stats', { dbPath, days })
  }

  /**
   * 获取指定账户的详细统计（按模型分组）
   * @param dbPath 数据库文件路径
   * @param accountId 账户ID
   * @param days 查询天数（可选，默认7天）
   */
  static async getAccountUsageDetail(
    dbPath: string,
    accountId: string,
    days?: number
  ): Promise<UsageStats[]> {
    return invoke('get_account_usage_detail', { dbPath, accountId, days })
  }

  /**
   * 获取数据库文件信息
   * @param dbPath 数据库文件路径
   */
  static async getDatabaseInfo(dbPath: string): Promise<DatabaseInfo> {
    return invoke('get_database_info', { dbPath })
  }

  /**
   * 清理旧的统计数据
   * @param dbPath 数据库文件路径
   * @param days 保留最近N天的数据，删除更早的数据
   * @returns 被删除的记录数
   */
  static async cleanupOldStats(dbPath: string, days: number): Promise<number> {
    return invoke('cleanup_old_stats', { dbPath, days })
  }
}
