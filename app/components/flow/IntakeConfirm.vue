<script setup lang="ts">
import type { TriageSignals } from '~~/shared/triage-types'

defineProps<{
  summary: string
  signals: TriageSignals
  transcript: string
}>()

const emit = defineEmits<{
  confirm: []
  back: []
}>()
</script>

<template>
  <UCard>
    <template #header>
      <h2 class="text-lg font-semibold">
        Does this sound right?
      </h2>
      <p class="text-sm text-muted mt-1">
        Confirm so we can suggest the best care setting.
      </p>
    </template>

    <div class="space-y-4">
      <!-- What you said -->
      <div class="rounded-lg bg-elevated p-3">
        <p class="text-xs font-medium uppercase tracking-wide text-muted mb-1">
          You said
        </p>
        <p class="text-sm italic opacity-80">
          "{{ transcript }}"
        </p>
      </div>

      <!-- Summary -->
      <UAlert
        color="info"
        variant="subtle"
        title="Our understanding"
        :description="summary"
      />

      <FlowDisclaimer compact />
    </div>

    <template #footer>
      <div class="flex gap-3">
        <UButton
          variant="outline"
          @click="emit('back')"
        >
          Try again
        </UButton>
        <UButton
          class="flex-1"
          trailing-icon="i-lucide-arrow-right"
          size="lg"
          @click="emit('confirm')"
        >
          Yes, show suggestions
        </UButton>
      </div>
    </template>
  </UCard>
</template>
