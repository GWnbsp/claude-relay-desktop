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
    unavailable_cooldown_seconds: number
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

    // 验证 server 配置
    if (!config.server) {
      errors.push('server 配置缺失')
      return { valid: false, errors }
    }

    if (!config.server.port || config.server.port < 1 || config.server.port > 65535) {
      errors.push('server.port 必须是 1-65535 之间的有效端口号')
    }

    if (!config.server.host) {
      errors.push('server.host 缺失')
    }

    if (!config.server.database_path) {
      errors.push('server.database_path 缺失')
    }

    // 验证 accounts（允许空数组）
    if (!Array.isArray(config.accounts)) {
      errors.push('accounts 必须是数组')
      return { valid: false, errors }
    }

    // 验证每个账户
    const ids = new Set<string>()
    for (let i = 0; i < config.accounts.length; i++) {
      const acc = config.accounts[i]
      const prefix = `账户 [${i}]`

      if (!acc.id) {
        errors.push(`${prefix} 缺少 id`)
      } else {
        if (ids.has(acc.id)) {
          errors.push(`${prefix} id 重复: ${acc.id}`)
        }
        ids.add(acc.id)
      }

      if (!acc.name) {
        errors.push(`${prefix} (id: ${acc.id || '未知'}) 缺少 name`)
      }

      if (acc.priority == null || typeof acc.priority !== 'number') {
        errors.push(`${prefix} (id: ${acc.id || '未知'}) priority 必须是数字`)
      }

      if (!acc.type) {
        errors.push(`${prefix} (id: ${acc.id || '未知'}) 缺少 type`)
      } else {
        // 验证类型是否有效
        const validTypes = ['claude-api', 'claude-oauth', 'gemini', 'openai-responses']
        if (!validTypes.includes(acc.type)) {
          errors.push(`${prefix} (id: ${acc.id || '未知'}) type 无效: ${acc.type}`)
        }

        // 验证凭证
        if (acc.type === 'claude-api' || acc.type === 'openai-responses') {
          if (!acc.api_key) {
            errors.push(`${prefix} (id: ${acc.id || '未知'}) 类型为 ${acc.type} 时必须提供 api_key`)
          }
        } else if (acc.type === 'claude-oauth' || acc.type === 'gemini') {
          if (!acc.refresh_token) {
            errors.push(`${prefix} (id: ${acc.id || '未知'}) 类型为 ${acc.type} 时必须提供 refresh_token`)
          }
        }
      }

      // 验证 proxy 配置
      if (acc.proxy) {
        if (!acc.proxy.type) {
          errors.push(`${prefix} (id: ${acc.id || '未知'}) proxy 缺少 type`)
        } else {
          const validProxyTypes = ['socks5', 'http', 'none']
          if (!validProxyTypes.includes(acc.proxy.type)) {
            errors.push(`${prefix} (id: ${acc.id || '未知'}) proxy.type 无效: ${acc.proxy.type}`)
          }

          // 如果不是 none 类型，必须有 host 和 port
          if (acc.proxy.type !== 'none') {
            if (!acc.proxy.host) {
              errors.push(`${prefix} (id: ${acc.id || '未知'}) proxy.type 为 ${acc.proxy.type} 时必须提供 proxy.host`)
            }
            if (!acc.proxy.port || acc.proxy.port < 1 || acc.proxy.port > 65535) {
              errors.push(`${prefix} (id: ${acc.id || '未知'}) proxy.port 必须是 1-65535 之间的有效端口号`)
            }
          }
        }
      }
    }

    // 验证 session 配置
    if (config.session) {
      if (typeof config.session.sticky_ttl_seconds !== 'number' || config.session.sticky_ttl_seconds < 0) {
        errors.push('session.sticky_ttl_seconds 必须是非负数')
      }
      if (typeof config.session.renewal_threshold_seconds !== 'number' || config.session.renewal_threshold_seconds < 0) {
        errors.push('session.renewal_threshold_seconds 必须是非负数')
      }
      if (typeof config.session.unavailable_cooldown_seconds !== 'number' || config.session.unavailable_cooldown_seconds < 0) {
        errors.push('session.unavailable_cooldown_seconds 必须是非负数')
      }
    }

    return { valid: errors.length === 0, errors }
  }
}

