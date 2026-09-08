import { getTranslations, setRequestLocale } from 'next-intl/server'
import { redirect } from 'next/navigation'
import { AuthForm } from '@/components/auth/auth-form'
import { signUp } from '@/lib/auth/actions'
import { getCurrentProfile, homePathForRole } from '@/lib/auth/session'

export default async function SignUpPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params
  setRequestLocale(locale)

  const profile = await getCurrentProfile()
  if (profile) redirect(homePathForRole(locale, profile.role))

  const t = await getTranslations('auth')

  return (
    <main className="mx-auto w-full max-w-sm px-6 py-16">
      <h1 className="mb-8 text-2xl font-semibold tracking-tight">{t('signUpTitle')}</h1>
      <AuthForm
        action={signUp}
        submitKey="signUpCta"
        footerTextKey="haveAccount"
        footerLinkKey="signInCta"
        footerHref="/sign-in"
        fields={[
          { name: 'fullName', labelKey: 'fullName', type: 'text', required: true, autoComplete: 'name' },
          { name: 'email', labelKey: 'email', type: 'email', required: true, autoComplete: 'email' },
          { name: 'phone', labelKey: 'phone', type: 'tel', autoComplete: 'tel' },
          { name: 'password', labelKey: 'password', type: 'password', required: true, autoComplete: 'new-password' },
        ]}
      />
    </main>
  )
}
