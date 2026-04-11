import { parseCareRouteQuery } from '../../../shared/care-routes'
import { getProvidersNearby } from '../../lib/provider-query'
import { getSupabaseAdmin } from '../../lib/supabase'

/** Limits unbounded query strings (DoS / log noise). */
const MAX_SUBURB_LEN = 120
/** Default list size for map/list UIs; cap prevents abuse. */
const DEFAULT_LIMIT = 3
const MAX_LIMIT = 25

export default defineEventHandler(async (event) => {
  const q = getQuery(event)
  const hasCoords
    = q.lat !== undefined && q.lng !== undefined && q.lat !== '' && q.lng !== ''
  const suburbRaw = typeof q.suburb === 'string' ? q.suburb.trim() : ''
  const suburb
    = suburbRaw.length > MAX_SUBURB_LEN
      ? suburbRaw.slice(0, MAX_SUBURB_LEN)
      : suburbRaw

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

  const route = parseCareRouteQuery(q.route)

  let limit = DEFAULT_LIMIT
  if (q.limit !== undefined && q.limit !== '') {
    const n = Number(q.limit)
    if (Number.isFinite(n)) {
      limit = Math.min(Math.max(Math.trunc(n), 1), MAX_LIMIT)
    }
  }

  let lat: number | undefined
  let lng: number | undefined
  if (hasCoords) {
    lat = Number(q.lat)
    lng = Number(q.lng)
    if (!Number.isFinite(lat) || !Number.isFinite(lng)) {
      throw createError({
        statusCode: 400,
        statusMessage: 'Bad Request',
        data: {
          error: {
            code: 'INVALID_COORDINATES',
            message: 'lat and lng must be valid numbers.'
          }
        }
      })
    }
  }

  const client = getSupabaseAdmin()
  return getProvidersNearby(client, route, {
    lat,
    lng,
    suburb: suburb || undefined,
    limit
  })
})
