import type { CategoryKey, Severity } from '~~/shared/triage-types'

export type FlowStep
  = | 'entry'
    | 'persona'
    | 'category'
    | 'redFlags'
    | 'severity'
    | 'recommendation'

export interface FlowSnapshot {
  consentGiven: boolean
  entryEmergency: boolean
  persona: 'self' | 'dependent' | null
  categoryKey: CategoryKey | null
  redFlagIds: string[]
  severity: Severity | null
  afterHours: boolean
  canWait: boolean
  medicationOrMinorIssue: boolean
}
