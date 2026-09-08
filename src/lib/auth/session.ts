import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import type { Database } from '@/lib/types/database'

export type Role = Database['public']['Enums']['user_role']
export type Profile = Database['public']['Tables']['profiles']['Row']

/** The signed-in user's profile, or null. Never throws. */
export async function getCurrentProfile(): Promise<Profile | null> {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) return null

  const { data } = await supabase.from('profiles').select('*').eq('id', user.id).single()

  return data ?? null
}

/** Where a user lands after signing in. */
export function homePathForRole(locale: string, role: Role): string {
  switch (role) {
    case 'admin':
      return `/${locale}/admin`
    case 'carrier':
      return `/${locale}/carrier`
    default:
      return `/${locale}/moves`
  }
}

/**
 * Guards a page. Redirects to sign-in when signed out, and to the user's own
 * area when their role doesn't match — never renders a "forbidden" page, since
 * a customer who lands on /admin has no use for one.
 *
 * This is defence in depth, not the security boundary: row level security is.
 */
export async function requireRole(locale: string, allowed: Role[]): Promise<Profile> {
  const profile = await getCurrentProfile()

  if (!profile) {
    redirect(`/${locale}/sign-in`)
  }

  if (!allowed.includes(profile.role)) {
    redirect(homePathForRole(locale, profile.role))
  }

  return profile
}
