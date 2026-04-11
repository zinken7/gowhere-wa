<script setup lang="ts">
import type { IntakeQuestion } from '~~/shared/intake-types'

const props = defineProps<{
  questions: IntakeQuestion[]
  transcript: string
}>()

const emit = defineEmits<{
  answer: [text: string]
  back: []
}>()

const answers = ref<Record<string, string>>({})
const freeText = ref('')

function selectOption(questionId: string, option: string) {
  answers.value[questionId] = option
}

function submit() {
  // Combine answers into a text to re-analyze
  const parts: string[] = []

  for (const q of props.questions) {
    const answer = answers.value[q.id]
    if (answer) {
      parts.push(answer)
    }
  }

  if (freeText.value.trim()) {
    parts.push(freeText.value.trim())
  }

  // Append to original transcript for richer context
  const combined = `${props.transcript}. ${parts.join('. ')}`
  emit('answer', combined)
}

const allAnswered = computed(() => {
  return props.questions.every(q => answers.value[q.id])
})
</script>

<template>
  <UCard>
    <template #header>
      <h2 class="text-lg font-semibold">
        A couple more details
      </h2>
      <p class="text-sm text-muted mt-1">
        We need a bit more information to suggest the right care setting.
      </p>
    </template>

    <div class="space-y-5">
      <div
        v-for="q in questions"
        :key="q.id"
      >
        <p class="text-sm font-medium mb-2">
          {{ q.text }}
        </p>

        <!-- Option buttons -->
        <div
          v-if="q.options"
          class="grid grid-cols-1 gap-2"
        >
          <UButton
            v-for="opt in q.options"
            :key="opt"
            block
            class="justify-start text-left"
            :variant="answers[q.id] === opt ? 'solid' : 'outline'"
            size="md"
            @click="selectOption(q.id, opt)"
          >
            {{ opt }}
          </UButton>
        </div>

        <!-- Free text if no options -->
        <UTextarea
          v-else
          v-model="freeText"
          placeholder="Describe…"
          :rows="2"
          autoresize
        />
      </div>
    </div>

    <template #footer>
      <div class="flex gap-3">
        <UButton
          variant="outline"
          @click="emit('back')"
        >
          Back
        </UButton>
        <UButton
          class="flex-1"
          trailing-icon="i-lucide-arrow-right"
          size="lg"
          :disabled="!allAnswered"
          @click="submit"
        >
          Continue
        </UButton>
      </div>
    </template>
  </UCard>
</template>
