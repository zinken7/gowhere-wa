import { RULES_VERSION } from '~~/shared/constants'
import type { RecommendResponse } from '~/types/api'
import type { TriageSignals } from '~~/shared/triage-types'
import { messageFromFetchError } from '~/utils/fetch-error'

export function useRecommendation() {
  const result = ref<RecommendResponse | null>(null)
  const status = ref<'idle' | 'loading' | 'error' | 'success'>('idle')
  const errorMessage = ref('')

  function setEmergencyEntryResult() {
    result.value = {
      rulesVersion: RULES_VERSION,
      route: 'ed',
      urgency: 'immediate',
      shortReason:
        'You chose emergency help. If life-threatening, call Triple Zero (000) now.',
      reasonCodes: ['USER_EMERGENCY_PATH'],
      ui: {
        headlineKey: 'recommend.ed.headline',
        bodyKey: 'recommend.ed.body'
      }
    }
    status.value = 'success'
    errorMessage.value = ''
  }

  async function fetchRecommendation(
    signals: TriageSignals,
    consent: boolean
  ) {
    status.value = 'loading'
    result.value = null
    errorMessage.value = ''
    try {
      result.value = await $fetch<RecommendResponse>(
        '/api/triage/recommend',
        {
          method: 'POST',
          body: { consentGiven: consent, signals }
        }
      )
      status.value = 'success'
    } catch (e: unknown) {
      status.value = 'error'
      errorMessage.value = messageFromFetchError(
        e,
        'Could not get a recommendation.'
      )
    }
  }

  function reset() {
    result.value = null
    status.value = 'idle'
    errorMessage.value = ''
  }

  return {
    result,
    status,
    errorMessage,
    fetchRecommendation,
    setEmergencyEntryResult,
    reset
  }
}
