/**
 * Default Gemini model for POST /api/intake/analyze structured classification.
 * Override via runtime config / NUXT_GEMINI_MODEL (e.g. gemini-2.5-flash-lite).
 */
export const DEFAULT_GEMINI_INTAKE_MODEL = 'gemini-2.5-flash'

export function resolveGeminiIntakeModel(modelId: string | undefined): string {
  const t = typeof modelId === 'string' ? modelId.trim() : ''
  return t.length > 0 ? t : DEFAULT_GEMINI_INTAKE_MODEL
}
