import { Languages } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { type AppLocale, SUPPORTED_LOCALES } from '@/lib/locale-storage'
import { cn } from '@/lib/utils'

interface LanguageSelectorProps {
  className?: string
  variant?: 'header' | 'default'
}

const localeLabels: Record<AppLocale, string> = {
  it: 'language.italian',
  en: 'language.english',
}

export function LanguageSelector({
  className,
  variant = 'default',
}: LanguageSelectorProps) {
  const { i18n, t } = useTranslation()
  const currentLocale = (i18n.resolvedLanguage ?? 'it') as AppLocale

  const handleChange = (locale: AppLocale) => {
    void i18n.changeLanguage(locale)
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        aria-label={t('language.label')}
        className={cn(
          'inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-sm font-medium outline-none transition-colors focus-visible:ring-2 focus-visible:ring-ring',
          variant === 'header'
            ? 'text-white hover:bg-white/15 focus-visible:ring-white/50'
            : 'text-foreground hover:bg-muted',
          className,
        )}
      >
        <Languages className="size-4" />
        <span>{t(`language.short.${currentLocale}`)}</span>
      </DropdownMenuTrigger>

      <DropdownMenuContent align="end" className="min-w-36">
        {SUPPORTED_LOCALES.map((locale) => (
          <DropdownMenuItem
            key={locale}
            onClick={() => handleChange(locale)}
            className={cn(currentLocale === locale && 'bg-accent')}
          >
            {t(localeLabels[locale])}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
