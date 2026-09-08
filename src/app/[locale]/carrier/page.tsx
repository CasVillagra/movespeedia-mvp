import { getTranslations, setRequestLocale } from 'next-intl/server'
import { requireRole } from '@/lib/auth/session'
import { RoleStub } from '@/components/role-stub'

export default async function CarrierPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params
  setRequestLocale(locale)

  const profile = await requireRole(locale, ['carrier'])
  const t = await getTranslations('dashboard')

  return <RoleStub title={t('carrierTitle')} nextUp={t('carrierNext')} profile={profile} />
}
