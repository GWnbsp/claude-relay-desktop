import { createContext, useContext, useEffect, useMemo, useState } from 'react'
import { TauriAPI, ServerStatus, AccountSummary } from '@/services/api'
import { Config, ConfigManager } from '@/services/config'
import { listen } from '@tauri-apps/api/event'

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
    await TauriAPI.startServer()
    await refreshStatus()
  }

  const stopServer = async () => {
    await TauriAPI.stopServer()
    await refreshStatus()
  }

  const restartServer = async () => {
    await TauriAPI.restartServer()
    await refreshStatus()
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

