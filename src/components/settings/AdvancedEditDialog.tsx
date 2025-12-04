import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { AlertTriangle } from 'lucide-react'
import { ConfigManager } from '@/services/config'

interface Props {
  open: boolean
  onClose: () => void
  onSave: (configText: string) => void
  initialValue: string
}

export function AdvancedEditDialog({ open, onClose, onSave, initialValue }: Props) {
  const [configText, setConfigText] = useState(initialValue)
  const [errors, setErrors] = useState<string[]>([])

  useEffect(() => {
    setConfigText(initialValue)
    setErrors([])
  }, [initialValue, open])

  if (!open) return null

  const handleValidate = () => {
    try {
      const parsed = ConfigManager.parse(configText)
      const result = ConfigManager.validate(parsed)
      if (result.valid) {
        setErrors([])
        return true
      } else {
        setErrors(result.errors)
        return false
      }
    } catch (e) {
      setErrors(['TOML 格式错误: ' + (e as Error).message])
      return false
    }
  }

  const handleSave = () => {
    if (handleValidate()) {
      onSave(configText)
      onClose()
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
      <Card className="w-full max-w-4xl max-h-[90vh] flex flex-col">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-yellow-500" />
            高级编辑模式
          </CardTitle>
          <p className="text-sm text-muted-foreground">
            直接编辑 TOML 配置文件。错误的配置可能导致服务无法启动。
          </p>
        </CardHeader>
        <CardContent className="flex-1 flex flex-col gap-4 overflow-hidden">
          <textarea
            className="flex-1 w-full rounded-md border border-input bg-background px-3 py-2 text-sm font-mono resize-none"
            value={configText}
            onChange={(e) => setConfigText(e.target.value)}
            spellCheck={false}
          />

          {errors.length > 0 && (
            <div className="rounded-md bg-destructive/10 border border-destructive/20 p-3">
              <p className="text-sm font-medium text-destructive mb-2">配置验证失败：</p>
              <ul className="list-disc list-inside space-y-1">
                {errors.map((err, i) => (
                  <li key={i} className="text-sm text-destructive">{err}</li>
                ))}
              </ul>
            </div>
          )}

          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={onClose}>取消</Button>
            <Button variant="outline" onClick={handleValidate}>验证配置</Button>
            <Button onClick={handleSave}>保存</Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
