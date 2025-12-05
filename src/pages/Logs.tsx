import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Trash2, Download, RefreshCw } from 'lucide-react'
import { useEffect, useState, useRef } from 'react'
import { TauriAPI } from '@/services/api'
import { listen } from '@tauri-apps/api/event'

export function Logs() {
  const [lines, setLines] = useState<string[]>([])
  const [autoScroll, setAutoScroll] = useState(true)
  const logContainerRef = useRef<HTMLDivElement>(null)

  const fetchLogs = async () => {
    try {
      const data = await TauriAPI.tailLogs?.()
      if (data) setLines(data)
    } catch (e) {
      console.error('Failed to fetch logs:', e)
    }
  }

  const handleClearLogs = async () => {
    try {
      await TauriAPI.clearLogs?.()
      setLines([])
    } catch (e) {
      console.error('Failed to clear logs:', e)
    }
  }

  const handleExportLogs = () => {
    const logText = lines.join('\n')
    const blob = new Blob([logText], { type: 'text/plain' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `logs-${new Date().toISOString().replace(/:/g, '-')}.txt`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }

  // 滚动到底部
  useEffect(() => {
    if (autoScroll && logContainerRef.current) {
      logContainerRef.current.scrollTop = logContainerRef.current.scrollHeight
    }
  }, [lines, autoScroll])

  // 初始加载日志
  useEffect(() => {
    fetchLogs()
  }, [])

  // 监听实时日志事件
  useEffect(() => {
    const unlisten = listen<string>('server-log', (event) => {
      const timestamp = new Date().toLocaleString('zh-CN', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
      })
      setLines((prev) => [...prev, `[${timestamp}] ${event.payload}`])
    })

    return () => {
      unlisten.then((fn) => fn())
    }
  }, [])

  // 定期刷新日志（作为后备方案）
  useEffect(() => {
    const id = setInterval(fetchLogs, 10000)
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
          <Button variant="outline" onClick={fetchLogs}>
            <RefreshCw className="mr-2 h-4 w-4" />
            刷新
          </Button>
          <Button variant="outline" onClick={handleExportLogs} disabled={lines.length === 0}>
            <Download className="mr-2 h-4 w-4" />
            导出日志
          </Button>
          <Button variant="outline" onClick={handleClearLogs} disabled={lines.length === 0}>
            <Trash2 className="mr-2 h-4 w-4" />
            清除日志
          </Button>
        </div>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>实时日志</CardTitle>
              <CardDescription>
                最近的服务器日志输出（共 {lines.length} 条）
              </CardDescription>
            </div>
            <label className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={autoScroll}
                onChange={(e) => setAutoScroll(e.target.checked)}
                className="rounded border-gray-300"
              />
              自动滚动
            </label>
          </div>
        </CardHeader>
        <CardContent>
          <div
            ref={logContainerRef}
            className="rounded-md border bg-muted/50 p-4 h-[600px] overflow-y-auto"
          >
            <div className="font-mono text-xs text-muted-foreground">
              {lines.length === 0 ? (
                <p className="text-center text-gray-500">暂无日志，请启动服务...</p>
              ) : (
                lines.map((l, i) => (
                  <p key={i} className="whitespace-pre-wrap break-all">
                    {l}
                  </p>
                ))
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
