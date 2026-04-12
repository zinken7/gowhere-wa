/**
 * Browser SpeechRecognition wrapper with text-input fallback.
 *
 * With `interimResults: true`, brief speech + immediate Stop can still succeed:
 * engines often finalize only after silence; interim text is used as fallback.
 *
 * Stop vs cancel:
 * - `stop()` → `recognition.stop()`, then after `onend` + grace, submit `final || interim` or empty.
 * - `cancel()` → `abort()`, discard, `cancelled` (no submission).
 *
 * Completion is delivered once via `start(onComplete)` — not from raw `onend` alone.
 */

export type VoiceSessionResult
  = | { kind: 'success', text: string }
    | { kind: 'empty' }
    | { kind: 'cancelled' }
    | { kind: 'error', message: string }

/** After `onend`, wait for late `onresult` (ordering differs by engine). */
const POST_END_GRACE_MS = 250

export function useVoiceCapture() {
  const isSupported = ref(false)
  const isListening = ref(false)
  /** Live line: finals + current interim (for display). */
  const transcript = ref('')
  /** Accumulated final segments only. */
  const finalTranscript = ref('')
  /** Latest non-final hypothesis (cleared when finals advance). */
  const interimTranscript = ref('')
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

  function syncCombinedTranscript() {
    transcript.value = (finalTranscript.value + interimTranscript.value).trim()
  }

  /** Prefer finalized text; else last interim (manual Stop before finalization). */
  function pickBestTranscript(): string {
    const fin = finalTranscript.value.trim()
    if (fin.length > 0) {
      return fin
    }
    return interimTranscript.value.trim()
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
        finalTranscript.value = ''
        interimTranscript.value = ''
        transcript.value = ''
        errorMessage.value = ''
        deliverOnce({ kind: 'cancelled' })
        return
      }
      const text = pickBestTranscript()
      if (text.length > 0) {
        deliverOnce({ kind: 'success', text })
      } else {
        deliverOnce({ kind: 'empty' })
      }
    }, POST_END_GRACE_MS)
  }

  onMounted(() => {
    const win = window as unknown as Record<string, unknown>
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const SpeechRecognitionCtor = (win.SpeechRecognition ?? win.webkitSpeechRecognition) as (new () => any) | undefined
    if (SpeechRecognitionCtor) {
      isSupported.value = true
      recognition = new SpeechRecognitionCtor()
      recognition.lang = 'en-AU'
      recognition.interimResults = true
      recognition.continuous = false
      recognition.maxAlternatives = 1

      recognition.onresult = (event: {
        resultIndex: number
        results: ArrayLike<{ isFinal: boolean, 0?: { transcript: string } }>
      }) => {
        if (!sessionActive) {
          return
        }
        let interimChunk = ''
        for (let i = event.resultIndex; i < event.results.length; i++) {
          const res = event.results[i]
          if (!res?.[0]) {
            continue
          }
          const piece = res[0].transcript
          if (res.isFinal) {
            finalTranscript.value += piece
          } else {
            interimChunk += piece
          }
        }
        interimTranscript.value = interimChunk
        syncCombinedTranscript()
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
    finalTranscript.value = ''
    interimTranscript.value = ''
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

  /** Finalize capture — `onend` + grace reads final vs interim; single delivery via `deliverOnce`. */
  function stop() {
    if (!recognition || !sessionActive) {
      return
    }
    try {
      recognition.stop()
    } catch {
      if (sessionActive) {
        isListening.value = false
        scheduleSessionEnd()
      }
    }
  }

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
        finalTranscript.value = ''
        interimTranscript.value = ''
        transcript.value = ''
        errorMessage.value = ''
        deliverOnce({ kind: 'cancelled' })
      }
    }
  }

  function setManualTranscript(text: string) {
    finalTranscript.value = text
    interimTranscript.value = ''
    transcript.value = text.trim()
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
    finalTranscript.value = ''
    interimTranscript.value = ''
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
    finalTranscript,
    interimTranscript,
    errorMessage,
    start,
    stop,
    cancel,
    setManualTranscript,
    reset
  }
}
