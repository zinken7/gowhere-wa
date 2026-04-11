-- Demo seed — aligns with server/lib/static-providers.ts for consistent golden path.
-- Apply after migrations: `supabase db reset` or run in SQL editor.

insert into public.providers (id, name, type, address, lat, lng, phone, suburb, is_active)
values
  (
    'ed-royal-perth',
    'Royal Perth Hospital Emergency',
    'ed',
    '85 Wellington St, Perth WA 6000',
    -31.9536,
    115.8577,
    '000',
    'Perth',
    true
  ),
  (
    'ed-scgh',
    'Sir Charles Gairdner Hospital Emergency',
    'ed',
    'Hospital Ave, Nedlands WA 6009',
    -31.9692,
    115.8119,
    '000',
    'Nedlands',
    true
  ),
  (
    'gp-northbridge',
    'Northbridge GP Clinic (demo)',
    'gp',
    'Lake St, Northbridge WA 6003',
    -31.9469,
    115.8547,
    '08 0000 0000',
    'Northbridge',
    true
  ),
  (
    'gp-subiaco',
    'Subiaco Medical Centre (demo)',
    'gp',
    'Rokeby Rd, Subiaco WA 6008',
    -31.9483,
    115.8267,
    '08 0000 0001',
    'Subiaco',
    true
  ),
  (
    'pharm-cbd',
    'Perth City Pharmacy (demo)',
    'pharmacy',
    'Murray St, Perth WA 6000',
    -31.9523,
    115.8613,
    '08 0000 0002',
    'Perth',
    true
  ),
  (
    'uc-osborne-park',
    'Urgent Care — Osborne Park (demo)',
    'urgent_care_clinic',
    'Main St, Osborne Park WA 6017',
    -31.9047,
    115.8147,
    '08 0000 0003',
    'Osborne Park',
    true
  )
on conflict (id) do update set
  name = excluded.name,
  type = excluded.type,
  address = excluded.address,
  lat = excluded.lat,
  lng = excluded.lng,
  phone = excluded.phone,
  suburb = excluded.suburb,
  is_active = excluded.is_active;
