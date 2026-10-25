-- FitLog member API v1. Private fitness records never grant gym staff access.
create schema if not exists private;
revoke all on schema private from public, anon;
grant usage on schema private to authenticated;

create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  display_name text not null check (length(btrim(display_name)) between 1 and 100),
  date_of_birth date not null,
  timezone text not null default 'Asia/Kolkata',
  locale text not null default 'en' check (locale in ('en','hi')),
  weight_unit text not null default 'kg' check (weight_unit in ('kg','lb')),
  length_unit text not null default 'cm' check (length_unit in ('cm','in')),
  weekly_goal integer not null default 3 check (weekly_goal between 1 and 7),
  onboarding_complete boolean not null default false,
  status text not null default 'active' check (status in ('active','disabled','deletion_pending')),
  terms_version text not null, privacy_version text not null, accepted_at timestamptz not null default now(),
  created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);
alter table public.profiles enable row level security;

-- Internal authorization lookup: security definer is confined to a non-exposed schema,
-- fixed search_path, UID self-check, verified identity and current account/session state.
create function private.member_active() returns boolean language sql stable security definer
set search_path = '' as $$
 select exists(select 1 from auth.users u join public.profiles p on p.id=u.id
   where u.id=(select auth.uid()) and p.status='active'
   and u.deleted_at is null and (u.banned_until is null or u.banned_until < now())
   and (u.email_confirmed_at is not null or u.phone_confirmed_at is not null)
   and exists(select 1 from auth.sessions s where s.id::text=(select auth.jwt()->>'session_id') and s.user_id=u.id))
$$;
revoke all on function private.member_active() from public, anon;
grant execute on function private.member_active() to authenticated;
create policy profile_read on public.profiles for select to authenticated using (id=(select auth.uid()));
-- Profile activation and immutable notice/DOB fields are written through the checked RPC only.
grant select on public.profiles to authenticated;

create table public.exercises (
  id uuid not null, version integer not null check(version>0), owner_id uuid references public.profiles(id),
  name text not null check(length(btrim(name)) between 1 and 100),
  logging_type text not null check(logging_type in ('resistance','bodyweight','timed','distance')),
  load_basis text not null check(load_basis in ('total','per_hand','assistance','none')),
  multiplier integer not null check(multiplier in (1,2)),
  equipment text not null, primary_muscles text[] not null, secondary_muscles text[] not null default '{}',
  instructions text not null, aliases text[] not null default '{}', archived boolean not null default false,
  source text not null default 'member', created_at timestamptz not null default now(),
  primary key(id,version), check(cardinality(primary_muscles)>0)
);
alter table public.exercises enable row level security;
create index exercises_owner on public.exercises(owner_id);
create policy exercises_read on public.exercises for select to authenticated using
 ((owner_id is null or owner_id=(select auth.uid())) and (select private.member_active()));
create policy exercises_insert on public.exercises for insert to authenticated with check
 (owner_id=(select auth.uid()) and (select private.member_active()));
create policy exercises_update on public.exercises for update to authenticated using
 (owner_id=(select auth.uid()) and (select private.member_active())) with check
 (owner_id=(select auth.uid()) and (select private.member_active()));
grant select,insert,update on public.exercises to authenticated;

create table public.programmes (
 id uuid primary key, owner_id uuid not null references public.profiles(id),
 name text not null check(length(btrim(name)) between 1 and 100), description text not null default '',
 version integer not null default 1 check(version>0), days jsonb not null default '[]' check(jsonb_typeof(days)='array'),
 archived boolean not null default false, current boolean not null default false,
 created_at timestamptz not null default now(), updated_at timestamptz not null default now(),
 unique(owner_id,id), check(not (archived and current))
);
create unique index programmes_one_current on public.programmes(owner_id) where current and not archived;
create table public.schedule_occurrences (
 id uuid primary key, owner_id uuid not null, programme_id uuid not null, day_id uuid not null,
 local_date date not null, timezone text not null, status text not null default 'pending' check(status in ('pending','completed','missed','cancelled')),
 session_id uuid, revision integer not null default 1, unique(owner_id,id),
 foreign key(owner_id,programme_id) references public.programmes(owner_id,id)
);
create table public.workout_sessions (
 id uuid primary key, owner_id uuid not null references public.profiles(id),
 name text not null check(length(btrim(name)) between 1 and 100), programme_id uuid, day_id uuid,
 occurrence_id uuid, started_at timestamptz not null, ended_at timestamptz,
 local_date date not null, timezone text not null, status text not null check(status in ('in_progress','completed','discarded')),
 instances jsonb not null check(jsonb_typeof(instances)='array'), pauses jsonb not null default '[]', notes text not null default '' check(length(notes)<=2000),
 revision integer not null default 1 check(revision>0), deleted_at timestamptz,
 unique(owner_id,id), foreign key(owner_id,programme_id) references public.programmes(owner_id,id),
 foreign key(owner_id,occurrence_id) references public.schedule_occurrences(owner_id,id),
 check((status='in_progress' and ended_at is null) or status<>'in_progress'), check(ended_at is null or ended_at>=started_at)
);
create unique index one_active_workout on public.workout_sessions(owner_id) where status='in_progress' and deleted_at is null;
create unique index one_completed_occurrence on public.workout_sessions(occurrence_id) where occurrence_id is not null and status='completed' and deleted_at is null;
alter table public.schedule_occurrences add foreign key(owner_id,session_id) references public.workout_sessions(owner_id,id);
create table public.performed_sets (
 id uuid primary key, owner_id uuid not null, session_id uuid not null, instance_id uuid not null,
 mutation_id uuid not null unique, reps integer check(reps between 1 and 1000), load_kg numeric check(load_kg between 0 and 2000),
 duration_seconds integer check(duration_seconds between 1 and 86400), distance_metres numeric check(distance_metres>0 and distance_metres<=1000000),
 rpe numeric check(rpe between 0 and 10 and rpe*2=trunc(rpe*2)), rir integer check(rir between 0 and 10),
 set_type text not null check(set_type in ('warmup','working','drop','failure')), notes text not null default '' check(length(notes)<=2000),
 performed_at timestamptz not null, revision integer not null default 1, deleted_at timestamptz,
 foreign key(owner_id,session_id) references public.workout_sessions(owner_id,id), check(reps is not null or duration_seconds is not null or distance_metres is not null)
);
create index performed_sets_session on public.performed_sets(owner_id,session_id);

create table public.foods (
 id uuid primary key, owner_id uuid references public.profiles(id), name text not null check(length(btrim(name)) between 1 and 100),
 aliases text[] not null default '{}', brand text not null default '', reference_quantity numeric not null check(reference_quantity>0),
 reference_unit text not null check(reference_unit in ('g','ml','serving')), nutrients jsonb not null,
 servings jsonb not null default '[]', source text not null, source_version text not null,
 archived boolean not null default false, created_at timestamptz not null default now()
);
alter table public.foods enable row level security;
create index foods_owner on public.foods(owner_id);
create policy foods_read on public.foods for select to authenticated using ((owner_id is null or owner_id=(select auth.uid())) and (select private.member_active()));
create policy foods_insert on public.foods for insert to authenticated with check(owner_id=(select auth.uid()) and (select private.member_active()));
create policy foods_update on public.foods for update to authenticated using(owner_id=(select auth.uid()) and (select private.member_active())) with check(owner_id=(select auth.uid()) and (select private.member_active()));
grant select,insert,update on public.foods to authenticated;

create table public.meal_items (
 id uuid primary key, owner_id uuid not null references public.profiles(id), label text not null check(length(btrim(label)) between 1 and 100),
 food_id uuid references public.foods(id), quantity numeric not null check(quantity>0 and quantity<=100000), unit text not null,
 kcal numeric check(kcal>=0), protein numeric check(protein>=0), carbs numeric check(carbs>=0), fat numeric check(fat>=0), fibre numeric check(fibre>=0),
 category text not null, consumed_at timestamptz not null, local_date date not null, timezone text not null,
 source text not null, confirmed boolean not null default true check(confirmed), estimate boolean not null default false,
 revision integer not null default 1, deleted_at timestamptz,
 check(kcal is not null or protein is not null or carbs is not null or fat is not null or fibre is not null)
);
create table public.nutrition_targets (
 id uuid primary key, owner_id uuid not null references public.profiles(id), effective_date date not null,
 kcal numeric check(kcal>0), protein numeric check(protein>=0), carbs numeric check(carbs>=0), fat numeric check(fat>=0), fibre numeric check(fibre>=0),
 unique(owner_id,effective_date)
);
create table public.body_entries (
 id uuid primary key, owner_id uuid not null references public.profiles(id), measured_at timestamptz not null, local_date date not null, timezone text not null,
 weight_kg numeric check(weight_kg>0 and weight_kg<=500), body_fat numeric check(body_fat between 0 and 100),
 measurements jsonb not null default '{}', notes text not null default '' check(length(notes)<=2000),
 revision integer not null default 1, deleted_at timestamptz,
 check(weight_kg is not null or body_fat is not null or measurements<>'{}'::jsonb or length(btrim(notes))>0)
);
create table public.goals (
 id uuid primary key, owner_id uuid not null references public.profiles(id), name text not null,
 goal_type text not null check(goal_type in ('loss','gain','maintenance','strength','custom')),
 metric text not null check(metric in ('weight','max_load','e1rm','reps','manual')),
 exercise_id uuid, exercise_version integer, load_basis text, fixed_load_kg numeric,
 baseline numeric not null, baseline_cutoff timestamptz not null, start_date date not null, deadline date,
 target numeric not null, range_min numeric, range_max numeric,
 status text not null default 'active' check(status in ('active','paused','completed')), notes text not null default '', revision integer not null default 1,
 check(deadline is null or deadline>=start_date), foreign key(exercise_id,exercise_version) references public.exercises(id,version)
);
create table public.mutation_outcomes (
 id uuid primary key, owner_id uuid not null references public.profiles(id), entity_id uuid not null, kind text not null,
 result jsonb not null, created_at timestamptz not null default now()
);

-- Owner-only policies are intentionally independent of all gym/staff memberships.
do $$ declare t text; begin
 foreach t in array array['programmes','schedule_occurrences','workout_sessions','performed_sets','meal_items','nutrition_targets','body_entries','goals','mutation_outcomes'] loop
  execute format('alter table public.%I enable row level security',t);
  execute format('create index %I on public.%I(owner_id)',t||'_owner_idx',t);
  execute format('create policy owner_read on public.%I for select to authenticated using(owner_id=(select auth.uid()) and (select private.member_active()))',t);
  -- Workout and mutation writes are restricted to transactional RPCs below.
  if t in ('meal_items','nutrition_targets','body_entries','goals') then
   execute format('create policy owner_insert on public.%I for insert to authenticated with check(owner_id=(select auth.uid()) and (select private.member_active()))',t);
   execute format('create policy owner_update on public.%I for update to authenticated using(owner_id=(select auth.uid()) and (select private.member_active())) with check(owner_id=(select auth.uid()) and (select private.member_active()))',t);
   execute format('grant select,insert,update on public.%I to authenticated',t);
  else execute format('grant select on public.%I to authenticated',t);
  end if;
 end loop;
end $$;

-- Private photos: identity-scoped paths. No public bucket or gym read policy.
insert into storage.buckets(id,name,public,file_size_limit,allowed_mime_types)
values('personal-images','personal-images',false,10485760,array['image/jpeg','image/png','image/heic']);
create policy image_read on storage.objects for select to authenticated using
 (bucket_id='personal-images' and (storage.foldername(name))[1]=(select auth.uid())::text and (select private.member_active()));
create policy image_insert on storage.objects for insert to authenticated with check
 (bucket_id='personal-images' and (storage.foldername(name))[1]=(select auth.uid())::text and (select private.member_active()));
create policy image_delete on storage.objects for delete to authenticated using
 (bucket_id='personal-images' and (storage.foldername(name))[1]=(select auth.uid())::text and (select private.member_active()));

-- Server activation does not trust editable JWT user_metadata for eligibility or roles.
create function public.complete_onboarding(p_name text,p_dob date,p_timezone text,p_locale text,p_terms text,p_privacy text)
returns public.profiles language plpgsql security definer set search_path='' as $$
declare uid uuid := auth.uid(); result public.profiles;
begin
 if uid is null or not exists(select 1 from auth.users where id=uid and deleted_at is null and (email_confirmed_at is not null or phone_confirmed_at is not null) and (banned_until is null or banned_until<now())) then raise exception 'Verified sign-in required' using errcode='42501'; end if;
 if not exists(select 1 from pg_timezone_names where name=p_timezone) then raise exception 'Invalid time zone' using errcode='22023'; end if;
 if p_dob>(now() at time zone p_timezone)::date-interval '18 years' or p_dob<'1900-01-01' then raise exception 'You must be at least 18' using errcode='22023'; end if;
 if length(btrim(p_name)) not between 1 and 100 or p_locale not in ('en','hi') or length(p_terms)=0 or length(p_privacy)=0 then raise exception 'Invalid profile' using errcode='22023'; end if;
 select * into result from public.profiles where id=uid;
 if found then return result; end if;
 insert into public.profiles(id,display_name,date_of_birth,timezone,locale,terms_version,privacy_version,onboarding_complete)
 values(uid,btrim(p_name),p_dob,p_timezone,p_locale,p_terms,p_privacy,true) returning * into result;
 return result;
end $$;
revoke all on function public.complete_onboarding(text,date,text,text,text,text) from public, anon;
grant execute on function public.complete_onboarding(text,date,text,text,text,text) to authenticated;
