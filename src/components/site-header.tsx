import { getTranslations } from 'next-intl/server'
import { Link } from '@/i18n/navigation'
import { LocaleSwitcher } from '@/components/locale-switcher'
import { getCurrentProfile, homePathForRole } from '@/lib/auth/session'
import { signOut } from '@/lib/auth/actions'

export async function SiteHeader({ locale }: { locale: string }) {
  const t = await getTranslations('nav')
  const common = await getTranslations('common')
  const profile = await getCurrentProfile()

  return (
    <header className="border-b border-black/10 dark:border-white/15">
      <div className="mx-auto flex max-w-5xl items-center justify-between gap-4 px-6 py-4">
        <Link href="/" className="text-base font-semibold tracking-tight">
          {common('appName')}
        </Link>

        <nav className="flex items-center gap-4 text-sm">
          {profile ? (
            <>
              <Link href={homePathForRole(locale, profile.role).replace(`/${locale}`, '') || '/'}>
                {profile.role === 'admin' ? t('admin') : profile.role === 'carrier' ? t('carrierPortal') : t('myMoves')}
              </Link>
              <form action={signOut}>
                <input type="hidden" name="locale" value={locale} />
                <button type="submit" className="underline underline-offset-4">
                  {t('signOut')}
                </button>
              </form>
            </>
          ) : (
            <Link href="/sign-in">{t('signIn')}</Link>
          )}
          <LocaleSwitcher />
        </nav>
      </div>
    </header>
  )
}
