<script setup lang="ts">
import type { RecommendResponse } from '~/types/api'
import {
  careActionHeadline,
  recommendationTagline,
  showUrgencySafetyLine,
  urgencyLabel
} from '~/utils/care-copy'

defineProps<{
  result: RecommendResponse
}>()
</script>

<template>
  <UCard
    class="border-primary/30 bg-elevated/80"
    :ui="{ body: 'space-y-3' }"
  >
    <p class="text-xs font-medium uppercase tracking-wide text-muted">
      Where to go
    </p>
    <h2 class="text-2xl font-bold leading-tight text-highlighted sm:text-3xl">
      {{ careActionHeadline(result.route) }}
    </h2>
    <p class="text-sm leading-snug text-muted">
      {{ recommendationTagline(result) }}
    </p>
    <p
      v-if="showUrgencySafetyLine(result)"
      class="text-sm font-medium text-warning"
    >
      {{ urgencyLabel(result.urgency) }}
    </p>
  </UCard>
</template>
