import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Account } from '@/services/config'

interface Props {
  open: boolean
  onClose: () => void
  onSave: (account: Account) => void
  editAccount?: Account | null
}

const accountTypes = [
  { value: 'claude-api', label: 'Claude API Key' },
  { value: 'claude-oauth', label: 'Claude OAuth' },
  { value: 'gemini', label: 'Gemini' },
  { value: 'openai-responses', label: 'OpenAI Responses' },
]

export function AccountDialog({ open, onClose, onSave, editAccount }: Props) {
  const [type, setType] = useState<Account['type']>('claude-api')
  const [id, setId] = useState('')
  const [name, setName] = useState('')
  const [priority, setPriority] = useState(100)
  const [enabled, setEnabled] = useState(true)
  const [credential, setCredential] = useState('')

  const isEditMode = !!editAccount

  // 编辑模式：初始化表单
  useEffect(() => {
    if (editAccount) {
      setType(editAccount.type)
      setId(editAccount.id)
      setName(editAccount.name)
      setPriority(editAccount.priority)
      setEnabled(editAccount.enabled)
      // 提取凭证
      if ('api_key' in editAccount) {
        setCredential(editAccount.api_key || '')
      } else if ('refresh_token' in editAccount) {
        setCredential(editAccount.refresh_token || '')
      }
    } else {
      // 重置为默认值
      setType('claude-api')
      setId('')
      setName('')
      setPriority(100)
      setEnabled(true)
      setCredential('')
    }
  }, [editAccount, open])

  if (!open) return null

  const handleSave = () => {
    if (!id || !name) return
    const base: Account = {
      type,
      id,
      name,
      priority,
      enabled,
    }

    const account: Account =
      type === 'claude-api' || type === 'openai-responses'
        ? { ...base, api_key: credential }
        : { ...base, refresh_token: credential }

    onSave(account)
    onClose()
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
      <Card className="w-full max-w-lg">
        <CardHeader>
          <CardTitle>{isEditMode ? '编辑账户' : '添加账户'}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <label className="text-sm font-medium">类型</label>
            <select
              className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
              value={type}
              onChange={(e) => setType(e.target.value as Account['type'])}
              disabled={isEditMode}
            >
              {accountTypes.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="text-sm font-medium">ID</label>
              <input
                className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                value={id}
                onChange={(e) => setId(e.target.value)}
                placeholder="唯一 ID"
                disabled={isEditMode}
              />
            </div>
            <div className="space-y-1">
              <label className="text-sm font-medium">名称</label>
              <input
                className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="展示名称"
              />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="text-sm font-medium">优先级</label>
              <input
                type="number"
                className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                value={priority}
                onChange={(e) => setPriority(Number(e.target.value))}
              />
            </div>
            <div className="flex items-end gap-2">
              <input
                id="enabled"
                type="checkbox"
                checked={enabled}
                onChange={(e) => setEnabled(e.target.checked)}
                className="h-4 w-4"
              />
              <label htmlFor="enabled" className="text-sm">
                启用
              </label>
            </div>
          </div>
          <div className="space-y-1">
            <label className="text-sm font-medium">
              {type === 'claude-api' || type === 'openai-responses' ? 'API Key' : 'Refresh Token'}
            </label>
            <input
              className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
              value={credential}
              onChange={(e) => setCredential(e.target.value)}
            />
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="outline" onClick={onClose}>取消</Button>
            <Button onClick={handleSave} disabled={!id || !name || !credential}>
              {isEditMode ? '保存' : '添加'}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

