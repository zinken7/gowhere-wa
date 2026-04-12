/**
 * Browser SpeechRecognition wrapper with text-input fallback.
 *
 * Stop vs cancel:
 * - `stop()` ends recognition and resolves when the session completes (may yield text or empty).
 * - `cancel()` aborts, discards audio, completes with `cancelled` (no forward navigation).
 *
 * Do not rely on `onend` alone in the UI — completion is delivered once via `start(onComplete)`.
 */

export type VoiceSessionResult
  = | { kind: 'success', text: string }
    | { kind: 'empty' }
    | { kind: 'cancelled' }
    | { kind: 'error', message: string }

/** Time to wait after recognition ends so late `onresult` events can flush (Safari / WebKit). */
const POST_END_FLUSH_MS = 380

export function useVoiceCapture() {
  const isSupported = ref(false)
  const isListening = ref(false)
  const transcript = ref('')
  const errorMessage = ref('')

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let recognition: any = null

  let sessionActive = false
  let userCancelled = false
  let completionScheduled = false
  let flushTimer: ReturnType<typeof setTimeout> | null = null
  let onComplete: ((r: VoiceSessionResult) => void) | null = null

  function clearFlushTimer() {
    if (flushTimer != null) {
      clearTimeout(flushTimer)
      flushTimer = null
    }
  }

  function deliverOnce(result: VoiceSessionResult) {
    if (!sessionActive) {
      return
    }
    sessionActive = false
    completionScheduled = false
    clearFlushTimer()
    isListening.value = false
    const cb = onComplete
    onComplete = null
    cb?.(result)
  }

  function scheduleSessionEnd() {
    if (!sessionActive || completionScheduled) {
      return
    }
    completionScheduled = true
    clearFlushTimer()
    flushTimer = setTimeout(() => {
      flushTimer = null
      if (!sessionActive) {
        return
      }
      if (userCancelled) {
        transcript.value = ''
        errorMessage.value = ''
        deliverOnce({ kind: 'cancelled' })
        return
      }
      const text = transcript.value.trim()
      if (text.length > 0) {
        deliverOnce({ kind: 'success', text })
      } else {
        deliverOnce({ kind: 'empty' })
      }
    }, POST_END_FLUSH_MS)
  }

  onMounted(() => {
    const win = window as unknown as Record<string, unknown>
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const SpeechRecognitionCtor = (win.SpeechRecognition ?? win.webkitSpeechRecognition) as (new () => any) | undefined
    if (SpeechRecognitionCtor) {
      isSupported.value = true
      recognition = new SpeechRecognitionCtor()
      recognition.lang = 'en-AU'
      recognition.interimResults = false
      recognition.continuous = false
      recognition.maxAlternatives = 1

      recognition.onresult = (event: { results: { [index: number]: { transcript: string } }[] }) => {
        const result = event.results[event.results.length - 1]
        if (result?.[0]) {
          transcript.value = result[0].transcript
        }
      }

      recognition.onerror = (event: { error: string }) => {
        if (event.error === 'aborted') {
          return
        }
        if (event.error === 'no-speech') {
          errorMessage.value = ''
          return
        }
        if (event.error === 'not-allowed') {
          errorMessage.value = 'Microphone access was denied. You can type instead.'
          isSupported.value = false
          if (sessionActive) {
            deliverOnce({ kind: 'error', message: errorMessage.value })
          }
          return
        }
        errorMessage.value = `Voice capture error: ${event.error}`
        if (sessionActive) {
          deliverOnce({ kind: 'error', message: errorMessage.value })
        }
      }

      recognition.onend = () => {
        if (!sessionActive) {
          return
        }
        isListening.value = false
        scheduleSessionEnd()
      }
    }
  })

  function start(onDone: (r: VoiceSessionResult) => void) {
    if (!recognition) {
      onDone({ kind: 'error', message: 'Voice recognition is not available.' })
      return
    }
    clearFlushTimer()
    userCancelled = false
    completionScheduled = false
    errorMessage.value = ''
    transcript.value = ''
    sessionActive = true
    onComplete = onDone
    isListening.value = true
    try {
      recognition.start()
    } catch {
      sessionActive = false
      onComplete = null
      isListening.value = false
      onDone({ kind: 'error', message: 'Could not start voice capture.' })
    }
  }

  /** Finalize recognition — wait for final events; completion via `start` callback. */
  function stop() {
    if (!recognition || !sessionActive) {
      return
    }
    try {
      recognition.stop()
    } catch {
      // Already stopped
      if (sessionActive) {
        isListening.value = false
        scheduleSessionEnd()
      }
    }
  }

  /** Discard session — no transcript submission. */
  function cancel() {
    if (!recognition || !sessionActive) {
      return
    }
    userCancelled = true
    clearFlushTimer()
    completionScheduled = false
    try {
      recognition.abort()
    } catch {
      if (sessionActive) {
        isListening.value = false
        transcript.value = ''
        errorMessage.value = ''
        deliverOnce({ kind: 'cancelled' })
      }
    }
  }

  function setManualTranscript(text: string) {
    transcript.value = text
  }

  function reset() {
    clearFlushTimer()
    userCancelled = true
    if (recognition && sessionActive) {
      try {
        recognition.abort()
      } catch {
        /* ignore */
      }
    }
    sessionActive = false
    completionScheduled = false
    onComplete = null
    transcript.value = ''
    errorMessage.value = ''
    isListening.value = false
    userCancelled = false
  }

  onUnmounted(() => {
    if (recognition && isListening.value) {
      recognition.abort()
    }
    clearFlushTimer()
  })

  return {
    isSupported,
    isListening,
    transcript,
    errorMessage,
    start,
    stop,
    cancel,
    setManualTranscript,
    reset
  }
}
