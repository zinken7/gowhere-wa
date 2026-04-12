import { resolveGeminiIntakeModel } from '../lib/gemini-intake-model'

export default defineEventHandler((event) => {
  const config = useRuntimeConfig(event)
  return {
    ok: true,
    service: 'GoWhere-wa',
    time: new Date().toISOString(),
    /** Resolved model id for intake Gemini calls (from NUXT_GEMINI_MODEL or default). Not a secret. */
    geminiIntakeModel: resolveGeminiIntakeModel(config.geminiModel as string | undefined)
  }
})
