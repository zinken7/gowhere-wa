# Implementation plan — GoWhere WA (MVP)

**Inputs:** `docs/SPEC.md` (approved, build-ready).  
**Mode:** Solo hackathon — optimize for **one shippable demo** and **vertical slices** (feature slices through the stack), not “all backend then all frontend.”

**MVP scope (must match SPEC exactly):**

- Panic-proof **care routing** for WA users; **no diagnosis**.
- **Deterministic** routing; **documented/versioned** rules in code.
- **One polished golden path** for demo (content + UX + no dead ends).
- **AI not in core MVP.**
- **English only**; **anonymous** demo session; **web + PWA** (no Capacitor for MVP).
- Stack: **Nuxt 4**, **Nuxt UI**, **Nitro**, **Supabase** (`ap-southeast-2`), **Vercel**.
- Rule source: internal rules adapted from public WA Health / Healthdirect-style guidance; **not** a diagnostic system.
- Compliance: disclaimer on health screens, **explicit consent** before health/symptom data, **RLS** on sensitive tables, **no long-term raw location**, data minimization, **delete my data** when user-linked data exists.

---

## 1. Vertical slices (exact build order)

Each slice is **vertically integrated**: enough UI + server + tests (where listed) to **demo** that slice.

| # | Slice | Outcome |
|---|--------|---------|
| **1** | **Scaffold + quality gate** | Nuxt 4 + Nuxt UI + TS strict; `pnpm dev/build/lint/test` scripts exist and pass; `GET /api/health`; root layout with **disclaimer pattern** (stub page OK). |
| **2** | **Triage engine + recommend API** | Pure `triage-engine` + `POST /api/triage/recommend`; **unit tests** for critical branches; `rulesVersion` in response; **consent flag** enforced on server. |
| **3** | **Golden path UI (core)** | Single journey on `index` or `demo`: Entry → persona/category → red flags → severity/timing → **RecommendationCard** + **SafetyNetBox**; calls recommend API; **no contradictory** routes vs flags. |
| **4** | **Consent + copy** | Consent step **before** health inputs; disclaimer strings on health screens; align with SPEC Boundaries (no diagnostic language). |
| **5** | **Location + providers list** | **LocationStep** (geo or manual suburb); **GET /api/providers/nearby** + **ServiceList**; seed or static fallback. |
| **6** | **Map / directions (polish)** | Map components and/or directions route; **OpenExternalNavButton**; degrade to list + external maps if APIs fail. |

**Parallelism (solo):** Slices **1 → 2 → 3** are strictly sequential. **4** can be interleaved after **3** starts but must finish before treating demo as “compliant.” **5** and **6** depend on **3** for coherent UX; **6** depends on **5** for meaningful map context.

---

## 2. Implementation order (numbered checklist)

1. Project scaffold + ESLint/Prettier + Vitest wiring + Nitro health route.  
2. Triage engine module + types + unit tests (red flag → ED, branches in SPEC example).  
3. `recommend` API + integration test (JSON contract per `docs/API.md`).  
4. Flow state composable + minimal page wiring to display recommendation.  
5. Full golden path components (SPEC tree) and single scripted path.  
6. Consent gate + storage minimization (client-only state unless DB needed).  
7. Providers: migration + seed **or** static fallback first, then Supabase.  
8. Nearby API + list UI.  
9. Map/directions **Should** path + fallbacks.  
10. PWA meta, final polish, **deployment checkpoint** (below).

---

## 3. Testing checkpoints (mandatory)

| When | Checkpoint | Verify |
|------|------------|--------|
| After slice 2 | **Engine tests** | `pnpm test` — red-flag and main branches covered; same input → same output + `rulesVersion`. |
| After slice 2–3 | **API contract** | Manual or automated: `POST /recommend` returns stable shape; 400 without consent. |
| After slice 3 | **Golden path manual** | Walk `docs/DEMO_SCRIPT.md` (create during this phase if missing) — no dead ends. |
| Before ship | **Build + lint** | `pnpm build` + `pnpm lint` clean on Vercel-compatible env. |
| **Should** | **E2E** | Add `pnpm test:e2e` for golden path only if time remains. |

**Rule:** Do not skip engine tests for MVP; they protect deterministic claims.

---

## 4. Deployment checkpoint

| Gate | Requirement |
|------|-------------|
| **D1 — Early smoke** | After slice **1**: deploy to Vercel (preview); `GET /api/health` returns 200; env vars documented in `.env.example` (no secrets committed). |
| **D2 — Demo-ready** | After slice **3–4**: production or stable preview URL; golden path works on mobile viewport; disclaimer + consent live. |
| **D3 — Ship** | After tests + build green; Supabase migrations applied to project **or** explicit **fallback-only** mode documented in README for demo. |

---

## 5. Fallback demo strategy (if integrations fail)

**Goal:** Golden path still demos **deterministic routing** even if optional pieces break.

| Risk | Fallback |
|------|----------|
| Supabase unavailable or migrations not run | **`source: static_fallback`** for providers; hardcoded WA sample venues in server layer (minimal PII). |
| Geolocation denied | **LocationStep** collects **suburb text only**; nearby uses suburb string match or static list. |
| Directions API / map tiles fail | **ServiceList** + **OpenExternalNavButton** to Google/Apple Maps with address; hide or simplify map. |
| Time runs out before DB | Skip `002_households.sql` and any account features; stay **anonymous** per SPEC. |

**Non-negotiable:** Triage **never** falls back to random or AI; if API fails, return **400** with clear error, not a fake diagnosis.

---

## 6. Risks and mitigations

| Risk | Mitigation |
|------|------------|
| Scope creep (map, directions, DB) | Implement **Must** slices first; treat map/directions as **Should**. |
| Compliance slip | Consent + disclaimer in **slice 4** before calling demo “done.” |
| Solo fatigue | One golden path only; defer E2E and households. |

---

## 7. Docs to keep in sync

- **`docs/SPEC.md`** — source of truth for scope; update if plan cuts features.  
- **`docs/ARCHITECTURE.md`** — slices and engine ownership.  
- **`docs/API.md`** — request/response contracts.  
- **`tasks/todo.md`** — executable tasks with Must/Should/Could.

---

**Status:** Plan ready for Build phase; coding starts with slice 1 per `tasks/todo.md`.
