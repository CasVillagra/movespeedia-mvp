'use client'

import { useActionState } from 'react'
import { useLocale, useTranslations } from 'next-intl'
import { Link } from '@/i18n/navigation'
import type { AuthState } from '@/lib/auth/actions'

type Field = {
  name: string
  labelKey: string
  type: string
  required?: boolean
  autoComplete?: string
}

export function AuthForm({
  action,
  fields,
  submitKey,
  footerTextKey,
  footerLinkKey,
  footerHref,
}: {
  action: (prev: AuthState, formData: FormData) => Promise<AuthState>
  fields: Field[]
  submitKey: string
  footerTextKey: string
  footerLinkKey: string
  footerHref: string
}) {
  const t = useTranslations('auth')
  const locale = useLocale()
  const [state, formAction, pending] = useActionState<AuthState, FormData>(action, null)

  return (
    <form action={formAction} className="space-y-5">
      <input type="hidden" name="locale" value={locale} />

      {fields.map((field) => (
        <div key={field.name} className="space-y-1.5">
          <label htmlFor={field.name} className="block text-sm font-medium">
            {t(field.labelKey)}
          </label>
          <input
            id={field.name}
            name={field.name}
            type={field.type}
            required={field.required}
            autoComplete={field.autoComplete}
            className="w-full rounded-md border border-black/15 bg-transparent px-3 py-2 text-base
                       outline-none focus:border-black/40 dark:border-white/20 dark:focus:border-white/50"
          />
        </div>
      ))}

      {state?.error && (
        <p role="alert" className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-800 dark:bg-red-950 dark:text-red-200">
          {t(state.error)}
        </p>
      )}

      {state?.notice && (
        <p role="status" className="rounded-md bg-emerald-50 px-3 py-2 text-sm text-emerald-900 dark:bg-emerald-950 dark:text-emerald-200">
          {t(state.notice)}
        </p>
      )}

      <button
        type="submit"
        disabled={pending}
        className="w-full rounded-md bg-black px-4 py-2.5 text-sm font-medium text-white
                   disabled:opacity-60 dark:bg-white dark:text-black"
      >
        {pending ? t('working') : t(submitKey)}
      </button>

      <p className="text-center text-sm text-black/60 dark:text-white/60">
        {t(footerTextKey)}{' '}
        <Link href={footerHref} className="underline underline-offset-4">
          {t(footerLinkKey)}
        </Link>
      </p>
    </form>
  )
}
