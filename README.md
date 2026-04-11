# GoWhere WA (MVP)

Panic-proof **care routing** for Western Australia — deterministic rules, not a diagnosis. Stack: **Nuxt 4**, **Nitro**, **Nuxt UI**, optional **Supabase** for provider data.

## Requirements

- **Node.js** 22+
- **pnpm** 10+ (see `packageManager` in `package.json`)

## Quick start

```bash
pnpm install
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000). Run checks before pushing:

```bash
pnpm lint && pnpm test && pnpm typecheck && pnpm build
```

## Environment variables

| Name | Scope | Purpose |
|------|--------|---------|
| `NUXT_PUBLIC_SUPABASE_URL` | **Public** (embedded in client; safe) | Supabase project URL (`https://xxx.supabase.co`) |
| `NUXT_SUPABASE_SERVICE_ROLE_KEY` | **Server-only** (Nitro / API routes; never `NUXT_PUBLIC_*`) | Service role key for `server/lib/supabase.ts` — **never commit** |

Nuxt maps these to `runtimeConfig.public.supabaseUrl` and `runtimeConfig.supabaseServiceRoleKey` (see `nuxt.config.ts`). The service role key is **not** exposed to the browser bundle.

Copy `.env.example` to `.env` locally. For Vercel, add the same names under **Project → Settings → Environment Variables** (enable for **Preview** and/or **Production** as needed).

## Supabase (optional)

1. Create a project (e.g. region **Sydney `ap-southeast-2`** per `docs/SPEC.md` unless you standardise elsewhere).
2. Run SQL in order: `supabase/migrations/001_providers.sql`, `002_households.sql`.
3. Seed demo rows: `supabase/seed/providers.sql`.

If URL or service key is missing or the query fails, `GET /api/providers/nearby` returns **`static_fallback`** demo data so the app still works.

## Deploy on Vercel

1. Push this repo to GitHub (or GitLab / Bitbucket) and **Import** it in [Vercel](https://vercel.com).
2. **Framework preset:** Nuxt (auto-detected) — build command `pnpm build` / output handled by Nitro.
3. Set **`NUXT_PUBLIC_SUPABASE_URL`** and **`NUXT_SUPABASE_SERVICE_ROLE_KEY`** for the environments you use (at minimum **Preview** for PR previews).
4. Create a **preview deployment** (open a PR or use **Deployments → Redeploy**).

Do not paste the service role into any `PUBLIC` or client-side variable.

---

## Vercel preview verification (checkpoint **A5**)

Run these against the **preview URL** Vercel assigns (replace `https://YOUR-PREVIEW.vercel.app`).

| # | Check | How |
|---|--------|-----|
| 1 | App shell loads | Open `/` — GoWhere layout, no blank page. |
| 2 | Health | `curl -sS "https://YOUR-PREVIEW.vercel.app/api/health"` → HTTP **200**, JSON with `"ok": true`, `"service": "GoWhere-wa"`. |
| 3 | Golden path | In browser: consent → persona → category → red flags → severity → **recommendation** with card + list; no dead end. |
| 4 | Providers with Supabase (env set) | `curl -sS "https://YOUR-PREVIEW.vercel.app/api/providers/nearby?route=gp&suburb=Perth"` → HTTP **200**, JSON `"source": "supabase"` if DB seeded and keys valid; otherwise `"static_fallback"` is acceptable. |
| 5 | Fallback safe | Temporarily clear **`NUXT_SUPABASE_SERVICE_ROLE_KEY`** on a **test** preview (or use a project without DB): same `curl` → **200** and venues in `items`, `"source": "static_fallback"`. Restore env after. |

**Manual sign-off:** A5 is “done” when rows 1–3 pass on a real preview URL; 4–5 validate Supabase wiring and fallback.

API contract: `docs/API.md`.

## Documentation

| Doc | Purpose |
|-----|---------|
| `docs/SPEC.md` | Product scope and boundaries |
| `docs/ARCHITECTURE.md` | Runtime and slices |
| `docs/API.md` | HTTP contracts |

## License

See `LICENSE`.
