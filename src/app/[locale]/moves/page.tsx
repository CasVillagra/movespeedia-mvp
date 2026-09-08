import { getTranslations, setRequestLocale } from 'next-intl/server'
import { requireRole } from '@/lib/auth/session'
import { RoleStub } from '@/components/role-stub'

export default async function MovesPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params
  setRequestLocale(locale)

  const profile = await requireRole(locale, ['customer'])
  const t = await getTranslations('dashboard')

  return <RoleStub title={t('customerTitle')} nextUp={t('customerNext')} profile={profile} />
}
