/**
 * One boot-time line per cold start: resolved intake Gemini model (no secrets).
 * Inspect Vercel function logs to confirm NUXT_GEMINI_MODEL is applied.
 */
import { resolveGeminiIntakeModel } from '../lib/gemini-intake-model'

export default defineNitroPlugin(() => {
  if (import.meta.prerender) {
    return
  }
  const config = useRuntimeConfig()
  const model = resolveGeminiIntakeModel(config.geminiModel as string | undefined)
  console.log(JSON.stringify({
    component: 'intake',
    event: 'gemini_intake_boot',
    geminiModel: model,
    geminiApiKeyConfigured: Boolean(
      typeof config.geminiApiKey === 'string' && config.geminiApiKey.trim().length > 0
    )
  }))
})
