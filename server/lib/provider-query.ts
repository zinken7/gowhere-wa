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

/**
 * Suburb search is substring match. Broad queries (e.g. "Perth") may match no row
 * even when the DB has venues in the metro — then return all `raw` rows for the route.
 */
export function applySuburbPreference<T extends { suburb?: string | null, address: string }>(
  raw: T[],
  suburbQ: string | undefined
): T[] {
  const q = suburbQ?.trim().toLowerCase()
  if (!q) {
    return raw
  }
  const narrowed = raw.filter((r) => {
    const sub = (r.suburb ?? '').toLowerCase()
    const addr = r.address.toLowerCase()
    return sub.includes(q) || addr.includes(q)
  })
  return narrowed.length > 0 ? narrowed : raw
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

    console.log('[providers] raw query result', {
      route,
      suburb: opts.suburb ?? null,
      hasError: !!error,
      errorMessage: error?.message ?? null,
      rawCount: data?.length ?? 0
    })

  if (error) {
    throw error
  }

  const raw = data ?? []
  const filtered = applySuburbPreference(raw, opts.suburb)

  console.log('[providers] after suburb filter', {
    route,
    suburb: opts.suburb ?? null,
    rawCount: raw.length,
    filteredCount: filtered.length
  })

  let rows = filtered.map(mapRow).filter((r): r is ProviderListItem => r != null)

  console.log('[providers] after mapRow', {
    mappedCount: rows.length
  })

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

    console.log('[providers] sorted by distance', {
      lat,
      lng,
      finalCount: rows.length
    })
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
  const fallback = (reason: string): { source: 'static_fallback', items: ProviderListItem[] } => {
    console.log('[providers] fallback', {
      reason,
      route,
      suburb: opts.suburb ?? null,
      hasClient: !!client
    })
    return {
      source: 'static_fallback',
      items: staticFallback(route)
    }
  }

  console.log('[providers] getProvidersNearby start', {
    route,
    suburb: opts.suburb ?? null,
    lat: opts.lat ?? null,
    lng: opts.lng ?? null,
    hasClient: !!client
  })

  if (!client) {
    return fallback('no_client')
  }

  try {
    const items = await queryProvidersFromSupabase(client, route, opts)

    console.log('[providers] supabase items returned', {
      count: items.length
    })

    if (items.length === 0) {
      return fallback('empty_items_after_query')
    }

    return { source: 'supabase', items }
  } catch (err) {
    console.log('[providers] query exception', {
      message: err instanceof Error ? err.message : String(err)
    })
    return fallback('query_exception')
  }
}
