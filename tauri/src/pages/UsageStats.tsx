import { Button } from '@/components/ui/button'
import { BarChart3, Database, Download, RefreshCw } from 'lucide-react'
import { useEffect, useState } from 'react'
import { useApp } from '@/contexts/AppContext'
import { StatsAPI, type AccountUsageSummary, type DatabaseInfo } from '@/services/stats'
import { useTranslation } from 'react-i18next'
import { cn } from '@/lib/utils'

export function UsageStats() {
  const { state } = useApp()
  const { t } = useTranslation()

  const [stats, setStats] = useState<AccountUsageSummary[]>([])
  const [dbInfo, setDbInfo] = useState<DatabaseInfo | null>(null)
  const [days, setDays] = useState(7)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const databasePath = state.config?.server?.database_path || 'data/relay.db'

  const loadStats = async () => {
    setLoading(true)
    setError(null)
    try {
      const [statsData, dbInfoData] = await Promise.all([
        StatsAPI.getUsageStats(databasePath, days),
        StatsAPI.getDatabaseInfo(databasePath)
      ])
      setStats(statsData)
      setDbInfo(dbInfoData)
    } catch (err) {
      console.error('Failed to load stats:', err)
      setError(err as string)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadStats()
  }, [days, databasePath])

  const totalInput = stats.reduce((sum, s) => sum + s.total_input, 0)
  const totalOutput = stats.reduce((sum, s) => sum + s.total_output, 0)
  const totalRequests = stats.reduce((sum, s) => sum + s.total_requests, 0)
  const totalTokens = totalInput + totalOutput

  const maxTokens = Math.max(...stats.map(s => s.total_input + s.total_output), 1)

  const exportCSV = () => {
    const headers = ['Account ID', 'Input Tokens', 'Output Tokens', 'Total Tokens', 'Requests']
    const rows = stats.map(s => [
      s.account_id,
      s.total_input,
      s.total_output,
      s.total_input + s.total_output,
      s.total_requests
    ])

    const csv = [
      headers.join(','),
      ...rows.map(row => row.join(','))
    ].join('\n')

    const blob = new Blob([csv], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `usage-stats-${days}days.csv`
    a.click()
    URL.revokeObjectURL(url)
  }

  const formatNumber = (num: number) => {
    if (num >= 1000000) {
      return (num / 1000000).toFixed(2) + 'M'
    }
    if (num >= 1000) {
      return (num / 1000).toFixed(1) + 'K'
    }
    return num.toString()
  }

  return (
    <div className="flex h-full flex-col">
      {/* Header */}
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">{t('usageStats.title')}</h2>
          <p className="text-sm text-muted-foreground mt-1">
            {t('usageStats.subtitle')}
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={loadStats} disabled={loading}>
            <RefreshCw className={cn("mr-2 h-4 w-4", loading && "animate-spin")} />
            {t('logs.refresh')}
          </Button>
          <Button variant="outline" size="sm" onClick={exportCSV} disabled={stats.length === 0}>
            <Download className="mr-2 h-4 w-4" />
            {t('usageStats.export')}
          </Button>
        </div>
      </div>

      {/* Time Range Selector */}
      <div className="mb-6 flex items-center gap-2">
        <span className="text-sm text-muted-foreground">{t('usageStats.timeRange')}:</span>
        {[7, 30, 90, 365].map((d) => (
          <Button
            key={d}
            variant={days === d ? 'default' : 'outline'}
            size="sm"
            onClick={() => setDays(d)}
          >
            {d} {t('usageStats.days')}
          </Button>
        ))}
      </div>

      {/* Database Info */}
      {dbInfo && (
        <div className="mb-6 rounded-lg border bg-card p-4">
          <div className="flex items-center gap-2 mb-2">
            <Database className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm font-medium">{t('usageStats.databaseInfo')}</span>
          </div>
          <div className="text-xs text-muted-foreground space-y-1">
            <div>{t('usageStats.dbPath')}: {dbInfo.path}</div>
            <div>{t('usageStats.dbSize')}: {dbInfo.size_readable}</div>
            <div>{t('usageStats.dbStatus')}: {dbInfo.exists ? t('usageStats.dbExists') : t('usageStats.dbNotFound')}</div>
          </div>
        </div>
      )}

      {/* Error Message */}
      {error && (
        <div className="mb-6 rounded-lg border border-destructive bg-destructive/10 p-4">
          <p className="text-sm text-destructive">{error}</p>
        </div>
      )}

      {/* Summary Cards */}
      <div className="mb-6 grid grid-cols-4 gap-4">
        <div className="rounded-lg border bg-card p-4">
          <div className="text-xs text-muted-foreground mb-1">{t('usageStats.totalTokens')}</div>
          <div className="text-2xl font-bold">{formatNumber(totalTokens)}</div>
        </div>
        <div className="rounded-lg border bg-card p-4">
          <div className="text-xs text-muted-foreground mb-1">{t('usageStats.inputTokens')}</div>
          <div className="text-2xl font-bold text-blue-600">{formatNumber(totalInput)}</div>
        </div>
        <div className="rounded-lg border bg-card p-4">
          <div className="text-xs text-muted-foreground mb-1">{t('usageStats.outputTokens')}</div>
          <div className="text-2xl font-bold text-green-600">{formatNumber(totalOutput)}</div>
        </div>
        <div className="rounded-lg border bg-card p-4">
          <div className="text-xs text-muted-foreground mb-1">{t('usageStats.requests')}</div>
          <div className="text-2xl font-bold">{formatNumber(totalRequests)}</div>
        </div>
      </div>

      {/* Stats List */}
      <div className="flex-1 overflow-auto">
        {loading ? (
          <div className="flex items-center justify-center h-32">
            <div className="text-sm text-muted-foreground">{t('message.loading')}</div>
          </div>
        ) : stats.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-32 text-muted-foreground">
            <BarChart3 className="h-12 w-12 mb-2 opacity-20" />
            <p className="text-sm">{t('usageStats.noData')}</p>
          </div>
        ) : (
          <div className="space-y-4">
            {stats.map((stat) => {
              const total = stat.total_input + stat.total_output
              const percentage = (total / maxTokens) * 100
              const inputPercent = (stat.total_input / total) * 100
              const outputPercent = (stat.total_output / total) * 100

              return (
                <div key={stat.account_id} className="rounded-lg border bg-card p-4">
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-medium">{stat.account_id}</span>
                    <span className="text-sm text-muted-foreground">
                      {formatNumber(total)} tokens
                    </span>
                  </div>

                  {/* Progress Bar */}
                  <div className="mb-2 h-6 overflow-hidden rounded-full bg-secondary">
                    <div
                      className="h-full bg-gradient-to-r from-blue-500 to-green-500"
                      style={{ width: `${percentage}%` }}
                    />
                  </div>

                  {/* Details */}
                  <div className="flex items-center justify-between text-xs text-muted-foreground">
                    <div className="flex gap-4">
                      <span className="flex items-center gap-1">
                        <div className="h-2 w-2 rounded-full bg-blue-500" />
                        {t('usageStats.input')}: {formatNumber(stat.total_input)}
                      </span>
                      <span className="flex items-center gap-1">
                        <div className="h-2 w-2 rounded-full bg-green-500" />
                        {t('usageStats.output')}: {formatNumber(stat.total_output)}
                      </span>
                    </div>
                    <span>{formatNumber(stat.total_requests)} {t('usageStats.requests').toLowerCase()}</span>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
