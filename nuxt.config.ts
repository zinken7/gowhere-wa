// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({

  modules: [
    '@nuxt/eslint',
    '@nuxt/ui'
  ],

  /** Use file basename for auto-import names (EntryActions not FlowEntryActions). */
  components: [
    {
      path: '~/components',
      pathPrefix: false
    }
  ],

  /** Disable in production builds to avoid shipping devtools to users. */
  devtools: {
    enabled: false
  },

  css: ['~/assets/css/main.css'],
  runtimeConfig: {
    /** Server-only — never expose to client. Maps from `NUXT_SUPABASE_SERVICE_ROLE_KEY`. */
    supabaseServiceRoleKey: '',
    public: {
      /** Supabase project URL; safe to expose. Maps from `NUXT_PUBLIC_SUPABASE_URL`. */
      supabaseUrl: ''
    }
  },

  routeRules: {
    '/': { prerender: true }
  },

  compatibilityDate: '2025-01-15',

  eslint: {
    config: {
      stylistic: {
        commaDangle: 'never',
        braceStyle: '1tbs'
      }
    }
  }
})
