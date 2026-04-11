-- Future user-scoped grouping (optional auth). No anon access until policies are added with auth.

create table public.households (
  id uuid primary key default gen_random_uuid(),
  label text,
  created_at timestamptz not null default now()
);

alter table public.households enable row level security;

-- Intentionally no policies: deny all for anon/authenticated until Supabase Auth + app rules are defined.
comment on table public.households is 'Reserved for authenticated household grouping; RLS locked down for MVP.';
