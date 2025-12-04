import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { PlayCircle, StopCircle, Activity } from 'lucide-react'

export function Dashboard() {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold tracking-tight">仪表盘</h2>
        <p className="text-muted-foreground">
          监控服务状态和运行统计
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
              <p className="text-2xl font-bold text-muted-foreground">未运行</p>
            </div>
            <div>
              <p className="text-sm font-medium">端口</p>
              <p className="text-2xl font-bold text-muted-foreground">-</p>
            </div>
          </div>
          <div className="flex gap-2">
            <Button className="flex-1">
              <PlayCircle className="mr-2 h-4 w-4" />
              启动服务
            </Button>
            <Button variant="outline" className="flex-1" disabled>
              <StopCircle className="mr-2 h-4 w-4" />
              停止服务
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Statistics Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">总请求数</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">0</div>
            <p className="text-xs text-muted-foreground">
              自启动以来
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">成功率</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">0%</div>
            <p className="text-xs text-muted-foreground">
              请求成功率
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">活跃账户</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">0</div>
            <p className="text-xs text-muted-foreground">
              已配置账户
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">平均响应时间</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">0ms</div>
            <p className="text-xs text-muted-foreground">
              最近 100 次请求
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
