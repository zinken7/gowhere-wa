import { recommendCare } from '../../lib/triage-engine'
import type { CategoryKey, Severity, TriageSignals } from '../../../shared/triage-types'

interface RecommendBody {
  consentGiven?: boolean
  signals?: {
    persona?: 'self' | 'dependent'
    categoryKey?: string
    redFlags?: boolean
    severity?: string
    canWait?: boolean
    afterHours?: boolean
    medicationOrMinorIssue?: boolean
  }
}

const CATEGORY_KEYS: CategoryKey[] = [
  'breathing',
  'chest_pain',
  'fever',
  'injury',
  'mental_health',
  'medication',
  'other'
]

const SEVERITIES: Severity[] = ['mild', 'moderate', 'severe']

function parseCategory(key: string | undefined): CategoryKey {
  if (key && (CATEGORY_KEYS as string[]).includes(key)) {
    return key as CategoryKey
  }
  return 'other'
}

function parseSeverity(s: string | undefined): Severity {
  if (s && (SEVERITIES as string[]).includes(s)) {
    return s as Severity
  }
  return 'mild'
}

export default defineEventHandler(async (event) => {
  const body = await readBody<RecommendBody>(event).catch(() => null)

  if (!body?.consentGiven) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Bad Request',
      data: {
        error: {
          code: 'CONSENT_REQUIRED',
          message: 'Consent is required before care routing.'
        }
      }
    })
  }

  const raw = body.signals ?? {}

  const signals: TriageSignals = {
    persona: raw.persona === 'dependent' ? 'dependent' : 'self',
    categoryKey: parseCategory(raw.categoryKey),
    redFlags: Boolean(raw.redFlags),
    severity: parseSeverity(raw.severity),
    canWait: raw.canWait ?? true,
    afterHours: Boolean(raw.afterHours),
    medicationOrMinorIssue: Boolean(raw.medicationOrMinorIssue)
  }

  const result = recommendCare(signals)

  return {
    rulesVersion: result.rulesVersion,
    route: result.route,
    urgency: result.urgency,
    shortReason: result.shortReason,
    reasonCodes: result.reasonCodes,
    ui: result.ui
  }
})
