import { getTranslations } from 'next-intl/server'
import type { Profile } from '@/lib/auth/session'

/**
 * Placeholder for the three role areas. Milestone 1 proves that auth, roles
 * and RLS route people to the right place; the screens themselves are later
 * milestones.
 */
export async function RoleStub({
  title,
  nextUp,
  profile,
  children,
}: {
  title: string
  nextUp: string
  profile: Profile
  children?: React.ReactNode
}) {
  const t = await getTranslations('dashboard')

  return (
    <main className="mx-auto w-full max-w-3xl px-6 py-14">
      <h1 className="text-2xl font-semibold tracking-tight">{title}</h1>

      <p className="mt-2 text-black/70 dark:text-white/70">
        {t('signedInAs', { name: profile.full_name ?? '—', role: profile.role })}
      </p>

      <div className="mt-6 rounded-lg border border-dashed border-black/20 p-5 text-sm dark:border-white/25">
        <p className="font-medium">{t('comingNext')}</p>
        <p className="mt-1 text-black/70 dark:text-white/70">{nextUp}</p>
      </div>

      {children}
    </main>
  )
}
