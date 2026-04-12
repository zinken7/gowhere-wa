<script setup lang="ts">
const {
  step,
  consentGiven,
  transcript,
  sessionRootTranscript,
  followUpRenderKey,
  summary,
  signals,
  questions,
  analyzeError,
  entryEmergency,
  analyzeTranscript,
  confirmAndProceed,
  back
} = useIntakeFlow()

// Expose step to app.vue for chrome visibility
provide('flowStep', step)

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
  suburbModalOpen: provSuburbModalOpen,
  suburbDraft: provSuburbDraft,
  prepareForLoad,
  loadForRoute,
  confirmSuburb,
  cancelSuburbModal,
  retryLocationFromModal,
  reset: provReset
} = useProviders()

useHead({
  title: 'GoWhere WA — Care routing',
  meta: [
    {
      name: 'description',
      content:
        'Describe your concern by voice — we\'ll suggest where to seek care in Western Australia.'
    }
  ]
})

// When step reaches recommendation, load the result
watch(step, async (s) => {
  if (s !== 'recommendation') return
  await loadRecommendationPanel()
})

// Reset recommendation state when leaving recommendation
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

  // Use the structured signals from intake confirmation
  if (signals.value) {
    await fetchRecommendation(signals.value, consentGiven.value)
    const r = recResult.value
    if (r) {
      await loadForRoute(r.route)
    }
  }
}

function onVoiceStart(text: string) {
  analyzeTranscript(text)
}

function onConfirm() {
  confirmAndProceed()
}

function onFollowUpAnswer(text: string) {
  analyzeTranscript(text, { fromFollowUp: true })
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

const STEP_LABELS: Partial<Record<string, string>> = {
  confirm: 'Confirm',
  follow_up: 'Follow-up',
  recommendation: 'Result'
}
</script>

<template>
  <UContainer
    :class="[
      'max-w-lg mx-auto',
      step === 'entry' ? 'px-5 py-2' : 'px-4 py-6 pb-24'
    ]"
  >
    <!-- Back + step badge (hidden on entry) -->
    <div
      v-if="step !== 'entry' && step !== 'listening' && step !== 'analyzing'"
      class="mb-4 flex items-center gap-2"
    >
      <UButton
        variant="ghost"
        color="neutral"
        icon="i-lucide-arrow-left"
        @click="back()"
      >
        Back
      </UButton>
      <UBadge
        v-if="STEP_LABELS[step]"
        color="neutral"
        variant="subtle"
      >
        {{ STEP_LABELS[step] }}
      </UBadge>
    </div>

    <!-- 1. Entry — voice-first hero -->
    <EntryActions
      v-if="step === 'entry'"
      v-model:consent-given="consentGiven"
      @start="onVoiceStart"
    />

    <!-- 2. Analyzing — loading state -->
    <div
      v-else-if="step === 'analyzing'"
      class="flex flex-col items-center justify-center gap-4 py-16"
    >
      <USkeleton class="h-6 w-48 rounded-lg" />
      <p class="text-sm text-muted">
        Analyzing your concern…
      </p>
      <USkeleton class="h-32 w-full max-w-sm rounded-lg" />
    </div>

    <!-- 3. Confirm — user verifies parsed summary -->
    <IntakeConfirm
      v-else-if="step === 'confirm' && signals"
      :summary="summary"
      :signals="signals"
      :transcript="transcript"
      @confirm="onConfirm"
      @back="back()"
    />

    <!-- 4. Follow-up — need more info -->
    <div
      v-else-if="step === 'follow_up'"
      class="space-y-4"
    >
      <UAlert
        v-if="analyzeError"
        color="warning"
        variant="subtle"
        :title="analyzeError"
      />
      <IntakeFollowUp
        :key="`fu-${followUpRenderKey}`"
        :questions="questions"
        :original-transcript="sessionRootTranscript"
        @answer="onFollowUpAnswer"
        @back="back()"
      />
    </div>

    <!-- 5. Recommendation -->
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
        <!-- <div class="mb-2">
          <FlowDisclaimer compact />
        </div> -->
        <RecommendationCard :result="recResult" />
        <SafetyNetBox
          :show-ed-cta="recResult.route === 'ed'"
        />
        <ClientOnly>
          <SuburbLocationModal
            v-model:open="provSuburbModalOpen"
            v-model:suburb="provSuburbDraft"
            @confirm="confirmSuburb"
            @cancel="cancelSuburbModal"
            @retry-location="retryLocationFromModal"
          />
        </ClientOnly>
        <ServiceList
          :items="provItems"
          :status="provStatus"
          :error-message="provError"
          @retry="retryProviders"
        />
      </template>
    </div>

    <!-- Fallback -->
    <UAlert
      v-else
      color="warning"
      variant="subtle"
      title="This step could not be shown"
      description="Try refreshing the page."
    />
  </UContainer>
</template>
