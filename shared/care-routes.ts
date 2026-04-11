import type { CareRoute } from './triage-types'

/** Canonical list — keep in sync with DB `providers.type` check and triage outputs. */
export const CARE_ROUTES = [
  'ed',
  'gp',
  'pharmacy',
  'urgent_care_clinic'
] as const satisfies readonly CareRoute[]

/** `route` query param: unknown or invalid → default `gp` (deterministic demo default). */
export function parseCareRouteQuery(raw: unknown): CareRoute {
  return typeof raw === 'string' && (CARE_ROUTES as readonly string[]).includes(raw)
    ? (raw as CareRoute)
    : 'gp'
}
