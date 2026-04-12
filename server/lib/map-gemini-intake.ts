/**
 * Maps validated {@link GeminiIntakeClassification} to the app's {@link IntakeResponse} union.
 * Does not diagnose — only shapes navigation-oriented fields for triage.
 */
import type {
  IntakeConfirm,
  IntakeEmergency,
  IntakeFollowUp,
  IntakeQuestion,
  IntakeResponse
} from '../../shared/intake-types'
import type { GeminiIntakeClassification } from '../../shared/gemini-intake-types'
import type { CategoryKey, Severity, TriageSignals } from '../../shared/triage-types'

function inferCategoryKey(g: GeminiIntakeClassification): CategoryKey {
  const blob = [...g.extractedSymptoms, ...g.urgencySignals, g.summary].join(' ').toLowerCase()
  if (/\b(breath|lung|cough|wheez|asthma)\b/.test(blob)) {
    return 'breathing'
  }
  if (/\b(chest|heart|palpitat)\b/.test(blob)) {
    return 'chest_pain'
  }
  if (/\b(fever|flu|infect|unwell|vomit|nausea|diarr|sore throat)\b/.test(blob)) {
    return 'fever'
  }
  if (/\b(injur|wound|bleed|cut|burn|fall|fractur)\b/.test(blob)) {
    return 'injury'
  }
  if (/\b(anxi|depress|mental|stress|panic|sleep|suicid)\b/.test(blob)) {
    return 'mental_health'
  }
  if (/\b(medic|prescri|pill|tablet|refill|pharmacy|script)\b/.test(blob)) {
    return 'medication'
  }
  return 'other'
}

function inferRedFlags(g: GeminiIntakeClassification): boolean {
  if (g.suggestedDestination === 'ed') {
    return true
  }
  const blob = [...g.urgencySignals, g.summary].join(' ').toLowerCase()
  return /\b(stroke|bleed|unconscious|can't breathe|not breathing|severe chest|anaphylaxis|suicid)\b/.test(blob)
}

function severityFromGemini(g: GeminiIntakeClassification): Severity {
  if (g.suggestedDestination === 'ed') {
    return 'severe'
  }
  if (g.suggestedDestination === 'urgent_care_clinic') {
    return 'moderate'
  }
  if (g.suggestedDestination === 'gp') {
    return 'mild'
  }
  if (g.urgencySignals.length > 0) {
    return 'moderate'
  }
  return 'mild'
}

function buildPartialSignals(
  g: GeminiIntakeClassification,
  prior?: Partial<TriageSignals>
): Partial<TriageSignals> {
  const categoryKey = inferCategoryKey(g)
  return {
    ...prior,
    persona: prior?.persona ?? 'self',
    categoryKey: prior?.categoryKey ?? categoryKey,
    severity: prior?.severity ?? severityFromGemini(g),
    redFlags: prior?.redFlags ?? inferRedFlags(g),
    canWait: prior?.canWait ?? g.suggestedDestination !== 'ed',
    afterHours: prior?.afterHours ?? false,
    medicationOrMinorIssue:
      prior?.medicationOrMinorIssue
      ?? (inferCategoryKey(g) === 'medication' || /\b(script|refill|tablet)\b/i.test(g.summary))
  }
}

function followUpQuestions(g: GeminiIntakeClassification): IntakeQuestion[] {
  if (g.missingInfo.length > 0) {
    return g.missingInfo.slice(0, 6).map((text, i) => ({
      id: `gemini-missing-${i}`,
      text: text.length > 220 ? `${text.slice(0, 217)}…` : text,
      options: undefined
    }))
  }
  return [
    {
      id: 'clarify',
      text: 'Could you share a bit more about your symptoms and how long this has been going on?',
      options: undefined
    }
  ]
}

export function mapGeminiToIntakeResponse(
  g: GeminiIntakeClassification,
  priorSignals?: Partial<TriageSignals>
): IntakeResponse {
  const summary = typeof g.summary === 'string' ? g.summary.trim().slice(0, 500) : ''

  if (g.classification === 'emergency') {
    return {
      type: 'emergency',
      reason: summary.length > 0
        ? summary
        : 'Your description suggests you may need immediate emergency help. If life-threatening, call Triple Zero (000) now.'
    } satisfies IntakeEmergency
  }

  if (g.classification === 'follow_up') {
    return {
      type: 'follow_up',
      questions: followUpQuestions(g),
      partialSignals: buildPartialSignals(g, priorSignals)
    } satisfies IntakeFollowUp
  }

  const categoryKey = inferCategoryKey(g)
  const signals: TriageSignals = {
    persona: priorSignals?.persona ?? 'self',
    categoryKey: priorSignals?.categoryKey ?? categoryKey,
    redFlags: inferRedFlags(g),
    severity: priorSignals?.severity ?? severityFromGemini(g),
    canWait:
      priorSignals?.canWait
      ?? (g.suggestedDestination !== 'ed' && g.suggestedDestination !== 'unknown'),
    afterHours: priorSignals?.afterHours ?? false,
    medicationOrMinorIssue:
      priorSignals?.medicationOrMinorIssue
      ?? (categoryKey === 'medication' || /\b(script|refill|tablet)\b/i.test(summary))
  }

  return {
    type: 'confirm',
    summary: summary.length > 0 ? summary : 'Please confirm these details so we can suggest where to seek care.',
    signals
  } satisfies IntakeConfirm
}
