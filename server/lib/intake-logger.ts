/**
 * Structured logging for POST /api/intake/analyze — no secrets, no full transcripts.
 * Vercel: Runtime Logs (Functions) — filter JSON by `component":"intake"`.
 */
import type { H3Event } from 'h3'
import { getRequestHeader } from 'h3'
import { randomUUID } from 'node:crypto'

const COMPONENT = 'intake'
const PREVIEW_MAX = 100

export type IntakeFallbackReason
  = 'missing_api_key'
    | 'gemini_request_failed'
    | 'gemini_timeout'
    | 'empty_response_text'
    | 'invalid_json'
    | 'schema_validation_failed'
    | 'mapping_failed'
    | 'unknown_failure'

export interface IntakeLogBase {
  component: typeof COMPONENT
  requestId: string
  route: string
  timestamp: string
  environment: string
}

function resolveEnvironment(): string {
  return process.env.VERCEL_ENV || process.env.NODE_ENV || 'production'
}

/** Call from the route with `useRuntimeConfig` + env flags (see analyze.post.ts). */
export function resolveIntakeVerbose(
  runtimeIntakeDebugLogs?: boolean
): boolean {
  if (process.env.INTAKE_DEBUG_LOGS === 'true') {
    return true
  }
  if (process.env.NUXT_INTAKE_DEBUG_LOGS === 'true') {
    return true
  }
  return runtimeIntakeDebugLogs === true
}

/** Safe one-line preview for logs (not full PHI). */
export function safeTranscriptPreview(transcript: string, max = PREVIEW_MAX): string {
  const t = transcript.replace(/\s+/g, ' ').trim()
  if (t.length <= max) {
    return t
  }
  return `${t.slice(0, max)}…`
}

export function formatErrorForLog(
  e: unknown,
  includeStack: boolean
): { name: string, message: string, stack?: string } {
  const name = e instanceof Error ? e.name : 'Error'
  const message = e instanceof Error ? e.message : String(e)
  if (!includeStack) {
    return { name, message }
  }
  const stack = e instanceof Error && e.stack ? e.stack.split('\n').slice(0, 6).join('\n') : undefined
  return { name, message, stack }
}

function emitLine(payload: Record<string, unknown>): void {
  console.log(JSON.stringify(payload))
}

export interface IntakeLogger {
  readonly verbose: boolean
  readonly base: () => IntakeLogBase
  /** Full stage trace — only when verbose (INTAKE_DEBUG_LOGS / NUXT_INTAKE_DEBUG_LOGS / runtimeConfig). */
  stage: (event: string, data?: Record<string, unknown>) => void
  /** One compact line when Gemini fails and verbose is off (avoid silent failures). */
  logQuietGeminiFailure: (reason: IntakeFallbackReason, detail?: Record<string, unknown>) => void
  /** Always: end-of-request summary for Vercel inspection. */
  summary: (data: Record<string, unknown>) => void
}

export function createIntakeLogger(event: H3Event, options: { verbose: boolean }): IntakeLogger {
  const verbose = options.verbose
  const requestId
    = getRequestHeader(event, 'x-vercel-id')
      || getRequestHeader(event, 'x-request-id')
      || getRequestHeader(event, 'cf-ray')
      || randomUUID()

  const base = (): IntakeLogBase => ({
    component: COMPONENT,
    requestId,
    route: event.path || '/api/intake/analyze',
    timestamp: new Date().toISOString(),
    environment: resolveEnvironment()
  })

  return {
    verbose,
    base,
    stage(eventName: string, data: Record<string, unknown> = {}) {
      if (!verbose) {
        return
      }
      emitLine({ ...base(), event: eventName, ...data })
    },
    logQuietGeminiFailure(reason: IntakeFallbackReason, detail: Record<string, unknown> = {}) {
      if (verbose) {
        return
      }
      emitLine({
        ...base(),
        event: 'intake_gemini_failure',
        reason,
        ...detail
      })
    },
    summary(data: Record<string, unknown>) {
      emitLine({
        ...base(),
        event: 'intake_request_summary',
        ...data
      })
    }
  }
}
