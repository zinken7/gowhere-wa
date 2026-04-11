<script setup lang="ts">
import type { CategoryKey } from '~~/shared/triage-types'

const model = defineModel<CategoryKey | null>({ required: true })

const emit = defineEmits<{ continue: [] }>()

const categories: { key: CategoryKey, label: string, hint: string }[] = [
  { key: 'breathing', label: 'Breathing / lungs', hint: 'Shortness of breath, wheeze' },
  { key: 'chest_pain', label: 'Chest discomfort', hint: 'Pressure, tightness, pain' },
  { key: 'fever', label: 'Fever / infection concern', hint: 'Temperature, feeling unwell' },
  { key: 'injury', label: 'Injury / wound', hint: 'Cuts, sprains, pain after injury' },
  { key: 'mental_health', label: 'Mental health / distress', hint: 'Anxiety, mood, safety concerns' },
  { key: 'medication', label: 'Medication question', hint: 'Refills, side effects, supply' },
  { key: 'other', label: 'Something else', hint: 'General concern' }
]
</script>

<template>
  <UCard>
    <template #header>
      <h2 class="text-lg font-semibold">
        What is the main concern today?
      </h2>
      <p class="text-sm text-muted mt-1">
        Choose the closest match — this is for routing only, not a diagnosis.
      </p>
      <FlowDisclaimer
        compact
        class="mt-3"
      />
    </template>

    <div class="grid grid-cols-1 gap-2">
      <UButton
        v-for="c in categories"
        :key="c.key"
        block
        size="lg"
        class="justify-start text-left h-auto py-3"
        :variant="model === c.key ? 'solid' : 'outline'"
        @click="model = c.key"
      >
        <span class="flex flex-col items-start gap-0.5">
          <span class="font-medium">{{ c.label }}</span>
          <span class="text-xs font-normal opacity-80">{{ c.hint }}</span>
        </span>
      </UButton>
    </div>

    <template #footer>
      <UButton
        block
        trailing-icon="i-lucide-arrow-right"
        size="lg"
        :disabled="model == null"
        @click="emit('continue')"
      >
        Continue
      </UButton>
    </template>
  </UCard>
</template>
