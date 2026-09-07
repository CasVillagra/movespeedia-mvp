'use client'

import { useLocale, useTranslations } from 'next-intl'
import { usePathname, useRouter } from '@/i18n/navigation'
import { routing, type Locale } from '@/i18n/routing'

export function LocaleSwitcher() {
  const t = useTranslations('common')
  const locale = useLocale()
  const router = useRouter()
  const pathname = usePathname()

  return (
    <label className="flex items-center gap-2 text-sm">
      <span className="sr-only">{t('language')}</span>
      <select
        value={locale}
        onChange={(event) => router.replace(pathname, { locale: event.target.value as Locale })}
        className="rounded border border-black/15 bg-transparent px-2 py-1 dark:border-white/20"
      >
        {routing.locales.map((value) => (
          <option key={value} value={value}>
            {value === 'en' ? t('english') : t('spanish')}
          </option>
        ))}
      </select>
    </label>
  )
}
