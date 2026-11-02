-- CT-1 seed check, part 2 of 3: the catalogue rows exactly as the first seed run left them.
create temporary table ct1_after_first on commit drop as
  select e.id, e.version, e.owner_id, row_to_json(e)::text as row_text
  from public.exercises e
  where e.id in (select t.x::uuid from jsonb_array_elements_text(current_setting('ct1.seed_ids')::jsonb) as t(x));
