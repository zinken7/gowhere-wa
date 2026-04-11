import type { TriageSignals } from './triage-types'

/**
 * Intake analysis — transforms free-form user input into one of three outcomes.
 */

/** Request body for POST /api/intake/analyze */
export interface IntakeRequest {
  /** Free-form user description (voice transcript or typed text) */
  transcript: string
  /** Whether the user has given consent */
  consentGiven: boolean
  /** Optional prior context if this is a follow-up round */
  priorSignals?: Partial<TriageSignals>
}

/**
 * Intake analysis outcome — discriminated union.
 * The `type` field determines which branch the client follows.
 */
export type IntakeResponse
  = | IntakeEmergency
    | IntakeConfirm
    | IntakeFollowUp

export interface IntakeEmergency {
  type: 'emergency'
  reason: string
}

export interface IntakeConfirm {
  type: 'confirm'
  /** Human-readable summary for the user to verify */
  summary: string
  /** Structured signals ready for the triage engine */
  signals: TriageSignals
}

export interface IntakeFollowUp {
  type: 'follow_up'
  /** Questions the user needs to answer */
  questions: IntakeQuestion[]
  /** Partial signals extracted so far */
  partialSignals: Partial<TriageSignals>
}

export interface IntakeQuestion {
  id: string
  text: string
  /** Optional predefined choices; if absent, free-text expected */
  options?: string[]
}
