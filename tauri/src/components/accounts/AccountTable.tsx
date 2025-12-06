import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { AccountSummary } from '@/services/api'
import { Pencil, Trash2 } from 'lucide-react'
import { useTranslation } from 'react-i18next'

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
  const { t } = useTranslation()

  if (!accounts.length) {
    return (
      <Card>
        <CardContent className="py-10 text-center text-muted-foreground">
          {t('accountTable.noAccounts')}
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="rounded-md border overflow-hidden">
      <table className="min-w-full divide-y divide-border">
        <thead className="bg-muted/50">
          <tr>
            <th className="px-4 py-2 text-left text-xs font-medium text-muted-foreground uppercase">{t('accountTable.name')}</th>
            <th className="px-4 py-2 text-left text-xs font-medium text-muted-foreground uppercase">{t('accountTable.type')}</th>
            <th className="px-4 py-2 text-left text-xs font-medium text-muted-foreground uppercase">{t('accountTable.platform')}</th>
            <th className="px-4 py-2 text-left text-xs font-medium text-muted-foreground uppercase">{t('accountTable.priority')}</th>
            <th className="px-4 py-2 text-left text-xs font-medium text-muted-foreground uppercase">{t('accountTable.status')}</th>
            <th className="px-4 py-2 text-right text-xs font-medium text-muted-foreground uppercase">{t('accountTable.actions')}</th>
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
                  {acc.enabled ? t('accountTable.enabled') : t('accountTable.disabled')}
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
                      title={t('accountTable.editTooltip')}
                    >
                      <Pencil className="h-4 w-4" />
                    </Button>
                  )}
                  {onDelete && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        if (confirm(t('accountTable.confirmDelete', { name: acc.name }))) {
                          onDelete(acc.id)
                        }
                      }}
                      className="h-8 w-8 p-0 hover:text-destructive"
                      title={t('accountTable.deleteTooltip')}
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

