/**
 * POST /api/intake/analyze
 *
 * Accepts free-form text (voice transcript or typed input),
 * returns one of: emergency | confirm | follow_up.
 *
 * Consent is required. Emergency keywords bypass everything.
 */
import { createError, getRequestHeader } from 'h3'
import { analyzeIntake } from '../../lib/intake-parser'
import { classifyIntakeWithGemini } from '../../lib/intake-gemini'
import { resolveGeminiIntakeModel } from '../../lib/gemini-intake-model'
import {
  createIntakeLogger,
  resolveIntakeVerbose,
  safeTranscriptPreview
} from '../../lib/intake-logger'
import type { IntakeRequest, IntakeResponse } from '../../../shared/intake-types'
import type { TriageSignals } from '../../../shared/triage-types'

export default defineEventHandler(async (event) => {
  const started = Date.now()
  const config = useRuntimeConfig(event)
  const verbose = resolveIntakeVerbose(
    (config as { intakeDebugLogs?: boolean }).intakeDebugLogs
  )
  const log = createIntakeLogger(event, { verbose })

  const durationMs = () => Date.now() - started

  try {
    const body = await readBody<IntakeRequest>(event).catch(() => null)

    log.stage('intake_request_received', {
      hasBody: body != null && typeof body === 'object' && !Array.isArray(body),
      contentType: getRequestHeader(event, 'content-type') ?? ''
    })

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

    log.stage('intake_validation_passed', {})

    const transcript = body.transcript.trim().slice(0, 2000)
    const priorSignals = (body.priorSignals ?? undefined) as Partial<TriageSignals> | undefined

    log.stage('intake_transcript_normalized', {
      transcriptLength: transcript.length,
      transcriptPreview: safeTranscriptPreview(transcript),
      priorSignalsPresent: Boolean(priorSignals && Object.keys(priorSignals).length > 0)
    })

    const geminiKey = typeof config.geminiApiKey === 'string' ? config.geminiApiKey.trim() : ''
    const geminiModel = resolveGeminiIntakeModel(
      (config as { geminiModel?: string }).geminiModel
    )

    log.stage('intake_gemini_config', {
      model: geminiModel,
      apiKeyPresent: geminiKey.length > 0,
      transcriptLength: transcript.length,
      priorSignalsPresent: Boolean(priorSignals && Object.keys(priorSignals).length > 0)
    })

    if (geminiKey.length === 0) {
      log.stage('intake_fallback_activated', { reason: 'missing_api_key' })
      const out: IntakeResponse = analyzeIntake(transcript, priorSignals)
      log.stage('intake_fallback_completed', {
        finalClassification: out.type,
        source: 'keyword_parser'
      })
      log.summary({
        outcome: 'ok',
        usedGemini: false,
        geminiAttempted: false,
        fallbackUsed: true,
        fallbackReason: 'missing_api_key',
        geminiModel,
        finalClassification: out.type,
        suggestedDestination: null,
        durationMs: durationMs()
      })
      return out
    }

    const geminiOutcome = await classifyIntakeWithGemini(
      transcript,
      priorSignals,
      geminiKey,
      geminiModel,
      log
    )

    if (geminiOutcome.ok) {
      log.summary({
        outcome: 'ok',
        usedGemini: true,
        geminiAttempted: true,
        fallbackUsed: false,
        fallbackReason: null,
        geminiModel,
        finalClassification: geminiOutcome.response.type,
        suggestedDestination: geminiOutcome.suggestedDestination,
        durationMs: durationMs()
      })
      return geminiOutcome.response
    }

    log.stage('intake_fallback_activated', { reason: geminiOutcome.reason })
    const out: IntakeResponse = analyzeIntake(transcript, priorSignals)
    log.stage('intake_fallback_completed', {
      finalClassification: out.type,
      source: 'keyword_parser',
      geminiFailureReason: geminiOutcome.reason
    })
    log.summary({
      outcome: 'ok',
      usedGemini: false,
      geminiAttempted: true,
      fallbackUsed: true,
      fallbackReason: geminiOutcome.reason,
      geminiModel,
      finalClassification: out.type,
      suggestedDestination: null,
      durationMs: durationMs()
    })
    return out
  } catch (e: unknown) {
    const statusCode
      = e !== null && typeof e === 'object' && 'statusCode' in e
        ? Number((e as { statusCode?: number }).statusCode)
        : undefined
    if (statusCode === 400) {
      const data = e !== null && typeof e === 'object' && 'data' in e
        ? (e as { data?: { error?: { code?: string } } }).data
        : undefined
      const validationCode = data?.error?.code ?? 'UNKNOWN'
      log.summary({
        outcome: 'validation_error',
        validationCode,
        durationMs: durationMs()
      })
    }
    throw e
  }
})
