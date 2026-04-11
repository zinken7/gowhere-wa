-- GoWhere WA — provider directory (no user PII; public care venue metadata).
-- RLS: anon/authenticated may read active rows; writes via service role / dashboard only.

create table public.providers (
  id text primary key,
  name text not null,
  type text not null
    check (type in ('ed', 'gp', 'pharmacy', 'urgent_care_clinic')),
  address text not null,
  lat double precision not null,
  lng double precision not null,
  phone text,
  suburb text,
  is_active boolean not null default true,
  created_at timestamptz not null default now()
);

create index providers_type_active_idx on public.providers (type) where is_active = true;
create index providers_suburb_lower_idx on public.providers (lower(suburb));

alter table public.providers enable row level security;

create policy "providers_select_active"
  on public.providers
  for select
  to anon, authenticated
  using (is_active = true);

comment on table public.providers is 'Seeded care venue directory; not a complete WA listing.';
