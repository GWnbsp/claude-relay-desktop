import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Save, FileEdit } from 'lucide-react'

export function Settings() {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold tracking-tight">设置</h2>
        <p className="text-muted-foreground">
          配置服务器参数和应用选项
        </p>
      </div>

      <div className="grid gap-6">
        {/* Server Settings */}
        <Card>
          <CardHeader>
            <CardTitle>服务器配置</CardTitle>
            <CardDescription>
              修改服务器监听地址和端口
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">配置文件</label>
              <div className="flex gap-2">
                <input
                  type="text"
                  className="flex-1 rounded-md border border-input bg-background px-3 py-2 text-sm"
                  placeholder="/path/to/config.toml"
                  disabled
                />
                <Button variant="outline">
                  <FileEdit className="mr-2 h-4 w-4" />
                  编辑
                </Button>
              </div>
            </div>
            <Button>
              <Save className="mr-2 h-4 w-4" />
              保存配置
            </Button>
          </CardContent>
        </Card>

        {/* Application Settings */}
        <Card>
          <CardHeader>
            <CardTitle>应用设置</CardTitle>
            <CardDescription>
              自定义应用行为和外观
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <label className="text-sm font-medium">启动时自动运行服务</label>
                <p className="text-sm text-muted-foreground">
                  应用启动时自动启动转发服务
                </p>
              </div>
              <input
                type="checkbox"
                className="h-4 w-4"
              />
            </div>
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <label className="text-sm font-medium">最小化到系统托盘</label>
                <p className="text-sm text-muted-foreground">
                  关闭窗口时保持后台运行
                </p>
              </div>
              <input
                type="checkbox"
                className="h-4 w-4"
              />
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
