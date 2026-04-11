/**
 * Browser SpeechRecognition wrapper with text-input fallback.
 *
 * States: idle → listening → done
 * If SpeechRecognition is unavailable, `isSupported` is false and
 * the UI should show a text input instead.
 */
export function useVoiceCapture() {
  const isSupported = ref(false)
  const isListening = ref(false)
  const transcript = ref('')
  const errorMessage = ref('')

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let recognition: any = null

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
        isListening.value = false
      }

      recognition.onerror = (event: { error: string }) => {
        if (event.error === 'no-speech') {
          errorMessage.value = 'No speech detected. Please try again.'
        } else if (event.error === 'not-allowed') {
          errorMessage.value = 'Microphone access was denied. You can type instead.'
          isSupported.value = false
        } else {
          errorMessage.value = `Voice capture error: ${event.error}`
        }
        isListening.value = false
      }

      recognition.onend = () => {
        isListening.value = false
      }
    }
  })

  function start() {
    if (!recognition) return
    errorMessage.value = ''
    transcript.value = ''
    isListening.value = true
    try {
      recognition.start()
    } catch {
      // Already started — ignore
      isListening.value = false
    }
  }

  function stop() {
    if (!recognition) return
    recognition.stop()
    isListening.value = false
  }

  function setManualTranscript(text: string) {
    transcript.value = text
  }

  function reset() {
    transcript.value = ''
    errorMessage.value = ''
    isListening.value = false
  }

  onUnmounted(() => {
    if (recognition && isListening.value) {
      recognition.abort()
    }
  })

  return {
    isSupported,
    isListening,
    transcript,
    errorMessage,
    start,
    stop,
    setManualTranscript,
    reset
  }
}
