<script setup lang="ts">
import type { Severity } from '~~/shared/triage-types'

const severity = defineModel<Severity | null>('severity', { required: true })
const afterHours = defineModel<boolean>('afterHours', { required: true })

const emit = defineEmits<{ continue: [] }>()

const levels: { value: Severity, label: string, hint: string }[] = [
  { value: 'mild', label: 'Mild', hint: 'Uncomfortable but coping' },
  { value: 'moderate', label: 'Moderate', hint: 'Harder to ignore, affecting activity' },
  { value: 'severe', label: 'Severe', hint: 'Hard to manage, worsening, or very worried' }
]
</script>

<template>
  <UCard>
    <template #header>
      <h2 class="text-lg font-semibold">
        How strong are the symptoms right now?
      </h2>
      <p class="text-sm text-muted mt-1">
        This is a rough guide for routing — not a clinical score.
      </p>
      <FlowDisclaimer
        compact
        class="mt-3"
      />
    </template>

    <div class="grid grid-cols-1 gap-2">
      <UButton
        v-for="lv in levels"
        :key="lv.value"
        block
        size="lg"
        class="justify-start text-left h-auto py-3"
        :variant="severity === lv.value ? 'solid' : 'outline'"
        @click="severity = lv.value"
      >
        <span class="flex flex-col items-start gap-0.5">
          <span class="font-medium">{{ lv.label }}</span>
          <span class="text-xs font-normal opacity-80">{{ lv.hint }}</span>
        </span>
      </UButton>
    </div>

    <USeparator class="my-4" />

    <UFormField
      label="After usual GP clinic hours?"
      description="Helps route to after-hours options when appropriate."
    >
      <USwitch v-model="afterHours" />
    </UFormField>

    <template #footer>
      <UButton
        block
        trailing-icon="i-lucide-arrow-right"
        size="lg"
        :disabled="severity == null"
        @click="emit('continue')"
      >
        Get recommendation
      </UButton>
    </template>
  </UCard>
</template>
