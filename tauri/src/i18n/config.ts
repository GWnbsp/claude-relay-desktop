import i18n from 'i18next'
import { initReactI18next } from 'react-i18next'
import zhCN from './locales/zh-CN.json'
import enUS from './locales/en-US.json'

const STORAGE_KEY = 'app-language'

function getDefaultLanguage(): string {
  // Check localStorage first
  const stored = localStorage.getItem(STORAGE_KEY)
  if (stored === 'zh-CN' || stored === 'en-US') {
    return stored
  }

  // Detect system language
  const systemLang = navigator.language
  return systemLang.startsWith('zh') ? 'zh-CN' : 'en-US'
}

i18n
  .use(initReactI18next)
  .init({
    resources: {
      'zh-CN': { translation: zhCN },
      'en-US': { translation: enUS }
    },
    lng: getDefaultLanguage(),
    fallbackLng: 'en-US',
    interpolation: {
      escapeValue: false
    }
  })

// Save language changes to localStorage
i18n.on('languageChanged', (lng) => {
  localStorage.setItem(STORAGE_KEY, lng)
})

export default i18n
