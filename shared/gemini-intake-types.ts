/**
 * Strict JSON shape from Gemini (structured output) before mapping to {@link IntakeResponse}.
 * Not exposed to the HTTP client.
 */
export type GeminiSuggestedDestination = 'ed' | 'urgent_care_clinic' | 'gp' | 'unknown'

export interface GeminiIntakeClassification {
  classification: 'emergency' | 'confirm' | 'follow_up'
  summary: string
  urgencySignals: string[]
  extractedSymptoms: string[]
  missingInfo: string[]
  suggestedDestination: GeminiSuggestedDestination
  confidence: number
}
