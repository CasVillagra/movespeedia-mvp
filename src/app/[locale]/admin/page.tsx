import { getTranslations, setRequestLocale } from 'next-intl/server'
import { requireRole } from '@/lib/auth/session'
import { createClient } from '@/lib/supabase/server'
import { RoleStub } from '@/components/role-stub'

export default async function AdminPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params
  setRequestLocale(locale)

  const profile = await requireRole(locale, ['admin'])
  const t = await getTranslations('dashboard')

  // Only an admin can read pricing_config — proves the RLS policy end to end.
  const supabase = await createClient()
  const { data: pricing } = await supabase.from('pricing_config').select('*').single()

  return (
    <RoleStub title={t('adminTitle')} nextUp={t('adminNext')} profile={profile}>
      {pricing && (
        <dl className="mt-6 grid grid-cols-2 gap-x-6 gap-y-2 rounded-lg border border-black/10 p-5 text-sm dark:border-white/15">
          <dt className="text-black/60 dark:text-white/60">{t('baseRate')}</dt>
          <dd>${pricing.base_rate}</dd>
          <dt className="text-black/60 dark:text-white/60">{t('ratePerCubicFoot')}</dt>
          <dd>${pricing.rate_per_cubic_foot}</dd>
          <dt className="text-black/60 dark:text-white/60">{t('conversionFactor')}</dt>
          <dd>{pricing.cubic_feet_to_pounds_factor} lb / ft³</dd>
          <dt className="text-black/60 dark:text-white/60">{t('paymentStages')}</dt>
          <dd>
            {pricing.deposit_pct}% / {pricing.pre_move_pct}% / {pricing.delivery_pct}%
          </dd>
        </dl>
      )}
    </RoleStub>
  )
}
