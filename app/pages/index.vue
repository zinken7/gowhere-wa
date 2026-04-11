<script setup lang="ts">
import type { FlowStep } from '~/types/flow'

const STEP_BADGE: Partial<Record<FlowStep, string>> = {
  persona: 'Persona',
  category: 'Category',
  redFlags: 'Warning signs',
  severity: 'Severity',
  recommendation: 'Result'
}

function stepBadgeLabel(step: FlowStep): string {
  return STEP_BADGE[step] ?? 'Result'
}

const {
  step,
  consentGiven,
  entryEmergency,
  persona,
  categoryKey,
  redFlagIds,
  severity,
  afterHours,
  hasRedFlags,
  toTriageSignals,
  goEmergency,
  back
} = useFlowState()

const {
  result: recResult,
  status: recStatus,
  errorMessage: recError,
  fetchRecommendation,
  setEmergencyEntryResult,
  reset: recReset
} = useRecommendation()

const {
  items: provItems,
  status: provStatus,
  errorMessage: provError,
  prepareForLoad,
  loadForRoute,
  reset: provReset
} = useProviders()

useHead({
  title: 'CarePath WA — Care routing',
  meta: [
    {
      name: 'description',
      content:
        'Choose a sensible care setting in Western Australia — routing only, not a diagnosis.'
    }
  ]
})

watch(step, async (s) => {
  if (s !== 'recommendation') {
    return
  }
  await loadRecommendationPanel()
})

watch(step, (s, prev) => {
  if (prev === 'recommendation' && s !== 'recommendation') {
    recReset()
    provReset()
  }
})

async function loadRecommendationPanel() {
  prepareForLoad()
  if (entryEmergency.value) {
    setEmergencyEntryResult()
    const r = recResult.value
    if (r) {
      await loadForRoute(r.route)
    }
    return
  }
  await fetchRecommendation(toTriageSignals(), consentGiven.value)
  const r = recResult.value
  if (r) {
    await loadForRoute(r.route)
  }
}

function onStart() {
  step.value = 'persona'
}

function goCategory() {
  step.value = 'category'
}

function goRedFlags() {
  step.value = 'redFlags'
}

function onEmergency() {
  prepareForLoad()
  setEmergencyEntryResult()
  goEmergency()
}

function fromRedFlagsContinue() {
  step.value = hasRedFlags.value ? 'recommendation' : 'severity'
}

function fromSeverityContinue() {
  step.value = 'recommendation'
}

async function retryRecommendation() {
  await loadRecommendationPanel()
}

async function retryProviders() {
  const r = recResult.value
  if (r) {
    await loadForRoute(r.route)
  }
}

const showRecommendationLoading = computed(
  () =>
    step.value === 'recommendation'
    && (recStatus.value === 'loading' || recStatus.value === 'idle')
)
</script>

<template>
  <UContainer class="max-w-lg mx-auto px-4 py-6 pb-24">
    <div class="mb-4 flex items-center gap-2">
      <UButton
        v-if="step !== 'entry'"
        variant="ghost"
        color="neutral"
        icon="i-lucide-arrow-left"
        @click="back()"
      >
        Back
      </UButton>
      <UBadge
        v-if="step !== 'entry'"
        color="neutral"
        variant="subtle"
      >
        Step:
        {{ stepBadgeLabel(step) }}
      </UBadge>
    </div>

    <EntryActions
      v-if="step === 'entry'"
      v-model:consent-given="consentGiven"
      @start="onStart"
      @emergency="onEmergency"
    />

    <PersonaSelector
      v-else-if="step === 'persona'"
      v-model="persona"
      @continue="goCategory"
    />

    <CategoryGrid
      v-else-if="step === 'category'"
      v-model="categoryKey"
      @continue="goRedFlags"
    />

    <RedFlagChecklist
      v-else-if="step === 'redFlags'"
      v-model="redFlagIds"
      @continue="fromRedFlagsContinue"
    />

    <SeverityQuestions
      v-else-if="step === 'severity'"
      v-model:severity="severity"
      v-model:after-hours="afterHours"
      @continue="fromSeverityContinue"
    />

    <div
      v-else-if="step === 'recommendation'"
      class="space-y-4"
    >
      <div
        v-if="showRecommendationLoading"
        class="space-y-3"
        aria-busy="true"
        aria-label="Loading recommendation"
      >
        <USkeleton class="h-40 w-full rounded-lg" />
        <USkeleton class="h-32 w-full rounded-lg" />
      </div>

      <UAlert
        v-else-if="recStatus === 'error'"
        color="error"
        variant="subtle"
        title="Could not complete routing"
        :description="recError"
      >
        <template #actions>
          <UButton
            size="sm"
            variant="outline"
            @click="retryRecommendation"
          >
            Retry
          </UButton>
        </template>
      </UAlert>

      <template v-else-if="recStatus === 'success' && recResult">
        <div class="mb-2">
          <FlowDisclaimer compact />
        </div>
        <RecommendationCard :result="recResult" />
        <SafetyNetBox
          :show-ed-cta="recResult.route === 'ed'"
          :routing-hint="recResult.shortReason"
        />
        <ServiceList
          :items="provItems"
          :status="provStatus"
          :error-message="provError"
          @retry="retryProviders"
        />
      </template>
    </div>

    <UAlert
      v-else
      color="warning"
      variant="subtle"
      title="This step could not be shown"
      description="Try refreshing the page. If the problem continues, open the browser console and report missing component errors."
    />
  </UContainer>
</template>
