import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { PlayCircle, StopCircle, Activity, Users } from 'lucide-react'
import { useApp } from '@/contexts/AppContext'
import { useState, useEffect } from 'react'
import { TauriAPI, type DashboardStats } from '@/services/api'

export function Dashboard() {
  const { state, actions } = useApp()
  const [loading, setLoading] = useState(false)
  const [stats, setStats] = useState<DashboardStats>({
    active_accounts: 0,
    total_accounts: 0,
  })

  useEffect(() => {
    const loadStats = async () => {
      try {
        const data = await TauriAPI.getDashboardStats()
        setStats(data)
      } catch (error) {
        console.error('Failed to load stats:', error)
      }
    }

    loadStats()
    const interval = setInterval(loadStats, 5000)
    return () => clearInterval(interval)
  }, [])

  const handleStart = async () => {
    setLoading(true)
    await actions.startServer()
    setLoading(false)
  }

  const handleStop = async () => {
    setLoading(true)
    await actions.stopServer()
    setLoading(false)
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold tracking-tight">仪表盘</h2>
        <p className="text-muted-foreground">
          监控服务状态和账户信息
        </p>
      </div>

      {/* Server Status Card */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Activity className="h-5 w-5" />
            服务器状态
          </CardTitle>
          <CardDescription>当前服务器运行状态</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium">状态</p>
              <p className="text-2xl font-bold">
                {state.serverStatus.running ? '运行中' : '未运行'}
              </p>
            </div>
            <div>
              <p className="text-sm font-medium">端口</p>
              <p className="text-2xl font-bold text-muted-foreground">
                {state.serverStatus.port ?? '-'}
              </p>
            </div>
          </div>
          <div className="flex gap-2">
            <Button className="flex-1" onClick={handleStart} disabled={state.serverStatus.running || loading}>
              <PlayCircle className="mr-2 h-4 w-4" />
              启动服务
            </Button>
            <Button variant="outline" className="flex-1" onClick={handleStop} disabled={!state.serverStatus.running || loading}>
              <StopCircle className="mr-2 h-4 w-4" />
              停止服务
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Account Statistics */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            账户统计
          </CardTitle>
          <CardDescription>从配置文件读取的账户信息</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <p className="text-sm font-medium text-muted-foreground">已启用账户</p>
              <p className="text-3xl font-bold">{stats.active_accounts}</p>
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground">总账户数</p>
              <p className="text-3xl font-bold">{stats.total_accounts}</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
