import type { CareRoute } from '~~/shared/triage-types'
import type { ProviderItem, ProvidersResponse } from '~/types/api'
import { messageFromFetchError } from '~/utils/fetch-error'

export function useProviders() {
  const items = ref<ProviderItem[]>([])
  const status = ref<'idle' | 'loading' | 'error' | 'success'>('idle')
  const errorMessage = ref('')

  /** Clears items and shows loading before `/api/triage/recommend` finishes (avoids empty list flash). */
  function prepareForLoad() {
    items.value = []
    status.value = 'loading'
    errorMessage.value = ''
  }

  async function loadForRoute(route: CareRoute) {
    status.value = 'loading'
    errorMessage.value = ''
    try {
      const res = await $fetch<ProvidersResponse>(
        '/api/providers/nearby',
        {
          query: {
            route,
            suburb: 'Perth WA'
          }
        }
      )
      items.value = res.items
      status.value = 'success'
    } catch (e: unknown) {
      status.value = 'error'
      errorMessage.value = messageFromFetchError(e, 'Could not load places.')
      items.value = []
    }
  }

  function reset() {
    items.value = []
    status.value = 'idle'
    errorMessage.value = ''
  }

  return { items, status, errorMessage, prepareForLoad, loadForRoute, reset }
}
