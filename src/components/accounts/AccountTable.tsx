import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { AccountSummary } from '@/services/api'
import { Pencil, Trash2 } from 'lucide-react'

interface Props {
  accounts: AccountSummary[]
  onEdit?: (account: AccountSummary) => void
  onDelete?: (accountId: string) => void
}

const platformLabel: Record<string, string> = {
  claude: 'Claude',
  gemini: 'Gemini',
  codex: 'OpenAI Responses',
}

export function AccountTable({ accounts, onEdit, onDelete }: Props) {
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
            <th className="px-4 py-2 text-right text-xs font-medium text-muted-foreground uppercase">操作</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-border bg-background">
          {accounts.map((acc) => (
            <tr key={acc.id} className="hover:bg-muted/30 transition-colors">
              <td className="px-4 py-2 text-sm font-medium">{acc.name}</td>
              <td className="px-4 py-2 text-sm text-muted-foreground">{acc.account_type}</td>
              <td className="px-4 py-2 text-sm text-muted-foreground">{platformLabel[acc.platform] ?? acc.platform}</td>
              <td className="px-4 py-2 text-sm text-muted-foreground">{acc.priority}</td>
              <td className="px-4 py-2 text-sm">
                <Badge variant={acc.enabled ? 'success' : 'secondary'}>
                  {acc.enabled ? '启用' : '禁用'}
                </Badge>
              </td>
              <td className="px-4 py-2 text-sm">
                <div className="flex items-center justify-end gap-1">
                  {onEdit && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => onEdit(acc)}
                      className="h-8 w-8 p-0"
                      title="编辑账户"
                    >
                      <Pencil className="h-4 w-4" />
                    </Button>
                  )}
                  {onDelete && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        if (confirm(`确定要删除账户 "${acc.name}" 吗？`)) {
                          onDelete(acc.id)
                        }
                      }}
                      className="h-8 w-8 p-0 hover:text-destructive"
                      title="删除账户"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

