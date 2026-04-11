import { describe, expect, it } from 'vitest'
import { parseCareRouteQuery } from '../../shared/care-routes'

describe('parseCareRouteQuery', () => {
  it('parses valid route strings', () => {
    expect(parseCareRouteQuery('ed')).toBe('ed')
    expect(parseCareRouteQuery('gp')).toBe('gp')
    expect(parseCareRouteQuery('urgent_care_clinic')).toBe('urgent_care_clinic')
    expect(parseCareRouteQuery('pharmacy')).toBe('pharmacy')
  })

  it('uses first value when query is duplicated as an array (Nitro getQuery)', () => {
    expect(parseCareRouteQuery(['ed', 'gp'])).toBe('ed')
    expect(parseCareRouteQuery(['urgent_care_clinic'])).toBe('urgent_care_clinic')
  })

  it('trims whitespace', () => {
    expect(parseCareRouteQuery('  gp  ')).toBe('gp')
  })

  it('defaults to gp when invalid or empty', () => {
    expect(parseCareRouteQuery('hospital')).toBe('gp')
    expect(parseCareRouteQuery('')).toBe('gp')
    expect(parseCareRouteQuery(null)).toBe('gp')
    expect(parseCareRouteQuery(42)).toBe('gp')
  })
})
