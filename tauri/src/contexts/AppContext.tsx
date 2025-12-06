import { createContext, useContext, useEffect, useMemo, useState } from 'react'
import { TauriAPI, ServerStatus, AccountSummary } from '@/services/api'
import { Config, ConfigManager } from '@/services/config'
import { PortConflictAPI } from '@/services/portConflict'
import { listen } from '@tauri-apps/api/event'
import { toast } from 'sonner'
import i18n from '@/i18n/config'

interface AppState {
  serverStatus: ServerStatus
  config?: Config
  accounts: AccountSummary[]
  loading: boolean
  error?: string
}

interface AppActions {
  refreshStatus: () => Promise<void>
  startServer: () => Promise<void>
  stopServer: () => Promise<void>
  restartServer: () => Promise<void>
  loadConfig: () => Promise<void>
  saveConfig: (config: Config) => Promise<void>
  loadAccounts: () => Promise<void>
}

interface AppContextType {
  state: AppState
  actions: AppActions
}

const AppContext = createContext<AppContextType | null>(null)

const initialState: AppState = {
  serverStatus: { running: false },
  accounts: [],
  loading: true,
}

export function AppProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<AppState>(initialState)

  // 处理端口冲突
  const handlePortConflict = async (port: number) => {
    try {
      // 检查占用端口的进程
      const processInfo = await PortConflictAPI.checkPortConflict(port)

      if (!processInfo) {
        // 没有找到占用进程
        toast.error(i18n.t('server.startFailed'), {
          description: i18n.t('server.portInUse'),
          duration: 6000,
        })
        return
      }

      // 显示确认对话框
      const confirmed = window.confirm(
        i18n.t('server.portConflictConfirm', {
          port,
          processName: processInfo.name,
          pid: processInfo.pid,
        })
      )

      if (!confirmed) {
        toast.info(i18n.t('server.portConflictCancelled'))
        return
      }

      // 使用 toast.promise 显示关闭进程的进度
      await toast.promise(
        (async () => {
          await PortConflictAPI.killProcess(processInfo.pid)
          // 等待一秒让端口释放
          await new Promise((resolve) => setTimeout(resolve, 1000))
          // 重新启动服务器
          await TauriAPI.startServer()
          await refreshStatus()
        })(),
        {
          loading: i18n.t('server.killingProcess'),
          success: i18n.t('server.startSuccess'),
          error: i18n.t('server.killProcessFailed'),
        }
      )
    } catch (error) {
      console.error('Failed to handle port conflict:', error)
      toast.error(i18n.t('server.portInUse'), {
        description: String(error),
        duration: 6000,
      })
    }
  }

  const refreshStatus = async () => {
    try {
      const status = await TauriAPI.getServerStatus()
      setState((s) => ({ ...s, serverStatus: status, loading: false }))
    } catch (error: any) {
      setState((s) => ({ ...s, error: String(error), loading: false }))
    }
  }

  const loadConfig = async () => {
    try {
      const content = await TauriAPI.readConfig()
      const parsed = ConfigManager.parse(content)
      setState((s) => ({ ...s, config: parsed }))
    } catch (error: any) {
      setState((s) => ({ ...s, error: String(error) }))
    }
  }

  const saveConfig = async (config: Config) => {
    const toml = ConfigManager.stringify(config)
    await TauriAPI.writeConfig(toml)
    setState((s) => ({ ...s, config }))
  }

  const startServer = async () => {
    try {
      await TauriAPI.startServer()
      await refreshStatus()
      toast.success(i18n.t('server.startSuccess'))
    } catch (error: any) {
      const errorMessage = String(error)
      console.error('Failed to start server:', errorMessage)

      // 检查是否是"需要配置账户"的错误
      if (errorMessage.includes('At least one account must be configured')) {
        toast.error(i18n.t('server.startFailed'), {
          description: i18n.t('server.noAccountsConfigured'),
          duration: 8000,
        })
      } else if (errorMessage.includes('Port') && errorMessage.includes('already in use')) {
        // 端口冲突 - 提取端口号并检查占用进程
        const portMatch = errorMessage.match(/Port (\d+)/)
        if (portMatch) {
          const port = parseInt(portMatch[1])
          await handlePortConflict(port)
        } else {
          toast.error(i18n.t('server.startFailed'), {
            description: i18n.t('server.portInUse'),
            duration: 6000,
          })
        }
      } else if (errorMessage.includes('Config')) {
        toast.error(i18n.t('server.startFailed'), {
          description: `${i18n.t('server.configError')}: ${errorMessage}`,
          duration: 6000,
        })
      } else {
        toast.error(i18n.t('server.startFailed'), {
          description: errorMessage,
          duration: 6000,
        })
      }

      // 仍然刷新状态以确保 UI 正确
      await refreshStatus()
    }
  }

  const stopServer = async () => {
    try {
      await TauriAPI.stopServer()
      await refreshStatus()
      toast.success(i18n.t('server.stopSuccess'))
    } catch (error: any) {
      const errorMessage = String(error)
      console.error('Failed to stop server:', errorMessage)
      toast.error(i18n.t('server.stopFailed'), {
        description: errorMessage,
        duration: 5000,
      })
      await refreshStatus()
    }
  }

  const restartServer = async () => {
    try {
      await TauriAPI.restartServer()
      await refreshStatus()
      toast.success(i18n.t('server.restartSuccess'))
    } catch (error: any) {
      const errorMessage = String(error)
      console.error('Failed to restart server:', errorMessage)

      // 检查是否是"需要配置账户"的错误
      if (errorMessage.includes('At least one account must be configured')) {
        toast.error(i18n.t('server.restartFailed'), {
          description: i18n.t('server.noAccountsConfigured'),
          duration: 8000,
        })
      } else if (errorMessage.includes('Config')) {
        toast.error(i18n.t('server.restartFailed'), {
          description: `${i18n.t('server.configError')}: ${errorMessage}`,
          duration: 6000,
        })
      } else {
        toast.error(i18n.t('server.restartFailed'), {
          description: errorMessage,
          duration: 6000,
        })
      }

      await refreshStatus()
    }
  }

  const loadAccounts = async () => {
    try {
      const accounts = await TauriAPI.getAccountModels()
      setState((s) => ({ ...s, accounts }))
    } catch (error: any) {
      setState((s) => ({ ...s, error: String(error) }))
    }
  }

  useEffect(() => {
    refreshStatus()
    loadConfig()
    loadAccounts()

    // 监听来自托盘和应用菜单的事件
    const unlistenPromises = [
      listen('tray-start-server', () => {
        console.log('Received tray-start-server event')
        startServer()
      }),
      listen('tray-stop-server', () => {
        console.log('Received tray-stop-server event')
        stopServer()
      }),
      listen('tray-restart-server', () => {
        console.log('Received tray-restart-server event')
        restartServer()
      }),
    ]

    // 清理监听器
    return () => {
      Promise.all(unlistenPromises).then((unlisteners) => {
        unlisteners.forEach((unlisten) => unlisten())
      })
    }
  }, [])

  const value = useMemo<AppContextType>(
    () => ({
      state,
      actions: {
        refreshStatus,
        startServer,
        stopServer,
        restartServer,
        loadConfig,
        saveConfig,
        loadAccounts,
      },
    }),
    [state]
  )

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>
}

export const useApp = () => {
  const ctx = useContext(AppContext)
  if (!ctx) throw new Error('useApp must be used within AppProvider')
  return ctx
}

