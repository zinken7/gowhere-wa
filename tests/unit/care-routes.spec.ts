import { describe, expect, it } from 'vitest'
import { CARE_ROUTES, parseCareRouteQuery } from '../../shared/care-routes'

describe('parseCareRouteQuery', () => {
  it('defaults invalid values to gp', () => {
    expect(parseCareRouteQuery(undefined)).toBe('gp')
    expect(parseCareRouteQuery('')).toBe('gp')
    expect(parseCareRouteQuery('hospital')).toBe('gp')
    expect(parseCareRouteQuery(123)).toBe('gp')
  })

  it('accepts each canonical route', () => {
    for (const r of CARE_ROUTES) {
      expect(parseCareRouteQuery(r)).toBe(r)
    }
  })
})
