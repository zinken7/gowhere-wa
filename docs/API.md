# GoWhere WA — HTTP API (MVP)

**Base URL:** Same origin as the Nuxt app (Nitro). **No Supabase service role** in the browser; server routes read `NUXT_PUBLIC_SUPABASE_URL` + `NUXT_SUPABASE_SERVICE_ROLE_KEY` from Nitro `runtimeConfig` only (see `.env.example`).

**Scope:** Matches `docs/SPEC.md` — routing recommendations only, not diagnosis. All copy is non-diagnostic.

**Conventions:**

- JSON request/response bodies use `Content-Type: application/json`.
- Errors return JSON with at least `{ "error": { "code": string, "message": string } }` unless noted.
- Triage responses include **`rulesVersion`** for traceability.

---

## `GET /api/health`

**Purpose:** Liveness for deploy checks and monitoring.

**Response:** `200 OK`

```json
{
  "ok": true,
  "service": "GoWhere-wa",
  "time": "2026-04-11T00:00:00.000Z",
  "geminiIntakeModel": "gemini-2.5-flash"
}
```

- **`geminiIntakeModel`** — Resolved server config for `POST /api/intake/analyze` (`NUXT_GEMINI_MODEL` or default `gemini-2.5-flash`). Non-secret; use to verify deploy env.

---

## `POST /api/intake/analyze`

**Purpose:** Transform free-form user input (voice transcript or typed text) into structured routing signals. Returns one of three outcomes: emergency escalation, confirmation summary, or follow-up questions.

**Hybrid classifier (Gemini + fallback):** When **`NUXT_GEMINI_API_KEY`** is set (non-empty, server-only), Nitro first asks **Gemini** for a **strict JSON** navigation classification (default model **`gemini-2.5-flash`**, overridable via **`NUXT_GEMINI_MODEL`** — e.g. `gemini-2.5-flash-lite`). Temperature is low; output is not diagnostic. If the key is **unset or empty**, Nitro skips Gemini and uses the keyword parser only. If the key is set but the call **fails** (timeout, HTTP error, invalid JSON, schema mismatch, or mapping error), the handler **silently** falls back to the deterministic **keyword / pattern** parser in `server/lib/intake-parser.ts` (`analyzeIntake`). The HTTP response shape is always the same discriminated union below; clients never receive raw model errors or provider diagnostics.

**Request body:**

| Field | Type | Required | Notes |
|-------|------|----------|-------|
| `transcript` | string | Yes | Free-form text from voice or keyboard (max 2000 chars) |
| `consentGiven` | boolean | Yes | Must be `true` |
| `priorSignals` | object | No | Partial signals from a previous follow-up round |

**Success:** `200 OK` — discriminated union (`type` field):

**Emergency:**
```json
{
  "type": "emergency",
  "reason": "Your description suggests you may need immediate emergency help."
}
```

**Confirm (enough signals to route):**
```json
{
  "type": "confirm",
  "summary": "You described a breathing concern with moderate severity.",
  "signals": { /* TriageSignals object ready for /api/triage/recommend */ }
}
```

**Follow-up (missing information):**
```json
{
  "type": "follow_up",
  "questions": [
    {
      "id": "category",
      "text": "What is your main health concern?",
      "options": ["Breathing or lung issue", "Chest discomfort", "..."]
    }
  ],
  "partialSignals": { /* Partial TriageSignals extracted so far */ }
}
```

**Errors:**

- `400` — invalid body (`INVALID_BODY`), consent not given (`CONSENT_REQUIRED`), or missing transcript (`MISSING_TRANSCRIPT`).

**Server observability (Vercel / Nitro logs):** Each request emits one JSON line with `"event":"intake_request_summary"` (`geminiModel`, `geminiAttempted`, `fallbackReason`, `usedGemini`, duration, final classification). Cold starts may log `"event":"gemini_intake_boot"` with the resolved model id. Optional verbose tracing: set **`INTAKE_DEBUG_LOGS=true`** or **`NUXT_INTAKE_DEBUG_LOGS=true`** or **`NUXT_INTAKE_DEBUG_LOGS`** in runtime config — logs stage events (`intake_request_received`, `intake_gemini_*`, `intake_fallback_*`) without secrets or full transcripts (only length + short preview). Filter logs by `"component":"intake"`.

---

## `POST /api/triage/recommend`

**Purpose:** Deterministic care **route** from structured signals (no free-text diagnosis).

**Request body:**

| Field | Type | Required | Notes |
|-------|------|----------|--------|
| `signals` | object | Yes | Shape fixed per `rulesVersion`; see types in repo |
| `signals.persona` | string enum | No | e.g. self \| dependent — if omitted, server uses default |
| `signals.redFlags` | boolean | Yes | Any selected red-flag → ED path per rules |
| `signals.categoryKey` | string | No | Concern category (non-diagnostic label) |
| `signals.severity` | string enum | No | e.g. mild \| moderate \| severe — mapping is rule-defined |
| `signals.canWait` | boolean | No | Urgency proxy |
| `signals.afterHours` | boolean | No | Affects clinic vs urgent care routing |
| `signals.medicationOrMinorIssue` | boolean | No | Example axis from SPEC code style |
| `consentGiven` | boolean | Yes | Must be `true` to process health-adjacent signals per boundaries |

**Success:** `200 OK`

```json
{
  "rulesVersion": "GoWhere-wa-1.0.0",
  "route": "ed | gp | pharmacy | urgent_care_clinic",
  "urgency": "immediate | today | 24_to_48h | routine",
  "shortReason": "Plain-language explanation of why this care setting fits (not a diagnosis).",
  "reasonCodes": ["string"],
  "ui": {
    "headlineKey": "string",
    "bodyKey": "string"
  }
}
```

- **`urgency`** — How soon to act (routing hint, not a clinical triage score).
- **`shortReason`** — Non-diagnostic rationale shown in the UI; safe to display verbatim.

**Client behavior:** Prefer `shortReason` for primary copy; map `reasonCodes` and `ui.*Key` for localization or A/B copy tests. Do not present reason codes as medical facts or diagnoses.

**Error payload shape (typical):**

```json
{
  "error": {
    "code": "CONSENT_REQUIRED",
    "message": "Consent is required before care routing."
  }
}
```

**Errors:**

- `400` — invalid body: not a JSON object (`INVALID_BODY`), `consentGiven` not strictly `true` (`CONSENT_REQUIRED`), or invalid enum values.
- `422` — valid JSON but signals inconsistent (optional; prefer deterministic defaults if SPEC prefers no dead ends).

---

## `GET /api/providers/nearby`

**Purpose:** Return nearby care facilities for list/map. Reads from Supabase `providers` when URL + service key are set and the query succeeds; otherwise returns the same **deterministic** embedded demo list (`static_fallback`). Empty DB or query errors also fall back so the golden demo path always has venues.

**Ranking:** With **`lat` + `lng`**, results are sorted by straight-line distance (Haversine) and include **`distanceKm`**. With **`suburb`** only (no coords), rows are filtered by substring match on `suburb` / `address`; if nothing matches, all rows for that **`route`** are returned — still **type-filtered** by `route` (`ed`, `gp`, `pharmacy`, `urgent_care_clinic`).

**Query parameters:**

| Param | Type | Required | Notes |
|-------|------|----------|--------|
| `lat` | number | Conditional | With `lng`, sorts matches by Haversine distance (km) and includes **`distanceKm`** on each item |
| `lng` | number | Conditional | |
| `suburb` | string | Conditional | Preferentially filters rows whose `suburb` or `address` contains the substring (case-insensitive). If **no** row matches, returns all rows for `route` (avoids empty results for broad labels like “Perth” vs seeded suburbs). Trimmed; **max 120 chars** (longer input truncated server-side). |
| `route` | string | No | Care route: `ed` \| `gp` \| `pharmacy` \| `urgent_care_clinic`; invalid values default to `gp`. If the same key is repeated, the **first** value wins (matches `parseCareRouteQuery` in `shared/care-routes.ts`). |
| `limit` | number | No | Max rows to return (default **3**, min 1, max **25**). List UIs should use a small limit. |

**Success:** `200 OK`

```json
{
  "source": "supabase | static_fallback",
  "items": [
    {
      "id": "string",
      "name": "string",
      "type": "string",
      "address": "string",
      "lat": 0,
      "lng": 0,
      "phone": "string | null",
      "distanceKm": 0
    }
  ]
}
```

- **`distanceKm`** — Included only when `lat` + `lng` were provided; straight-line distance in kilometres (Haversine), rounded to one decimal. Omitted for suburb-only lookups.

**Errors:**

- `400` — missing location strategy (neither coords nor suburb), or invalid `lat`/`lng` (non-finite numbers).

**Migrations:** `supabase/migrations/001_providers.sql`, `002_households.sql`; seed: `supabase/seed/providers.sql`.

---

## `GET /api/directions/route`

**Purpose:** Optional server-side directions polyline or metadata; may be stubbed with external-only navigation.

**Query parameters:** `fromLat`, `fromLng`, `toLat`, `toLng` (numbers).

**Success:** `200 OK`

```json
{
  "mode": "stub | external",
  "providerUrl": "string | null"
}
```

**Errors:**

- `400` — invalid coordinates.
- `502` — upstream directions unavailable (client falls back to “Open in maps”).

---

## Notes

- **Rate limiting:** Recommended on public `recommend` and `nearby` in production; hackathon MVP may defer.
- **PII:** Do not log full request bodies containing health signals in production without policy; dev-only logging only.
- **Vercel / env:** Use the same variable names as `.env.example`. `NUXT_SUPABASE_SERVICE_ROLE_KEY` must be **server-only** (never `NUXT_PUBLIC_*`). Enable vars for **Preview** if you test preview URLs; **Production-only** scope omits them on previews. Server resolves URL/key from `useRuntimeConfig()` and `process.env.NUXT_*` (see `server/lib/supabase.ts`). See `README.md` troubleshooting.

**Status:** Contract for MVP; evolve with `tasks/plan.md` and engine versioning.
