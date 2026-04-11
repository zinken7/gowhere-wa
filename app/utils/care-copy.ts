import type { RecommendResponse } from '~/types/api'
import type { CareRoute, Urgency } from '~~/shared/triage-types'

/** Directive, action-oriented headline for the recommendation card (hackathon / mobile scan). */
export function careActionHeadline(route: CareRoute): string {
  const map: Record<CareRoute, string> = {
    ed: 'Go to an emergency department',
    gp: 'Go to a GP',
    pharmacy: 'Go to a pharmacy',
    urgent_care_clinic: 'Go to an urgent care clinic'
  }
  return map[route]
}

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

const SHORT_REASON_MAX = 140

/** One short supporting line — never reason codes. */
export function recommendationTagline(result: RecommendResponse): string {
  const s = result.shortReason.trim()
  if (s.length <= SHORT_REASON_MAX) {
    return s
  }
  return `${s.slice(0, SHORT_REASON_MAX - 1)}…`
}

/** Show an extra safety line only when timing is urgent. */
export function showUrgencySafetyLine(result: RecommendResponse): boolean {
  return result.urgency === 'immediate'
}
