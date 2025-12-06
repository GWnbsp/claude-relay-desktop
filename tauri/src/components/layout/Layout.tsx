import { Link, useLocation, useNavigate } from 'react-router-dom'
import { cn } from '@/lib/utils'
import {
  LayoutDashboard,
  Users,
  Settings,
  FileText,
  BarChart3,
} from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { ThemeToggle } from '@/components/ui/theme-toggle'
import { LanguageToggle } from '@/components/ui/language-toggle'
import { useEffect } from 'react'
import { listen } from '@tauri-apps/api/event'

interface LayoutProps {
  children: React.ReactNode
}

const navigationItems = [
  {
    name: 'nav.dashboard',
    path: '/',
    icon: LayoutDashboard,
  },
  {
    name: 'nav.accounts',
    path: '/accounts',
    icon: Users,
  },
  {
    name: 'nav.usage',
    path: '/usage',
    icon: BarChart3,
  },
  {
    name: 'nav.settings',
    path: '/settings',
    icon: Settings,
  },
  {
    name: 'nav.logs',
    path: '/logs',
    icon: FileText,
  },
]

export function Layout({ children }: LayoutProps) {
  const location = useLocation()
  const navigate = useNavigate()
  const { t } = useTranslation()

  useEffect(() => {
    // 监听来自托盘和应用菜单的导航事件
    const unlistenPromise = listen<string>('navigate-to', (event) => {
      console.log('Received navigate-to event:', event.payload)
      navigate(event.payload)
    })

    return () => {
      unlistenPromise.then((unlisten) => unlisten())
    }
  }, [navigate])

  return (
    <div className="flex h-screen bg-background">
      {/* Sidebar */}
      <aside className="w-64 border-r bg-card shadow-sm">
        <div className="flex h-full flex-col">
          {/* Logo */}
          <div className="flex h-16 items-center border-b px-6">
            <h1 className="text-xl font-bold bg-gradient-to-r from-primary to-blue-600 bg-clip-text text-transparent">
              {t('common.appName')}
            </h1>
          </div>

          {/* Navigation */}
          <nav className="flex-1 space-y-1 p-4">
            {navigationItems.map((item) => {
              const Icon = item.icon
              const isActive = location.pathname === item.path

              return (
                <Link
                  key={item.path}
                  to={item.path}
                  className={cn(
                    'flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all duration-200',
                    isActive
                      ? 'bg-primary text-primary-foreground shadow-md scale-[1.02]'
                      : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground hover:scale-[1.01]'
                  )}
                >
                  <Icon className={cn(
                    "h-5 w-5 transition-transform duration-200",
                    isActive && "scale-110"
                  )} />
                  <span>{t(item.name)}</span>
                </Link>
              )
            })}
          </nav>

          {/* Theme and Language Toggles */}
          <div className="border-t px-4 py-3">
            <div className="flex items-center justify-center gap-2 rounded-lg bg-muted/50 p-2">
              <ThemeToggle />
              <div className="h-6 w-px bg-border" />
              <LanguageToggle />
            </div>
          </div>

          {/* Footer */}
          <div className="border-t px-4 py-3">
            <p className="text-xs text-center text-muted-foreground">
              {t('common.version')} 0.1.0
            </p>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-auto">
        <div className="container mx-auto max-w-7xl p-6">
          {children}
        </div>
      </main>
    </div>
  )
}
