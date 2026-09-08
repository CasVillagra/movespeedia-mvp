import { getTranslations, setRequestLocale } from 'next-intl/server'
import { redirect } from 'next/navigation'
import { AuthForm } from '@/components/auth/auth-form'
import { signIn } from '@/lib/auth/actions'
import { getCurrentProfile, homePathForRole } from '@/lib/auth/session'

export default async function SignInPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params
  setRequestLocale(locale)

  const profile = await getCurrentProfile()
  if (profile) redirect(homePathForRole(locale, profile.role))

  const t = await getTranslations('auth')

  return (
    <main className="mx-auto w-full max-w-sm px-6 py-16">
      <h1 className="mb-8 text-2xl font-semibold tracking-tight">{t('signInTitle')}</h1>
      <AuthForm
        action={signIn}
        submitKey="signInCta"
        footerTextKey="noAccount"
        footerLinkKey="signUpCta"
        footerHref="/sign-up"
        fields={[
          { name: 'email', labelKey: 'email', type: 'email', required: true, autoComplete: 'email' },
          { name: 'password', labelKey: 'password', type: 'password', required: true, autoComplete: 'current-password' },
        ]}
      />
    </main>
  )
}
