import { getTranslations, setRequestLocale } from 'next-intl/server'
import { createClient } from '@/lib/supabase/server'
import { LocaleSwitcher } from '@/components/locale-switcher'

export default async function HomePage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params
  setRequestLocale(locale)

  const t = await getTranslations('home')

  // Proves the full stack end to end: RLS-governed anonymous read of the catalog.
  const supabase = await createClient()
  const { count } = await supabase
    .from('catalog_items')
    .select('*', { count: 'exact', head: true })
    .eq('is_active', true)

  const { count: placeholderCount } = await supabase
    .from('catalog_items')
    .select('*', { count: 'exact', head: true })
    .eq('is_placeholder', true)

  return (
    <main className="mx-auto flex min-h-screen max-w-2xl flex-col justify-center gap-8 px-6 py-16">
      <div className="flex justify-end">
        <LocaleSwitcher />
      </div>

      <div className="space-y-3">
        <h1 className="text-4xl font-semibold tracking-tight">{t('title')}</h1>
        <p className="text-lg text-black/70 dark:text-white/70">{t('subtitle')}</p>
      </div>

      <div className="rounded-lg border border-black/10 p-5 text-sm dark:border-white/15">
        <p className="font-medium">{t('statusHeading')}</p>
        <p className="mt-2 text-black/70 dark:text-white/70">
          {t('statusCatalog', { count: count ?? 0 })}
        </p>
        {(placeholderCount ?? 0) > 0 && (
          <p className="mt-2 rounded bg-amber-100 px-3 py-2 text-amber-900 dark:bg-amber-950 dark:text-amber-200">
            {t('statusPlaceholder')}
          </p>
        )}
      </div>
    </main>
  )
}
