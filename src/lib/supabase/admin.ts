import { createClient as createSupabaseClient } from '@supabase/supabase-js'
import type { Database } from '@/lib/types/database'

/**
 * Service-role client. BYPASSES ROW LEVEL SECURITY.
 *
 * Only for trusted server-side work that genuinely cannot run as the user:
 * quote calculation (reads pricing_config, which is admin-only), carrier
 * matching across carriers, and Stripe webhook handlers.
 *
 * Never import this into a Client Component.
 */
export function createAdminClient() {
  const secretKey = process.env.SUPABASE_SECRET_KEY
  if (!secretKey) {
    throw new Error('SUPABASE_SECRET_KEY is not set')
  }

  return createSupabaseClient<Database>(process.env.NEXT_PUBLIC_SUPABASE_URL!, secretKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  })
}
