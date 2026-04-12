/**
 * Gemini-based intake classifier — structured JSON only.
 * On any failure returns null; callers must fall back to {@link analyzeIntake}.
 */
import { GoogleGenerativeAI, SchemaType } from '@google/generative-ai'
import type { ResponseSchema } from '@google/generative-ai'
import type { TriageSignals } from '../../shared/triage-types'
import type { IntakeResponse } from '../../shared/intake-types'
import type { GeminiIntakeClassification } from '../../shared/gemini-intake-types'
import { mapGeminiToIntakeResponse } from './map-gemini-intake'
import type { IntakeFallbackReason, IntakeLogger } from './intake-logger'
import { formatErrorForLog } from './intake-logger'
import { resolveGeminiIntakeModel } from './gemini-intake-model'

const REQUEST_TIMEOUT_MS = 12_000

const FEW_SHOT_AND_RULES = `
You are a structured intake classifier for an Australian healthcare navigation app.

Your job is navigation classification only.
You are not diagnosing.
You must use only the transcript, priorSignals, and followUpPass (when provided).

Return exactly one JSON object matching the schema.
Do not output markdown.
Do not output code fences.
Do not output extra keys.
Do not output explanations outside JSON.

Unclear-input policy (critical):
- If the text is nonsense, gibberish, too vague, contradictory, or not enough to choose a safe care setting, do NOT guess "gp" or any destination.
- Use classification "follow_up" with suggestedDestination "unknown" and list specific missingInfo items the user should answer.
- If you cannot responsibly infer a destination, use suggestedDestination "unknown" — never route low-quality text to "gp" by default.
- The numeric "confidence" field is required by schema only; it is NOT used for routing decisions downstream.

Classification policy:
- emergency: clear emergency red flags or immediate danger
- confirm: enough concrete detail to suggest a plausible non-emergency routing destination AND missingInfo is empty
- follow_up: need more detail, routine/low-urgency framing, OR unclear/unsafe to route yet

Safety policy:
- If severe chest pain, trouble breathing, stroke-like neurologic symptoms, severe bleeding, collapse, seizure, unconsciousness, suicidal intent, severe allergic reaction, or major trauma are present, classification must be "emergency".
- If unsure between "follow_up" and routing to "gp", choose "follow_up" with unknown destination rather than a false GP route.
- Do not invent symptoms.
- Do not give a diagnosis.
- suggestedDestination is only a routing hint: "ed" | "urgent_care_clinic" | "gp" | "unknown".
- Keep summary short, factual, and non-diagnostic.
- Arrays must always be present.
- confidence: number 0 to 1 (schema compatibility only).

Few-shot examples:

Input:
{
  "transcript": "I have crushing chest pain and I feel short of breath.",
  "priorSignals": null
}
Output:
{
  "classification": "emergency",
  "summary": "Severe chest pain with shortness of breath.",
  "urgencySignals": ["chest pain", "shortness of breath"],
  "extractedSymptoms": ["chest pain", "shortness of breath"],
  "missingInfo": [],
  "suggestedDestination": "ed",
  "confidence": 0.5
}

Input:
{
  "transcript": "My child has a fever since this afternoon and is complaining of ear pain.",
  "priorSignals": null
}
Output:
{
  "classification": "confirm",
  "summary": "Fever and ear pain may need same-day assessment.",
  "urgencySignals": ["fever"],
  "extractedSymptoms": ["fever", "ear pain"],
  "missingInfo": [],
  "suggestedDestination": "urgent_care_clinic",
  "confidence": 0.5
}

Input:
{
  "transcript": "I need another script for my blood pressure tablets and I feel okay otherwise.",
  "priorSignals": null
}
Output:
{
  "classification": "follow_up",
  "summary": "Routine medication request without acute danger signs.",
  "urgencySignals": [],
  "extractedSymptoms": [],
  "missingInfo": [],
  "suggestedDestination": "gp",
  "confidence": 0.5
}

Input:
{
  "transcript": "I have had a sore throat for two days, no trouble breathing, eating okay.",
  "priorSignals": null
}
Output:
{
  "classification": "follow_up",
  "summary": "Mild throat symptoms without obvious emergency features.",
  "urgencySignals": [],
  "extractedSymptoms": ["sore throat"],
  "missingInfo": [],
  "suggestedDestination": "gp",
  "confidence": 0.5
}

Input:
{
  "transcript": "Bad stomach pain since tonight and I keep vomiting.",
  "priorSignals": null
}
Output:
{
  "classification": "follow_up",
  "summary": "Acute stomach pain with vomiting may need urgent assessment; more detail needed.",
  "urgencySignals": ["vomiting", "acute pain"],
  "extractedSymptoms": ["stomach pain", "vomiting"],
  "missingInfo": ["severity", "blood in vomit", "hydration concerns"],
  "suggestedDestination": "urgent_care_clinic",
  "confidence": 0.5
}

Input:
{
  "transcript": "My face feels droopy and my arm is weak.",
  "priorSignals": null
}
Output:
{
  "classification": "emergency",
  "summary": "Possible emergency neurologic warning signs.",
  "urgencySignals": ["face drooping", "arm weakness"],
  "extractedSymptoms": ["face drooping", "arm weakness"],
  "missingInfo": [],
  "suggestedDestination": "ed",
  "confidence": 0.5
}

Input:
{
  "transcript": "banana cloud running quickly",
  "priorSignals": null
}
Output:
{
  "classification": "follow_up",
  "summary": "Input is not clear enough to suggest a care setting.",
  "urgencySignals": [],
  "extractedSymptoms": [],
  "missingInfo": ["What health problem are you having?", "Where on the body?", "How long?", "How severe?"],
  "suggestedDestination": "unknown",
  "confidence": 0.5
}

Input:
{
  "transcript": "help me",
  "priorSignals": null
}
Output:
{
  "classification": "follow_up",
  "summary": "Not enough detail to route safely.",
  "urgencySignals": [],
  "extractedSymptoms": [],
  "missingInfo": ["What symptoms or concern?", "Urgent or ongoing?", "Any red flags like chest pain, breathing trouble, severe bleeding?"],
  "suggestedDestination": "unknown",
  "confidence": 0.5
}

Input:
{
  "transcript": "not feeling right",
  "priorSignals": null
}
Output:
{
  "classification": "follow_up",
  "summary": "Vague symptoms — need more specifics before routing.",
  "urgencySignals": [],
  "extractedSymptoms": [],
  "missingInfo": ["Main symptoms", "Duration", "Severity", "Any emergency warning signs?"],
  "suggestedDestination": "unknown",
  "confidence": 0.5
}

Input:
{
  "transcript": "pain maybe, not sure, somewhere",
  "priorSignals": null
}
Output:
{
  "classification": "follow_up",
  "summary": "Location and nature of pain are unclear.",
  "urgencySignals": [],
  "extractedSymptoms": [],
  "missingInfo": ["Where is the pain?", "What type of pain?", "Since when?", "Anything make it worse?"],
  "suggestedDestination": "unknown",
  "confidence": 0.5
}
`

/** Structured JSON schema for Gemini; cast satisfies SDK `ResponseSchema` (TS widens `SchemaType` literals otherwise). */
const responseSchema = {
  type: SchemaType.OBJECT,
  properties: {
    classification: {
      type: SchemaType.STRING,
      format: 'enum',
      enum: ['emergency', 'confirm', 'follow_up'] as string[],
      description: 'Navigation outcome type'
    },
    summary: { type: SchemaType.STRING, description: 'Short non-diagnostic summary' },
    urgencySignals: {
      type: SchemaType.ARRAY,
      items: { type: SchemaType.STRING }
    },
    extractedSymptoms: {
      type: SchemaType.ARRAY,
      items: { type: SchemaType.STRING }
    },
    missingInfo: {
      type: SchemaType.ARRAY,
      items: { type: SchemaType.STRING }
    },
    suggestedDestination: {
      type: SchemaType.STRING,
      format: 'enum',
      enum: ['ed', 'urgent_care_clinic', 'gp', 'unknown'] as string[]
    },
    confidence: {
      type: SchemaType.NUMBER,
      description:
        'Compat only: any number 0–1. Not a native Gemini confidence score; server mapping ignores it for routing.'
    }
  },
  required: [
    'classification',
    'summary',
    'urgencySignals',
    'extractedSymptoms',
    'missingInfo',
    'suggestedDestination',
    'confidence'
  ]
} as ResponseSchema

function withTimeout<T>(promise: Promise<T>, ms: number): Promise<T> {
  return new Promise((resolve, reject) => {
    const t = setTimeout(() => reject(new Error('GEMINI_TIMEOUT')), ms)
    promise.then(
      (v) => {
        clearTimeout(t)
        resolve(v)
      },
      (e) => {
        clearTimeout(t)
        reject(e)
      }
    )
  })
}

function isStringArray(v: unknown): v is string[] {
  return Array.isArray(v) && v.every(x => typeof x === 'string')
}

function validateGeminiPayload(raw: unknown): GeminiIntakeClassification | null {
  if (!raw || typeof raw !== 'object') {
    return null
  }
  const o = raw as Record<string, unknown>
  const classification = o.classification
  const summary = o.summary
  const suggestedDestination = o.suggestedDestination
  const confidence = o.confidence

  if (
    classification !== 'emergency'
    && classification !== 'confirm'
    && classification !== 'follow_up'
  ) {
    return null
  }
  if (typeof summary !== 'string' || summary.trim().length === 0) {
    return null
  }
  if (
    suggestedDestination !== 'ed'
    && suggestedDestination !== 'urgent_care_clinic'
    && suggestedDestination !== 'gp'
    && suggestedDestination !== 'unknown'
  ) {
    return null
  }
  if (!isStringArray(o.urgencySignals) || !isStringArray(o.extractedSymptoms) || !isStringArray(o.missingInfo)) {
    return null
  }
  if (typeof confidence !== 'number' || !Number.isFinite(confidence)) {
    return null
  }
  const conf = Math.min(1, Math.max(0, confidence))

  return {
    classification,
    summary: summary.trim(),
    urgencySignals: o.urgencySignals,
    extractedSymptoms: o.extractedSymptoms,
    missingInfo: o.missingInfo,
    suggestedDestination,
    confidence: conf
  }
}

export type GeminiClassifyOutcome
  = | {
    ok: true
    response: IntakeResponse
    classification: 'emergency' | 'confirm' | 'follow_up'
    suggestedDestination: string
  }
  | {
    ok: false
    reason: IntakeFallbackReason
    error?: { name: string, message: string, stack?: string }
  }

/**
 * Returns mapped {@link IntakeResponse} when Gemini succeeds; otherwise `ok: false` with a fallback reason for logging.
 */
export async function classifyIntakeWithGemini(
  transcript: string,
  priorSignals: Partial<TriageSignals> | undefined,
  apiKey: string,
  modelId: string,
  followUpPass: number,
  log: IntakeLogger
): Promise<GeminiClassifyOutcome> {
  const key = apiKey.trim()
  if (!key) {
    return { ok: false, reason: 'unknown_failure' }
  }

  const modelName = resolveGeminiIntakeModel(modelId)

  const genAI = new GoogleGenerativeAI(key)
  const model = genAI.getGenerativeModel(
    {
      model: modelName,
      systemInstruction: {
        role: 'system',
        parts: [{ text: FEW_SHOT_AND_RULES }]
      },
      generationConfig: {
        temperature: 0.1,
        topP: 0.9,
        maxOutputTokens: 1024,
        responseMimeType: 'application/json',
        responseSchema
      }
    },
    { timeout: REQUEST_TIMEOUT_MS }
  )

  const priorJson = priorSignals && Object.keys(priorSignals).length > 0
    ? JSON.stringify(priorSignals)
    : 'null'

  const pass = Number.isFinite(followUpPass) ? Math.max(0, Math.floor(followUpPass)) : 0
  const userPrompt = `followUpPass (0 = first intake analysis; 1+ = user already submitted clarification answers this session):\n${pass}\n\npriorSignals (JSON, may be null):\n${priorJson}\n\ntranscript:\n${transcript}`

  log.stage('intake_gemini_attempt_starting', {
    model: modelName,
    transcriptLength: transcript.length,
    priorSignalsPresent: Boolean(priorSignals && Object.keys(priorSignals).length > 0)
  })

  log.stage('intake_gemini_config', {
    model: modelName,
    apiKeyPresent: true,
    transcriptLength: transcript.length,
    priorSignalsPresent: Boolean(priorSignals && Object.keys(priorSignals).length > 0)
  })

  const run = model.generateContent({
    contents: [{ role: 'user', parts: [{ text: userPrompt }] }]
  })

  let text: string
  try {
    const result = await withTimeout(run, REQUEST_TIMEOUT_MS + 2000)
    text = result.response.text()
    log.stage('intake_gemini_request_success', {
      model: modelName,
      responseTextLength: typeof text === 'string' ? text.length : 0
    })
  } catch (e) {
    const isTimeout = e instanceof Error && e.message === 'GEMINI_TIMEOUT'
    const reason: IntakeFallbackReason = isTimeout ? 'gemini_timeout' : 'gemini_request_failed'
    const includeStack = Boolean(import.meta.dev)
    const err = formatErrorForLog(e, includeStack)
    log.stage('intake_gemini_request_failed', {
      model: modelName,
      reason,
      ...err
    })
    log.logQuietGeminiFailure(reason, {
      model: modelName,
      errorName: err.name,
      errorMessage: err.message
    })
    return { ok: false, reason, error: err }
  }

  if (typeof text !== 'string' || !text.trim()) {
    log.stage('intake_gemini_empty_response', {})
    log.logQuietGeminiFailure('empty_response_text', { model: modelName })
    return { ok: false, reason: 'empty_response_text' }
  }

  let parsed: unknown
  try {
    parsed = JSON.parse(text) as unknown
  } catch (e) {
    const includeStack = Boolean(import.meta.dev)
    const err = formatErrorForLog(e, includeStack)
    log.stage('intake_gemini_invalid_json', {
      ...err,
      responseTextLength: text.length
    })
    log.logQuietGeminiFailure('invalid_json', { model: modelName, errorName: err.name })
    return { ok: false, reason: 'invalid_json', error: err }
  }

  const validated = validateGeminiPayload(parsed)
  if (!validated) {
    log.stage('intake_gemini_schema_validation_failed', {
      parsedKeys: parsed && typeof parsed === 'object' ? Object.keys(parsed as object) : []
    })
    log.logQuietGeminiFailure('schema_validation_failed', { model: modelName })
    return { ok: false, reason: 'schema_validation_failed' }
  }

  try {
    const response = mapGeminiToIntakeResponse(validated, priorSignals)
    log.stage('intake_gemini_success', {
      model: modelName,
      classification: validated.classification,
      suggestedDestination: validated.suggestedDestination,
      responseType: response.type
    })
    return {
      ok: true,
      response,
      classification: validated.classification,
      suggestedDestination: validated.suggestedDestination
    }
  } catch (e) {
    const includeStack = Boolean(import.meta.dev)
    const err = formatErrorForLog(e, includeStack)
    log.stage('intake_gemini_mapping_failed', { ...err })
    log.logQuietGeminiFailure('mapping_failed', { model: modelName, errorName: err.name })
    return { ok: false, reason: 'mapping_failed', error: err }
  }
}
