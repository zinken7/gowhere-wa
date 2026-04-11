# CarePath WA — HTTP API (MVP)

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
  "service": "carepath-wa",
  "time": "2026-04-11T00:00:00.000Z"
}
```

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
  "rulesVersion": "carepath-wa-1.0.0",
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

**Query parameters:**

| Param | Type | Required | Notes |
|-------|------|----------|--------|
| `lat` | number | Conditional | With `lng`, sorts matches by Haversine distance (km) |
| `lng` | number | Conditional | |
| `suburb` | string | Conditional | Preferentially filters rows whose `suburb` or `address` contains the substring (case-insensitive). If **no** row matches, returns all rows for `route` (avoids empty results for broad labels like “Perth” vs seeded suburbs). Trimmed; **max 120 chars** (longer input truncated server-side). |
| `route` | string | No | Care route: `ed` \| `gp` \| `pharmacy` \| `urgent_care_clinic`; invalid values default to `gp` |

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
      "phone": "string | null"
    }
  ]
}
```

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
- **Vercel / env:** Use the same variable names as `.env.example`. `NUXT_SUPABASE_SERVICE_ROLE_KEY` must be **server-only** (never `NUXT_PUBLIC_*`). See `README.md` (Vercel preview verification).

**Status:** Contract for MVP; evolve with `tasks/plan.md` and engine versioning.
