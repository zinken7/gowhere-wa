<script setup lang="ts">
import { reactive } from 'vue'
import type { IntakeQuestion } from '~~/shared/intake-types'
import { INTAKE_TERMINAL_QUESTION_ID } from '~~/shared/constants'

const props = defineProps<{
  questions: IntakeQuestion[]
  /** First transcript this session; combined with answers for re-analysis. */
  originalTranscript: string
}>()

const emit = defineEmits<{
  answer: [text: string]
  back: []
}>()

const answers = reactive<Record<string, string>>({})

function qKey(q: IntakeQuestion, index: number): string {
  const id = q.id?.trim()
  return id && id.length > 0 ? id : `follow-up-${index}`
}

function setAnswer(key: string, value: string) {
  answers[key] = value
}

function selectOption(questionId: string, option: string) {
  answers[questionId] = option
}

function submit() {
  if (isTerminal.value) {
    return
  }
  const lines: string[] = []
  const root = props.originalTranscript.trim()
  if (root.length > 0) {
    lines.push(`Original concern:\n${root}`)
  }

  const detailLines: string[] = []
  for (let i = 0; i < props.questions.length; i++) {
    const q = props.questions[i]!
    const key = qKey(q, i)
    const answer = answers[key]?.trim()
    if (answer) {
      detailLines.push(`${q.text}: ${answer}`)
    }
  }
  if (detailLines.length > 0) {
    lines.push(`Follow-up details:\n${detailLines.join('\n')}`)
  }

  const combined = lines.join('\n\n')
  emit('answer', combined)
}

const isTerminal = computed(
  () =>
    props.questions.length === 1
    && props.questions[0]?.id === INTAKE_TERMINAL_QUESTION_ID
)

const allAnswered = computed(() => {
  if (isTerminal.value) {
    return false
  }
  return props.questions.every((q, i) => {
    const key = qKey(q, i)
    return Boolean(answers[key]?.trim())
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

    <UAlert
      v-if="isTerminal"
      color="info"
      variant="subtle"
      title="We need a different next step"
      :description="questions[0]?.text"
      class="mb-4"
    />

    <div
      v-else
      class="space-y-5"
    >
      <div
        v-for="(q, idx) in questions"
        :key="qKey(q, idx)"
      >
        <p class="text-sm font-medium mb-2">
          {{ q.text }}
        </p>

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
          v-if="!isTerminal"
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
