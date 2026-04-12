/**
 * Intake flow state machine for voice-first UX.
 *
 * Steps: entry → listening → analyzing → confirm|follow_up → recommendation
 */
import type { IntakeResponse, IntakeQuestion } from '~~/shared/intake-types'
import type { TriageSignals } from '~~/shared/triage-types'
import { MAX_INTAKE_FOLLOW_UP_PASS } from '~~/shared/constants'
import { messageFromFetchError } from '~/utils/fetch-error'

export type IntakeStep
  = | 'entry'
    | 'listening'
    | 'analyzing'
    | 'confirm'
    | 'follow_up'
    | 'recommendation'

export function useIntakeFlow() {
  const step = ref<IntakeStep>('entry')
  const consentGiven = ref(false)

  /** First user transcript this session (not overwritten by combined follow-up text). */
  const sessionRootTranscript = ref('')

  /** Last follow-up round index successfully sent to the API (see MAX_INTAKE_FOLLOW_UP_PASS). */
  const followUpPassSent = ref(0)

  /** Bumps when we receive a new follow_up payload so the follow-up form remounts with clean fields. */
  const followUpRenderKey = ref(0)

  // Transcript shown / last full text sent for analysis
  const transcript = ref('')

  // Analysis result
  const summary = ref('')
  const signals = ref<TriageSignals | null>(null)
  const questions = ref<IntakeQuestion[]>([])
  const partialSignals = ref<Partial<TriageSignals>>({})
  const emergencyReason = ref('')

  // Status
  const analyzeStatus = ref<'idle' | 'loading' | 'error'>('idle')
  const analyzeError = ref('')
  const analyzeInFlight = ref(false)

  // Emergency entry (direct button)
  const entryEmergency = ref(false)

  async function analyzeTranscript(text: string, opts?: { fromFollowUp?: boolean }) {
    const trimmed = text.trim()
    if (!trimmed) {
      return
    }
    if (analyzeInFlight.value) {
      return
    }

    let roundToSend = 0
    if (!opts?.fromFollowUp) {
      sessionRootTranscript.value = trimmed
      followUpPassSent.value = 0
      roundToSend = 0
    } else {
      roundToSend = followUpPassSent.value + 1
      if (roundToSend > MAX_INTAKE_FOLLOW_UP_PASS) {
        analyzeError.value
          = 'Maximum clarification steps reached. For advice, call Healthdirect on 1800 022 222 (24/7), see your GP, or call Triple Zero (000) in an emergency. You can start again below.'
        return
      }
    }

    analyzeInFlight.value = true
    step.value = 'analyzing'
    analyzeStatus.value = 'loading'
    analyzeError.value = ''
    transcript.value = trimmed

    try {
      const result = await $fetch<IntakeResponse>(
        '/api/intake/analyze',
        {
          method: 'POST',
          body: {
            transcript: trimmed,
            consentGiven: consentGiven.value,
            followUpRound: roundToSend,
            priorSignals: Object.keys(partialSignals.value).length > 0
              ? partialSignals.value
              : undefined
          }
        }
      )

      if (opts?.fromFollowUp) {
        followUpPassSent.value = roundToSend
      }

      analyzeStatus.value = 'idle'
      handleResult(result)
    } catch (e: unknown) {
      analyzeStatus.value = 'error'
      analyzeError.value = messageFromFetchError(e, 'Could not analyze your input.')
      step.value = 'entry'
    } finally {
      analyzeInFlight.value = false
    }
  }

  function handleResult(result: IntakeResponse) {
    switch (result.type) {
      case 'emergency':
        emergencyReason.value = result.reason
        entryEmergency.value = true
        step.value = 'recommendation'
        break

      case 'confirm':
        summary.value = result.summary
        signals.value = result.signals
        step.value = 'confirm'
        break

      case 'follow_up':
        followUpRenderKey.value += 1
        questions.value = result.questions
        partialSignals.value = result.partialSignals
        step.value = 'follow_up'
        break
    }
  }

  function confirmAndProceed() {
    step.value = 'recommendation'
  }

  function goEmergency() {
    entryEmergency.value = true
    consentGiven.value = true
    step.value = 'recommendation'
  }

  function back() {
    switch (step.value) {
      case 'recommendation':
        if (entryEmergency.value) {
          entryEmergency.value = false
          step.value = 'entry'
        } else {
          step.value = 'confirm'
        }
        break
      case 'confirm':
      case 'follow_up':
        sessionRootTranscript.value = ''
        followUpPassSent.value = 0
        analyzeError.value = ''
        step.value = 'entry'
        break
      case 'analyzing':
      case 'listening':
        step.value = 'entry'
        break
      default:
        break
    }
  }

  function reset() {
    step.value = 'entry'
    consentGiven.value = false
    sessionRootTranscript.value = ''
    followUpPassSent.value = 0
    followUpRenderKey.value = 0
    transcript.value = ''
    summary.value = ''
    signals.value = null
    questions.value = []
    partialSignals.value = {}
    emergencyReason.value = ''
    entryEmergency.value = false
    analyzeStatus.value = 'idle'
    analyzeError.value = ''
  }

  return {
    step,
    consentGiven,
    sessionRootTranscript,
    followUpPassSent,
    followUpRenderKey,
    transcript,
    summary,
    signals,
    questions,
    partialSignals,
    emergencyReason,
    entryEmergency,
    analyzeStatus,
    analyzeError,
    analyzeTranscript,
    confirmAndProceed,
    goEmergency,
    back,
    reset
  }
}
