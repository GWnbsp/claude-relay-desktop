import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Plus } from 'lucide-react'

export function Accounts() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">账户管理</h2>
          <p className="text-muted-foreground">
            管理 Claude API 账户配置
          </p>
        </div>
        <Button>
          <Plus className="mr-2 h-4 w-4" />
          添加账户
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>账户列表</CardTitle>
          <CardDescription>
            当前配置的所有 API 账户
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <p className="text-sm text-muted-foreground">
              暂无配置的账户
            </p>
            <Button variant="outline" className="mt-4">
              <Plus className="mr-2 h-4 w-4" />
              添加第一个账户
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
