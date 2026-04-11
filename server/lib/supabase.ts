import { createClient, type SupabaseClient } from '@supabase/supabase-js'

/**
 * Server-only Supabase client (service role). Bypasses RLS; use only in Nitro routes / server lib.
 * Returns null when URL/key are not configured — callers should use static provider fallback.
 */
export function getSupabaseAdmin(): SupabaseClient | null {
  const config = useRuntimeConfig()
  const url = config.public.supabaseUrl as string | undefined
  const key = config.supabaseServiceRoleKey as string | undefined
  if (!url?.trim() || !key?.trim()) {
    return null
  }
  return createClient(url.trim(), key.trim(), {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  })
}
