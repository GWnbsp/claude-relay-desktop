import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { AccountSummary } from '@/services/api'

interface Props {
  accounts: AccountSummary[]
}

const platformLabel: Record<string, string> = {
  claude: 'Claude',
  gemini: 'Gemini',
  codex: 'OpenAI Responses',
}

export function AccountTable({ accounts }: Props) {
  if (!accounts.length) {
    return (
      <Card>
        <CardContent className="py-10 text-center text-muted-foreground">
          暂无配置的账户
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="rounded-md border overflow-hidden">
      <table className="min-w-full divide-y divide-border">
        <thead className="bg-muted/50">
          <tr>
            <th className="px-4 py-2 text-left text-xs font-medium text-muted-foreground uppercase">名称</th>
            <th className="px-4 py-2 text-left text-xs font-medium text-muted-foreground uppercase">类型</th>
            <th className="px-4 py-2 text-left text-xs font-medium text-muted-foreground uppercase">平台</th>
            <th className="px-4 py-2 text-left text-xs font-medium text-muted-foreground uppercase">优先级</th>
            <th className="px-4 py-2 text-left text-xs font-medium text-muted-foreground uppercase">启用</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-border bg-background">
          {accounts.map((acc) => (
            <tr key={acc.id}>
              <td className="px-4 py-2 text-sm font-medium">{acc.name}</td>
              <td className="px-4 py-2 text-sm text-muted-foreground">{acc.account_type}</td>
              <td className="px-4 py-2 text-sm text-muted-foreground">{platformLabel[acc.platform] ?? acc.platform}</td>
              <td className="px-4 py-2 text-sm text-muted-foreground">{acc.priority}</td>
              <td className="px-4 py-2 text-sm">
                <Badge variant={acc.enabled ? 'success' : 'secondary'}>
                  {acc.enabled ? '启用' : '禁用'}
                </Badge>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

