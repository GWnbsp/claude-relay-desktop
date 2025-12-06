import { Moon, Sun, Monitor } from 'lucide-react'
import { useTheme } from '@/contexts/ThemeContext'
import { useTranslation } from 'react-i18next'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'

export function ThemeToggle() {
  const { theme, resolvedTheme, setTheme } = useTheme()
  const { t } = useTranslation()

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="sm"
          className="h-9 w-9 rounded-md hover:bg-accent/50 transition-all duration-200"
        >
          {resolvedTheme === 'light' ? (
            <Sun className="h-4 w-4 transition-transform duration-200 hover:rotate-12" />
          ) : (
            <Moon className="h-4 w-4 transition-transform duration-200 hover:-rotate-12" />
          )}
          <span className="sr-only">{t('theme.toggle')}</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-40">
        <DropdownMenuItem
          onClick={() => setTheme('light')}
          className="cursor-pointer"
        >
          <Sun className="mr-2 h-4 w-4" />
          <span className="flex-1">{t('theme.light')}</span>
          {theme === 'light' && <span className="text-primary font-bold">✓</span>}
        </DropdownMenuItem>
        <DropdownMenuItem
          onClick={() => setTheme('dark')}
          className="cursor-pointer"
        >
          <Moon className="mr-2 h-4 w-4" />
          <span className="flex-1">{t('theme.dark')}</span>
          {theme === 'dark' && <span className="text-primary font-bold">✓</span>}
        </DropdownMenuItem>
        <DropdownMenuItem
          onClick={() => setTheme('system')}
          className="cursor-pointer"
        >
          <Monitor className="mr-2 h-4 w-4" />
          <span className="flex-1">{t('theme.system')}</span>
          {theme === 'system' && <span className="text-primary font-bold">✓</span>}
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
