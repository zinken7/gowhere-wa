# Task list — CarePath WA (MVP)

**Rules:** Order is **implementation order**. **Must** = ship blocker; **Should** = MVP quality bar if time allows; **Could** = nice-to-have. Aligns with `docs/SPEC.md` and `tasks/plan.md`.

**Verification shorthand:** `build` = `pnpm build`, `lint` = `pnpm lint`, `test` = `pnpm test`.

---

## Phase A — Foundation

- [x] **A1** — [Must] Scaffold Nuxt 4 + TypeScript strict + Nuxt UI + Tailwind; add `pnpm` scripts: `dev`, `build`, `preview`, `lint`, `test`.  
  - **Acceptance:** Clean `build` + `lint`; `dev` runs.  
  - **Verify:** `pnpm build && pnpm lint`

- [x] **A2** — [Must] Add Nitro `GET /api/health` per `docs/API.md`.  
  - **Acceptance:** JSON `ok: true` with service name + timestamp.  
  - **Verify:** curl/browser; unit test optional.

- [x] **A3** — [Must] App shell: layout, mobile-first base, placeholder for global disclaimer.  
  - **Acceptance:** All routes render inside layout; no blank errors.  
  - **Verify:** manual smoke.

- [x] **A4** — [Should] `.env.example` + `runtimeConfig` placeholders for Supabase URL + service role (server-only documented).  
  - **Acceptance:** No secrets in repo; Vercel: set `NUXT_PUBLIC_SUPABASE_URL` and `NUXT_SUPABASE_SERVICE_ROLE_KEY` to match `.env.example`.  
  - **Verify:** file review; optional README env blurb.

- [ ] **A5** — [Must] **Deployment checkpoint (D1):** Vercel project + preview deploy; health route OK.  
  - **Acceptance:** Preview URL loads; `/api/health` 200.  
  - **Verify:** browser + `curl` on preview URL.

---

## Phase B — Deterministic core (critical path)

- [x] **B1** — [Must] Implement `server/lib/triage-engine.ts` (+ `server/utils/*` as needed) — pure functions, `rulesVersion`, **CareRoute** outputs + `reasonCodes`.  
  - **Acceptance:** Same signals → same output; red flags → ED per rules.  
  - **Verify:** `pnpm test` (unit).

- [x] **B2** — [Must] `POST /api/triage/recommend` — validates body, requires `consentGiven === true`, returns contract from `docs/API.md`.  
  - **Acceptance:** 400 when consent false/missing; 200 shape stable.  
  - **Verify:** manual / engine tests; optional handler test later.

- [x] **T1** — [Must] **Testing checkpoint:** engine + recommend covered.  
  - **Acceptance:** Critical branches asserted (incl. Slice 1 golden path acceptance group).  
  - **Verify:** `pnpm test` green.

---

## Phase C — Golden path UI

- [x] **C1** — [Must] `useFlowState` (or equivalent) + types for flow signals; no diagnosis copy.  
  - **Acceptance:** State serializable to API `signals` shape.  
  - **Verify:** manual + typecheck.

- [x] **C2** — [Must] Wire **one** page flow (`/` or `/demo`) through: Entry → Persona → Category → Red flags → Severity/timing → result.  
  - **Acceptance:** Uses **RecommendationCard** + **SafetyNetBox**; single linear golden path works; **no blank screen** on result step while loading; **Nuxt auto-import names must match** (see `nuxt.config.ts` `pathPrefix: false`).  
  - **Verify:** manual walkthrough (`pnpm dev`).

- [x] **C3** — [Must] Components per SPEC: at minimum **EntryActions**, **PersonaSelector**, **CategoryGrid**, **RedFlagChecklist**, **SeverityQuestions**, **RecommendationCard**, **SafetyNetBox**; back navigation without dead ends.  
  - **Acceptance:** All steps reachable; back() returns to correct prior step; recommendation uses **live API response** (emergency entry uses in-app fallback aligned with ED + `shortReason`).  
  - **Verify:** manual.

- [x] **C4** — [Must] Consent **before** symptom/health inputs; disclaimer on health-related screens.  
  - **Acceptance:** Start disabled without consent; **FlowDisclaimer** on entry and on persona → severity; extra disclaimer on result before card.  
  - **Verify:** manual.

---

## Phase D — Providers + location

- [ ] **L1** — [Should] **LocationStep** — browser geolocation with **suburb fallback**; no long-term storage of raw coords (SPEC).  
  - **Acceptance:** Works with deny geolocation; minimal retention.  
  - **Verify:** manual (allow/deny).

- [x] **L2** — [Should] `GET /api/providers/nearby` + Supabase migrations/seed **and** `static_fallback` when env missing or DB errors.  
  - **Acceptance:** `source` reflects live DB when configured; deterministic fallback preserves demo.  
  - **Verify:** `pnpm test` (provider-query unit); manual with/without env.

- [x] **L3** — [Should] **ServiceList** wired to nearby response.  
  - **Acceptance:** Shows name, address, action to open maps; loading/error/empty states.  
  - **Verify:** manual.

---

## Phase E — Map / directions polish

- [ ] **E1** — [Should] Map slice: **CareMap**, **ClinicMarker**, **RoutePanel** (or simplified single map).  
  - **Acceptance:** Matches list selection; degrades gracefully.  
  - **Verify:** manual.

- [ ] **E2** — [Could] `GET /api/directions/route` stub or real upstream; **OpenExternalNavButton**.  
  - **Acceptance:** Failure shows external maps only (`docs/API.md` fallback).  
  - **Verify:** manual with network throttled/off.

---

## Phase F — Ship

- [ ] **F1** — [Should] PWA basics (manifest, meta) if time.  
  - **Acceptance:** Installable or documented “add to home” for demo.  
  - **Verify:** manual.

- [ ] **F2** — [Could] `docs/DEMO_SCRIPT.md` step-by-step for judges.  
  - **Acceptance:** Matches golden path only.  
  - **Verify:** reviewer read-through.

- [ ] **F3** — [Could] E2E for golden path (`pnpm test:e2e`).  
  - **Acceptance:** One happy path.  
  - **Verify:** CI/local green.

- [ ] **F4** — [Must] **Deployment checkpoint (D2):** demo URL + env set; golden path on mobile.  
  - **Acceptance:** D2 criteria in `tasks/plan.md`.  
  - **Verify:** phone + desktop.

- [ ] **F5** — [Must] **Ship checkpoint (D3):** `build` + `lint` + `test` green; README “how to run demo.”  
  - **Acceptance:** New dev can run locally in &lt; 10 min with docs.  
  - **Verify:** `pnpm build && pnpm lint && pnpm test`

---

## Cut list (if time runs out)

Apply in order (last items cut first):

1. **Could:** E2 directions API — external maps link only.  
2. **Could:** F3 E2E; F1 PWA.  
3. **Should:** E1 map — use **ServiceList** only + **OpenExternalNavButton**.  
4. **Should:** L1 geolocation — suburb-only entry.  
5. **Should:** Supabase providers — **static_fallback** only for demo (`tasks/plan.md`).  
6. **Must not cut:** B* triage engine + consent + disclaimer + golden path + deterministic API.

---

**Status:** Slice 1 **flow UI unblocked**: `pathPrefix: false` in `nuxt.config.ts`. **Data layer:** Supabase `providers` + `households` migrations, `supabase/seed/providers.sql`, `server/lib/supabase.ts`, `server/lib/provider-query.ts`, `/api/providers/nearby` uses DB when configured else static fallback. **Open:** A5 preview deploy, Phase F ship checks; apply migrations on your Supabase project (`supabase db push` or SQL editor).

---

## Demo readiness review (2026-04-11)

### Bugs found (by severity)

| Severity | Issue | Resolution |
|----------|--------|------------|
| **High** | After `POST /api/triage/recommend` succeeded, `useProviders` stayed `idle` until `loadForRoute` ran → **ServiceList** fell through to an empty `<ul>` (no skeleton). | **`prepareForLoad()`** in `useProviders` — clear items + `loading` at start of `loadRecommendationPanel`; **ServiceList** also treats `idle && items.length === 0` as loading. |
| **High** | **Emergency** entry: step jumped to `recommendation` while `recStatus` was still `idle` → full-panel skeleton hid the ED card until the watch ran. | **`onEmergency`** now calls `prepareForLoad()`, **`setEmergencyEntryResult()`**, then **`goEmergency()`** so the recommendation panel shows ED + provider loading without a pointless full skeleton. |

No **critical**-severity issues identified in this pass.

### Fixes applied (code)

- `app/composables/useProviders.ts` — `prepareForLoad()`; used from `index.vue`.
- `app/pages/index.vue` — `loadRecommendationPanel` starts with `prepareForLoad()`; emergency handler pre-fills ED result before navigation.
- `app/components/flow/ServiceList.vue` — loading branch includes `idle` + empty items.
- `tests/unit/triage-engine.spec.ts` — **golden mild fever** full object snapshot (routing + copy stability for demo).

### Medium / low — not fixed in this pass (track separately)

| Severity | Item |
|----------|------|
| **Medium** | **L1** still open: `useProviders` uses fixed `suburb: 'Perth WA'` — no browser geolocation or user suburb field; demo is WA-centric but not location-personalized. |
| **Medium** | **Mobile viewport** not covered by automated E2E — manual check on real device / DevTools still required (F4). |
| **Medium** | **`/` prerender** (`routeRules`) — client-side `$fetch` to `/api/*` after hydration is expected; confirm once on Vercel preview (CORS same-origin, Nitro on server). |
| **Low** | **RecommendationCard** shows raw `reasonCodes` — fine for transparency; may trim for judge-facing demo copy later. |
| **Low** | **Rate limiting** on public APIs not implemented (noted in `docs/API.md`). |
| **Low** | **Supabase failure**: server already falls back to `static_fallback`; client rarely sees provider errors unless network/400 — covered by server design. |

### Final verification checklist (run before demo)

- [ ] `pnpm test && pnpm lint && pnpm build` — green  
- [ ] `pnpm dev` — golden path: Entry (consent) → Persona → Category → Red flags → Severity → result with **RecommendationCard** + **ServiceList**  
- [ ] **Emergency** from entry — ED card + safety net + provider list without long blank state  
- [ ] **Mobile** (DevTools or phone): `max-w-lg` flow readable; buttons stack on narrow width  
- [ ] **Vercel**: `NUXT_PUBLIC_SUPABASE_URL` + `NUXT_SUPABASE_SERVICE_ROLE_KEY` set; `/api/health` 200; optional: `/api/providers/nearby?route=gp&suburb=Perth` returns `source` + items  
- [ ] **Back** from result through severity/red flags/category/persona to entry — no dead ends  
