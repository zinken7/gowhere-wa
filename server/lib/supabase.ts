import { createClient, type SupabaseClient } from '@supabase/supabase-js'

/**
 * Resolve URL + service role from Nitro runtimeConfig, with `process.env` fallback.
 * On some hosts (e.g. Vercel serverless), private `runtimeConfig` keys may not hydrate
 * even when `NUXT_*` vars exist — Vercel still injects them on `process.env` at runtime.
 * This module is server-only; never import from client code.
 */
function supabaseUrlAndKey(): { url: string, key: string } | null {
  const config = useRuntimeConfig()
  const url = String(
    config.public.supabaseUrl ?? process.env.NUXT_PUBLIC_SUPABASE_URL ?? ''
  ).trim()
  const key = String(
    config.supabaseServiceRoleKey ?? process.env.NUXT_SUPABASE_SERVICE_ROLE_KEY ?? ''
  ).trim()
  if (!url || !key) {
    return null
  }
  return { url, key }
}

/**
 * Server-only Supabase client (service role). Bypasses RLS; use only in Nitro routes / server lib.
 * Returns null when URL/key are not configured — callers should use static provider fallback.
 */
export function getSupabaseAdmin(): SupabaseClient | null {
  const pair = supabaseUrlAndKey()
  if (!pair) {
    return null
  }
  return createClient(pair.url, pair.key, {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  })
}
