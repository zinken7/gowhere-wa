/**
 * When max follow-up passes are exceeded, return a non-routing clarification (no fake GP/ED destination).
 */
import { INTAKE_TERMINAL_QUESTION_ID } from '../../shared/constants'
import type { IntakeFollowUp } from '../../shared/intake-types'
import type { TriageSignals } from '../../shared/triage-types'

export function buildTerminalMaxFollowUpResponse(
  partialSignals: Partial<TriageSignals> | undefined
): IntakeFollowUp {
  return {
    type: 'follow_up',
    questions: [
      {
        id: INTAKE_TERMINAL_QUESTION_ID,
        text:
          'We could not narrow this down enough from the details provided. For trusted advice in Australia, call Healthdirect on 1800 022 222 (24/7), see your usual GP, or call Triple Zero (000) only if it is an emergency.',
        options: undefined
      }
    ],
    partialSignals: partialSignals ?? {}
  }
}
