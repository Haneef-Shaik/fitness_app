create or replace function private.validate_member_record() returns trigger language plpgsql security definer set search_path='' as $$
declare items jsonb; ex jsonb; current_ex public.exercises;
begin
 if tg_table_name='programmes' then
  perform private.assert_contract('days',new.days);
  if exists(select 1 from jsonb_array_elements(new.days) d cross join lateral jsonb_array_elements(d->'exercises') p where (p->>'repsMin')::integer>(p->>'repsMax')::integer) then raise exception 'Invalid rep range' using errcode='22023'; end if;
  if (select count(*)<>count(distinct d->>'id') from jsonb_array_elements(new.days) d) or
    exists(select 1 from jsonb_array_elements(new.days) d where (select count(*)<>count(distinct p->>'id') from jsonb_array_elements(d->'exercises') p)) then raise exception 'Duplicate plan identifiers' using errcode='22023'; end if;
 elsif tg_table_name='workout_sessions' then
  perform private.assert_contract('instances',new.instances);
  if not exists(select 1 from pg_timezone_names where name=new.timezone) or (new.started_at at time zone new.timezone)::date<>new.local_date then raise exception 'Workout date does not match time zone' using errcode='22023'; end if;
  if exists(select 1 from jsonb_array_elements(new.pauses) p where (p->>'endedAt')::timestamptz<(p->>'startedAt')::timestamptz) then raise exception 'Invalid pause interval' using errcode='22023'; end if;
  if (select count(*)<>count(distinct d->>'id') from jsonb_array_elements(new.instances) d) then raise exception 'Duplicate exercise instances' using errcode='22023'; end if;
 elsif tg_table_name='foods' then
  perform private.assert_contract('nutrients',new.nutrients);
 elsif tg_table_name='body_entries' then
  perform private.assert_contract('measurements',new.measurements);
 end if;
 if tg_table_name in ('meal_items','body_entries') then
  if not exists(select 1 from pg_timezone_names where name=new.timezone) then raise exception 'Invalid timezone' using errcode='22023'; end if;
  if tg_table_name='meal_items' then
   if (new.consumed_at at time zone new.timezone)::date<>new.local_date then raise exception 'Meal date does not match timestamp' using errcode='22023'; end if;
   if new.food_id is not null and not exists(select 1 from public.foods where id=new.food_id and (owner_id is null or owner_id=new.owner_id)) then raise exception 'Food unavailable' using errcode='42501'; end if;
  elsif (new.measured_at at time zone new.timezone)::date<>new.local_date then raise exception 'Measurement date does not match timestamp' using errcode='22023'; end if;
 end if;
 if tg_table_name in ('programmes','workout_sessions') then
  if tg_table_name='programmes' then select coalesce(jsonb_agg(p),'[]') into items from jsonb_array_elements(new.days) d cross join lateral jsonb_array_elements(d->'exercises') p;
  else items:=new.instances; end if;
  for ex in select p->'exercise' from jsonb_array_elements(items) p loop
   select * into current_ex from public.exercises where id=(ex->>'id')::uuid and version=(ex->>'version')::integer and (owner_id is null or owner_id=new.owner_id);
   if not found or current_ex.logging_type<>ex->>'type' or current_ex.load_basis<>ex->>'loadBasis' or current_ex.multiplier<>(ex->>'multiplier')::integer then raise exception 'Exercise snapshot unavailable or logging basis changed' using errcode='22023'; end if;
  end loop;
 end if;
 return new;
end $$;
