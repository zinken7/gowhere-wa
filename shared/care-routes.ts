import type { CareRoute } from './triage-types'

/** Canonical list — keep in sync with DB `providers.type` check and triage outputs. */
export const CARE_ROUTES = [
  'ed',
  'gp',
  'pharmacy',
  'urgent_care_clinic'
] as const satisfies readonly CareRoute[]

/**
 * `route` query param: unknown or invalid → default `gp` (deterministic demo default).
 * Nitro may surface duplicate query keys as a string[] — take the first string value.
 */
export function parseCareRouteQuery(raw: unknown): CareRoute {
  const first = Array.isArray(raw) ? raw[0] : raw
  const s = typeof first === 'string' ? first.trim() : ''
  return s !== '' && (CARE_ROUTES as readonly string[]).includes(s)
    ? (s as CareRoute)
    : 'gp'
}
