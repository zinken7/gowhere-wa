<script setup lang="ts">
const model = defineModel<'self' | 'dependent' | null>({ required: true })

const emit = defineEmits<{ continue: [] }>()
</script>

<template>
  <UCard>
    <template #header>
      <h2 class="text-lg font-semibold">
        Who is this for?
      </h2>
      <p class="text-sm text-muted mt-1">
        This helps us tailor general guidance — not a diagnosis.
      </p>
      <FlowDisclaimer
        compact
        class="mt-3"
      />
    </template>

    <div class="grid grid-cols-1 gap-3 sm:grid-cols-2">
      <UButton
        size="xl"
        block
        :variant="model === 'self' ? 'solid' : 'outline'"
        @click="model = 'self'"
      >
        Me
      </UButton>
      <UButton
        size="xl"
        block
        :variant="model === 'dependent' ? 'solid' : 'outline'"
        @click="model = 'dependent'"
      >
        Someone I care for
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
