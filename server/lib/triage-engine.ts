import { RULES_VERSION } from '../../shared/constants'
import type {
  CareRoute,
  CategoryKey,
  Severity,
  TriageResult,
  TriageSignals,
  Urgency
} from '../../shared/triage-types'

export { RULES_VERSION }
export type { CareRoute, CategoryKey, Severity, TriageResult, TriageSignals, Urgency }

function ed(
  reasonCodes: string[],
  shortReason: string
): TriageResult {
  return {
    rulesVersion: RULES_VERSION,
    route: 'ed',
    urgency: 'immediate',
    shortReason,
    reasonCodes,
    ui: {
      headlineKey: 'recommend.ed.headline',
      bodyKey: 'recommend.ed.body'
    }
  }
}

function pharmacy(reasonCodes: string[], shortReason: string): TriageResult {
  return {
    rulesVersion: RULES_VERSION,
    route: 'pharmacy',
    urgency: 'today',
    shortReason,
    reasonCodes,
    ui: {
      headlineKey: 'recommend.pharmacy.headline',
      bodyKey: 'recommend.pharmacy.body'
    }
  }
}

function urgent(
  reasonCodes: string[],
  shortReason: string
): TriageResult {
  return {
    rulesVersion: RULES_VERSION,
    route: 'urgent_care_clinic',
    urgency: 'today',
    shortReason,
    reasonCodes,
    ui: {
      headlineKey: 'recommend.urgent.headline',
      bodyKey: 'recommend.urgent.body'
    }
  }
}

function gp(reasonCodes: string[], shortReason: string): TriageResult {
  return {
    rulesVersion: RULES_VERSION,
    route: 'gp',
    urgency: 'routine',
    shortReason,
    reasonCodes,
    ui: {
      headlineKey: 'recommend.gp.headline',
      bodyKey: 'recommend.gp.body'
    }
  }
}

/**
 * Deterministic care routing — recommends a care setting only (not a diagnosis).
 */
export function recommendCare(signals: TriageSignals): TriageResult {
  const s = signals

  if (s.redFlags) {
    return ed(
      ['RED_FLAGS'],
      'Serious warning signs mean emergency care is the right next step.'
    )
  }

  if (s.categoryKey === 'breathing' && s.severity === 'severe') {
    return ed(
      ['BREATHING_SEVERE'],
      'Severe breathing difficulty needs emergency assessment.'
    )
  }

  if (s.categoryKey === 'chest_pain' && s.severity !== 'mild') {
    return ed(
      ['CHEST_URGENT'],
      'Chest symptoms like these are treated as urgent until assessed in person.'
    )
  }

  if (s.categoryKey === 'mental_health' && s.severity === 'severe') {
    return ed(
      ['MENTAL_HEALTH_SEVERE'],
      'If you may be at risk of harm, emergency services can help keep you safe.'
    )
  }

  if (s.categoryKey === 'medication' && s.severity === 'mild') {
    return pharmacy(
      ['PHARMACY_REFILL'],
      'A pharmacist can often help with medication supply questions.'
    )
  }

  if (s.afterHours && (s.severity === 'moderate' || s.severity === 'severe')) {
    return urgent(
      ['AFTER_HOURS_URGENT'],
      'After hours, an urgent care clinic can assess worsening symptoms.'
    )
  }

  if (s.severity === 'severe') {
    return urgent(
      ['SEVERE_UNSCHEDULED'],
      'Same-day assessment is safer when symptoms are severe.'
    )
  }

  if (s.severity === 'moderate') {
    return gp(
      ['GP_SAME_DAY'],
      'A GP clinic is usually the right place for this level of concern.'
    )
  }

  return gp(
    ['GP_ROUTINE'],
    'A GP visit is appropriate when symptoms are mild and stable.'
  )
}
