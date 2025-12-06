import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Trash2, Download, RefreshCw } from 'lucide-react'
import { useEffect, useState, useRef } from 'react'
import { TauriAPI } from '@/services/api'
import { listen } from '@tauri-apps/api/event'
import { save } from '@tauri-apps/api/dialog'
import { writeTextFile } from '@tauri-apps/api/fs'
import { useTranslation } from 'react-i18next'

export function Logs() {
  const { t } = useTranslation()
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

  const handleExportLogs = async () => {
    try {
      const logText = lines.join('\n')

      // 使用 Tauri 的保存对话框
      const defaultFileName = `logs-${new Date().toISOString().replace(/:/g, '-').split('.')[0]}.txt`
      const filePath = await save({
        defaultPath: defaultFileName,
        filters: [{
          name: 'Text Files',
          extensions: ['txt']
        }]
      })

      // 如果用户取消了对话框，filePath 会是 null
      if (filePath) {
        await writeTextFile(filePath, logText)
        console.log('Logs exported successfully to:', filePath)
      }
    } catch (e) {
      console.error('Failed to export logs:', e)
    }
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
          <h2 className="text-3xl font-bold tracking-tight">{t('logs.title')}</h2>
          <p className="text-muted-foreground">
            {t('logs.subtitle')}
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={fetchLogs}>
            <RefreshCw className="mr-2 h-4 w-4" />
            {t('logs.refresh')}
          </Button>
          <Button variant="outline" onClick={handleExportLogs} disabled={lines.length === 0}>
            <Download className="mr-2 h-4 w-4" />
            {t('logs.export')}
          </Button>
          <Button variant="outline" onClick={handleClearLogs} disabled={lines.length === 0}>
            <Trash2 className="mr-2 h-4 w-4" />
            {t('logs.clear')}
          </Button>
        </div>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>{t('logs.realtime')}</CardTitle>
              <CardDescription>
                {t('logs.count', { count: lines.length })}
              </CardDescription>
            </div>
            <label className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={autoScroll}
                onChange={(e) => setAutoScroll(e.target.checked)}
                className="rounded border-gray-300"
              />
              {t('logs.autoScroll')}
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
                <p className="text-center text-gray-500">{t('logs.noLogs')}</p>
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
