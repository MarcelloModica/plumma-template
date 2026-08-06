export const SUPPORTED_LOCALES = ['it', 'en'] as const

export type AppLocale = (typeof SUPPORTED_LOCALES)[number]

const LOCALE_STORAGE_KEY = 'plumma.locale'

export function isAppLocale(value: string): value is AppLocale {
  return SUPPORTED_LOCALES.includes(value as AppLocale)
}

export function getStoredLocale(): AppLocale | null {
  const stored = localStorage.getItem(LOCALE_STORAGE_KEY)
  return stored && isAppLocale(stored) ? stored : null
}

export function setStoredLocale(locale: AppLocale): void {
  localStorage.setItem(LOCALE_STORAGE_KEY, locale)
}

export function resolveInitialLocale(): AppLocale {
  const stored = getStoredLocale()
  if (stored) {
    return stored
  }

  const browserLanguage = navigator.language.toLowerCase()
  if (browserLanguage.startsWith('en')) {
    return 'en'
  }

  return 'it'
}
