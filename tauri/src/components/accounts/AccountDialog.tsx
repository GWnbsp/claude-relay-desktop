import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Account } from '@/services/config'
import { useTranslation } from 'react-i18next'

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
  const { t } = useTranslation()
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
      alert(t('accounts.priorityInvalid'))
      return
    }

    // Proxy 验证
    if (proxyEnabled) {
      if (!proxyHost) {
        alert(t('accounts.proxyHostRequired'))
        return
      }
      if (proxyPort < 1 || proxyPort > 65535) {
        alert(t('accounts.proxyPortInvalid'))
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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4 overflow-y-auto">
      <div className="w-full max-w-lg my-auto">
        <Card className="w-full max-h-[90vh] flex flex-col">
          <CardHeader>
            <CardTitle>{isEditMode ? t('accounts.editAccount') : t('accounts.addAccount')}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 overflow-y-auto">
          <div className="space-y-2">
            <label className="text-sm font-medium">{t('accounts.accountType')}</label>
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
              <p className="text-xs text-muted-foreground">{t('accounts.accountTypeDesc')}</p>
            )}
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">{t('accounts.accountNickname')}</label>
            <input
              className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder={t('accounts.accountNicknamePlaceholder')}
            />
            <p className="text-xs text-muted-foreground">{t('accounts.accountNicknameDesc')}</p>
          </div>

          {isEditMode && (
            <div className="space-y-2">
              <label className="text-sm font-medium text-muted-foreground">{t('accounts.accountId')}</label>
              <input
                className="w-full rounded-md border border-input bg-muted px-3 py-2 text-sm text-muted-foreground"
                value={id}
                readOnly
                disabled
              />
              <p className="text-xs text-muted-foreground">{t('accounts.accountIdDesc')}</p>
            </div>
          )}

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <label className="text-sm font-medium">{t('accounts.priority')}</label>
              <input
                type="number"
                className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                value={priority}
                onChange={(e) => setPriority(Number(e.target.value))}
              />
              <p className="text-xs text-muted-foreground">{t('accounts.priorityDesc')}</p>
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
                  {t('accounts.enabled')}
                </label>
              </div>
              <p className="text-xs text-muted-foreground">{t('accounts.disabledDesc')}</p>
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">
              {type === 'claude-api' || type === 'openai-responses' ? t('accounts.apiKey') : t('accounts.refreshToken')}
            </label>
            <input
              type="password"
              className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm font-mono"
              value={credential}
              onChange={(e) => setCredential(e.target.value)}
              placeholder={type === 'claude-api' || type === 'openai-responses' ? t('accounts.apiKeyPlaceholder') : t('accounts.refreshTokenPlaceholder')}
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">{t('accounts.apiUrl')}</label>
            <input
              type="text"
              className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm font-mono"
              value={apiUrl}
              onChange={(e) => setApiUrl(e.target.value)}
              placeholder={t('accounts.apiUrlPlaceholder')}
            />
            <p className="text-xs text-muted-foreground">
              {t('accounts.apiUrlDesc')}
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
                {t('accounts.useProxy')}
              </label>
            </div>

            {proxyEnabled && (
              <div className="space-y-3 pt-2">
                <div className="space-y-2">
                  <label className="text-sm font-medium">{t('accounts.proxyType')}</label>
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
                    <label className="text-sm font-medium">{t('accounts.proxyHost')}</label>
                    <input
                      type="text"
                      className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                      value={proxyHost}
                      onChange={(e) => setProxyHost(e.target.value)}
                      placeholder="127.0.0.1"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium">{t('accounts.proxyPort')}</label>
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
                    <label className="text-sm font-medium">{t('accounts.proxyUsername')}</label>
                    <input
                      type="text"
                      className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                      value={proxyUsername}
                      onChange={(e) => setProxyUsername(e.target.value)}
                      placeholder={t('accounts.proxyUsernamePlaceholder')}
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium">{t('accounts.proxyPassword')}</label>
                    <input
                      type="password"
                      className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                      value={proxyPassword}
                      onChange={(e) => setProxyPassword(e.target.value)}
                      placeholder={t('accounts.proxyPasswordPlaceholder')}
                    />
                  </div>
                </div>
              </div>
            )}
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <Button variant="outline" onClick={onClose}>{t('accounts.cancel')}</Button>
            <Button onClick={handleSave} disabled={!name || !credential}>
              {isEditMode ? t('accounts.saveChanges') : t('accounts.addAccount')}
            </Button>
          </div>
        </CardContent>
      </Card>
      </div>
    </div>
  )
}

