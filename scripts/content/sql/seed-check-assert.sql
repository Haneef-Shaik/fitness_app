-- CT-1 seed check, part 3 of 3: after the second run, compare against parts 1 and 2. Then insert each starter
-- template as a programme of the synthetic member, which the days contract and the exercise-snapshot trigger must
-- accept. Any failure raises an error; success raises one notice. The command then rolls everything back.
create temporary table ct1_member_after on commit drop as
  select 'profiles'::text as tbl, count(*) as n, md5(coalesce(string_agg(row_to_json(p)::text, ',' order by p.id), '')) as digest from public.profiles p
  union all
  select 'programmes'::text, count(*), md5(coalesce(string_agg(row_to_json(g)::text, ',' order by g.id), '')) from public.programmes g;
do $check$
declare
  seed_ids uuid[] := array(select t.x::uuid from jsonb_array_elements_text(current_setting('ct1.seed_ids')::jsonb) as t(x));
  expected integer;
  failures text[] := '{}';
  n bigint;
  tpl jsonb;
  accepted integer := 0;
begin
  expected := cardinality(seed_ids);
  select count(*) into n from ct1_after_first where owner_id is null;
  if n <> expected then failures := failures || format('after the first run %s of %s catalogue keys hold a catalogue row', n, expected); end if;
  select count(*) into n from public.exercises e where e.id = any(seed_ids);
  if n <> expected then failures := failures || format('after the second run %s rows exist for %s catalogue keys', n, expected); end if;
  select count(*) into n from ct1_after_first f left join public.exercises e on e.id = f.id and e.version = f.version
    where e.id is null or row_to_json(e)::text <> f.row_text;
  if n <> 0 then failures := failures || format('the second run changed or removed %s catalogue rows', n); end if;
  select count(*) into n from ct1_exercises_before b left join public.exercises e on e.id = b.id and e.version = b.version
    where e.id is null or row_to_json(e)::text <> b.row_text;
  if n <> 0 then failures := failures || format('%s exercise rows that existed before the seed changed or vanished', n); end if;
  if not exists (select 1 from ct1_exercises_before where id = 'c7100000-0000-4000-8000-0000000000b1') then
    failures := failures || 'the synthetic member-owned exercise is missing from the snapshot'::text;
  end if;
  select count(*) into n from ct1_member_before b full join ct1_member_after a using (tbl)
    where a.digest is distinct from b.digest or a.n is distinct from b.n;
  if n <> 0 then failures := failures || 'profile or programme rows changed'::text; end if;
  select count(*) into n from public.exercises e
    where not (e.id = any(seed_ids)) and not exists (select 1 from ct1_exercises_before b where b.id = e.id and b.version = e.version);
  if n <> 0 then failures := failures || format('%s unexpected exercise rows appeared', n); end if;
  if cardinality(failures) > 0 then raise exception 'CT-1 seed check failed: %', array_to_string(failures, '; '); end if;
  for tpl in select value from jsonb_array_elements(current_setting('ct1.templates')::jsonb) loop
    insert into public.programmes (id, owner_id, name, description, days)
    values (gen_random_uuid(), 'c7100000-0000-4000-8000-0000000000a1', tpl->>'name', tpl->>'description', tpl->'days');
    accepted := accepted + 1;
  end loop;
  raise notice 'CT-1 seed check: % catalogue rows present once after two runs; the second run changed nothing; % pre-existing exercise rows and the member tables unchanged; % starter templates accepted by the programme contract',
    expected, (select count(*) from ct1_exercises_before), accepted;
end
$check$;
