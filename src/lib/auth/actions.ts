'use server'

import { redirect } from 'next/navigation'
import { revalidatePath } from 'next/cache'
import { z } from 'zod'
import { createClient } from '@/lib/supabase/server'
import { homePathForRole } from '@/lib/auth/session'

export type AuthState = { error?: string; notice?: string } | null

const localeSchema = z.enum(['en', 'es'])

const signInSchema = z.object({
  email: z.string().trim().min(1).pipe(z.email()),
  password: z.string().min(1),
})

const signUpSchema = z.object({
  fullName: z.string().trim().min(2),
  email: z.string().trim().min(1).pipe(z.email()),
  phone: z.string().trim().optional(),
  // Stricter than Supabase's own minimum (6) on purpose, so the rule the user
  // is shown is always the one that actually applies.
  password: z.string().min(8),
})

function localeFrom(formData: FormData): 'en' | 'es' {
  const parsed = localeSchema.safeParse(formData.get('locale'))
  return parsed.success ? parsed.data : 'en'
}

export async function signIn(_prev: AuthState, formData: FormData): Promise<AuthState> {
  const locale = localeFrom(formData)

  const parsed = signInSchema.safeParse({
    email: formData.get('email'),
    password: formData.get('password'),
  })

  if (!parsed.success) {
    return { error: 'invalidCredentials' }
  }

  const supabase = await createClient()
  const { error } = await supabase.auth.signInWithPassword(parsed.data)

  // Deliberately generic: distinguishing "no such account" from "wrong
  // password" tells an attacker which emails are registered.
  if (error) {
    return { error: 'invalidCredentials' }
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', (await supabase.auth.getUser()).data.user!.id)
    .single()

  revalidatePath('/', 'layout')
  redirect(homePathForRole(locale, profile?.role ?? 'customer'))
}

export async function signUp(_prev: AuthState, formData: FormData): Promise<AuthState> {
  const locale = localeFrom(formData)

  const parsed = signUpSchema.safeParse({
    fullName: formData.get('fullName'),
    email: formData.get('email'),
    phone: formData.get('phone'),
    password: formData.get('password'),
  })

  if (!parsed.success) {
    const issue = parsed.error.issues[0]
    const field = issue?.path[0]
    if (field === 'password') return { error: 'passwordTooShort' }
    if (field === 'fullName') return { error: 'nameRequired' }
    return { error: 'emailInvalid' }
  }

  const supabase = await createClient()

  const { data, error } = await supabase.auth.signUp({
    email: parsed.data.email,
    password: parsed.data.password,
    options: {
      // Read by the handle_new_user trigger to populate the profile row.
      data: {
        full_name: parsed.data.fullName,
        phone: parsed.data.phone ?? '',
        preferred_locale: locale,
      },
    },
  })

  if (error) {
    return { error: error.message.toLowerCase().includes('already') ? 'emailInUse' : 'genericError' }
  }

  // With email confirmation enabled there is no session yet; the user has to
  // confirm before they can sign in.
  if (!data.session) {
    return { notice: 'checkEmail' }
  }

  revalidatePath('/', 'layout')
  redirect(homePathForRole(locale, 'customer'))
}

export async function signOut(formData: FormData): Promise<void> {
  const locale = localeFrom(formData)

  const supabase = await createClient()
  await supabase.auth.signOut()

  revalidatePath('/', 'layout')
  redirect(`/${locale}`)
}
