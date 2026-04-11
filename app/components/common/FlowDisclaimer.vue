<script setup lang="ts">
defineProps<{
  compact?: boolean
}>()
</script>

<template>
  <UAlert
    color="warning"
    variant="subtle"
    icon="i-lucide-info"
    :title="compact ? undefined : 'Important'"
    :description="compact
      ? 'This tool does not diagnose. It only suggests where to seek care.'
      : 'This app is not a substitute for professional medical advice. It does not diagnose conditions — it only helps you choose a sensible care setting.'"
  />
</template>
