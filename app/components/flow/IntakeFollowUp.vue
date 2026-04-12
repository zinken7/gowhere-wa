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

/** Per-question answers (options or free text), keyed by stable question id. */
const answers = ref<Record<string, string>>({})

function qKey(q: IntakeQuestion, index: number): string {
  const id = q.id?.trim()
  return id && id.length > 0 ? id : `follow-up-${index}`
}

function setAnswer(key: string, value: string) {
  answers.value[key] = value
}

function selectOption(questionId: string, option: string) {
  answers.value[questionId] = option
}

function submit() {
  const parts: string[] = []

  for (let i = 0; i < props.questions.length; i++) {
    const q = props.questions[i]!
    const key = qKey(q, i)
    const answer = answers.value[key]?.trim()
    if (answer) {
      parts.push(answer)
    }
  }

  const combined = `${props.transcript}. ${parts.join('. ')}`
  emit('answer', combined)
}

const allAnswered = computed(() => {
  return props.questions.every((q, i) => {
    const key = qKey(q, i)
    return Boolean(answers.value[key]?.trim())
  })
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
        v-for="(q, idx) in questions"
        :key="qKey(q, idx)"
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
            :variant="answers[qKey(q, idx)] === opt ? 'solid' : 'outline'"
            size="md"
            @click="selectOption(qKey(q, idx), opt)"
          >
            {{ opt }}
          </UButton>
        </div>

        <!-- Free text if no options — one value per question (not a shared ref) -->
        <UTextarea
          v-else
          :model-value="answers[qKey(q, idx)] ?? ''"
          placeholder="Describe…"
          :rows="2"
          autoresize
          @update:model-value="(v: string) => setAnswer(qKey(q, idx), v)"
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
