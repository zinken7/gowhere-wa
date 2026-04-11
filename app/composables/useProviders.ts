import type { CareRoute } from '~~/shared/triage-types'
import type { ProviderItem, ProvidersResponse } from '~/types/api'
import { messageFromFetchError } from '~/utils/fetch-error'

/** Default suburb when the user cancels the dialog or leaves the field blank. */
const SUBURB_FALLBACK = 'Perth WA'
const NEARBY_LIMIT = 3

const GEO_OPTIONS: PositionOptions = {
  enableHighAccuracy: false,
  timeout: 12_000,
  maximumAge: 300_000
}

type GeolocationResult = { ok: true, lat: number, lng: number } | { ok: false }

function getCurrentPositionOnce(): Promise<GeolocationResult> {
  if (!import.meta.client || typeof navigator === 'undefined' || !navigator.geolocation) {
    return Promise.resolve({ ok: false })
  }
  return new Promise((resolve) => {
    navigator.geolocation.getCurrentPosition(
      pos => resolve({
        ok: true,
        lat: pos.coords.latitude,
        lng: pos.coords.longitude
      }),
      () => resolve({ ok: false }),
      GEO_OPTIONS
    )
  })
}

/** Defensive: only show venues matching the active care route (guards API/DB anomalies). */
function normalizeProviderItems(route: CareRoute, raw: ProviderItem[]): ProviderItem[] {
  return raw.filter(p => p.type === route).slice(0, NEARBY_LIMIT)
}

export type ProviderLoadStatus = 'idle' | 'loading' | 'error' | 'success' | 'need_suburb'

export function useProviders() {
  const items = ref<ProviderItem[]>([])
  const status = ref<ProviderLoadStatus>('idle')
  const errorMessage = ref('')
  const suburbModalOpen = ref(false)
  const suburbDraft = ref('')
  const lastRoute = ref<CareRoute | null>(null)

  function prepareForLoad() {
    items.value = []
    status.value = 'loading'
    errorMessage.value = ''
    suburbModalOpen.value = false
    suburbDraft.value = ''
    lastRoute.value = null
  }

  async function fetchNearby(
    route: CareRoute,
    opts: { lat?: number, lng?: number, suburb?: string }
  ): Promise<void> {
    const query: Record<string, string> = {
      route,
      limit: String(NEARBY_LIMIT)
    }
    if (opts.lat != null && opts.lng != null) {
      query.lat = String(opts.lat)
      query.lng = String(opts.lng)
    } else if (opts.suburb != null && opts.suburb.trim() !== '') {
      query.suburb = opts.suburb.trim()
    } else {
      query.suburb = SUBURB_FALLBACK
    }

    const res = await $fetch<ProvidersResponse>(
      '/api/providers/nearby',
      { query }
    )
    items.value = normalizeProviderItems(route, res.items)
    status.value = 'success'
    suburbModalOpen.value = false
  }

  async function loadForRoute(route: CareRoute) {
    if (status.value === 'error') {
      errorMessage.value = ''
    }

    lastRoute.value = route
    status.value = 'loading'
    errorMessage.value = ''
    suburbModalOpen.value = false

    try {
      const geo = await getCurrentPositionOnce()
      if (geo.ok) {
        await fetchNearby(route, { lat: geo.lat, lng: geo.lng })
        return
      }
      suburbDraft.value = ''
      items.value = []
      status.value = 'need_suburb'
      suburbModalOpen.value = true
    } catch (e: unknown) {
      status.value = 'error'
      errorMessage.value = messageFromFetchError(e, 'Could not load places.')
      items.value = []
      suburbModalOpen.value = false
    }
  }

  async function confirmSuburb() {
    const route = lastRoute.value
    if (!route) {
      return
    }
    suburbModalOpen.value = false
    status.value = 'loading'
    errorMessage.value = ''
    const suburb = suburbDraft.value.trim() || SUBURB_FALLBACK
    try {
      await fetchNearby(route, { suburb })
    } catch (e: unknown) {
      status.value = 'error'
      errorMessage.value = messageFromFetchError(e, 'Could not load places.')
      items.value = []
    }
  }

  async function cancelSuburbModal() {
    suburbModalOpen.value = false
    const route = lastRoute.value
    if (!route) {
      return
    }
    status.value = 'loading'
    errorMessage.value = ''
    try {
      await fetchNearby(route, { suburb: SUBURB_FALLBACK })
    } catch (e: unknown) {
      status.value = 'error'
      errorMessage.value = messageFromFetchError(e, 'Could not load places.')
      items.value = []
    }
  }

  async function retryLocationFromModal() {
    suburbModalOpen.value = false
    const route = lastRoute.value
    if (!route) {
      return
    }
    status.value = 'loading'
    errorMessage.value = ''
    try {
      const geo = await getCurrentPositionOnce()
      if (geo.ok) {
        await fetchNearby(route, { lat: geo.lat, lng: geo.lng })
        return
      }
      suburbDraft.value = ''
      items.value = []
      status.value = 'need_suburb'
      suburbModalOpen.value = true
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
    suburbModalOpen.value = false
    suburbDraft.value = ''
    lastRoute.value = null
  }

  return {
    items,
    status,
    errorMessage,
    suburbModalOpen,
    suburbDraft,
    prepareForLoad,
    loadForRoute,
    confirmSuburb,
    cancelSuburbModal,
    retryLocationFromModal,
    reset
  }
}
