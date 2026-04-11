import { describe, expect, it } from 'vitest'
import {
  applySuburbPreference,
  distanceKm,
  getProvidersNearby
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

describe('getProvidersNearby', () => {
  it('uses static_fallback when Supabase client is null', async () => {
    const r = await getProvidersNearby(null, 'gp', {})
    expect(r.source).toBe('static_fallback')
    expect(r.items.length).toBeGreaterThan(0)
    expect(r.items.every(i => i.type === 'gp')).toBe(true)
  })
})
