import type { SupabaseClient } from '@supabase/supabase-js'
import type { CareRoute } from '../../shared/triage-types'
import { filterProvidersForRoute } from './static-providers'

export interface ProviderListItem {
  id: string
  name: string
  type: string
  address: string
  lat: number
  lng: number
  phone: string | null
}

/** Haversine distance in km (Earth mean radius). */
export function distanceKm(
  a: { lat: number, lng: number },
  b: { lat: number, lng: number }
): number {
  const toRad = (d: number) => (d * Math.PI) / 180
  const R = 6371
  const dLat = toRad(b.lat - a.lat)
  const dLng = toRad(b.lng - a.lng)
  const lat1 = toRad(a.lat)
  const lat2 = toRad(b.lat)
  const h
    = Math.sin(dLat / 2) ** 2
      + Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLng / 2) ** 2
  return 2 * R * Math.asin(Math.min(1, Math.sqrt(h)))
}

function mapRow(row: Record<string, unknown>): ProviderListItem | null {
  const id = row.id != null ? String(row.id) : ''
  const name = row.name != null ? String(row.name) : ''
  const type = row.type != null ? String(row.type) : ''
  const address = row.address != null ? String(row.address) : ''
  const lat = Number(row.lat)
  const lng = Number(row.lng)
  const phone = row.phone == null ? null : String(row.phone)
  if (!id || !name || !type || !address || !Number.isFinite(lat) || !Number.isFinite(lng)) {
    return null
  }
  return { id, name, type, address, lat, lng, phone }
}

/**
 * Fetch providers for a care route from Supabase, ordered by proximity when lat/lng given.
 */
export async function queryProvidersFromSupabase(
  client: SupabaseClient,
  route: CareRoute,
  opts: { lat?: number, lng?: number, suburb?: string }
): Promise<ProviderListItem[]> {
  const { data, error } = await client
    .from('providers')
    .select('id, name, type, address, lat, lng, phone, suburb')
    .eq('type', route)
    .eq('is_active', true)

  if (error) {
    throw error
  }

  const raw = data ?? []
  const suburbQ = opts.suburb?.trim().toLowerCase()
  let filtered = raw
  if (suburbQ) {
    filtered = raw.filter((r) => {
      const sub = (r.suburb ?? '').toLowerCase()
      const addr = r.address.toLowerCase()
      return sub.includes(suburbQ) || addr.includes(suburbQ)
    })
  }

  let rows = filtered.map(mapRow).filter((r): r is ProviderListItem => r != null)

  const lat = opts.lat
  const lng = opts.lng
  if (
    lat != null
    && lng != null
    && Number.isFinite(lat)
    && Number.isFinite(lng)
  ) {
    const origin = { lat, lng }
    rows = [...rows].sort(
      (a, b) =>
        distanceKm(origin, a) - distanceKm(origin, b)
    )
  }

  return rows
}

function staticFallback(route: CareRoute): ProviderListItem[] {
  return filterProvidersForRoute(route)
}

/**
 * Load providers for map/list. Uses Supabase when configured; on failure or empty result, static demo data.
 */
export async function getProvidersNearby(
  client: SupabaseClient | null,
  route: CareRoute,
  opts: { lat?: number, lng?: number, suburb?: string }
): Promise<{ source: 'supabase' | 'static_fallback', items: ProviderListItem[] }> {
  const fallback = (): { source: 'static_fallback', items: ProviderListItem[] } => ({
    source: 'static_fallback',
    items: staticFallback(route)
  })

  if (!client) {
    return fallback()
  }

  try {
    const items = await queryProvidersFromSupabase(client, route, opts)
    if (items.length === 0) {
      return fallback()
    }
    return { source: 'supabase', items }
  } catch {
    return fallback()
  }
}
