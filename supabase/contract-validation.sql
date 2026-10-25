create function private.assert_contract(p_name text,p_value jsonb) returns void language plpgsql stable security definer set search_path='' as $$
declare valid boolean;
begin
 select extensions.jsonb_matches_schema(schema,p_value) into valid from private.contracts where name=p_name;
 if valid is distinct from true then raise exception 'Invalid % data',p_name using errcode='22023'; end if;
end $$;
revoke all on function private.assert_contract(text,jsonb) from public,anon,authenticated;

create function private.validate_member_record() returns trigger language plpgsql security definer set search_path='' as $$
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
revoke all on function private.validate_member_record() from public,anon,authenticated;
create trigger validate_programme before insert or update on public.programmes for each row execute function private.validate_member_record();
create trigger validate_workout before insert or update on public.workout_sessions for each row execute function private.validate_member_record();
create trigger validate_body before insert or update on public.body_entries for each row execute function private.validate_member_record();
create trigger validate_meal before insert or update on public.meal_items for each row execute function private.validate_member_record();
create trigger validate_food before insert or update on public.foods for each row execute function private.validate_member_record();

-- Direct edits cannot mutate historical exercise definitions. A changed basis needs a new version.
revoke update on public.exercises from authenticated;
grant update(archived) on public.exercises to authenticated;
alter table public.meal_items add constraint finite_nutrients check(coalesce(kcal,0)<'Infinity'::numeric and coalesce(protein,0)<'Infinity'::numeric and coalesce(carbs,0)<'Infinity'::numeric and coalesce(fat,0)<'Infinity'::numeric and coalesce(fibre,0)<'Infinity'::numeric);
alter table public.nutrition_targets add constraint finite_targets check(coalesce(kcal,0)<'Infinity'::numeric and coalesce(protein,0)<'Infinity'::numeric and coalesce(carbs,0)<'Infinity'::numeric and coalesce(fat,0)<'Infinity'::numeric and coalesce(fibre,0)<'Infinity'::numeric);

-- Validated activation must also reject a revoked sign-in session.
create or replace function private.complete_onboarding(p_name text,p_dob date,p_timezone text,p_locale text,p_terms text,p_privacy text)
returns public.profiles language plpgsql security definer set search_path='' as $$
declare uid uuid:=auth.uid(); result public.profiles;
begin
 if uid is null or not exists(select 1 from auth.users u where id=uid and deleted_at is null and (email_confirmed_at is not null or phone_confirmed_at is not null) and (banned_until is null or banned_until<now()) and exists(select 1 from auth.sessions s where s.user_id=u.id and s.id::text=auth.jwt()->>'session_id')) then raise exception 'Verified current sign-in required' using errcode='42501'; end if;
 if p_timezone is null or not exists(select 1 from pg_timezone_names where name=p_timezone) then raise exception 'Invalid timezone' using errcode='22023'; end if;
 if p_dob is null or p_dob>(now() at time zone p_timezone)::date-interval '18 years' or p_dob<'1900-01-01' then raise exception 'You must be at least 18' using errcode='22023'; end if;
 if p_name is null or length(btrim(p_name)) not between 1 and 100 or p_locale is null or p_locale not in ('en','hi') or coalesce(length(p_terms),0)=0 or coalesce(length(p_privacy),0)=0 then raise exception 'Invalid profile' using errcode='22023'; end if;
 select * into result from public.profiles where id=uid;
 if found then
  if result.status<>'active' then raise exception 'Account unavailable' using errcode='42501'; end if;
  return result;
 end if;
 insert into public.profiles(id,display_name,date_of_birth,timezone,locale,terms_version,privacy_version,onboarding_complete) values(uid,btrim(p_name),p_dob,p_timezone,p_locale,p_terms,p_privacy,true) returning * into result;
 return result;
end $$;
