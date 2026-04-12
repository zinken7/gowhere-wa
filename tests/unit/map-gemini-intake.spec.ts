import { describe, expect, it } from 'vitest'
import { mapGeminiToIntakeResponse } from '../../server/lib/map-gemini-intake'
import type { GeminiIntakeClassification } from '../../shared/gemini-intake-types'

function g(over: Partial<GeminiIntakeClassification>): GeminiIntakeClassification {
  return {
    classification: 'confirm',
    summary: 'Test summary.',
    urgencySignals: [],
    extractedSymptoms: [],
    missingInfo: [],
    suggestedDestination: 'gp',
    confidence: 0.8,
    ...over
  }
}

describe('mapGeminiToIntakeResponse', () => {
  it('maps emergency to IntakeEmergency', () => {
    const r = mapGeminiToIntakeResponse(
      g({
        classification: 'emergency',
        summary: 'Possible stroke warning signs.',
        suggestedDestination: 'ed',
        urgencySignals: ['weakness'],
        extractedSymptoms: ['arm weakness']
      })
    )
    expect(r.type).toBe('emergency')
    if (r.type === 'emergency') {
      expect(r.reason).toContain('stroke')
    }
  })

  it('maps confirm with TriageSignals', () => {
    const r = mapGeminiToIntakeResponse(
      g({
        classification: 'confirm',
        summary: 'Fever and ear pain may need same-day assessment.',
        urgencySignals: ['fever'],
        extractedSymptoms: ['fever', 'ear pain'],
        suggestedDestination: 'urgent_care_clinic',
        missingInfo: ['age']
      })
    )
    expect(r.type).toBe('confirm')
    if (r.type === 'confirm') {
      expect(r.signals.categoryKey).toBeDefined()
      expect(r.signals.redFlags).toBeDefined()
      expect(typeof r.signals.canWait).toBe('boolean')
    }
  })

  it('maps follow_up with questions from missingInfo', () => {
    const r = mapGeminiToIntakeResponse(
      g({
        classification: 'follow_up',
        summary: 'Routine request.',
        suggestedDestination: 'gp',
        missingInfo: ['duration', 'severity']
      })
    )
    expect(r.type).toBe('follow_up')
    if (r.type === 'follow_up') {
      expect(r.questions.length).toBeGreaterThan(0)
      expect(r.questions[0]?.text).toBe('duration')
    }
  })

  it('merges priorSignals into partialSignals for follow_up', () => {
    const r = mapGeminiToIntakeResponse(
      g({
        classification: 'follow_up',
        summary: 'Need more detail.',
        suggestedDestination: 'unknown',
        missingInfo: []
      }),
      { persona: 'dependent', categoryKey: 'fever' }
    )
    expect(r.type).toBe('follow_up')
    if (r.type === 'follow_up') {
      expect(r.partialSignals.persona).toBe('dependent')
      expect(r.partialSignals.categoryKey).toBe('fever')
    }
  })
})
