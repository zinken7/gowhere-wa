import type { CareRoute } from '../../lib/triage-engine'
import { filterProvidersForRoute } from '../../lib/static-providers'

const ROUTES: CareRoute[] = ['ed', 'gp', 'pharmacy', 'urgent_care_clinic']

export default defineEventHandler((event) => {
  const q = getQuery(event)
  const routeRaw = typeof q.route === 'string' ? q.route : ''
  const hasCoords
    = q.lat !== undefined && q.lng !== undefined && q.lat !== '' && q.lng !== ''
  const suburb = typeof q.suburb === 'string' ? q.suburb.trim() : ''

  if (!hasCoords && !suburb) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Bad Request',
      data: {
        error: {
          code: 'LOCATION_REQUIRED',
          message: 'Provide lat/lng or suburb to list providers.'
        }
      }
    })
  }

  const route = (ROUTES as string[]).includes(routeRaw)
    ? (routeRaw as CareRoute)
    : 'gp'

  const items = filterProvidersForRoute(route)

  return {
    source: 'static_fallback' as const,
    items
  }
})
