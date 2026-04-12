# Task list — GoWhere WA (MVP)

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

- [x] **A5** — [Must] **Deployment checkpoint (D1):** Vercel preview **verified** on live URL.  
  - **Evidence (2026-04-11):** `https://visagio-hackathon.vercel.app/` — `GET /` **200**; `GET /api/health` **200** `{"ok":true,"service":"GoWhere-wa",...}`; `GET /api/providers/nearby?route=gp&suburb=Perth` **200** `"source":"static_fallback"` + demo GP items (Supabase not active or not seeded on preview — acceptable per API). Entry shell renders (GoWhere WA + consent + Start / Emergency). **Golden path click-through:** confirm locally in browser once per release; automated agent verified APIs + home only.  
  - **Ready (repo):** `README.md` — env mapping, Supabase steps, A5 table; `runtimeConfig` + `.env.example` aligned; service role server-only.

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

- [x] **L1** — [Should] **Location + suburb** — browser geolocation first; on failure **`SuburbLocationModal`** collects suburb for `/api/providers/nearby` (no passive hint banner); coords not stored; cancel uses **Perth WA** default.  
  - **Acceptance:** Deny/timeout geo → modal → list loads; optional “Try location again” in modal.  
  - **Verify:** manual.

- [x] **L2** — [Should] `GET /api/providers/nearby` + Supabase migrations/seed **and** `static_fallback` when env missing or DB errors.  
  - **Acceptance:** `source` reflects live DB when configured; deterministic fallback preserves demo.  
  - **Verify:** `pnpm test` (provider-query unit); manual with/without env.

- [x] **L3** — [Should] **ServiceList** wired to nearby response.  
  - **Acceptance:** Shows name, address, action to open maps; loading/error/empty states.  
  - **Verify:** manual.

- [x] **L4** — [Must] **Hackathon recommendation UX (2026-04):** Simplified **RecommendationCard**; **ServiceList** shows **3** route-matched providers; **`parseCareRouteQuery`** handles duplicated `route` query keys; client **`normalizeProviderItems`** filters by `type`; **`useProviders`** uses geo → else **suburb modal** (not a hint banner); cancel → **Perth WA**; **`GET /api/providers/nearby`** `limit` + **`distanceKm`** with coords.  
  - **Verify:** `pnpm test` (provider-query + care-routes); manual result screen.

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

## Phase V — Voice-First Pivot

- [x] **V1** — [Must] Voice capture composable (`useVoiceCapture`) — browser SpeechRecognition with text fallback.
  - **Acceptance:** `isSupported` detects API; `isListening` toggles on start/stop; transcript populated on speech end; graceful degradation to text input.
  - **Verify:** manual (Chrome desktop + mobile).

- [x] **V2** — [Must] Intake analysis types (`shared/intake-types.ts`) — discriminated union: `emergency | confirm | follow_up`.
  - **Acceptance:** TypeScript compiles; types used by both server and client.
  - **Verify:** `pnpm build`.

- [x] **V3** — [Must] Deterministic intake parser (`server/lib/intake-parser.ts`) — keyword/pattern matching for emergency detection, category, severity, red flags, persona extraction.
  - **Acceptance:** Same text → same output; emergency keywords → `emergency` type; missing info → `follow_up` with questions.
  - **Verify:** unit tests (TODO).

- [x] **V4** — [Must] `POST /api/intake/analyze` — validates body, requires consent, returns intake response.
  - **Acceptance:** 400 without consent; 200 with discriminated union shape; max 2000 char transcript.
  - **Verify:** manual / curl.
  - **Update (2026-04):** Hybrid path — tries **Gemini** structured JSON first when `NUXT_GEMINI_API_KEY` is set; on any failure falls back to `analyzeIntake` (keyword parser). Same response contract.

- [x] **V5** — [Must] Intake flow composable (`useIntakeFlow`) — state machine: entry → listening → analyzing → confirm|follow_up → recommendation.
  - **Acceptance:** Emergency path fast; back navigation works; follow-up re-analyzes with combined context.
  - **Verify:** manual.

- [x] **V6** — [Must] Redesigned Entry screen — voice-first hero with dark background, orange accent, mic CTA, emergency pill, consent checkbox.
  - **Acceptance:** Mobile-first full-screen; pulse animation on listening; text fallback available.
  - **Verify:** manual (mobile viewport).

- [x] **V7** — [Must] IntakeConfirm + IntakeFollowUp components — confirmation card and follow-up questions UI.
  - **Acceptance:** Confirm shows transcript + summary + action; follow-up shows option buttons + continue.
  - **Verify:** manual.

- [x] **V8** — [Must] Rewired `index.vue` — new flow replaces old 6-step wizard; preserves RecommendationCard, SafetyNetBox, ServiceList.
  - **Acceptance:** Full voice → analyze → confirm → recommend path works; emergency path works.
  - **Verify:** manual golden path.

- [x] **V9** — [Must] Docs updated — `API.md` has `/api/intake/analyze`; `ARCHITECTURE.md` has intake parser layer.
  - **Verify:** doc review.

- [ ] **V10** — [Should] Unit tests for `intake-parser.ts` — emergency keywords, category extraction, missing signal detection.
  - **Verify:** `pnpm test`.

- [ ] **V11** — [Should] Polish Entry screen — match mockup pixel-perfect; test on real device.
  - **Verify:** manual on phone.

### Old flow components (retired but not deleted)
- `PersonaSelector.vue` — no longer rendered from index.vue; intake parser extracts persona.
- `CategoryGrid.vue` — no longer rendered; intake parser extracts category.
- `RedFlagChecklist.vue` — no longer rendered; intake parser detects red flags.
- `SeverityQuestions.vue` — no longer rendered; intake parser + follow-up handles severity.
- `useFlowState.ts` — no longer imported; replaced by `useIntakeFlow.ts`.

---

**Status:** Slice 1 **flow UI unblocked**: `pathPrefix: false` in `nuxt.config.ts`. **Voice-first pivot complete (V1–V9)**: voice capture, intake parser, API, flow composable, Entry redesign, confirm/follow-up UI, index.vue rewired. **Intake analyze** optionally uses Gemini + **silent** fallback to keyword parser (`docs/API.md`). **Open:** V10 intake parser tests; V11 design polish; Phase F ship checks; optional Supabase env + migrations on Vercel for `source: supabase`; **L1** LocationStep if prioritizing geo/suburb UX.

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
| **Medium** | **L1** partial: `useProviders` now tries **one-shot** browser geolocation for ranking + `distanceKm`; on deny/timeout falls back to **`Perth WA`** suburb (no user-editable suburb field). |
| **Medium** | **Mobile viewport** not covered by automated E2E — manual check on real device / DevTools still required (F4). |
| **Medium** | **`/` prerender** (`routeRules`) — client-side `$fetch` to `/api/*` after hydration is expected; confirm once on Vercel preview (CORS same-origin, Nitro on server). |
| **Done** | **RecommendationCard** no longer shows `reasonCodes` / rules version on the result screen (hackathon scan-friendly). |
| **Low** | **Rate limiting** on public APIs not implemented (noted in `docs/API.md`). |
| **Low** | **Supabase failure**: server already falls back to `static_fallback`; client rarely sees provider errors unless network/400 — covered by server design. |

### Final verification checklist (run before demo)

- [ ] `pnpm test && pnpm lint && pnpm build` — green  
- [ ] `pnpm dev` — golden path: Entry (consent) → Persona → Category → Red flags → Severity → result with **RecommendationCard** + **ServiceList**  
- [ ] **Emergency** from entry — ED card + safety net + provider list without long blank state  
- [ ] **Mobile** (DevTools or phone): `max-w-lg` flow readable; buttons stack on narrow width  
- [ ] **Vercel**: `NUXT_PUBLIC_SUPABASE_URL` + `NUXT_SUPABASE_SERVICE_ROLE_KEY` set; `/api/health` 200; optional: `/api/providers/nearby?route=gp&suburb=Perth` returns `source` + items  
- [ ] **Back** from result through severity/red flags/category/persona to entry — no dead ends  
