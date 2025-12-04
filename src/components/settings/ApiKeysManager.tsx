import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Plus, Trash2, Key } from 'lucide-react'

interface Props {
  apiKeys: string[]
  onChange: (keys: string[]) => void
}

export function ApiKeysManager({ apiKeys, onChange }: Props) {
  const [newKey, setNewKey] = useState('')

  const handleAdd = () => {
    if (!newKey.trim()) return
    if (apiKeys.includes(newKey.trim())) {
      alert('该 API Key 已存在')
      return
    }
    onChange([...apiKeys, newKey.trim()])
    setNewKey('')
  }

  const handleRemove = (index: number) => {
    onChange(apiKeys.filter((_, i) => i !== index))
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Key className="h-5 w-5" />
          API Keys 管理
        </CardTitle>
        <p className="text-sm text-muted-foreground">
          配置客户端访问服务器时需要的 API Keys（留空表示不启用认证）
        </p>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* 添加新 Key */}
        <div className="flex gap-2">
          <input
            type="text"
            className="flex-1 rounded-md border border-input bg-background px-3 py-2 text-sm"
            placeholder="输入新的 API Key"
            value={newKey}
            onChange={(e) => setNewKey(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') handleAdd()
            }}
          />
          <Button onClick={handleAdd} disabled={!newKey.trim()}>
            <Plus className="mr-2 h-4 w-4" />
            添加
          </Button>
        </div>

        {/* Keys 列表 */}
        {apiKeys.length > 0 ? (
          <div className="space-y-2">
            <p className="text-sm font-medium">已配置的 API Keys ({apiKeys.length})</p>
            <div className="space-y-1">
              {apiKeys.map((key, index) => (
                <div
                  key={index}
                  className="flex items-center justify-between rounded-md border bg-muted/50 px-3 py-2"
                >
                  <code className="flex-1 text-sm font-mono">
                    {key.substring(0, 8)}...{key.substring(key.length - 8)}
                  </code>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleRemove(index)}
                    className="h-8 w-8 p-0"
                  >
                    <Trash2 className="h-4 w-4 text-destructive" />
                  </Button>
                </div>
              ))}
            </div>
          </div>
        ) : (
          <div className="text-center py-8 text-sm text-muted-foreground">
            未配置 API Keys - 服务器将不启用认证
          </div>
        )}
      </CardContent>
    </Card>
  )
}
