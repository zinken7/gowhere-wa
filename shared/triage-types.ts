export type CareRoute = 'ed' | 'gp' | 'pharmacy' | 'urgent_care_clinic'

export type Urgency = 'immediate' | 'today' | '24_to_48h' | 'routine'

export type Severity = 'mild' | 'moderate' | 'severe'

export type CategoryKey
  = | 'breathing'
    | 'chest_pain'
    | 'fever'
    | 'injury'
    | 'mental_health'
    | 'medication'
    | 'other'

export interface TriageSignals {
  persona: 'self' | 'dependent'
  categoryKey: CategoryKey
  redFlags: boolean
  severity: Severity
  canWait: boolean
  afterHours: boolean
  medicationOrMinorIssue: boolean
}

export interface TriageResult {
  rulesVersion: string
  route: CareRoute
  urgency: Urgency
  shortReason: string
  reasonCodes: string[]
  ui: { headlineKey: string, bodyKey: string }
}
