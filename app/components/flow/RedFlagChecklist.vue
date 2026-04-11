<script setup lang="ts">
const model = defineModel<string[]>({ required: true })

const emit = defineEmits<{ continue: [] }>()

const items = [
  {
    id: 'breathing',
    label: 'Severe trouble breathing, choking, or lips turning blue'
  },
  {
    id: 'chest',
    label: 'Sudden severe chest pain, pressure, or spreading pain'
  },
  {
    id: 'bleed',
    label: 'Heavy bleeding that will not stop, or signs of shock'
  },
  {
    id: 'stroke',
    label: 'Face droop, slurred speech, sudden weakness, or collapse'
  },
  {
    id: 'allergy',
    label: 'Severe allergic reaction (tongue/throat swelling, difficulty breathing)'
  }
] as const

function setChecked(id: string, checked: boolean) {
  if (checked && !model.value.includes(id)) {
    model.value = [...model.value, id]
  }
  if (!checked) {
    model.value = model.value.filter(x => x !== id)
  }
}
</script>

<template>
  <UCard>
    <template #header>
      <h2 class="text-lg font-semibold">
        Warning signs
      </h2>
      <p class="text-sm text-muted mt-1">
        Tick anything that applies. These signs usually mean emergency care is appropriate — not a diagnosis.
      </p>
      <FlowDisclaimer
        compact
        class="mt-3"
      />
    </template>

    <div class="space-y-3">
      <UCheckbox
        v-for="it in items"
        :key="it.id"
        :model-value="model.includes(it.id)"
        :label="it.label"
        @update:model-value="(v) => setChecked(it.id, Boolean(v))"
      />
    </div>

    <template #footer>
      <UButton
        block
        trailing-icon="i-lucide-arrow-right"
        size="lg"
        @click="emit('continue')"
      >
        Continue
      </UButton>
    </template>
  </UCard>
</template>
