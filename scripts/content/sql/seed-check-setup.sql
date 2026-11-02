-- CT-1 seed check, part 1 of 3 (scripts/content/verify-seed.mjs). The command wraps every part in one transaction
-- that always ends in rollback, so nothing here is ever kept. A synthetic member (never a real account, no real
-- address) gets private rows, including an exercise that shares a catalogue name. Then every exercise row that
-- exists before the seed, and a digest of the member tables, are snapshotted for part 3.
insert into auth.users (id, aud, role, email, email_confirmed_at, created_at, updated_at)
values ('c7100000-0000-4000-8000-0000000000a1', 'authenticated', 'authenticated', 'ct1-seed-check@example.invalid', now(), now(), now());
insert into public.profiles (id, display_name, date_of_birth, terms_version, privacy_version)
values ('c7100000-0000-4000-8000-0000000000a1', 'CT-1 seed check', date '1990-01-01', 'ct1-seed-check', 'ct1-seed-check');
insert into public.exercises (id, version, owner_id, name, logging_type, load_basis, multiplier, equipment, primary_muscles, instructions, source)
values ('c7100000-0000-4000-8000-0000000000b1', 1, 'c7100000-0000-4000-8000-0000000000a1', 'Barbell back squat', 'resistance', 'total', 1,
  'Barbell', array['Quadriceps'], 'A member''s own exercise that shares a catalogue name.', 'member');
insert into public.programmes (id, owner_id, name, description, days)
values ('c7100000-0000-4000-8000-0000000000c1', 'c7100000-0000-4000-8000-0000000000a1', 'Synthetic plan', 'CT-1 seed check', '[]'::jsonb);
create temporary table ct1_exercises_before on commit drop as
  select e.id, e.version, row_to_json(e)::text as row_text from public.exercises e;
create temporary table ct1_member_before on commit drop as
  select 'profiles'::text as tbl, count(*) as n, md5(coalesce(string_agg(row_to_json(p)::text, ',' order by p.id), '')) as digest from public.profiles p
  union all
  select 'programmes'::text, count(*), md5(coalesce(string_agg(row_to_json(g)::text, ',' order by g.id), '')) from public.programmes g;
