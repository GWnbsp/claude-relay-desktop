import { useState, useEffect } from 'react'

function App() {
  const [message, setMessage] = useState('正在初始化...')

  useEffect(() => {
    setMessage('Claude Code Relay Desktop 开发环境已准备就绪！')
  }, [])

  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="text-center space-y-6">
        <h1 className="text-4xl font-bold text-foreground">
          Claude Code Relay
        </h1>
        <p className="text-xl text-muted-foreground">
          {message}
        </p>
        <div className="text-sm text-muted-foreground">
          <p>开发环境设置完成</p>
          <p className="mt-2">接下来可以开始开发核心功能</p>
        </div>
      </div>
    </div>
  )
}

export default App
