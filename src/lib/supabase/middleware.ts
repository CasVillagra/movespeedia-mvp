import { createServerClient } from '@supabase/ssr'
import type { NextRequest, NextResponse } from 'next/server'

/**
 * Refreshes the Supabase auth session and writes the rotated cookies onto the
 * response that next-intl has already produced, so locale routing and auth
 * cookies don't fight over the response object.
 */
export async function refreshSession(request: NextRequest, response: NextResponse) {
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) => {
            response.cookies.set(name, value, options)
          })
        },
      },
    }
  )

  // Touching getUser() is what triggers the refresh. Do not remove.
  const {
    data: { user },
  } = await supabase.auth.getUser()

  return { response, user }
}
