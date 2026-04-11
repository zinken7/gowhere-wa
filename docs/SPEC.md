# Spec: CarePath WA (MVP)

## Objective

**Product:** A panic-proof **care routing** web app that helps people in Western Australia choose an appropriate care setting **before** defaulting to the emergency department (ED), when that may not be the right first step.

**User:** Someone who is worried or unsure where to seek care (self or dependent), on mobile or desktop, seeking clear next steps without being diagnosed.

**Why:** Reduce inappropriate ED presentations where safe alternatives exist, by making routing **deterministic**, **explainable**, and **fast** for a demo.

**MVP principles:**

- **No diagnosis** — The app recommends *where to seek care* (route), not *what condition* the user has.
- **Deterministic routing first** — Rules are explicit, testable, and repeatable; same inputs → same route.
- **One polished golden path** — A single end-to-end journey is demo-ready (content, UX, and performance).
- **AI is out of scope for MVP** — May be noted as a future extension only; not required for core flows.

**Success criteria (MVP):**

- A user can complete the golden path in one session without dead ends or contradictory advice.
- The recommended route is produced by documented, versioned rules (no opaque model).
- Medical disclaimer and consent patterns align with project boundaries (see Boundaries).
- Build, lint, and test commands run clean on the target stack.

## Tech Stack

| Layer | Choice |
|--------|--------|
| Framework | Nuxt 4 (Vue 3, TypeScript strict) |
| UI | Nuxt UI + Tailwind (as bundled with Nuxt UI) |
| Backend | Nuxt server routes (Nitro) |
| Data & auth | Supabase (prefer Sydney `ap-southeast-2` unless WA-specific requirement documented) |
| Hosting | Vercel |

*Versions are pinned when `package.json` exists; until then, use current stable Nuxt 4.*

## Commands

*To be finalized when the repo is scaffolded. Placeholder targets:*

```bash
# Dev
pnpm dev

# Production build
pnpm build

# Preview production locally
pnpm preview

# Lint / format (align with Nuxt defaults + project config)
pnpm lint

# Unit / component tests (Vitest or project default)
pnpm test

# E2E (if added)
pnpm test:e2e
```

## Project Structure

*Expected once Nuxt app exists:*

```
CarePath/
├── app/
│   ├── app.vue
│   ├── assets/
│   │   └── css/
│   │       └── main.css
│   ├── components/
│   │   ├── common/
│   │   ├── flow/
│   │   │       ├── EntryActions.vue
│   │   │       ├── PersonaSelector.vue
│   │   │       ├── CategoryGrid.vue
│   │   │       ├── RedFlagChecklist.vue
│   │   │       ├── SeverityQuestions.vue
│   │   │       ├── LocationStep.vue
│   │   │       ├── RecommendationCard.vue
│   │   │       ├── ServiceList.vue
│   │   │       └── SafetyNetBox.vue
│   │   └── map/
│   │           ├── CareMap.vue
│   │           ├── ClinicMarker.vue
│   │           ├── RoutePanel.vue
│   │           └── OpenExternalNavButton.vue
│   ├── composables/
│   │   ├── useFlowState.ts
│   │   ├── useRecommendation.ts
│   │   ├── useLocation.ts
│   │   ├── useDirections.ts
│   │   └── useProviders.ts
│   ├── pages/
│   │   ├── index.vue
│   │   └── demo.vue
│   ├── stores/
│   │   ├── flow.ts
│   │   └── demo.ts
│   └── types/
│       ├── api.ts
│       ├── flow.ts
│       ├── recommendation.ts
│       ├── provider.ts
│       └── map.ts
│
├── server/
│   ├── api/
│   │   ├── health.get.ts
│   │   ├── triage/
│   │   │   └── recommend.post.ts
│   │   ├── providers/
│   │   │   └── nearby.get.ts
│   │   └── directions/
│   │       └── route.get.ts
│   ├── lib/
│   │   ├── supabase.ts
│   │   ├── triage-engine.ts
│   │   ├── provider-query.ts
│   │   └── directions-client.ts
│   └── utils/
│       ├── red-flags.ts
│       └── safety-net.ts
│
├── supabase/
│   ├── migrations/
│   │   ├── 001_providers.sql
│   │   └── 002_households.sql
│   └── seed/
│       └── providers.sql
│
├── docs/
│   ├── SPEC.md
│   ├── ARCHITECTURE.md
│   ├── API.md
│   └── DEMO_SCRIPT.md
│
├── .env.example
├── nuxt.config.ts
├── package.json
└── README.md
```

## Code Style

- Vue SFCs with `<script setup lang="ts">`.
- Prefer composables for reusable flow state; keep routing rules in pure, testable modules (e.g. `lib/routing/`).
- Server-only secrets via runtime config / environment variables — never client-exposed.

**Example (pure routing helper — illustrative):**

```ts
export type CareRoute = 'ed' | 'gp' | 'pharmacy' | 'urgent_care_clinic'

export function routeFromSignals(signals: {
  redFlags: boolean
  medicationOrMinorIssue: boolean
  afterHours: boolean
  needsSameDay: boolean
}): CareRoute {
  if (signals.redFlags) return 'ed'
  if (signals.medicationOrMinorIssue) return 'pharmacy'
  if (signals.afterHours && signals.needsSameDay) return 'urgent_care_clinic'
  return 'gp'
}
```

Naming: `PascalCase` components, `camelCase` functions/vars, `kebab-case` routes where Nuxt expects file-based routing.

## Testing Strategy

- **Routing engine:** Unit tests for rule tables / decision functions (highest ROI for deterministic MVP).
- **API:** Integration tests for server routes that apply rules and return stable JSON shapes.
- **Golden path:** One E2E or scripted manual test checklist for the demo journey (automate when scaffold exists).
- **Coverage:** Pragmatic target for core routing modules (e.g. critical branches); exact threshold TBD in Plan phase.

## Boundaries

### Always

- Show a clear non-diagnostic disclaimer on health-related screens (e.g. not a substitute for professional advice — align wording with legal review).
- Obtain **explicit consent** before collecting health or symptom-related data; **minimize** what is stored.
- Use **RLS** on Supabase tables that hold user or health-related data; allow **delete my data** when accounts exist.
- **Do not** store long-term raw location history.
- Do not store more than needed; keep data minimal..
- Run tests before merging material changes once the test harness exists.

### Ask first

- New dependencies beyond core stack.
- Database schema or RLS policy changes.
- Changing hosting region, analytics, or consent copy.
- Removing or weakening tests to “go green.”

### Never

- Present outputs as a **diagnosis** or certainty about condition.
- Commit secrets (Supabase keys, service roles).
- Ship non-deterministic “routing” as MVP core without documented rules.

## Compliance note (Australia)

Align privacy and consent with Australian expectations and internal legal review. This spec does not replace legal advice.

## Open Questions

1. **Rule source:** Internal routing rules adapted from public WA Health and Healthdirect-style guidance; not a diagnostic system.
2. **Languages:** English-only.
3. **Demo auth:** Anonymous session for the golden path demo
4. **Capacitor / native:** Web + PWA for MVP; native wrapper later if needed.

---

## Living document

Update this file when scope, success criteria, or architectural boundaries change. Implementation PRs should reference the section they implement.

**Status:** SPEC approved.
