import type { CategoryKey, Severity, TriageSignals } from '~~/shared/triage-types'
import type { FlowStep } from '~/types/flow'

export function useFlowState() {
  const step = ref<FlowStep>('entry')
  const consentGiven = ref(false)
  const entryEmergency = ref(false)
  const persona = ref<'self' | 'dependent' | null>(null)
  const categoryKey = ref<CategoryKey | null>(null)
  const redFlagIds = ref<string[]>([])
  const severity = ref<Severity | null>(null)
  const afterHours = ref(false)
  const canWait = ref(true)
  const medicationOrMinorIssue = ref(false)

  const hasRedFlags = computed(() => redFlagIds.value.length > 0)

  const skippedSeverity = computed(
    () => hasRedFlags.value || entryEmergency.value
  )

  function reset() {
    step.value = 'entry'
    consentGiven.value = false
    entryEmergency.value = false
    persona.value = null
    categoryKey.value = null
    redFlagIds.value = []
    severity.value = null
    afterHours.value = false
    canWait.value = true
    medicationOrMinorIssue.value = false
  }

  function toTriageSignals(): TriageSignals {
    return {
      persona: persona.value ?? 'self',
      categoryKey: categoryKey.value ?? 'other',
      redFlags: hasRedFlags.value,
      severity: severity.value ?? 'mild',
      canWait: canWait.value,
      afterHours: afterHours.value,
      medicationOrMinorIssue:
        medicationOrMinorIssue.value
        || categoryKey.value === 'medication'
    }
  }

  function goEmergency() {
    entryEmergency.value = true
    consentGiven.value = true
    step.value = 'recommendation'
  }

  function back() {
    if (step.value === 'recommendation') {
      if (entryEmergency.value) {
        entryEmergency.value = false
        step.value = 'entry'
        return
      }
      step.value = skippedSeverity.value ? 'redFlags' : 'severity'
      return
    }
    if (step.value === 'severity') {
      step.value = 'redFlags'
      return
    }
    if (step.value === 'redFlags') {
      step.value = 'category'
      return
    }
    if (step.value === 'category') {
      step.value = 'persona'
      return
    }
    if (step.value === 'persona') {
      step.value = 'entry'
    }
  }

  return {
    step,
    consentGiven,
    entryEmergency,
    persona,
    categoryKey,
    redFlagIds,
    severity,
    afterHours,
    canWait,
    medicationOrMinorIssue,
    hasRedFlags,
    skippedSeverity,
    reset,
    toTriageSignals,
    goEmergency,
    back
  }
}
