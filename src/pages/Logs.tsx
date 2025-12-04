import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Trash2, Download } from 'lucide-react'
import { useEffect, useState } from 'react'
import { TauriAPI } from '@/services/api'

export function Logs() {
  const [lines, setLines] = useState<string[]>(['等待服务启动...'])

  const fetchLogs = async () => {
    try {
      const data = await TauriAPI.tailLogs?.()
      if (data) setLines(data)
    } catch (e) {
      // ignore
    }
  }

  useEffect(() => {
    fetchLogs()
    const id = setInterval(fetchLogs, 5000)
    return () => clearInterval(id)
  }, [])

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">日志</h2>
          <p className="text-muted-foreground">
            查看服务器运行日志和请求记录
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline">
            <Download className="mr-2 h-4 w-4" />
            导出日志
          </Button>
          <Button variant="outline">
            <Trash2 className="mr-2 h-4 w-4" />
            清除日志
          </Button>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>实时日志</CardTitle>
          <CardDescription>
            最近的服务器日志输出
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border bg-muted/50 p-4">
            <div className="font-mono text-sm text-muted-foreground">
              {lines.map((l, i) => (
                <p key={i}>{l}</p>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
