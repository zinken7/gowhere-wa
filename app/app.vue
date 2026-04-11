<script setup lang="ts">
useHead({
  meta: [
    { name: 'viewport', content: 'width=device-width, initial-scale=1' }
  ],
  link: [{ rel: 'icon', href: '/favicon.ico' }],
  htmlAttrs: { lang: 'en' }
})

const title = 'CarePath WA'
const description
  = 'Panic-proof care routing for Western Australia — not a diagnosis.'

useSeoMeta({
  title,
  description,
  ogTitle: title,
  ogDescription: description
})
</script>

<template>
  <UApp>
    <UHeader class="border-b border-default">
      <template #left>
        <NuxtLink
          to="/"
          class="flex items-center gap-2 font-semibold text-highlighted"
        >
          <span class="text-lg">CarePath</span>
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

    <UMain class="min-h-[calc(100dvh-8rem)]">
      <NuxtPage />
    </UMain>

    <USeparator />

    <UFooter class="border-t border-default">
      <template #left>
        <p class="text-xs text-muted max-w-prose">
          This app does not diagnose conditions or replace a clinician. If unsure, seek professional advice.
        </p>
      </template>
    </UFooter>
  </UApp>
</template>
