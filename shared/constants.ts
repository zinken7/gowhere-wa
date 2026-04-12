/** Public rule bundle id — keep in sync with server/lib/triage-engine.ts */
export const RULES_VERSION = 'GoWhere-wa-1.0.0'

/** Max follow-up pass index allowed on POST /api/intake/analyze (0 = first analysis). Block above this to avoid endless loops. */
export const MAX_INTAKE_FOLLOW_UP_PASS = 3

/** Follow-up question id when the server hit max clarification rounds — UI shows info + Back only. */
export const INTAKE_TERMINAL_QUESTION_ID = 'intake-terminal'
