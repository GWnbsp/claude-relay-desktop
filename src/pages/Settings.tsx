import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Save, FolderOpen } from 'lucide-react'
import { useEffect, useState } from 'react'
import { useApp } from '@/contexts/AppContext'
import { TauriAPI } from '@/services/api'
import { ConfigManager } from '@/services/config'
import { ApiKeysManager } from '@/components/settings/ApiKeysManager'
import { open } from '@tauri-apps/api/dialog'

export function Settings() {
  const { state, actions } = useApp()
  const [configText, setConfigText] = useState('')
  const [path, setPath] = useState('')
  const [saving, setSaving] = useState(false)
  const [apiKeys, setApiKeys] = useState<string[]>([])

  useEffect(() => {
    TauriAPI.getConfigPath().then(setPath)
    actions.loadConfig()
  }, [])

  useEffect(() => {
    if (state.config) {
      setConfigText(ConfigManager.stringify(state.config))
      setApiKeys(state.config.api_keys || [])
    }
  }, [state.config])

  const handleSave = async () => {
    setSaving(true)
    await TauriAPI.writeConfig(configText)
    await actions.loadConfig()
    setSaving(false)
  }

  const handleApiKeysChange = (keys: string[]) => {
    if (!state.config) return
    const updated = { ...state.config, api_keys: keys }
    setApiKeys(keys)
    setConfigText(ConfigManager.stringify(updated))
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
      <div>
        <h2 className="text-3xl font-bold tracking-tight">设置</h2>
        <p className="text-muted-foreground">
          配置服务器参数和应用选项
        </p>
      </div>

      <div className="grid gap-6">
        {/* API Keys Manager */}
        <ApiKeysManager apiKeys={apiKeys} onChange={handleApiKeysChange} />

        {/* Server Settings */}
        <Card>
          <CardHeader>
            <CardTitle>服务器配置</CardTitle>
            <CardDescription>
              修改服务器监听地址和端口
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">配置文件</label>
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
            <textarea
              className="w-full h-64 rounded-md border border-input bg-background px-3 py-2 text-sm font-mono"
              value={configText}
              onChange={(e) => setConfigText(e.target.value)}
            />
            <Button onClick={handleSave} disabled={saving}>
              <Save className="mr-2 h-4 w-4" />
              {saving ? '保存中...' : '保存配置并重启'}
            </Button>
          </CardContent>
        </Card>

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
    </div>
  )
}
