import { Languages } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'

export function LanguageToggle() {
  const { t, i18n } = useTranslation()

  const changeLanguage = (lng: string) => {
    i18n.changeLanguage(lng)
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="sm"
          className="h-9 w-9 rounded-md hover:bg-accent/50 transition-all duration-200"
        >
          <Languages className="h-4 w-4 transition-transform duration-200 hover:scale-110" />
          <span className="sr-only">{t('language.toggle')}</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-40">
        <DropdownMenuItem
          onClick={() => changeLanguage('zh-CN')}
          className="cursor-pointer"
        >
          <span className="flex-1">{t('language.chinese')}</span>
          {i18n.language === 'zh-CN' && <span className="text-primary font-bold">✓</span>}
        </DropdownMenuItem>
        <DropdownMenuItem
          onClick={() => changeLanguage('en-US')}
          className="cursor-pointer"
        >
          <span className="flex-1">{t('language.english')}</span>
          {i18n.language === 'en-US' && <span className="text-primary font-bold">✓</span>}
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
