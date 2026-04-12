<script setup lang="ts">
import type { VoiceSessionResult } from '~/composables/useVoiceCapture'

const consentGiven = defineModel<boolean>('consentGiven', { required: true })

const emit = defineEmits<{
  start: [transcript: string]
}>()

const {
  isSupported,
  isListening,
  transcript,
  errorMessage: voiceError,
  start: startVoice,
  stop: stopVoice,
  cancel: cancelVoice,
  setManualTranscript,
  reset: resetVoice
} = useVoiceCapture()

const textInput = ref('')
const showTextInput = ref(false)
/** Shown when user stops without usable speech (not the same as mic errors). */
const emptyCaptureHint = ref('')

function handleVoiceResult(result: VoiceSessionResult) {
  emptyCaptureHint.value = ''
  switch (result.kind) {
    case 'success':
      emit('start', result.text)
      break
    case 'empty':
      emptyCaptureHint.value = 'No speech captured. Try again or type instead.'
      break
    case 'cancelled':
      resetVoice()
      break
    case 'error':
      break
  }
}

/** Start voice with a single completion callback (no duplicate watch/onend navigation). */
function beginListening() {
  emptyCaptureHint.value = ''
  startVoice(handleVoiceResult)
}

/** Primary CTA — start voice, or finalize stop (not cancel). */
function handleCta() {
  if (!consentGiven.value) return

  if (isListening.value) {
    stopVoice()
    return
  }

  if (isSupported.value) {
    beginListening()
  } else {
    showTextInput.value = true
  }
}

/** Explicit cancel — discard speech and stay on entry. */
function handleCancelListening() {
  if (!isListening.value) return
  emptyCaptureHint.value = ''
  cancelVoice()
}

function handleTextSubmit() {
  const text = textInput.value.trim()
  if (!text) return
  setManualTranscript(text)
  emit('start', text)
}

function switchToText() {
  if (isListening.value) {
    cancelVoice()
  }
  showTextInput.value = true
}

function switchToVoice() {
  showTextInput.value = false
  resetVoice()
  emptyCaptureHint.value = ''
}

function goToEmergency() {
  navigateTo('/emergency')
}
</script>

<template>
  <div class="entry-screen">
    <!-- ─── Top bar ─── -->
    <div class="entry-top">
      <div class="entry-top-spacer" />
      <button
        type="button"
        class="emergency-pill"
        @click="goToEmergency"
      >
        Life Threatening
      </button>
    </div>

    <!-- ─── Main content (vertically centered) ─── -->
    <div class="entry-center">
      <!-- Brand pin icon — INLINE SVG so fill color works -->
      <svg class="entry-pin" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 130" aria-label="GoWhere">
        <path
          d="M50,0 C77.6,0 100,22.4 100,50 C100,77.6 75,102 56,118 Q50,124 44,118 C25,102 0,77.6 0,50 C0,22.4 22.4,0 50,0 Z"
          fill="#F97316"
        />
        <rect x="25" y="45" width="50" height="17.5" rx="4" ry="4" fill="#0F0A07" />
        <rect x="41.5" y="30" width="17.5" height="50" rx="4" ry="4" fill="#0F0A07" />
      </svg>

      <!-- Headline -->
      <h1 class="entry-title">
        GoWhere <span class="entry-title-accent">WA</span>
      </h1>
      <p class="entry-subtitle">
        Where to go when <br> you're unwell
      </p>

      <!-- Mic rings area -->
      <button
        class="mic-area"
        :class="{
          'mic-area--listening': isListening,
          'mic-area--disabled': !consentGiven
        }"
        :disabled="!consentGiven"
        :aria-label="isListening ? 'Stop recording' : 'Tap microphone to speak'"
        @click="handleCta"
      >
        <span class="mic-ring mic-ring--3" />
        <span class="mic-ring mic-ring--2" />
        <span class="mic-ring mic-ring--1" />
        <span class="mic-core">
          <!-- Mic icon — INLINE SVG so stroke color works -->
          <svg
            class="mic-icon"
            xmlns="http://www.w3.org/2000/svg"
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            stroke="#F97316"
            stroke-width="2"
            stroke-linecap="round"
            stroke-linejoin="round"
          >
            <path d="M12 19v3" />
            <path d="M19 10v2a7 7 0 0 1-14 0v-2" />
            <rect x="9" y="2" width="6" height="13" rx="3" fill="#F97316" />
          </svg>
        </span>
      </button>

      <!-- Voice error -->
      <p v-if="voiceError" class="entry-error" role="alert">
        {{ voiceError }}
      </p>
      <p v-if="emptyCaptureHint" class="entry-hint" role="status">
        {{ emptyCaptureHint }}
      </p>
    </div>

    <!-- ─── Bottom section ─── -->
    <div class="entry-bottom">
      <!-- Text input fallback -->
      <div v-if="showTextInput" class="text-fallback">
        <UTextarea v-model="textInput" placeholder="Describe what you're experiencing…" :rows="3" autoresize />
        <div class="text-fallback-actions">
          <UButton
            block
            size="lg"
            :disabled="!textInput.trim()"
            trailing-icon="i-lucide-arrow-right"
            @click="handleTextSubmit"
          >
            Analyze
          </UButton>
          <UButton v-if="isSupported" block variant="outline" @click="switchToVoice">
            Use voice instead
          </UButton>
        </div>
      </div>

      <!-- Listening: Stop (finalize) + Cancel (discard) -->
      <template v-else-if="isListening">
        <button
          class="cta-button"
          type="button"
          @click="handleCta"
        >
          Stop — finish and analyze
        </button>
        <button
          type="button"
          class="cancel-listen"
          @click="handleCancelListening"
        >
          Cancel
        </button>
      </template>

      <!-- Primary CTA button (idle) -->
      <button
        v-else
        class="cta-button"
        :class="{ 'cta-button--disabled': !consentGiven }"
        :disabled="!consentGiven"
        @click="handleCta"
      >
        Speak now or tap to start
      </button>

      <!-- Type-instead link -->
      <p v-if="!showTextInput && consentGiven && !isListening" class="type-hint">
        or
        <button class="type-link" type="button" @click="switchToText">
          type instead
        </button>
      </p>

      <!-- Consent / disclaimer -->
      <div class="entry-consent">
        <label class="consent-label">
          <input v-model="consentGiven" type="checkbox" class="consent-checkbox">
          <span class="consent-text">
            Not medical advice — does not diagnose conditions.
          </span>
        </label>
      </div>
    </div>
  </div>
</template>

<style scoped>
/* ═══════════════════════════════════════════════
   Entry Screen — mobile-first (390px target)
   Dark premium: orange pin → title → mic rings → CTA
   ═══════════════════════════════════════════════ */

.entry-screen {
  display: flex;
  flex-direction: column;
  min-height: calc(100dvh - 4rem);
  padding: 0.5rem 0;
  user-select: none;
}

/* ─── Top bar ─── */

.entry-top {
  display: flex;
  justify-content: flex-end;
  align-items: center;
  padding: 0 0 0.5rem;
  flex-shrink: 0;
}

.entry-top-spacer {
  flex: 1;
}

.emergency-pill {
  display: inline-flex;
  align-items: center;
  padding: 0.5rem 1rem;
  border-radius: 9999px;
  border: none;
  background: #F97316;
  color: #fff;
  font-size: 0.75rem;
  font-weight: 700;
  letter-spacing: 0.01em;
  cursor: pointer;
  transition: background 0.15s, transform 0.1s;
  white-space: nowrap;
}

.emergency-pill:hover {
  background: #FB923C;
}

.emergency-pill:active {
  transform: scale(0.97);
}

/* ─── Center content ─── */

.entry-center {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 0.5rem 0 0;
}

/* Pin icon — inline SVG, orange fill */
.entry-pin {
  width: 8rem;
  height: auto;
  margin-bottom: 1.25rem;
}

/* Title */
.entry-title {
  font-size: 3rem;
  font-weight: 800;
  letter-spacing: -0.03em;
  line-height: 1.1;
  margin: 0 0 0.5rem;
  text-align: center;
  color: #fff4ec;
}

.entry-title-accent {
  color: #f97316;
}

/* Subtitle */
.entry-subtitle {
  font-size: 1.25rem;
  color: #fff;
  opacity: 0.85;
  max-width: 18rem;
  font-weight: 600;
  text-align: center;
  line-height: 1.5;
  margin: 0 0 1.5rem;
  z-index: 2;
}

/* ─── Mic rings area ─── */

.mic-area {
  position: relative;
  width: 11rem;
  height: 11rem;
  border: none;
  background: transparent;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 0;
  -webkit-tap-highlight-color: transparent;
}

.mic-area--disabled {
  opacity: 0.3;
  cursor: not-allowed;
}

/* Concentric rings — visible dark grey */
.mic-ring {
  position: absolute;
  border-radius: 50%;
  pointer-events: none;
}

.mic-ring--3 {
  inset: -5rem;
  background: oklch(31.088% 0.00335 48.215 / 0.05);
}

.mic-ring--2 {
  inset: -2.8rem;
  background: oklch(31.088% 0.00335 48.215 / 0.1);
}

.mic-ring--1 {
  inset: -0.5rem;
  background: oklch(31.088% 0.00335 48.215 / 0.2);
}

/* Core circle with mic icon */
.mic-core {
  position: relative;
  width: 7.5rem;
  height: 7.5rem;
  border-radius: 50%;
  background: oklch(0% 0 0);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 2;
  transition:
    background 0.2s,
    transform 0.15s;
}

.mic-area:hover:not(:disabled) .mic-core {
  background: oklch(0.28 0.02 50);
  transform: scale(1.05);
}

.mic-area:active:not(:disabled) .mic-core {
  transform: scale(0.95);
}

.mic-icon {
  width: 6rem;
  height: 6rem;
}

/* ─── Listening state ─── */

.mic-area--listening .mic-ring--1 {
  animation: ring-pulse 1.8s ease-in-out infinite;
}

.mic-area--listening .mic-ring--2 {
  animation: ring-pulse 1.8s ease-in-out 0.2s infinite;
}

.mic-area--listening .mic-ring--3 {
  animation: ring-pulse 1.8s ease-in-out 0.4s infinite;
}

.mic-area--listening .mic-core {
  background: #f97316;
  border-color: #f97316;
}

.mic-area--listening .mic-icon {
  stroke: #fff;
}

@keyframes ring-pulse {
  0%,
  100% {
    border-color: oklch(0.35 0.01 50 / 0.55);
    transform: scale(1);
  }

  50% {
    border-color: oklch(0.55 0.15 50 / 0.7);
    transform: scale(1.05);
  }
}

/* ─── Error / hints ─── */

.entry-error {
  margin-top: 0.75rem;
  font-size: 0.8rem;
  color: #fb923c;
  text-align: center;
  max-width: 18rem;
}

.entry-hint {
  margin-top: 0.75rem;
  font-size: 0.85rem;
  color: #fff;
  opacity: 0.75;
  text-align: center;
  max-width: 20rem;
  line-height: 1.35;
}

/* ─── Bottom section ─── */

.entry-bottom {
  flex-shrink: 0;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.75rem;
  padding: 0 0 0.5rem;
}

/* Primary CTA */
.cta-button {
  width: 100%;
  padding: 1.1rem 1.5rem;
  border-radius: 0.75rem;
  border: none;
  background: #f97316;
  color: #fff;
  font-size: 1.1rem;
  font-weight: 700;
  cursor: pointer;
  transition:
    background 0.15s,
    transform 0.1s;
  -webkit-tap-highlight-color: transparent;
  z-index: 2;
}

.cta-button:hover:not(:disabled) {
  background: #fb923c;
}

.cta-button:active:not(:disabled) {
  transform: scale(0.98);
}

.cta-button--disabled {
  opacity: 0.35;
  cursor: not-allowed;
}

.cancel-listen {
  width: 100%;
  padding: 0.65rem;
  border: none;
  background: transparent;
  color: #fff;
  opacity: 0.55;
  font-size: 0.95rem;
  font-weight: 600;
  text-decoration: underline;
  cursor: pointer;
  -webkit-tap-highlight-color: transparent;
}

.cancel-listen:hover {
  opacity: 0.85;
}

/* Type hint */
.type-hint {
  font-size: 0.8rem;
  opacity: 0.4;
  margin: 0;
}

.type-link {
  background: none;
  border: none;
  color: #fb923c;
  text-decoration: underline;
  cursor: pointer;
  font-size: inherit;
  padding: 0;
}

/* Text fallback */
.text-fallback {
  width: 100%;
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.text-fallback-actions {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

/* Consent */
.entry-consent {
  padding-top: 0.25rem;
}

.consent-label {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  cursor: pointer;
}

.consent-checkbox {
  width: 1rem;
  height: 1rem;
  accent-color: #f97316;
  cursor: pointer;
  flex-shrink: 0;
}

.consent-text {
  font-size: 0.7rem;
  opacity: 0.4;
  line-height: 1.3;
}
</style>
