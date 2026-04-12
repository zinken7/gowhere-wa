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

const GEMINI_MODEL = 'gemini-2.0-flash'
const REQUEST_TIMEOUT_MS = 12_000

const FEW_SHOT_AND_RULES = `
You are a structured intake classifier for an Australian healthcare navigation app.

Your job is navigation classification only.
You are not diagnosing.
You must use only the provided transcript and priorSignals.

Return exactly one JSON object matching the schema.
Do not output markdown.
Do not output code fences.
Do not output extra keys.
Do not output explanations outside JSON.

Classification policy:
- emergency: clear emergency red flags or immediate danger
- confirm: same-day concern, unclear severity, missing key details, or uncertainty between urgent options
- follow_up: mild, stable, routine, chronic, administrative, or clearly non-urgent concerns

Safety policy:
- If severe chest pain, trouble breathing, stroke-like neurologic symptoms, severe bleeding, collapse, seizure, unconsciousness, suicidal intent, severe allergic reaction, or major trauma are present, classification must be "emergency".
- If unsure between "follow_up" and "confirm", choose "confirm".
- Do not invent symptoms.
- Do not give a diagnosis.
- suggestedDestination is only a routing hint: "ed" | "urgent_care_clinic" | "gp" | "unknown".
- Keep summary short, factual, and non-diagnostic.
- Arrays must always be present.
- confidence must be a number from 0 to 1.

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
  "confidence": 0.98
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
  "missingInfo": ["age details", "severity", "red flags"],
  "suggestedDestination": "urgent_care_clinic",
  "confidence": 0.78
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
  "confidence": 0.90
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
  "confidence": 0.82
}

Input:
{
  "transcript": "Bad stomach pain since tonight and I keep vomiting.",
  "priorSignals": null
}
Output:
{
  "classification": "confirm",
  "summary": "Acute stomach pain with vomiting may need urgent assessment.",
  "urgencySignals": ["vomiting", "acute pain"],
  "extractedSymptoms": ["stomach pain", "vomiting"],
  "missingInfo": ["severity", "blood in vomit", "hydration concerns"],
  "suggestedDestination": "urgent_care_clinic",
  "confidence": 0.76
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
  "confidence": 0.99
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
    confidence: { type: SchemaType.NUMBER, description: '0–1' }
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

/**
 * Returns mapped {@link IntakeResponse} when Gemini succeeds; `null` to trigger keyword fallback.
 */
export async function classifyIntakeWithGemini(
  transcript: string,
  priorSignals: Partial<TriageSignals> | undefined,
  apiKey: string
): Promise<IntakeResponse | null> {
  const key = apiKey.trim()
  if (!key) {
    return null
  }

  const genAI = new GoogleGenerativeAI(key)
  const model = genAI.getGenerativeModel(
    {
      model: GEMINI_MODEL,
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

  const userPrompt = `priorSignals (JSON, may be null):\n${priorJson}\n\ntranscript:\n${transcript}`

  const run = model.generateContent({
    contents: [{ role: 'user', parts: [{ text: userPrompt }] }]
  })

  let text: string
  try {
    const result = await withTimeout(run, REQUEST_TIMEOUT_MS + 2000)
    text = result.response.text()
  } catch (e) {
    if (import.meta.dev) {
      const msg = e instanceof Error ? e.message : String(e)
      console.warn('[intake-gemini] request failed:', msg)
    }
    return null
  }

  let parsed: unknown
  try {
    parsed = JSON.parse(text) as unknown
  } catch {
    if (import.meta.dev) {
      console.warn('[intake-gemini] invalid JSON from model')
    }
    return null
  }

  const validated = validateGeminiPayload(parsed)
  if (!validated) {
    if (import.meta.dev) {
      console.warn('[intake-gemini] schema validation failed')
    }
    return null
  }

  try {
    return mapGeminiToIntakeResponse(validated, priorSignals)
  } catch {
    return null
  }
}
