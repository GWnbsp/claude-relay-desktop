import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Account } from '@/services/config'

interface Props {
  open: boolean
  onClose: () => void
  onSave: (account: Account) => void
  editAccount?: Account | null
}

const accountTypes = [
  { value: 'claude-api', label: 'Claude API Key' },
  { value: 'claude-oauth', label: 'Claude OAuth' },
  { value: 'gemini', label: 'Gemini' },
  { value: 'openai-responses', label: 'OpenAI Responses' },
]

// 生成唯一ID
function generateAccountId(type: string): string {
  const timestamp = Date.now()
  const random = Math.floor(Math.random() * 1000)
  return `${type}-${timestamp}-${random}`
}

export function AccountDialog({ open, onClose, onSave, editAccount }: Props) {
  const [type, setType] = useState<Account['type']>('claude-api')
  const [id, setId] = useState('')
  const [name, setName] = useState('')
  const [priority, setPriority] = useState(100)
  const [enabled, setEnabled] = useState(true)
  const [credential, setCredential] = useState('')
  const [apiUrl, setApiUrl] = useState('')

  // Proxy 配置
  const [proxyEnabled, setProxyEnabled] = useState(false)
  const [proxyType, setProxyType] = useState<'socks5' | 'http' | 'none'>('http')
  const [proxyHost, setProxyHost] = useState('')
  const [proxyPort, setProxyPort] = useState(1080)
  const [proxyUsername, setProxyUsername] = useState('')
  const [proxyPassword, setProxyPassword] = useState('')

  const isEditMode = !!editAccount

  // 编辑模式：初始化表单
  useEffect(() => {
    if (editAccount) {
      setType(editAccount.type)
      setId(editAccount.id)
      setName(editAccount.name)
      setPriority(editAccount.priority)
      setEnabled(editAccount.enabled)
      setApiUrl(editAccount.api_url || '')

      // 加载 proxy 配置
      if (editAccount.proxy && editAccount.proxy.type !== 'none') {
        setProxyEnabled(true)
        setProxyType(editAccount.proxy.type)
        setProxyHost(editAccount.proxy.host || '')
        setProxyPort(editAccount.proxy.port || 1080)
        setProxyUsername(editAccount.proxy.username || '')
        setProxyPassword(editAccount.proxy.password || '')
      } else {
        setProxyEnabled(false)
      }

      // 提取凭证
      if ('api_key' in editAccount) {
        setCredential(editAccount.api_key || '')
      } else if ('refresh_token' in editAccount) {
        setCredential(editAccount.refresh_token || '')
      }
    } else {
      // 重置为默认值，并生成新ID
      const newType = 'claude-api'
      setType(newType)
      setId(generateAccountId(newType))
      setName('')
      setPriority(100)
      setEnabled(true)
      setCredential('')
      setApiUrl('')
      setProxyEnabled(false)
      setProxyType('http')
      setProxyHost('')
      setProxyPort(1080)
      setProxyUsername('')
      setProxyPassword('')
    }
  }, [editAccount, open])

  // 当类型改变时，重新生成ID（仅新增模式）
  useEffect(() => {
    if (!isEditMode && open) {
      setId(generateAccountId(type))
    }
  }, [type, isEditMode, open])

  if (!open) return null

  const handleSave = () => {
    // 基础验证
    if (!id || !name || !credential) return

    // Priority 验证
    if (isNaN(priority) || priority < 0) {
      alert('优先级必须是非负数')
      return
    }

    // Proxy 验证
    if (proxyEnabled) {
      if (!proxyHost) {
        alert('启用代理时必须填写代理地址')
        return
      }
      if (proxyPort < 1 || proxyPort > 65535) {
        alert('代理端口必须在 1-65535 之间')
        return
      }
    }

    const base: Account = {
      type,
      id,
      name,
      priority,
      enabled,
      api_url: apiUrl || undefined,
    }

    // 添加 proxy 配置
    if (proxyEnabled && proxyHost) {
      base.proxy = {
        type: proxyType,
        host: proxyHost,
        port: proxyPort,
        username: proxyUsername || undefined,
        password: proxyPassword || undefined,
      }
    }

    const account: Account =
      type === 'claude-api' || type === 'openai-responses'
        ? { ...base, api_key: credential }
        : { ...base, refresh_token: credential }

    onSave(account)
    onClose()
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
      <Card className="w-full max-w-lg">
        <CardHeader>
          <CardTitle>{isEditMode ? '编辑账户' : '添加账户'}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <label className="text-sm font-medium">账户类型</label>
            <select
              className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
              value={type}
              onChange={(e) => setType(e.target.value as Account['type'])}
              disabled={isEditMode}
            >
              {accountTypes.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
            {isEditMode && (
              <p className="text-xs text-muted-foreground">账户类型创建后无法修改</p>
            )}
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">账户昵称</label>
            <input
              className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="为这个账户起个好记的名字"
            />
            <p className="text-xs text-muted-foreground">用于在界面上识别不同的账户</p>
          </div>

          {isEditMode && (
            <div className="space-y-2">
              <label className="text-sm font-medium text-muted-foreground">账户 ID</label>
              <input
                className="w-full rounded-md border border-input bg-muted px-3 py-2 text-sm text-muted-foreground"
                value={id}
                readOnly
                disabled
              />
              <p className="text-xs text-muted-foreground">ID 创建后无法修改</p>
            </div>
          )}

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <label className="text-sm font-medium">优先级</label>
              <input
                type="number"
                className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                value={priority}
                onChange={(e) => setPriority(Number(e.target.value))}
              />
              <p className="text-xs text-muted-foreground">数值越大优先级越高</p>
            </div>
            <div className="flex flex-col justify-center gap-2">
              <div className="flex items-center gap-2">
                <input
                  id="enabled"
                  type="checkbox"
                  checked={enabled}
                  onChange={(e) => setEnabled(e.target.checked)}
                  className="h-4 w-4"
                />
                <label htmlFor="enabled" className="text-sm font-medium">
                  启用此账户
                </label>
              </div>
              <p className="text-xs text-muted-foreground">禁用后不会被使用</p>
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">
              {type === 'claude-api' || type === 'openai-responses' ? 'API Key' : 'Refresh Token'}
            </label>
            <input
              type="password"
              className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm font-mono"
              value={credential}
              onChange={(e) => setCredential(e.target.value)}
              placeholder={type === 'claude-api' || type === 'openai-responses' ? '输入 API Key' : '输入 Refresh Token'}
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">API URL（可选）</label>
            <input
              type="text"
              className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm font-mono"
              value={apiUrl}
              onChange={(e) => setApiUrl(e.target.value)}
              placeholder="例如：https://relay.nf.video 或留空使用默认"
            />
            <p className="text-xs text-muted-foreground">
              自定义中转服务器地址，留空则使用官方 API 端点
            </p>
          </div>

          {/* Proxy 配置 */}
          <div className="space-y-3 rounded-md border border-border p-3 bg-muted/30">
            <div className="flex items-center gap-2">
              <input
                id="proxy-enabled"
                type="checkbox"
                checked={proxyEnabled}
                onChange={(e) => setProxyEnabled(e.target.checked)}
                className="h-4 w-4"
              />
              <label htmlFor="proxy-enabled" className="text-sm font-medium">
                使用代理服务器
              </label>
            </div>

            {proxyEnabled && (
              <div className="space-y-3 pt-2">
                <div className="space-y-2">
                  <label className="text-sm font-medium">代理类型</label>
                  <select
                    className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                    value={proxyType}
                    onChange={(e) => setProxyType(e.target.value as 'socks5' | 'http')}
                  >
                    <option value="http">HTTP</option>
                    <option value="socks5">SOCKS5</option>
                  </select>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-2">
                    <label className="text-sm font-medium">代理地址</label>
                    <input
                      type="text"
                      className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                      value={proxyHost}
                      onChange={(e) => setProxyHost(e.target.value)}
                      placeholder="127.0.0.1"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium">端口</label>
                    <input
                      type="number"
                      className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                      value={proxyPort}
                      onChange={(e) => setProxyPort(Number(e.target.value))}
                      placeholder="1080"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-2">
                    <label className="text-sm font-medium">用户名（可选）</label>
                    <input
                      type="text"
                      className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                      value={proxyUsername}
                      onChange={(e) => setProxyUsername(e.target.value)}
                      placeholder="留空表示无需认证"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium">密码（可选）</label>
                    <input
                      type="password"
                      className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                      value={proxyPassword}
                      onChange={(e) => setProxyPassword(e.target.value)}
                      placeholder="留空表示无需认证"
                    />
                  </div>
                </div>
              </div>
            )}
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <Button variant="outline" onClick={onClose}>取消</Button>
            <Button onClick={handleSave} disabled={!name || !credential}>
              {isEditMode ? '保存修改' : '添加账户'}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

