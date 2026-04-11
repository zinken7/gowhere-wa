import { describe, expect, it } from 'vitest'
import { recommendCare, RULES_VERSION } from '../../server/lib/triage-engine'
import type { TriageSignals } from '../../server/lib/triage-engine'

function base(over: Partial<TriageSignals> = {}): TriageSignals {
  return {
    persona: 'self',
    categoryKey: 'other',
    redFlags: false,
    severity: 'mild',
    canWait: true,
    afterHours: false,
    medicationOrMinorIssue: false,
    ...over
  }
}

describe('recommendCare', () => {
  it('returns stable rulesVersion', () => {
    const r = recommendCare(base())
    expect(r.rulesVersion).toBe(RULES_VERSION)
  })

  it('routes to ED when any red flag is present', () => {
    const r = recommendCare(base({ redFlags: true }))
    expect(r.route).toBe('ed')
    expect(r.urgency).toBe('immediate')
    expect(r.reasonCodes).toContain('RED_FLAGS')
  })

  it('routes breathing + severe to ED without red flags', () => {
    const r = recommendCare(
      base({ categoryKey: 'breathing', severity: 'severe', redFlags: false })
    )
    expect(r.route).toBe('ed')
    expect(r.reasonCodes).toContain('BREATHING_SEVERE')
  })

  it('routes chest pain moderate or severe to ED', () => {
    const mod = recommendCare(
      base({ categoryKey: 'chest_pain', severity: 'moderate' })
    )
    const sev = recommendCare(
      base({ categoryKey: 'chest_pain', severity: 'severe' })
    )
    expect(mod.route).toBe('ed')
    expect(sev.route).toBe('ed')
  })

  it('routes medication + mild to pharmacy', () => {
    const r = recommendCare(
      base({
        categoryKey: 'medication',
        severity: 'mild',
        medicationOrMinorIssue: true
      })
    )
    expect(r.route).toBe('pharmacy')
    expect(r.urgency).toMatch(/today|routine/)
  })

  it('routes after-hours moderate/severe non-ED to urgent care when applicable', () => {
    const r = recommendCare(
      base({
        categoryKey: 'fever',
        severity: 'moderate',
        afterHours: true,
        redFlags: false
      })
    )
    expect(r.route).toBe('urgent_care_clinic')
  })

  it('defaults mild other to GP', () => {
    const r = recommendCare(base({ categoryKey: 'fever', severity: 'mild' }))
    expect(r.route).toBe('gp')
    expect(r.urgency).toBe('routine')
  })

  it('is deterministic for identical inputs', () => {
    const a = recommendCare(base({ categoryKey: 'injury', severity: 'moderate' }))
    const b = recommendCare(base({ categoryKey: 'injury', severity: 'moderate' }))
    expect(a).toEqual(b)
  })
})

/** Slice 1 acceptance — golden demo path scenarios (deterministic engine only). */
describe('Slice 1 golden path acceptance', () => {
  it('full mild path: fever + mild + no flags → GP + routine + reason text', () => {
    const r = recommendCare(
      base({
        categoryKey: 'fever',
        severity: 'mild',
        redFlags: false,
        afterHours: false
      })
    )
    expect(r.route).toBe('gp')
    expect(r.urgency).toBe('routine')
    expect(r.shortReason.length).toBeGreaterThan(10)
    expect(r.reasonCodes).toContain('GP_ROUTINE')
  })

  it('emergency red-flag path: any red flag → ED + immediate', () => {
    const r = recommendCare(
      base({
        categoryKey: 'other',
        severity: 'mild',
        redFlags: true
      })
    )
    expect(r.route).toBe('ed')
    expect(r.urgency).toBe('immediate')
    expect(r.reasonCodes).toContain('RED_FLAGS')
  })
})
