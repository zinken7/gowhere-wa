<script setup lang="ts">
import type { RecommendResponse } from '~/types/api'
import { careSettingLabel, urgencyLabel } from '~/utils/care-copy'

defineProps<{
  result: RecommendResponse
}>()
</script>

<template>
  <UCard>
    <template #header>
      <div class="flex flex-wrap items-center gap-2">
        <h2 class="text-lg font-semibold">
          Suggested next step
        </h2>
        <UBadge
          color="neutral"
          variant="subtle"
        >
          Rules {{ result.rulesVersion }}
        </UBadge>
      </div>
      <p class="text-sm text-muted mt-1">
        Routing suggestion only — not a diagnosis.
      </p>
    </template>

    <div class="space-y-4">
      <div>
        <p class="text-xs font-medium uppercase tracking-wide text-muted">
          Care setting
        </p>
        <p class="text-xl font-semibold">
          {{ careSettingLabel(result.route) }}
        </p>
      </div>

      <div>
        <p class="text-xs font-medium uppercase tracking-wide text-muted">
          Urgency
        </p>
        <p class="text-base">
          {{ urgencyLabel(result.urgency) }}
        </p>
      </div>

      <UAlert
        color="info"
        variant="subtle"
        title="Why this suggestion"
        :description="result.shortReason"
      />

      <div
        v-if="result.reasonCodes.length"
        class="text-xs text-muted"
      >
        <span class="font-medium">Reason codes:</span>
        {{ result.reasonCodes.join(', ') }}
      </div>
    </div>
  </UCard>
</template>
