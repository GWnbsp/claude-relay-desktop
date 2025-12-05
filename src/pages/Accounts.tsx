import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Plus } from 'lucide-react'
import { useApp } from '@/contexts/AppContext'
import { AccountTable } from '@/components/accounts/AccountTable'
import { useMemo, useState } from 'react'
import { AccountDialog } from '@/components/accounts/AccountDialog'
import { Account } from '@/services/config'
import { useTranslation } from 'react-i18next'

export function Accounts() {
  const { state, actions } = useApp()
  const { t } = useTranslation()
  const [filter, setFilter] = useState('all')
  const [open, setOpen] = useState(false)
  const [editingAccount, setEditingAccount] = useState<Account | null>(null)

  const filtered = useMemo(() => {
    if (filter === 'all') return state.accounts
    return state.accounts.filter((a) => a.platform === filter)
  }, [filter, state.accounts])

  // 从配置中找到完整的 Account 对象
  const findAccountById = (id: string): Account | undefined => {
    return state.config?.accounts.find((acc) => acc.id === id)
  }

  const handleAdd = async (account: Account) => {
    if (!state.config) return
    const next = { ...state.config, accounts: [...state.config.accounts, account] }
    await actions.saveConfig(next)
    await actions.loadAccounts()
  }

  const handleEdit = async (account: Account) => {
    if (!state.config) return
    const updatedAccounts = state.config.accounts.map((acc) =>
      acc.id === account.id ? account : acc
    )
    const next = { ...state.config, accounts: updatedAccounts }
    await actions.saveConfig(next)
    await actions.loadAccounts()
  }

  const handleDelete = async (accountId: string) => {
    if (!state.config) return
    const updatedAccounts = state.config.accounts.filter((acc) => acc.id !== accountId)
    const next = { ...state.config, accounts: updatedAccounts }
    await actions.saveConfig(next)
    await actions.loadAccounts()
  }

  const handleOpenEdit = (accountSummary: any) => {
    const fullAccount = findAccountById(accountSummary.id)
    if (fullAccount) {
      setEditingAccount(fullAccount)
      setOpen(true)
    }
  }

  const handleClose = () => {
    setOpen(false)
    setEditingAccount(null)
  }

  const handleSave = async (account: Account) => {
    if (editingAccount) {
      await handleEdit(account)
    } else {
      await handleAdd(account)
    }
    handleClose()
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">{t('accounts.title')}</h2>
          <p className="text-muted-foreground">
            {t('accounts.subtitle')}
          </p>
        </div>
        <Button onClick={() => setOpen(true)}>
          <Plus className="mr-2 h-4 w-4" />
          {t('accounts.addAccount')}
        </Button>
      </div>

      <div className="flex gap-2">
        <label className="text-sm text-muted-foreground">{t('accounts.platformFilter')}</label>
        <select
          className="rounded-md border border-input bg-background px-2 py-1 text-sm"
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
        >
          <option value="all">{t('accounts.all')}</option>
          <option value="claude">{t('accounts.claude')}</option>
          <option value="gemini">{t('accounts.gemini')}</option>
          <option value="codex">{t('accounts.openaiResponses')}</option>
        </select>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>{t('accounts.accountList')}</CardTitle>
          <CardDescription>
            {t('accounts.accountListDesc')}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <AccountTable
            accounts={filtered}
            onEdit={handleOpenEdit}
            onDelete={handleDelete}
          />
          <div className="mt-4 text-sm text-muted-foreground">
            {t('accounts.totalCount', { filtered: filtered.length, total: state.accounts.length })}
          </div>
        </CardContent>
      </Card>

      <AccountDialog
        open={open}
        onClose={handleClose}
        onSave={handleSave}
        editAccount={editingAccount}
      />
    </div>
  )
}
