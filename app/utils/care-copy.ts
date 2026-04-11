import type { CareRoute, Urgency } from '~~/shared/triage-types'

export function careSettingLabel(route: CareRoute): string {
  const map: Record<CareRoute, string> = {
    ed: 'Emergency department',
    gp: 'GP clinic',
    pharmacy: 'Pharmacy',
    urgent_care_clinic: 'Urgent care clinic'
  }
  return map[route]
}

export function urgencyLabel(u: Urgency): string {
  const map: Record<Urgency, string> = {
    'immediate': 'Immediate',
    'today': 'Today / soon',
    '24_to_48h': 'Within 24–48 hours',
    'routine': 'Routine'
  }
  return map[u]
}
