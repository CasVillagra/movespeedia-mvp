import createIntlMiddleware from 'next-intl/middleware'
import type { NextRequest } from 'next/server'
import { routing } from '@/i18n/routing'
import { refreshSession } from '@/lib/supabase/middleware'

const handleI18n = createIntlMiddleware(routing)

export default async function proxy(request: NextRequest) {
  // Locale resolution first, then session refresh onto the same response.
  const response = handleI18n(request)
  const { response: withSession } = await refreshSession(request, response)
  return withSession
}

export const config = {
  matcher: ['/((?!api|_next|_vercel|.*\\..*).*)'],
}
