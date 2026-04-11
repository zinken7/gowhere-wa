<script setup lang="ts">
useHead({
  meta: [
    { name: 'viewport', content: 'width=device-width, initial-scale=1, viewport-fit=cover' }
  ],
  link: [{ rel: 'icon', href: '/favicon.ico' }],
  htmlAttrs: { lang: 'en', class: 'dark' }
})

const title = 'GoWhere WA'
const description
  = 'Panic-proof care routing for Western Australia — not a diagnosis.'

useSeoMeta({
  title,
  description,
  ogTitle: title,
  ogDescription: description
})

/**
 * Chrome visibility — entry screen is full-bleed dark,
 * other steps show the normal header/footer.
 *
 * Injected from index.vue via provide('flowStep', step).
 * Falls back to showing chrome if no step is provided (other pages).
 */
const flowStep = inject<Ref<string>>('flowStep', ref(''))
const showChrome = computed(() => {
  const s = flowStep.value
  return s !== '' && s !== 'entry'
})
</script>

<template>
  <UApp>
    <UHeader
      v-if="showChrome"
      class="border-b border-default"
    >
      <template #left>
        <NuxtLink
          to="/"
          class="flex items-center gap-2 font-semibold text-highlighted"
        >
          <span class="text-lg">GoWhere</span>
          <UBadge
            color="neutral"
            variant="subtle"
            size="sm"
          >
            WA
          </UBadge>
        </NuxtLink>
      </template>

      <template #right>
        <UColorModeButton />
      </template>
    </UHeader>

    <UMain :class="showChrome ? 'min-h-[calc(100dvh-8rem)]' : ''">
      <NuxtPage />
    </UMain>

    <template v-if="showChrome">
      <USeparator />

      <UFooter class="border-t border-default">
        <template #left>
          <p class="text-xs text-muted max-w-prose">
            This app does not diagnose conditions or replace a clinician. If unsure, seek professional advice.
          </p>
        </template>
      </UFooter>
    </template>
  </UApp>
</template>
