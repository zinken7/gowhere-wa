import type { CareRoute } from '~~/shared/triage-types'
import type { ProviderItem } from '~/types/api'
import { messageFromFetchError } from '~/utils/fetch-error'

export function useProviders() {
  const items = ref<ProviderItem[]>([])
  const status = ref<'idle' | 'loading' | 'error' | 'success'>('idle')
  const errorMessage = ref('')

  async function loadForRoute(route: CareRoute) {
    status.value = 'loading'
    errorMessage.value = ''
    try {
      const res = await $fetch<{ source: string, items: ProviderItem[] }>(
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

  return { items, status, errorMessage, loadForRoute, reset }
}
