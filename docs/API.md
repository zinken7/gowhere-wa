# CarePath WA — HTTP API (MVP)

**Base URL:** Same origin as the Nuxt app (Nitro). **No public Supabase keys** for privileged operations; server routes use server-side config only.

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
  "rulesVersion": "string",
  "route": "ed | gp | pharmacy | urgent_care_clinic",
  "reasonCodes": ["string"],
  "ui": {
    "headlineKey": "string",
    "bodyKey": "string"
  }
}
```

**Client behavior:** Map `reasonCodes` and keys to localized copy on the client; do not show internal rule IDs as medical facts.

**Errors:**

- `400` — invalid body, missing `consentGiven`, or invalid enum values.
- `422` — valid JSON but signals inconsistent (optional; prefer deterministic defaults if SPEC prefers no dead ends).

---

## `GET /api/providers/nearby`

**Purpose:** Return nearby care facilities for list/map (seeded DB or fallback).

**Query parameters:**

| Param | Type | Required | Notes |
|-------|------|----------|--------|
| `lat` | number | Conditional | Required if using geo query |
| `lng` | number | Conditional | |
| `suburb` | string | Conditional | Fallback when geolocation denied |
| `route` | string | No | Filter by type of care aligned to recommendation |

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

- `400` — missing location strategy (neither coords nor suburb).

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

**Status:** Contract for MVP; evolve with `tasks/plan.md` and engine versioning.
