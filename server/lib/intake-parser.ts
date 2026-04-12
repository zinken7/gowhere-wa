/**
 * Deterministic intake parser — extracts structured triage signals
 * from free-form text using keyword/pattern matching.
 *
 * No LLM dependency. Keeps intake analysis explainable and testable.
 */
import type { CategoryKey, TriageSignals } from '../../shared/triage-types'
import type {
  IntakeConfirm,
  IntakeEmergency,
  IntakeFollowUp,
  IntakeQuestion
} from '../../shared/intake-types'

/* ─── Emergency keyword detection ─── */

const EMERGENCY_PATTERNS = [
  /\b(can'?t breathe|not breathing|stopped breathing)\b/i,
  /\b(chest pain|heart attack)\b/i,
  /\b(unconscious|unresponsive|passed out|fainted)\b/i,
  /\b(severe bleed|won'?t stop bleeding|heavy bleeding)\b/i,
  /\b(seizure|convuls|fitting)\b/i,
  /\b(stroke|face droop|slurred speech)\b/i,
  /\b(choking|can'?t swallow)\b/i,
  /\b(suicid|self[- ]?harm|hurt myself|end my life|kill myself)\b/i,
  /\b(overdose|took too many|poisoning)\b/i,
  /\b(anaphyla|severe allergic|throat (is )?swell)/i
]

/* ─── Category detection ─── */

const CATEGORY_MAP: { pattern: RegExp, key: CategoryKey }[] = [
  { pattern: /\b(breath|lung|wheez|asthma|inhaler|cough)\b/i, key: 'breathing' },
  { pattern: /\b(chest|heart|palpitat)\b/i, key: 'chest_pain' },
  { pattern: /\b(fever|temperatur|flu|cold|infect|sick|unwell|vomit|nausea|diarr)\b/i, key: 'fever' },
  { pattern: /\b(injur|wound|cut|bleed|sprain|broken|fractur|fall|fell|burn|bruise)\b/i, key: 'injury' },
  { pattern: /\b(anxi|depress|mental|stress|panic|mood|sleep|insomnia|sad|worry|worried)\b/i, key: 'mental_health' },
  { pattern: /\b(medic|prescri|pill|tablet|refill|pharmacy|dosage|side effect)\b/i, key: 'medication' }
]

/* ─── Severity detection ─── */

const SEVERE_PATTERNS = [
  /\b(severe|extreme|unbearable|worst|terrible|excruciating|very bad|really bad|10.*(out of|\/)\s*10)\b/i,
  /\b(can'?t (move|walk|stand|bear))\b/i,
  /\b(getting worse|rapidly|emergency)\b/i
]

const MODERATE_PATTERNS = [
  /\b(moderate|quite bad|fairly bad|significant|noticeable|uncomfortable|painful)\b/i,
  /\b(getting worse slowly|worsening)\b/i
]

const MILD_PATTERNS = [
  /\b(mild|slight|minor|little|small|bit of|manageable|not too bad|bearable)\b/i
]

/* ─── Red flag detection ─── */

const RED_FLAG_PATTERNS = [
  /\b(blood in (stool|urine|vomit))\b/i,
  /\b(stiff neck.*(fever|headache)|fever.*stiff neck)\b/i,
  /\b(sudden.*headache|thunderclap)\b/i,
  /\b(vision (loss|change|blur))\b/i,
  /\b(weakness.*(one side|arm|leg)|numb.*(face|arm|leg))\b/i,
  /\b(confused|confusion|disoriented)\b/i,
  /\b(rash.*spread|spreading rash)\b/i
]

/* ─── Persona detection ─── */

const DEPENDENT_PATTERNS = [
  /\b(my (child|kid|baby|toddler|son|daughter|mother|father|parent|grandm|grandf|husband|wife|partner))\b/i,
  /\b(for (my|a) (child|kid|baby))\b/i,
  /\b(he is|she is|they are|he'?s|she'?s|they'?re)\b/i
]

/* ─── Time/hours detection ─── */

const AFTER_HOURS_PATTERNS = [
  /\b(after hours|evening|night|weekend|sunday|saturday|late|midnight|closed)\b/i
]

/* ─── Vague / low-information heuristic (keyword path only) ─── */

function hasClinicalHint(text: string): boolean {
  if (EMERGENCY_PATTERNS.some(p => p.test(text))) {
    return true
  }
  if (CATEGORY_MAP.some(c => c.pattern.test(text))) {
    return true
  }
  return /\b(pain|hurt|ache|sick|fever|cough|nausea|vomit|bleed|breath|dizzy|rash|swell|unwell|head|throat|ear|eye|stomach|back|doctor|gp|clinic|hospital)\b/i.test(
    text
  )
}

function isLikelyNonClinicalOrTooVague(text: string): boolean {
  const t = text.trim()
  if (t.length < 3) {
    return true
  }
  const words = t.split(/\s+/).filter(Boolean)
  if (words.length <= 2) {
    return !hasClinicalHint(t)
  }
  if (words.length < 8 && !hasClinicalHint(t)) {
    return true
  }
  return false
}

/* ─── Main parser ─── */

export function analyzeIntake(
  transcript: string,
  priorSignals?: Partial<TriageSignals>
): IntakeConfirm | IntakeEmergency | IntakeFollowUp {
  const text = transcript.trim()

  if (!text) {
    return followUp(priorSignals ?? {}, [
      { id: 'describe', text: 'Could you describe what you\'re experiencing?', options: undefined }
    ])
  }

  // 1. Emergency escalation — always check first
  for (const pattern of EMERGENCY_PATTERNS) {
    if (pattern.test(text)) {
      return {
        type: 'emergency',
        reason: 'Your description suggests you may need immediate emergency help. If life-threatening, call Triple Zero (000) now.'
      } satisfies IntakeEmergency
    }
  }

  // 1b. Very short or non-clinical text — clarify instead of defaulting to a care route
  if (isLikelyNonClinicalOrTooVague(text)) {
    return followUp(priorSignals ?? {}, [
      {
        id: 'vague-main',
        text: 'What is the main health problem or symptom you want help with?',
        options: undefined
      },
      {
        id: 'vague-when',
        text: 'Roughly when did this start, or when did it get worse?',
        options: undefined
      }
    ])
  }

  // 2. Extract signals from text
  const extracted: Partial<TriageSignals> = { ...priorSignals }

  // Persona
  if (!extracted.persona) {
    extracted.persona = DEPENDENT_PATTERNS.some(p => p.test(text)) ? 'dependent' : 'self'
  }

  // Category
  if (!extracted.categoryKey) {
    for (const { pattern, key } of CATEGORY_MAP) {
      if (pattern.test(text)) {
        extracted.categoryKey = key
        break
      }
    }
  }

  // Severity
  if (!extracted.severity) {
    if (SEVERE_PATTERNS.some(p => p.test(text))) {
      extracted.severity = 'severe'
    } else if (MODERATE_PATTERNS.some(p => p.test(text))) {
      extracted.severity = 'moderate'
    } else if (MILD_PATTERNS.some(p => p.test(text))) {
      extracted.severity = 'mild'
    }
  }

  // Red flags
  if (extracted.redFlags === undefined) {
    extracted.redFlags = RED_FLAG_PATTERNS.some(p => p.test(text))
  }

  // After hours
  if (extracted.afterHours === undefined) {
    extracted.afterHours = AFTER_HOURS_PATTERNS.some(p => p.test(text))
  }

  // Medication shortcut
  if (extracted.medicationOrMinorIssue === undefined) {
    extracted.medicationOrMinorIssue = extracted.categoryKey === 'medication'
  }

  // Can wait default
  if (extracted.canWait === undefined) {
    extracted.canWait = extracted.severity !== 'severe'
  }

  // 3. Check for red flags → immediate routing
  if (extracted.redFlags) {
    return confirm(extracted, 'Warning signs detected — we suggest seeking emergency care.')
  }

  // 4. Check completeness — do we have enough to route?
  const missing = getMissingSignals(extracted)

  if (missing.length > 0) {
    return followUp(extracted, missing)
  }

  // 5. All signals present — confirm with user
  const summary = buildSummary(extracted as TriageSignals)
  return confirm(extracted, summary)
}

/* ─── Helpers ─── */

function getMissingSignals(signals: Partial<TriageSignals>): IntakeQuestion[] {
  const questions: IntakeQuestion[] = []

  if (!signals.categoryKey) {
    questions.push({
      id: 'category',
      text: 'What is your main health concern?',
      options: [
        'Breathing or lung issue',
        'Chest discomfort',
        'Fever or feeling unwell',
        'Injury or wound',
        'Mental health or distress',
        'Medication question',
        'Something else'
      ]
    })
  }

  if (!signals.severity) {
    questions.push({
      id: 'severity',
      text: 'How would you rate the severity?',
      options: ['Mild — manageable', 'Moderate — uncomfortable', 'Severe — hard to bear']
    })
  }

  return questions
}

function buildSummary(signals: TriageSignals): string {
  const parts: string[] = []

  const categoryLabels: Record<CategoryKey, string> = {
    breathing: 'a breathing concern',
    chest_pain: 'chest discomfort',
    fever: 'fever or infection symptoms',
    injury: 'an injury or wound',
    mental_health: 'a mental health concern',
    medication: 'a medication question',
    other: 'a general health concern'
  }

  parts.push(`You described ${categoryLabels[signals.categoryKey]}`)
  parts.push(`with ${signals.severity} severity`)

  if (signals.persona === 'dependent') {
    parts.push('for someone you care for')
  }

  if (signals.afterHours) {
    parts.push('outside regular hours')
  }

  return parts.join(', ') + '.'
}

function confirm(
  extracted: Partial<TriageSignals>,
  summary: string
): IntakeConfirm {
  const signals: TriageSignals = {
    persona: extracted.persona ?? 'self',
    categoryKey: extracted.categoryKey ?? 'other',
    redFlags: extracted.redFlags ?? false,
    severity: extracted.severity ?? 'mild',
    canWait: extracted.canWait ?? true,
    afterHours: extracted.afterHours ?? false,
    medicationOrMinorIssue: extracted.medicationOrMinorIssue ?? false
  }

  return { type: 'confirm', summary, signals }
}

function followUp(
  partial: Partial<TriageSignals>,
  questions: IntakeQuestion[]
): IntakeFollowUp {
  return { type: 'follow_up', questions, partialSignals: partial }
}
