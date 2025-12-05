import { Button } from '@/components/ui/button'
import { Save, FolderOpen, Code2, Settings as Server, Zap } from 'lucide-react'
import { useEffect, useState } from 'react'
import { useApp } from '@/contexts/AppContext'
import { TauriAPI, type AppSettings } from '@/services/api'
import { ConfigManager, Config } from '@/services/config'
import { ApiKeysManager } from '@/components/settings/ApiKeysManager'
import { AdvancedEditDialog } from '@/components/settings/AdvancedEditDialog'
import { open } from '@tauri-apps/api/dialog'
import { useTranslation } from 'react-i18next'
import { enable as enableAutostart, disable as disableAutostart, isEnabled as isAutostartEnabled } from 'tauri-plugin-autostart-api'
import { cn } from '@/lib/utils'

export function Settings() {
  const { state, actions } = useApp()
  const { t } = useTranslation()
  const [path, setPath] = useState('')
  const [saving, setSaving] = useState(false)
  const [showAdvanced, setShowAdvanced] = useState(false)
  const [activeTab, setActiveTab] = useState<'app' | 'server'>('app')

  // Form state
  const [apiKeys, setApiKeys] = useState<string[]>([])
  const [host, setHost] = useState('127.0.0.1')
  const [port, setPort] = useState(3000)
  const [databasePath, setDatabasePath] = useState('data/relay.db')
  const [logLevel, setLogLevel] = useState('info')
  const [stickyTtl, setStickyTtl] = useState(3600)
  const [renewalThreshold, setRenewalThreshold] = useState(300)

  // App settings state
  const [autostartOnBoot, setAutostartOnBoot] = useState(false)
  const [autostartServer, setAutostartServer] = useState(false)
  const [minimizeToTray, setMinimizeToTray] = useState(false)

  // Load app settings
  useEffect(() => {
    const loadAppSettings = async () => {
      try {
        const settings = await TauriAPI.getAppSettings()
        setAutostartServer(settings.autostart_server)
        setMinimizeToTray(settings.minimize_to_tray)

        // Check if autostart on boot is enabled
        const enabled = await isAutostartEnabled()
        setAutostartOnBoot(enabled)
      } catch (error) {
        console.error('Failed to load app settings:', error)
      }
    }
    loadAppSettings()
  }, [])

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

  // Handle app settings changes
  const handleAutostartOnBootChange = async (checked: boolean) => {
    try {
      if (checked) {
        await enableAutostart()
      } else {
        await disableAutostart()
      }
      setAutostartOnBoot(checked)
    } catch (error) {
      console.error('Failed to toggle autostart on boot:', error)
    }
  }

  const handleAutostartServerChange = async (checked: boolean) => {
    try {
      const settings: AppSettings = {
        autostart_on_boot: autostartOnBoot,
        autostart_server: checked,
        minimize_to_tray: minimizeToTray,
      }
      await TauriAPI.updateAppSettings(settings)
      setAutostartServer(checked)
    } catch (error) {
      console.error('Failed to update autostart server setting:', error)
    }
  }

  const handleMinimizeToTrayChange = async (checked: boolean) => {
    try {
      const settings: AppSettings = {
        autostart_on_boot: autostartOnBoot,
        autostart_server: autostartServer,
        minimize_to_tray: checked,
      }
      await TauriAPI.updateAppSettings(settings)
      setMinimizeToTray(checked)
    } catch (error) {
      console.error('Failed to update minimize to tray setting:', error)
    }
  }

  const tabs = [
    { id: 'app' as const, label: t('settings.appSettings'), icon: Zap },
    { id: 'server' as const, label: t('settings.serverConfigTitle'), icon: Server },
  ]

  return (
    <div className="flex h-full flex-col">
      {/* Header */}
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">{t('settings.title')}</h2>
          <p className="text-sm text-muted-foreground mt-1">
            {t('settings.subtitle')}
          </p>
        </div>
        <Button variant="ghost" size="sm" onClick={() => setShowAdvanced(true)}>
          <Code2 className="mr-2 h-4 w-4" />
          {t('settings.editAdvanced')}
        </Button>
      </div>

      {/* Tabs */}
      <div className="mb-6 border-b">
        <div className="flex gap-1">
          {tabs.map((tab) => {
            const Icon = tab.icon
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={cn(
                  "flex items-center gap-2 px-4 py-3 text-sm font-medium transition-colors relative",
                  activeTab === tab.id
                    ? "text-primary"
                    : "text-muted-foreground hover:text-foreground"
                )}
              >
                <Icon className="h-4 w-4" />
                {tab.label}
                {activeTab === tab.id && (
                  <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary" />
                )}
              </button>
            )
          })}
        </div>
      </div>

      {/* Tab Content */}
      <div className="flex-1 overflow-auto">
        {activeTab === 'app' && (
          <div className="max-w-2xl space-y-6">
            <div className="flex items-start gap-3 rounded-lg border border-green-200 bg-green-50/50 p-4 dark:border-green-900/30 dark:bg-green-900/10">
              <div className="rounded-full bg-green-100 p-1.5 dark:bg-green-900/30">
                <Zap className="h-4 w-4 text-green-600 dark:text-green-400" />
              </div>
              <div className="flex-1">
                <p className="text-sm font-medium text-green-900 dark:text-green-100">
                  {t('settings.autoSaved')}
                </p>
                <p className="mt-0.5 text-xs text-green-700 dark:text-green-300">
                  {t('settings.autoSavedDesc')}
                </p>
              </div>
            </div>

            {/* Application Settings */}
            <div className="space-y-4">
              <div className="flex items-center justify-between py-3">
                <div className="flex-1">
                  <label className="text-sm font-medium">{t('settings.autostartOnBoot')}</label>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {t('settings.autostartOnBootDesc')}
                  </p>
                </div>
                <label className="relative inline-flex cursor-pointer items-center">
                  <input
                    type="checkbox"
                    className="peer sr-only"
                    checked={autostartOnBoot}
                    onChange={(e) => handleAutostartOnBootChange(e.target.checked)}
                  />
                  <div className="peer h-6 w-11 rounded-full bg-gray-200 after:absolute after:left-[2px] after:top-[2px] after:h-5 after:w-5 after:rounded-full after:border after:border-gray-300 after:bg-white after:transition-all after:content-[''] peer-checked:bg-primary peer-checked:after:translate-x-full peer-checked:after:border-white peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-primary/50 dark:bg-gray-700 dark:after:border-gray-600"></div>
                </label>
              </div>

              <div className="flex items-center justify-between border-t py-3">
                <div className="flex-1">
                  <label className="text-sm font-medium">{t('settings.autoStart')}</label>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {t('settings.autoStartDesc')}
                  </p>
                </div>
                <label className="relative inline-flex cursor-pointer items-center">
                  <input
                    type="checkbox"
                    className="peer sr-only"
                    checked={autostartServer}
                    onChange={(e) => handleAutostartServerChange(e.target.checked)}
                  />
                  <div className="peer h-6 w-11 rounded-full bg-gray-200 after:absolute after:left-[2px] after:top-[2px] after:h-5 after:w-5 after:rounded-full after:border after:border-gray-300 after:bg-white after:transition-all after:content-[''] peer-checked:bg-primary peer-checked:after:translate-x-full peer-checked:after:border-white peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-primary/50 dark:bg-gray-700 dark:after:border-gray-600"></div>
                </label>
              </div>

              <div className="flex items-center justify-between border-t py-3">
                <div className="flex-1">
                  <label className="text-sm font-medium">{t('settings.minimizeToTray')}</label>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {t('settings.minimizeToTrayDesc')}
                  </p>
                </div>
                <label className="relative inline-flex cursor-pointer items-center">
                  <input
                    type="checkbox"
                    className="peer sr-only"
                    checked={minimizeToTray}
                    onChange={(e) => handleMinimizeToTrayChange(e.target.checked)}
                  />
                  <div className="peer h-6 w-11 rounded-full bg-gray-200 after:absolute after:left-[2px] after:top-[2px] after:h-5 after:w-5 after:rounded-full after:border after:border-gray-300 after:bg-white after:transition-all after:content-[''] peer-checked:bg-primary peer-checked:after:translate-x-full peer-checked:after:border-white peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-primary/50 dark:bg-gray-700 dark:after:border-gray-600"></div>
                </label>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'server' && (
          <div className="max-w-4xl space-y-6">
            <div className="flex items-start gap-3 rounded-lg border border-orange-200 bg-orange-50/50 p-4 dark:border-orange-900/30 dark:bg-orange-900/10">
              <div className="rounded-full bg-orange-100 p-1.5 dark:bg-orange-900/30">
                <Save className="h-4 w-4 text-orange-600 dark:text-orange-400" />
              </div>
              <div className="flex-1">
                <p className="text-sm font-medium text-orange-900 dark:text-orange-100">
                  {t('settings.needsSave')}
                </p>
                <p className="mt-0.5 text-xs text-orange-700 dark:text-orange-300">
                  {t('settings.serverConfigNotice')}
                </p>
              </div>
            </div>

            {/* API Keys */}
            <div className="space-y-2">
              <h3 className="text-sm font-medium">API Keys</h3>
              <ApiKeysManager apiKeys={apiKeys} onChange={handleApiKeysChange} />
            </div>

            {/* Server Configuration - Compact Form */}
            <div className="space-y-4">
              <h3 className="text-sm font-medium">{t('settings.serverConfig')}</h3>

              <div className="space-y-3">
                <div className="flex items-center gap-3">
                  <label className="w-32 text-sm text-muted-foreground">{t('settings.configFile')}</label>
                  <input
                    type="text"
                    className="flex-1 rounded-md border border-input bg-background px-3 py-1.5 text-sm"
                    value={path}
                    readOnly
                  />
                  <Button variant="outline" size="sm" onClick={handlePick}>
                    <FolderOpen className="h-4 w-4" />
                  </Button>
                </div>

                <div className="flex items-center gap-3">
                  <label className="w-32 text-sm text-muted-foreground">{t('settings.serverHost')}</label>
                  <input
                    type="text"
                    className="w-48 rounded-md border border-input bg-background px-3 py-1.5 text-sm"
                    value={host}
                    onChange={(e) => setHost(e.target.value)}
                    placeholder="127.0.0.1"
                  />
                  <label className="ml-4 w-16 text-sm text-muted-foreground">{t('settings.serverPort')}</label>
                  <input
                    type="number"
                    className="w-24 rounded-md border border-input bg-background px-3 py-1.5 text-sm"
                    value={port}
                    onChange={(e) => setPort(Number(e.target.value))}
                    min={1}
                    max={65535}
                  />
                </div>

                <div className="flex items-center gap-3">
                  <label className="w-32 text-sm text-muted-foreground">{t('settings.databasePath')}</label>
                  <input
                    type="text"
                    className="flex-1 rounded-md border border-input bg-background px-3 py-1.5 text-sm"
                    value={databasePath}
                    onChange={(e) => setDatabasePath(e.target.value)}
                    placeholder="data/relay.db"
                  />
                </div>

                <div className="flex items-center gap-3">
                  <label className="w-32 text-sm text-muted-foreground">{t('settings.logLevel')}</label>
                  <select
                    className="w-48 rounded-md border border-input bg-background px-3 py-1.5 text-sm"
                    value={logLevel}
                    onChange={(e) => setLogLevel(e.target.value)}
                  >
                    <option value="debug">Debug</option>
                    <option value="info">Info</option>
                    <option value="warn">Warn</option>
                    <option value="error">Error</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Session Settings */}
            <div className="space-y-4">
              <h3 className="text-sm font-medium">{t('settings.sessionConfig')}</h3>

              <div className="space-y-3">
                <div className="flex items-start gap-3">
                  <div className="w-32">
                    <label className="text-sm text-muted-foreground">{t('settings.stickyTtl')}</label>
                  </div>
                  <div className="flex-1">
                    <input
                      type="number"
                      className="w-32 rounded-md border border-input bg-background px-3 py-1.5 text-sm"
                      value={stickyTtl}
                      onChange={(e) => setStickyTtl(Number(e.target.value))}
                      min={0}
                    />
                    <p className="mt-1 text-xs text-muted-foreground">{t('settings.stickyTtlDesc')}</p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <div className="w-32">
                    <label className="text-sm text-muted-foreground">{t('settings.renewalThreshold')}</label>
                  </div>
                  <div className="flex-1">
                    <input
                      type="number"
                      className="w-32 rounded-md border border-input bg-background px-3 py-1.5 text-sm"
                      value={renewalThreshold}
                      onChange={(e) => setRenewalThreshold(Number(e.target.value))}
                      min={0}
                    />
                    <p className="mt-1 text-xs text-muted-foreground">{t('settings.renewalThresholdDesc')}</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Save Button */}
            <div className="sticky bottom-0 flex items-center justify-between border-t bg-background/95 backdrop-blur py-4">
              <p className="text-xs text-muted-foreground">
                {t('settings.saveHint')}
              </p>
              <Button onClick={handleSave} disabled={saving} className="bg-orange-600 hover:bg-orange-700">
                <Save className="mr-2 h-4 w-4" />
                {saving ? t('settings.saving') : t('settings.save')}
              </Button>
            </div>
          </div>
        )}
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
