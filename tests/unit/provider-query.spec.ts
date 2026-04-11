import { describe, expect, it } from 'vitest'
import {
  applySuburbPreference,
  distanceKm,
  getProvidersNearby,
  rankAndLimitProviders,
  type ProviderListItem
} from '../../server/lib/provider-query'

describe('distanceKm', () => {
  it('is ~0 for identical points', () => {
    const p = { lat: -31.95, lng: 115.85 }
    expect(distanceKm(p, p)).toBe(0)
  })

  it('orders Perth CBD vs Nedlands consistently', () => {
    const perth = { lat: -31.9536, lng: 115.8577 }
    const nedlands = { lat: -31.9692, lng: 115.8119 }
    const d = distanceKm(perth, nedlands)
    expect(d).toBeGreaterThan(2)
    expect(d).toBeLessThan(10)
  })
})

describe('applySuburbPreference', () => {
  it('returns all rows when suburb matches nothing (e.g. Perth vs Northbridge GP seed)', () => {
    const raw = [
      { suburb: 'Northbridge', address: 'Lake St, Northbridge WA 6003' },
      { suburb: 'Subiaco', address: 'Rokeby Rd, Subiaco WA 6008' }
    ]
    const out = applySuburbPreference(raw, 'Perth')
    expect(out).toEqual(raw)
  })

  it('narrows when substring matches', () => {
    const raw = [
      { suburb: 'Northbridge', address: 'Lake St' },
      { suburb: 'Subiaco', address: 'Rokeby Rd' }
    ]
    const out = applySuburbPreference(raw, 'North')
    expect(out).toHaveLength(1)
    expect(out[0]!.suburb).toBe('Northbridge')
  })
})

describe('rankAndLimitProviders', () => {
  const four: ProviderListItem[] = [
    { id: '1', name: 'A', type: 'gp', address: 'x', lat: -31.95, lng: 115.85, phone: null },
    { id: '2', name: 'B', type: 'gp', address: 'y', lat: -31.96, lng: 115.86, phone: null },
    { id: '3', name: 'C', type: 'gp', address: 'z', lat: -31.97, lng: 115.87, phone: null },
    { id: '4', name: 'D', type: 'gp', address: 'w', lat: -31.98, lng: 115.88, phone: null }
  ]

  it('caps results at limit', () => {
    const out = rankAndLimitProviders(four, {}, 3)
    expect(out).toHaveLength(3)
  })

  it('sorts by distance and sets distanceKm when lat/lng given', () => {
    const origin = { lat: -31.9536, lng: 115.8577 }
    const out = rankAndLimitProviders(four, origin, 2)
    expect(out).toHaveLength(2)
    expect(out[0]!.distanceKm).toBeDefined()
    expect(out[0]!.distanceKm!).toBeLessThanOrEqual(out[1]!.distanceKm!)
  })
})

describe('getProvidersNearby', () => {
  it('uses static_fallback when Supabase client is null', async () => {
    const r = await getProvidersNearby(null, 'gp', {})
    expect(r.source).toBe('static_fallback')
    expect(r.items.length).toBeGreaterThan(0)
    expect(r.items.length).toBeLessThanOrEqual(3)
    expect(r.items.every(i => i.type === 'gp')).toBe(true)
  })

  it('respects limit in static fallback', async () => {
    const r = await getProvidersNearby(null, 'ed', { limit: 1 })
    expect(r.items).toHaveLength(1)
  })
})
