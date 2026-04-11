import type { CareRoute, Urgency } from '~~/shared/triage-types'

export interface RecommendResponse {
  rulesVersion: string
  route: CareRoute
  urgency: Urgency
  shortReason: string
  reasonCodes: string[]
  ui: {
    headlineKey: string
    bodyKey: string
  }
}

export interface ProvidersResponse {
  source: 'supabase' | 'static_fallback'
  items: ProviderItem[]
}

export interface ProviderItem {
  id: string
  name: string
  type: string
  address: string
  lat: number
  lng: number
  phone: string | null
  /** Present when the server ranked by user lat/lng (km). */
  distanceKm?: number
}
