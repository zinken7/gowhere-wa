<script setup lang="ts">
import type { ProviderLoadStatus } from '~/composables/useProviders'
import type { ProviderItem } from '~/types/api'

defineProps<{
  items: ProviderItem[]
  status: ProviderLoadStatus
  errorMessage?: string
}>()

const emit = defineEmits<{ retry: [] }>()
</script>

<template>
  <UCard :ui="{ body: 'space-y-4' }">
    <template #header>
      <h3 class="text-lg font-semibold text-highlighted">
        Nearby options
      </h3>
      <p class="mt-1 text-xs text-muted">
        Confirm details before you go.
      </p>
    </template>

    <div
      v-if="status === 'loading'"
      class="space-y-3"
      aria-busy="true"
    >
      <USkeleton class="h-20 w-full rounded-lg" />
      <USkeleton class="h-20 w-full rounded-lg" />
      <USkeleton class="h-20 w-full rounded-lg" />
    </div>

    <UAlert
      v-else-if="status === 'error'"
      color="error"
      variant="subtle"
      title="Could not load places"
      :description="errorMessage || 'Please try again.'"
    >
      <template #actions>
        <UButton
          variant="outline"
          size="sm"
          @click="emit('retry')"
        >
          Retry
        </UButton>
      </template>
    </UAlert>

    <div
      v-else-if="status === 'need_suburb'"
      class="rounded-lg border border-dashed border-default bg-elevated/30 px-4 py-6 text-center text-sm text-muted"
      role="status"
    >
      Use the suburb dialog to load nearby options for this care setting.
    </div>

    <div
      v-else-if="status === 'success' && items.length === 0"
      class="rounded-lg border border-dashed border-default p-6 text-center text-sm text-muted"
      role="status"
    >
      No venues matched this route. Try another suburb or check back later.
    </div>

    <ul
      v-else-if="status === 'success' && items.length > 0"
      class="space-y-3"
      role="list"
    >
      <li
        v-for="p in items"
        :key="p.id"
        class="rounded-xl border border-default bg-elevated/50 p-4"
      >
        <div class="flex flex-col gap-1">
          <p class="font-semibold text-highlighted">
            {{ p.name }}
          </p>
          <p class="text-sm text-muted">
            {{ p.address }}
          </p>
          <p
            v-if="p.distanceKm != null"
            class="text-xs text-muted"
          >
            ~{{ p.distanceKm }} km away
          </p>
        </div>
        <div class="mt-3 flex flex-wrap gap-2">
          <UButton
            v-if="p.phone"
            size="sm"
            color="primary"
            icon="i-lucide-phone"
            :to="p.phone === '000' ? 'tel:000' : `tel:${p.phone.replace(/\s/g, '')}`"
            external
          >
            Call now
          </UButton>
          <UButton
            size="sm"
            variant="outline"
            icon="i-lucide-navigation"
            :to="`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(p.address)}`"
            target="_blank"
            external
          >
            Get directions
          </UButton>
        </div>
      </li>
    </ul>
  </UCard>
</template>
