import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Save, FolderOpen, Code2 } from 'lucide-react'
import { useEffect, useState } from 'react'
import { useApp } from '@/contexts/AppContext'
import { TauriAPI } from '@/services/api'
import { ConfigManager, Config } from '@/services/config'
import { ApiKeysManager } from '@/components/settings/ApiKeysManager'
import { AdvancedEditDialog } from '@/components/settings/AdvancedEditDialog'
import { open } from '@tauri-apps/api/dialog'

export function Settings() {
  const { state, actions } = useApp()
  const [path, setPath] = useState('')
  const [saving, setSaving] = useState(false)
  const [showAdvanced, setShowAdvanced] = useState(false)

  // Form state
  const [apiKeys, setApiKeys] = useState<string[]>([])
  const [host, setHost] = useState('127.0.0.1')
  const [port, setPort] = useState(3000)
  const [databasePath, setDatabasePath] = useState('data/relay.db')
  const [logLevel, setLogLevel] = useState('info')
  const [stickyTtl, setStickyTtl] = useState(3600)
  const [renewalThreshold, setRenewalThreshold] = useState(300)

  useEffect(() => {
    TauriAPI.getConfigPath().then(setPath)
    actions.loadConfig()
  }, [])

  useEffect(() => {
    if (state.config) {
      setApiKeys(state.config.api_keys || [])
      setHost(state.config.server.host)
      setPort(state.config.server.port)
      setDatabasePath(state.config.server.database_path)
      setLogLevel(state.config.server.log_level)
      setStickyTtl(state.config.session.sticky_ttl_seconds)
      setRenewalThreshold(state.config.session.renewal_threshold_seconds)
    }
  }, [state.config])

  const buildConfig = (): Config => {
    return {
      server: {
        host,
        port,
        database_path: databasePath,
        log_level: logLevel,
      },
      api_keys: apiKeys,
      accounts: state.config?.accounts || [],
      session: {
        sticky_ttl_seconds: stickyTtl,
        renewal_threshold_seconds: renewalThreshold,
      },
    }
  }

  const handleSave = async () => {
    if (!state.config) return
    setSaving(true)
    const updated = buildConfig()
    const configText = ConfigManager.stringify(updated)
    await TauriAPI.writeConfig(configText)
    await actions.loadConfig()
    await actions.loadAccounts() // 刷新账户列表
    setSaving(false)
  }

  const handleApiKeysChange = (keys: string[]) => {
    setApiKeys(keys)
  }

  const handleAdvancedSave = async (configText: string) => {
    setSaving(true)
    await TauriAPI.writeConfig(configText)
    await actions.loadConfig()
    await actions.loadAccounts() // 刷新账户列表
    setSaving(false)
  }

  const handlePick = async () => {
    const res = await open({ filters: [{ name: 'TOML', extensions: ['toml'] }] })
    if (typeof res === 'string') {
      await TauriAPI.setConfigPath(res)
      setPath(res)
      await actions.loadConfig()
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">设置</h2>
          <p className="text-muted-foreground">
            配置服务器参数和应用选项
          </p>
        </div>
        <Button variant="outline" onClick={() => setShowAdvanced(true)}>
          <Code2 className="mr-2 h-4 w-4" />
          高级编辑
        </Button>
      </div>

      <div className="grid gap-6">
        {/* API Keys Manager */}
        <ApiKeysManager apiKeys={apiKeys} onChange={handleApiKeysChange} />

        {/* Server Settings */}
        <Card>
          <CardHeader>
            <CardTitle>服务器配置</CardTitle>
            <CardDescription>
              修改服务器监听地址、端口和其他参数
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">配置文件路径</label>
              <div className="flex gap-2">
                <input
                  type="text"
                  className="flex-1 rounded-md border border-input bg-background px-3 py-2 text-sm"
                  value={path}
                  readOnly
                />
                <Button variant="outline" onClick={handlePick}>
                  <FolderOpen className="mr-2 h-4 w-4" />
                  选择
                </Button>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">监听地址</label>
                <input
                  type="text"
                  className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                  value={host}
                  onChange={(e) => setHost(e.target.value)}
                  placeholder="127.0.0.1"
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">监听端口</label>
                <input
                  type="number"
                  className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                  value={port}
                  onChange={(e) => setPort(Number(e.target.value))}
                  min={1}
                  max={65535}
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">数据库路径</label>
              <input
                type="text"
                className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                value={databasePath}
                onChange={(e) => setDatabasePath(e.target.value)}
                placeholder="data/relay.db"
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">日志级别</label>
              <select
                className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                value={logLevel}
                onChange={(e) => setLogLevel(e.target.value)}
              >
                <option value="debug">Debug</option>
                <option value="info">Info</option>
                <option value="warn">Warn</option>
                <option value="error">Error</option>
              </select>
            </div>
          </CardContent>
        </Card>

        {/* Session Settings */}
        <Card>
          <CardHeader>
            <CardTitle>会话配置</CardTitle>
            <CardDescription>
              配置会话保持和续期策略
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">会话保持时长（秒）</label>
                <input
                  type="number"
                  className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                  value={stickyTtl}
                  onChange={(e) => setStickyTtl(Number(e.target.value))}
                  min={0}
                />
                <p className="text-xs text-muted-foreground">同一会话将保持使用相同账户的时长</p>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">续期阈值（秒）</label>
                <input
                  type="number"
                  className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                  value={renewalThreshold}
                  onChange={(e) => setRenewalThreshold(Number(e.target.value))}
                  min={0}
                />
                <p className="text-xs text-muted-foreground">会话剩余时间低于此值时自动续期</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Save Button */}
        <div className="flex justify-end">
          <Button onClick={handleSave} disabled={saving}>
            <Save className="mr-2 h-4 w-4" />
            {saving ? '保存中...' : '保存配置'}
          </Button>
        </div>

        {/* Application Settings */}
        <Card>
          <CardHeader>
            <CardTitle>应用设置</CardTitle>
            <CardDescription>
              自定义应用行为和外观
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <label className="text-sm font-medium">启动时自动运行服务</label>
                <p className="text-sm text-muted-foreground">
                  应用启动时自动启动转发服务
                </p>
              </div>
              <input
                type="checkbox"
                className="h-4 w-4"
              />
            </div>
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <label className="text-sm font-medium">最小化到系统托盘</label>
                <p className="text-sm text-muted-foreground">
                  关闭窗口时保持后台运行
                </p>
              </div>
              <input
                type="checkbox"
                className="h-4 w-4"
              />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Advanced Edit Dialog */}
      <AdvancedEditDialog
        open={showAdvanced}
        onClose={() => setShowAdvanced(false)}
        onSave={handleAdvancedSave}
        initialValue={state.config ? ConfigManager.stringify(state.config) : ''}
      />
    </div>
  )
}
