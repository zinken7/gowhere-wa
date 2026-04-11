# Task list — CarePath WA (MVP)

**Rules:** Order is **implementation order**. **Must** = ship blocker; **Should** = MVP quality bar if time allows; **Could** = nice-to-have. Aligns with `docs/SPEC.md` and `tasks/plan.md`.

**Verification shorthand:** `build` = `pnpm build`, `lint` = `pnpm lint`, `test` = `pnpm test`.

---

## Phase A — Foundation

- [ ] **A1** — [Must] Scaffold Nuxt 4 + TypeScript strict + Nuxt UI + Tailwind; add `pnpm` scripts: `dev`, `build`, `preview`, `lint`, `test`.  
  - **Acceptance:** Clean `build` + `lint`; `dev` runs.  
  - **Verify:** `pnpm build && pnpm lint`

- [ ] **A2** — [Must] Add Nitro `GET /api/health` per `docs/API.md`.  
  - **Acceptance:** JSON `ok: true` with service name + timestamp.  
  - **Verify:** curl/browser; unit test optional.

- [ ] **A3** — [Must] App shell: layout, mobile-first base, placeholder for global disclaimer.  
  - **Acceptance:** All routes render inside layout; no blank errors.  
  - **Verify:** manual smoke.

- [ ] **A4** — [Should] `.env.example` + `runtimeConfig` placeholders for Supabase URL/keys (anon + server only documented).  
  - **Acceptance:** No secrets in repo; README notes Vercel env mapping.  
  - **Verify:** grep for keys in git history N/A; file review.

- [ ] **A5** — [Must] **Deployment checkpoint (D1):** Vercel project + preview deploy; health route OK.  
  - **Acceptance:** Preview URL loads; `/api/health` 200.  
  - **Verify:** browser + `curl` on preview URL.

---

## Phase B — Deterministic core (critical path)

- [ ] **B1** — [Must] Implement `server/lib/triage-engine.ts` (+ `server/utils/*` as needed) — pure functions, `rulesVersion`, **CareRoute** outputs + `reasonCodes`.  
  - **Acceptance:** Same signals → same output; red flags → ED per rules.  
  - **Verify:** `pnpm test` (unit).

- [ ] **B2** — [Must] `POST /api/triage/recommend` — validates body, requires `consentGiven === true`, returns contract from `docs/API.md`.  
  - **Acceptance:** 400 when consent false/missing; 200 shape stable.  
  - **Verify:** `pnpm test` (integration) or minimal handler test.

- [ ] **T1** — [Must] **Testing checkpoint:** engine + recommend covered.  
  - **Acceptance:** Critical branches asserted.  
  - **Verify:** `pnpm test` green.

---

## Phase C — Golden path UI

- [ ] **C1** — [Must] `useFlowState` (or equivalent) + types for flow signals; no diagnosis copy.  
  - **Acceptance:** State serializable to API `signals` shape.  
  - **Verify:** manual + typecheck.

- [ ] **C2** — [Must] Wire **one** page flow (`/` or `/demo`) through: Entry → Persona → Category → Red flags → Severity/timing → result.  
  - **Acceptance:** Uses **RecommendationCard** + **SafetyNetBox**; single linear golden path works.  
  - **Verify:** manual walkthrough.

- [ ] **C3** — [Must] Components per SPEC: at minimum **EntryActions**, **PersonaSelector**, **CategoryGrid**, **RedFlagChecklist**, **SeverityQuestions**, **RecommendationCard**, **SafetyNetBox** (split may be pragmatic but names/purpose match SPEC).  
  - **Acceptance:** No dead end; back navigation works.  
  - **Verify:** manual.

- [ ] **C4** — [Must] Consent **before** symptom/health inputs; disclaimer on health steps.  
  - **Acceptance:** API not called with health signals until consent stored in client state.  
  - **Verify:** manual + optional test for gating.

---

## Phase D — Providers + location

- [ ] **L1** — [Should] **LocationStep** — browser geolocation with **suburb fallback**; no long-term storage of raw coords (SPEC).  
  - **Acceptance:** Works with deny geolocation; minimal retention.  
  - **Verify:** manual (allow/deny).

- [ ] **L2** — [Should] `GET /api/providers/nearby` + Supabase seed **or** `static_fallback` per plan.  
  - **Acceptance:** List JSON matches `docs/API.md`; works in preview with env or fallback.  
  - **Verify:** manual + `pnpm test` if integration test exists.

- [ ] **L3** — [Should] **ServiceList** wired to nearby response.  
  - **Acceptance:** Shows name, address, action to open maps.  
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
4. **Should:** D1 geolocation — suburb-only entry.  
5. **Should:** Supabase providers — **static_fallback** only for demo (`tasks/plan.md`).  
6. **Must not cut:** B* triage engine + consent + disclaimer + golden path + deterministic API.

---

**Status:** Ready for Build; start with **A1**.
