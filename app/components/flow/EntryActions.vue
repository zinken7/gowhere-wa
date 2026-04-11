<script setup lang="ts">
const consentGiven = defineModel<boolean>('consentGiven', { required: true })

const emit = defineEmits<{
  start: []
  emergency: []
}>()
</script>

<template>
  <UCard>
    <template #header>
      <h1 class="text-xl font-semibold text-highlighted">
        CarePath WA
      </h1>
      <p class="text-sm text-muted mt-1">
        Find a sensible care setting before heading to emergency — when that may not be the right first step.
      </p>
    </template>

    <div class="space-y-4">
      <FlowDisclaimer compact />

      <UFormField>
        <UCheckbox
          v-model="consentGiven"
          label="I understand this is not medical advice and does not diagnose my condition."
        />
      </UFormField>

      <div class="flex flex-col gap-3 sm:flex-row">
        <UButton
          block
          size="lg"
          :disabled="!consentGiven"
          icon="i-lucide-arrow-right"
          trailing
          @click="emit('start')"
        >
          Start
        </UButton>
        <UButton
          block
          size="lg"
          color="error"
          variant="outline"
          icon="i-lucide-phone"
          @click="emit('emergency')"
        >
          Emergency — call 000
        </UButton>
      </div>
      <p class="text-xs text-muted">
        If you believe a life is in danger, call Triple Zero (000) now.
      </p>
    </div>
  </UCard>
</template>
