/**
 * POST /api/intake/analyze
 *
 * Accepts free-form text (voice transcript or typed input),
 * returns one of: emergency | confirm | follow_up.
 *
 * Consent is required. Emergency keywords bypass everything.
 */
import { analyzeIntake } from '../../lib/intake-parser'
import { classifyIntakeWithGemini } from '../../lib/intake-gemini'
import type { IntakeRequest, IntakeResponse } from '../../../shared/intake-types'
import type { TriageSignals } from '../../../shared/triage-types'

export default defineEventHandler(async (event) => {
  const body = await readBody<IntakeRequest>(event).catch(() => null)

  if (!body || typeof body !== 'object' || Array.isArray(body)) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Bad Request',
      data: {
        error: {
          code: 'INVALID_BODY',
          message: 'Request body must be a JSON object.'
        }
      }
    })
  }

  if (body.consentGiven !== true) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Bad Request',
      data: {
        error: {
          code: 'CONSENT_REQUIRED',
          message: 'Consent is required before intake analysis.'
        }
      }
    })
  }

  if (typeof body.transcript !== 'string') {
    throw createError({
      statusCode: 400,
      statusMessage: 'Bad Request',
      data: {
        error: {
          code: 'MISSING_TRANSCRIPT',
          message: 'A transcript string is required.'
        }
      }
    })
  }

  const transcript = body.transcript.trim().slice(0, 2000)
  const priorSignals = (body.priorSignals ?? undefined) as Partial<TriageSignals> | undefined

  const config = useRuntimeConfig(event)
  const geminiKey = typeof config.geminiApiKey === 'string' ? config.geminiApiKey.trim() : ''

  let geminiResult: IntakeResponse | null = null
  if (geminiKey.length > 0) {
    geminiResult = await classifyIntakeWithGemini(transcript, priorSignals, geminiKey)
  }

  if (geminiResult != null) {
    return geminiResult
  }

  return analyzeIntake(transcript, priorSignals)
})
