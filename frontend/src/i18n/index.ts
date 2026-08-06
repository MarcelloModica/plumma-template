import i18n from 'i18next'
import { initReactI18next } from 'react-i18next'
import {
  type AppLocale,
  resolveInitialLocale,
  setStoredLocale,
} from '@/lib/locale-storage'
import en from './locales/en.json'
import it from './locales/it.json'

function syncDocumentLanguage(locale: AppLocale) {
  document.documentElement.lang = locale
}

const initialLocale = resolveInitialLocale()

void i18n.use(initReactI18next).init({
  resources: {
    it: { translation: it },
    en: { translation: en },
  },
  lng: initialLocale,
  fallbackLng: 'it',
  supportedLngs: ['it', 'en'],
  nonExplicitSupportedLngs: true,
  interpolation: {
    escapeValue: false,
  },
})

syncDocumentLanguage(initialLocale)

i18n.on('languageChanged', (locale) => {
  if (locale === 'it' || locale === 'en') {
    setStoredLocale(locale)
    syncDocumentLanguage(locale)
  }
})

export default i18n
