<script setup lang="ts">
import type { ProviderItem } from '~/types/api'

defineProps<{
  items: ProviderItem[]
  status: 'idle' | 'loading' | 'error' | 'success'
  errorMessage?: string
}>()

const emit = defineEmits<{ retry: [] }>()
</script>

<template>
  <UCard>
    <template #header>
      <h3 class="text-base font-semibold">
        Example places (demo data)
      </h3>
      <p class="text-sm text-muted mt-1">
        Not a complete directory — verify details before you travel.
      </p>
    </template>

    <div
      v-if="status === 'loading'"
      class="space-y-3"
      aria-busy="true"
    >
      <USkeleton class="h-16 w-full" />
      <USkeleton class="h-16 w-full" />
      <USkeleton class="h-16 w-full" />
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
      v-else-if="status === 'success' && items.length === 0"
      class="rounded-lg border border-dashed border-default p-6 text-center text-sm text-muted"
      role="status"
    >
      No demo venues matched this filter. Try another route or check back later.
    </div>

    <ul
      v-else
      class="space-y-3"
    >
      <li
        v-for="p in items"
        :key="p.id"
        class="rounded-lg border border-default p-3"
      >
        <p class="font-medium">
          {{ p.name }}
        </p>
        <p class="text-sm text-muted mt-1">
          {{ p.address }}
        </p>
        <div class="mt-3 flex flex-wrap gap-2">
          <UButton
            v-if="p.phone"
            size="sm"
            variant="outline"
            icon="i-lucide-phone"
            :to="p.phone === '000' ? 'tel:000' : `tel:${p.phone.replace(/\s/g, '')}`"
            external
          >
            Call
          </UButton>
          <UButton
            size="sm"
            variant="ghost"
            icon="i-lucide-map"
            :to="`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(p.address)}`"
            target="_blank"
            external
          >
            Open in Maps
          </UButton>
        </div>
      </li>
    </ul>
  </UCard>
</template>
