-- Demo seed — aligns with server/lib/static-providers.ts for consistent golden path.
-- Apply after migrations: `supabase db reset` or run in SQL editor.

insert into public.providers (id, name, type, address, lat, lng, phone, suburb, is_active)
values
  -- Hospitals
  ('hospital-royal-perth','Royal Perth Hospital','ed','197 Wellington Street, Perth WA 6000',-31.9516,115.866,'08 9224 2244','Perth',true),
  ('hospital-fiona-stanley','Fiona Stanley Hospital','ed','11 Robin Warren Drive, Murdoch WA 6150',-32.0694,115.8351,'08 6152 2222','Murdoch',true),
  ('hospital-sir-charles-gairdner','Sir Charles Gairdner Hospital','ed','Hospital Avenue, Nedlands WA 6009',-31.968,115.8177,'08 6457 3333','Nedlands',true),
  ('hospital-perth-childrens','Perth Children''s Hospital','ed','15 Hospital Avenue, Nedlands WA 6009',-31.9633,115.8172,'08 6456 2222','Nedlands',true),
  ('hospital-joondalup','Joondalup Health Campus','ed','Cnr Grand Boulevard & Shenton Avenue, Joondalup WA 6027',-31.7442,115.769,'08 9400 9400','Joondalup',true),
  ('hospital-midland','St John of God Midland Public Hospital','ed','1 Clayton Street, Midland WA 6056',-31.8895,116.0107,'08 9462 4000','Midland',true),
  ('hospital-armadale','Armadale Health Service','ed','3056 Albany Highway, Mount Nasura WA 6112',-32.1519,116.0125,'08 9391 2000','Armadale',true),
  ('hospital-king-edward','King Edward Memorial Hospital','ed','374 Bagot Road, Subiaco WA 6008',-31.9572,115.8206,'08 6458 2222','Subiaco',true),
  ('hospital-rockingham','Rockingham General Hospital','ed','Elanora Drive, Cooloongup WA 6168',-32.2927,115.7698,'08 9599 4000','Rockingham',true),

  -- Urgent care
  ('ucc-armadale','St John Urgent Care Armadale','urgent_care_clinic','Shop 62/63, 10 Orchard Avenue, Armadale WA 6112',-32.1498,116.0159,'08 9399 0909','Armadale',true),
  ('ucc-cannington','St John Urgent Care Cannington','urgent_care_clinic','1472 Albany Highway, Beckenham WA 6107',-32.0183,115.9383,'08 9350 8000','Beckenham',true),
  ('ucc-cockburn','St John Urgent Care Cockburn','urgent_care_clinic','Cockburn Gateway Shopping Centre, 816 Beeliar Drive, Success WA 6164',-32.1422,115.8485,'08 6174 6000','Success',true),
  ('ucc-joondalup','St John Urgent Care Joondalup','urgent_care_clinic','Joondalup Gate, 21 Joondalup Drive, Edgewater WA 6027',-31.7538,115.7704,'08 9400 7000','Edgewater',true),
  ('ucc-midland','St John Urgent Care Midland','urgent_care_clinic','Building 2, Unit 6-7, 8 Clayton Street, Midland WA 6056',-31.889,116.0108,'08 9260 5600','Midland',true),
  ('ucc-osborne-park','St John Urgent Care Osborne Park','urgent_care_clinic','435 Scarborough Beach Road, Osborne Park WA 6017',-31.903,115.8109,'08 9267 8600','Osborne Park',true),
  ('ucc-kelmscott','St John Urgent Care Kelmscott','urgent_care_clinic','3043 Albany Highway, Kelmscott WA 6111',-32.1243,116.0183,'08 9334 6800','Kelmscott',true),

  -- GP
  ('gp-st-john-armadale','St John General Practice Armadale','gp','Shop 62/63, 10 Orchard Avenue, Armadale WA 6112',-32.1498,116.0159,'08 9399 0909','Armadale',true),
  ('gp-st-john-cannington','St John General Practice Cannington','gp','1472 Albany Highway, Beckenham WA 6107',-32.0183,115.9383,'08 9350 8000','Beckenham',true),
  ('gp-st-john-cockburn','St John General Practice Cockburn','gp','Cockburn Gateway Shopping Centre, 816 Beeliar Drive, Success WA 6164',-32.1422,115.8485,'08 6174 6000','Success',true),
  ('gp-st-john-joondalup','St John General Practice Joondalup','gp','Joondalup Gate, 21 Joondalup Drive, Edgewater WA 6027',-31.7538,115.7704,'08 9400 7000','Edgewater',true),
  ('gp-st-john-midland','St John General Practice Midland','gp','Building 2, Unit 6-7, 8 Clayton Street, Midland WA 6056',-31.889,116.0108,'08 9260 5600','Midland',true),
  ('gp-st-john-osborne-park','St John General Practice Osborne Park','gp','435 Scarborough Beach Road, Osborne Park WA 6017',-31.903,115.8109,'08 9267 8600','Osborne Park',true),

  -- Pharmacy
  ('pharmacy-chemist-warehouse-perth-city-centre','Chemist Warehouse Perth City Centre','pharmacy','Shop 25A, 580 Hay Street, Perth WA 6000',-31.953,115.8587,'08 6147 5448','Perth',true),
  ('pharmacy-chemist-warehouse-perth','Chemist Warehouse Perth','pharmacy','1/109 Murray Street, Perth WA 6000',-31.9527,115.8605,'08 9325 7948','Perth',true),
  ('pharmacy-777-perth-city','Pharmacy 777 Perth City','pharmacy','Gledden Building, Lot 3, 731 Hay Street, Perth WA 6000',-31.9522,115.8588,'08 9321 6411','Perth',true),
  ('pharmacy-priceline-rokeby-road','Priceline Pharmacy Rokeby Road','pharmacy','24 Rokeby Road, Subiaco WA 6008',-31.9483,115.8243,'08 6380 1000','Subiaco',true),
  ('pharmacy-subiaco-7-day-chemist','Subiaco 7 Day Chemist','pharmacy','157 Rokeby Road, Subiaco WA 6008',-31.9476,115.8237,'08 9381 3099','Subiaco',true),
  ('pharmacy-priceline-east-vic-park','Priceline Pharmacy East Victoria Park','pharmacy','Unit 4, 779 Albany Highway, East Victoria Park WA 6101',-31.9865,115.9029,'08 9470 6644','East Victoria Park',true),
  ('pharmacy-777-south-perth','Pharmacy 777 South Perth','pharmacy','143 Canning Highway, South Perth WA 6151',-31.9871,115.8707,'08 9367 6200','South Perth',true),
  ('pharmacy-777-east-perth','Pharmacy 777 East Perth','pharmacy','Shop 3, 81-95 Royal Street, East Perth WA 6004',-31.96,115.8745,'08 9221 1311','East Perth',true),
  ('pharmacy-terrywhite-rivervale','TerryWhite Chemmart Rivervale','pharmacy','Rivervale East PO, 118 Kooyong Road, Rivervale WA 6103',-31.9551,115.9052,'08 9472 4200','Rivervale',true)

on conflict (id) do update set
  name = excluded.name,
  type = excluded.type,
  address = excluded.address,
  lat = excluded.lat,
  lng = excluded.lng,
  phone = excluded.phone,
  suburb = excluded.suburb,
  is_active = excluded.is_active;