<script setup lang="ts">
defineProps<{
  showEdCta?: boolean
  /** Non-diagnostic routing rationale from the same response as RecommendationCard. */
  routingHint?: string
}>()
</script>

<template>
  <UCard class="border-error/40">
    <template #header>
      <h3 class="text-base font-semibold">
        If you are unsafe right now
      </h3>
      <p
        v-if="routingHint"
        class="text-sm text-muted mt-2"
      >
        {{ routingHint }}
      </p>
    </template>
    <ul class="space-y-3 text-sm">
      <li class="flex flex-col gap-2">
        <span class="text-muted">Life-threatening emergency (Australia)</span>
        <UButton
          color="error"
          block
          size="lg"
          icon="i-lucide-phone"
          to="tel:000"
          external
        >
          Call Triple Zero (000)
        </UButton>
      </li>
      <li class="flex flex-col gap-2">
        <span class="text-muted">Crisis support — mental health (24/7)</span>
        <UButton
          block
          variant="outline"
          to="tel:131114"
          external
        >
          Lifeline — 13 11 14
        </UButton>
      </li>
    </ul>
    <p
      v-if="showEdCta"
      class="text-xs text-muted mt-3"
    >
      Emergency departments treat the most serious and time-critical concerns first.
    </p>
  </UCard>
</template>
