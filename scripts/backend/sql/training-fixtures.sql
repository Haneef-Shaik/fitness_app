-- training.v1 fixture check (AR-1 box 4; docs/architecture/003 4.13). It reads the one shared fixture,
-- packages/domain/fixtures/ac03-training.v1.json, which packages/domain/src/fixtures.test.ts also reads,
-- from the psql variable `fixture`, and checks the private.*_v1 functions of
-- supabase/migrations/20261025234317_training_formula_v1.sql against it. From the repository root:
--   psql -X -v ON_ERROR_STOP=1 -v fixture="$(cat packages/domain/fixtures/ac03-training.v1.json)" -f scripts/backend/sql/training-fixtures.sql
-- It holds no expected values: every expectation comes from the fixture. It names only the AC03 vector ids
-- it requires (ac03-working-80x8, ac03-session). Everything runs in one
-- transaction that is always rolled back, so it creates and changes nothing.
\set ON_ERROR_STOP on
\if :{?fixture}
\else
do $$ begin raise exception 'Pass the fixture text: psql -v fixture="$(cat packages/domain/fixtures/ac03-training.v1.json)"'; end $$;
\endif

begin;
set local search_path = '';
select pg_catalog.set_config('fitlog.training_fixture', :'fixture', true) is not null as fixture_loaded;
do $$
declare
 f jsonb := current_setting('fitlog.training_fixture')::jsonb;
 by_id jsonb; vec jsonb; ex jsonb; fn regprocedure; grantee text; failures text[] := '{}';
 got text; volume numeric; working bigint; bad bigint;
begin
 raise notice 'training.v1 fixture text sha256 %', encode(sha256(convert_to(current_setting('fitlog.training_fixture'), 'UTF8')), 'hex');
 if coalesce(f->>'fixture' <> 'ac03-training' or f->>'formula' <> 'training.v1' or f->'fixtureVersion' <> '1'::jsonb
   or jsonb_typeof(f->'exercises') <> 'object' or jsonb_array_length(f->'setVectors') < 10 or jsonb_array_length(f->'sessionVectors') < 1, true) then
  raise exception 'Not the training.v1 fixture, or it has too few vectors';
 end if;

 -- The formula functions are pure, security invoker, and closed to PUBLIC and the API roles (a role this
 -- database lacks is skipped). A missing function stops the check here with "does not exist".
 foreach fn in array array['private.training_set_eligible_v1(text,boolean)'::regprocedure,
   'private.external_set_volume_v1(text,text,integer,text,integer,numeric,boolean)'::regprocedure,
   'private.epley_e1rm_v1(text,text,text,integer,numeric,boolean)'::regprocedure] loop
  if not exists (select 1 from pg_proc p where p.oid = fn and p.provolatile = 'i' and not p.prosecdef and p.proconfig = array['search_path=""']) then
   failures := failures || format('%s must be immutable and security invoker with an empty search_path', fn);
  end if;
  for grantee in select r.role_name from unnest(array['public', 'anon', 'authenticated']) as r(role_name)
    where r.role_name = 'public' or exists (select 1 from pg_roles where rolname = r.role_name) loop
   if has_function_privilege(grantee::name, fn::oid, 'execute') then failures := failures || format('%s is executable by %s', fn, grantee); end if;
  end loop;
 end loop;

 select jsonb_object_agg(x.item->>'id', x.item), count(*) - count(distinct x.item->>'id')
   into by_id, bad from jsonb_array_elements(f->'setVectors') as x(item);
 if bad <> 0 then failures := failures || 'set vector ids are not unique'::text; end if;
 -- The AC03 claim needs its own vectors, so a fixture without them fails even when every other vector passes.
 -- These are ids only; their expected values stay in the fixture.
 if not coalesce(by_id ? 'ac03-working-80x8', false) then failures := failures || 'set vector ac03-working-80x8 is missing'::text; end if;
 if not exists (select 1 from jsonb_array_elements(f->'sessionVectors') as x(item) where x.item->>'id' = 'ac03-session') then
  failures := failures || 'session vector ac03-session is missing'::text;
 end if;
 -- Session ids are present and unique across asserted and pending vectors, and every pending set reference resolves.
 select count(*) - count(distinct x.item->>'id') into bad
   from jsonb_array_elements(coalesce(f->'sessionVectors', '[]') || coalesce(f->'pendingSessionVectors', '[]')) as x(item);
 if bad <> 0 then failures := failures || 'session vector ids are missing or not unique'::text; end if;
 select count(*) into bad from jsonb_array_elements(coalesce(f->'pendingSessionVectors', '[]')) as x(item)
   cross join lateral jsonb_array_elements_text(x.item->'sets') as r(ref) where not coalesce(by_id ? r.ref, false);
 if bad <> 0 then failures := failures || 'a pending session vector names an unknown set vector'::text; end if;

 for vec in select x.item from jsonb_array_elements(f->'setVectors') as x(item) loop
  ex := f->'exercises'->(vec->>'exercise');
  -- Nullable is not optional: a missing key is malformed instead of reading as null.
  if coalesce(ex is null or jsonb_typeof(ex->'type') <> 'string' or jsonb_typeof(ex->'loadBasis') <> 'string' or jsonb_typeof(ex->'multiplier') <> 'number'
    or jsonb_typeof(vec->'setType') <> 'string' or jsonb_typeof(vec->'deleted') <> 'boolean' or jsonb_typeof(vec->'reps') not in ('number', 'null')
    or jsonb_typeof(vec->'loadKg') not in ('string', 'null') or jsonb_typeof(vec->'expect'->'volumeKgReps') not in ('string', 'null')
    or jsonb_typeof(vec->'expect'->'e1rmKg') not in ('string', 'null'), true) then
   failures := failures || format('%s: malformed set vector', coalesce(vec->>'id', '(no id)'));
   continue;
  end if;
  got := trim_scale(round(private.external_set_volume_v1(ex->>'type', ex->>'loadBasis', (ex->>'multiplier')::integer, vec->>'setType',
    (vec->>'reps')::integer, (vec->>'loadKg')::numeric, (vec->>'deleted')::boolean), 6))::text;
  if got is distinct from vec->'expect'->>'volumeKgReps' then
   failures := failures || format('%s volumeKgReps: expected %s, got %s', vec->>'id', coalesce(vec->'expect'->>'volumeKgReps', 'null'), coalesce(got, 'null'));
  end if;
  got := trim_scale(round(private.epley_e1rm_v1(ex->>'type', ex->>'loadBasis', vec->>'setType',
    (vec->>'reps')::integer, (vec->>'loadKg')::numeric, (vec->>'deleted')::boolean), 6))::text;
  if got is distinct from vec->'expect'->>'e1rmKg' then
   failures := failures || format('%s e1rmKg: expected %s, got %s', vec->>'id', coalesce(vec->'expect'->>'e1rmKg', 'null'), coalesce(got, 'null'));
  end if;
 end loop;

 -- Session vectors name set vectors by id. Pending (MB-4) session vectors are not asserted here either.
 for vec in select x.item from jsonb_array_elements(f->'sessionVectors') as x(item) loop
  select count(*) filter (where not coalesce(by_id ? r.ref, false)) into bad from jsonb_array_elements_text(vec->'sets') as r(ref);
  if coalesce(bad <> 0 or jsonb_array_length(vec->'sets') = 0 or jsonb_typeof(vec->'expect'->'volumeKgReps') <> 'string'
    or jsonb_typeof(vec->'expect'->'workingSets') <> 'number', true) then
   failures := failures || format('%s: malformed session vector', coalesce(vec->>'id', '(no id)'));
   continue;
  end if;
  select sum(private.external_set_volume_v1(e.exercise->>'type', e.exercise->>'loadBasis', (e.exercise->>'multiplier')::integer, s.set_vector->>'setType',
           (s.set_vector->>'reps')::integer, (s.set_vector->>'loadKg')::numeric, (s.set_vector->>'deleted')::boolean)),
         count(*) filter (where private.training_set_eligible_v1(s.set_vector->>'setType', (s.set_vector->>'deleted')::boolean))
    into volume, working
    from jsonb_array_elements_text(vec->'sets') as r(ref)
    cross join lateral (select by_id->r.ref) as s(set_vector)
    cross join lateral (select f->'exercises'->(s.set_vector->>'exercise')) as e(exercise);
  got := trim_scale(round(volume, 6))::text;
  if got is distinct from vec->'expect'->>'volumeKgReps' then
   failures := failures || format('%s volumeKgReps: expected %s, got %s', vec->>'id', vec->'expect'->>'volumeKgReps', coalesce(got, 'null'));
  end if;
  if working is distinct from (vec->'expect'->>'workingSets')::bigint then
   failures := failures || format('%s workingSets: expected %s, got %s', vec->>'id', vec->'expect'->>'workingSets', working);
  end if;
 end loop;

 if cardinality(failures) > 0 then raise exception 'training.v1 fixture failed in SQL: %', array_to_string(failures, '; '); end if;
 raise notice 'training.v1: % set vectors and % session vectors passed in SQL; % pending MB-4 session vectors not asserted',
  jsonb_array_length(f->'setVectors'), jsonb_array_length(f->'sessionVectors'), coalesce(jsonb_array_length(f->'pendingSessionVectors'), 0);
end $$;
rollback;
