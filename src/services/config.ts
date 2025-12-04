import TOML from '@iarna/toml'

export type AccountType = 'claude-oauth' | 'claude-api' | 'gemini' | 'openai-responses'

export interface ProxyConfig {
  type: 'socks5' | 'http' | 'none'
  host?: string
  port?: number
  username?: string
  password?: string
}

export interface Account {
  type: AccountType
  id: string
  name: string
  priority: number
  enabled: boolean
  refresh_token?: string
  api_key?: string
  api_url?: string
  proxy?: ProxyConfig
}

export interface Config {
  server: {
    host: string
    port: number
    database_path: string
    log_level: string
  }
  api_keys: string[]
  accounts: Account[]
  session: {
    sticky_ttl_seconds: number
    renewal_threshold_seconds: number
  }
}

export class ConfigManager {
  static parse(content: string): Config {
    return TOML.parse(content) as unknown as Config
  }

  static stringify(config: Config): string {
    return TOML.stringify(config as any)
  }

  static validate(config: Config): { valid: boolean; errors: string[] } {
    const errors: string[] = []

    if (!config.server?.port) errors.push('server.port 缺失')
    if (!Array.isArray(config.accounts)) errors.push('accounts 必须是数组')
    if (config.accounts.length === 0) errors.push('至少需要一个账户')
    const ids = new Set<string>()
    for (const acc of config.accounts) {
      if (!acc.id) errors.push('账户缺少 id')
      if (ids.has(acc.id)) errors.push(`账户 id 重复: ${acc.id}`)
      ids.add(acc.id)
      if (!acc.name) errors.push(`账户 ${acc.id} 缺少 name`)
      if (acc.priority == null) errors.push(`账户 ${acc.id} 缺少 priority`)
      if (!acc.type) errors.push(`账户 ${acc.id} 缺少 type`)
    }

    return { valid: errors.length === 0, errors }
  }
}

