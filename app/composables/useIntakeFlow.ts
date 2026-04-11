/**
 * Intake flow state machine for voice-first UX.
 *
 * Steps: entry → listening → analyzing → confirm|follow_up → recommendation
 */
import type { IntakeResponse, IntakeQuestion } from '~~/shared/intake-types'
import type { TriageSignals } from '~~/shared/triage-types'
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

  // Transcript
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

  // Emergency entry (direct button)
  const entryEmergency = ref(false)

  async function analyzeTranscript(text: string) {
    step.value = 'analyzing'
    analyzeStatus.value = 'loading'
    analyzeError.value = ''
    transcript.value = text

    try {
      const result = await $fetch<IntakeResponse>(
        '/api/intake/analyze',
        {
          method: 'POST',
          body: {
            transcript: text,
            consentGiven: consentGiven.value,
            priorSignals: Object.keys(partialSignals.value).length > 0
              ? partialSignals.value
              : undefined
          }
        }
      )

      analyzeStatus.value = 'idle'
      handleResult(result)
    } catch (e: unknown) {
      analyzeStatus.value = 'error'
      analyzeError.value = messageFromFetchError(e, 'Could not analyze your input.')
      step.value = 'entry'
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
