<script setup lang="ts">
useHead({
  title: 'Life-threatening emergency — GoWhere WA',
  meta: [
    {
      name: 'description',
      content:
        'If you may be having a life-threatening emergency in Australia, call Triple Zero (000) immediately.'
    }
  ]
})
</script>

<template>
  <div
    class="emergency-page flex min-h-dvh flex-col items-center bg-black px-6 pb-10 pt-8 text-center text-white"
  >
    <!-- Brand -->
    <header class="mb-10 w-full max-w-sm">
      <p class="mb-1 font-sans text-3xl font-extrabold tracking-tight">
        <span class="text-brand-500">Go</span><span class="text-[#FFF4EC]">Where WA</span>
      </p>
      <p class="text-sm font-medium text-white/90">
        When to Go Where
      </p>
    </header>

    <!-- Main question -->
    <main class="flex w-full max-w-sm flex-1 flex-col items-center">
      <h1 class="mb-6 text-xl font-bold leading-snug text-brand-500 sm:text-2xl">
        Is this a life-threatening emergency?
      </h1>

      <div class="mb-10 space-y-2 text-base text-white/95">
        <p class="font-semibold text-white">
          Example:
        </p>
        <ul
          class="list-none space-y-1.5"
          role="list"
        >
          <li>chest pain</li>
          <li>can't breathe</li>
          <li>heavy bleeding</li>
        </ul>
      </div>

      <!-- Primary CTA: dial 000 -->
      <a
        href="tel:000"
        class="flex w-full max-w-md items-center justify-center gap-3 rounded-xl bg-brand-500 px-5 py-4 text-base font-bold text-white shadow-lg transition hover:bg-brand-400 active:scale-[0.98] sm:text-lg"
        aria-label="Call Triple Zero emergency services now"
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          class="h-7 w-7 shrink-0"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          stroke-width="2"
          stroke-linecap="round"
          stroke-linejoin="round"
          aria-hidden="true"
        >
          <path
            d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"
          />
        </svg>
        Call Triple Zero (000) NOW
      </a>

      <p class="mt-6 text-sm text-white/85">
        <NuxtLink
          to="/"
          class="underline decoration-white/40 underline-offset-4 transition hover:text-brand-400"
        >
          Or continue with smart guidance if not sure.
        </NuxtLink>
      </p>
    </main>

    <!-- Compliance disclaimer -->
    <footer class="mt-auto max-w-md pt-6 text-xs leading-relaxed text-white/50">
      This app is not a substitute for professional medical advice. If you are unsure
      whether you need an ambulance, calling Triple Zero (000) is appropriate for
      possible life-threatening emergencies.
    </footer>
  </div>
</template>
