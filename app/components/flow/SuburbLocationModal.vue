<script setup lang="ts">
/**
 * Shown when browser geolocation is unavailable — user enters suburb for /api/providers/nearby.
 */
const open = defineModel<boolean>('open', { required: true })

const suburb = defineModel<string>('suburb', { default: '' })

const emit = defineEmits<{
  confirm: []
  cancel: []
  retryLocation: []
}>()

function onConfirm() {
  emit('confirm')
}

function onCancel() {
  emit('cancel')
}

function onRetryLocation() {
  emit('retryLocation')
}
</script>

<template>
  <UModal
    v-model:open="open"
    title="Enter your suburb"
    description="We use this to list nearby places for your care setting. We don’t store your location."
    :ui="{ footer: 'flex flex-col gap-3 sm:flex-row sm:justify-between sm:items-center' }"
  >
    <UButton
      class="sr-only pointer-events-none absolute opacity-0"
      tabindex="-1"
      aria-hidden="true"
    >
      .
    </UButton>

    <template #body>
      <div class="space-y-3">
        <UInput
          v-model="suburb"
          placeholder="e.g. Fremantle, Joondalup WA"
          size="lg"
          icon="i-lucide-map-pin"
          @keydown.enter.prevent="onConfirm"
        />
        <p class="text-xs text-muted">
          Tip: include WA or a suburb name. You can change this later by retrying location.
        </p>
        <UButton
          variant="link"
          color="neutral"
          size="sm"
          class="-mt-1 justify-start px-0"
          icon="i-lucide-crosshair"
          @click="onRetryLocation"
        >
          Try using my location again
        </UButton>
      </div>
    </template>

    <template #footer>
      <div class="flex w-full gap-2 sm:w-auto sm:justify-end">
        <UButton
          color="neutral"
          variant="outline"
          class="flex-1 sm:flex-none justify-center"
          @click="onCancel"
        >
          Cancel
        </UButton>
        <UButton
          class="flex-1 sm:flex-none"
          @click="onConfirm"
        >
          Show nearby places
        </UButton>
      </div>
    </template>
  </UModal>
</template>
