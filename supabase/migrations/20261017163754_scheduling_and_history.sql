create table public.programme_schedules (
 programme_id uuid primary key, owner_id uuid not null, effective_date date not null,
 timezone text not null, programme_version integer not null, revision integer not null default 1,
 foreign key(owner_id,programme_id) references public.programmes(owner_id,id)
);
alter table public.programme_schedules enable row level security;
revoke all on public.programme_schedules from anon,authenticated;
grant select on public.programme_schedules to authenticated;
create policy own_schedule on public.programme_schedules for select to authenticated using(owner_id=(select auth.uid()) and (select private.member_active()));
create unique index occurrence_identity on public.schedule_occurrences(programme_id,day_id,local_date) where status<>'cancelled';

create function private.refresh_schedule(p_programme uuid) returns void language plpgsql security definer set search_path='' as $$
declare s public.programme_schedules; p public.programmes; d jsonb; dt date; until_date date;
begin
 select * into s from public.programme_schedules where programme_id=p_programme and owner_id=auth.uid();
 if not found then return; end if;
 select * into p from public.programmes where id=p_programme and owner_id=auth.uid() and not archived;
 if not found then return; end if;
 until_date:=(now() at time zone s.timezone)::date+366;
 for d in select jsonb_array_elements(p.days) loop
  if jsonb_array_length(d->'exercises')=0 then continue; end if;
  for dt in select generate_series(greatest(s.effective_date,(now() at time zone s.timezone)::date),until_date,interval '1 day')::date loop
   if (d->'weekdays') @> jsonb_build_array(extract(dow from dt)::integer) and not exists(select 1 from public.schedule_occurrences where programme_id=p.id and day_id=(d->>'id')::uuid and local_date=dt and status<>'cancelled') then
    insert into public.schedule_occurrences(id,owner_id,programme_id,day_id,local_date,timezone) values(gen_random_uuid(),s.owner_id,p.id,(d->>'id')::uuid,dt,s.timezone);
   end if;
  end loop;
 end loop;
 update public.schedule_occurrences set status='missed',revision=revision+1 where owner_id=s.owner_id and programme_id=p.id and status='pending' and session_id is null and local_date<(now() at time zone timezone)::date;
end $$;
revoke all on function private.refresh_schedule(uuid) from public,anon,authenticated;

create function private.schedule_programme(p_id uuid,p_version integer,p_effective date,p_timezone text) returns void language plpgsql security definer set search_path='' as $$
declare p public.programmes; today date;
begin
 if not private.member_active() then raise exception 'Active account required' using errcode='42501'; end if;
 if not exists(select 1 from pg_timezone_names where name=p_timezone) then raise exception 'Invalid timezone' using errcode='22023'; end if;
 today:=(now() at time zone p_timezone)::date;
 if p_effective<today or p_effective>today+366 then raise exception 'Choose an effective date within the next year' using errcode='22023'; end if;
 perform pg_advisory_xact_lock(hashtextextended(auth.uid()::text,0));
 select * into p from public.programmes where id=p_id and owner_id=auth.uid() for update;
 if not found then raise exception 'Programme not found' using errcode='42501'; end if;
 if p.version<>p_version or p.archived then raise exception 'Programme changed; refresh before scheduling' using errcode='40001'; end if;
 if not exists(select 1 from jsonb_array_elements(p.days) d where jsonb_array_length(d->'exercises')>0 and jsonb_array_length(d->'weekdays')>0) then raise exception 'Add exercises and select weekdays first' using errcode='22023'; end if;
 update public.schedule_occurrences set status='cancelled',revision=revision+1 where programme_id=p_id and owner_id=auth.uid() and status='pending' and session_id is null and local_date>=p_effective;
 insert into public.programme_schedules(programme_id,owner_id,effective_date,timezone,programme_version) values(p_id,auth.uid(),p_effective,p_timezone,p_version)
 on conflict(programme_id) do update set effective_date=excluded.effective_date,timezone=excluded.timezone,programme_version=excluded.programme_version,revision=programme_schedules.revision+1;
 perform private.refresh_schedule(p_id);
end $$;
revoke all on function private.schedule_programme(uuid,integer,date,text) from public,anon;
grant execute on function private.schedule_programme(uuid,integer,date,text) to authenticated;
create function public.schedule_programme_v1(p_id uuid,p_version integer,p_effective date,p_timezone text) returns void language sql security invoker set search_path='' as $$select private.schedule_programme(p_id,p_version,p_effective,p_timezone)$$;
revoke all on function public.schedule_programme_v1(uuid,integer,date,text) from public,anon;
grant execute on function public.schedule_programme_v1(uuid,integer,date,text) to authenticated;
create function private.refresh_my_schedules() returns void language plpgsql security definer set search_path='' as $$declare pid uuid; begin
 if not private.member_active() then raise exception 'Active account required' using errcode='42501'; end if;
 for pid in select programme_id from public.programme_schedules where owner_id=auth.uid() loop perform private.refresh_schedule(pid); end loop;
end $$;
revoke all on function private.refresh_my_schedules() from public,anon;
grant execute on function private.refresh_my_schedules() to authenticated;
create function public.refresh_schedules_v1() returns void language sql security invoker set search_path='' as $$select private.refresh_my_schedules()$$;
revoke all on function public.refresh_schedules_v1() from public,anon;
grant execute on function public.refresh_schedules_v1() to authenticated;

create table public.workout_revisions (
 id uuid primary key default gen_random_uuid(), owner_id uuid not null references public.profiles(id),session_id uuid not null,
 revision integer not null, operation_id uuid not null, snapshot jsonb not null, created_at timestamptz not null default now(),
 unique(session_id,revision), foreign key(owner_id,session_id) references public.workout_sessions(owner_id,id)
);
alter table public.workout_revisions enable row level security;
revoke all on public.workout_revisions from anon,authenticated;
grant select on public.workout_revisions to authenticated;
create policy own_revisions on public.workout_revisions for select to authenticated using(owner_id=(select auth.uid()) and (select private.member_active()));

alter function private.apply_member_operation(jsonb) rename to apply_member_operation_core;
create function private.apply_member_operation(p_operation jsonb) returns jsonb language plpgsql security definer set search_path='' as $$
declare uid uuid:=auth.uid(); kind text:=p_operation->>'kind'; eid uuid:=(p_operation->>'entityId')::uuid;
 oid uuid:=(p_operation->>'id')::uuid; base integer:=(p_operation->>'baseRevision')::integer; payload jsonb:=p_operation->'payload';
 w public.workout_sessions; occ public.schedule_occurrences; previous public.mutation_outcomes; sd jsonb; instance jsonb; result jsonb;
 fingerprint text:=md5(jsonb_build_object('entity',eid,'kind',kind,'base',base,'payload',payload)::text);
begin
 if not private.member_active() or uid<>(p_operation->>'ownerId')::uuid then raise exception 'Active account required' using errcode='42501'; end if;
 perform pg_advisory_xact_lock(hashtextextended(uid::text,0));
 select * into previous from public.mutation_outcomes where id=oid;
 if found then
  if previous.owner_id<>uid or previous.request_hash<>fingerprint then raise exception 'Operation ID reused' using errcode='22023'; end if;
  return previous.result;
 end if;
 if kind='session.create' and payload->'session'->>'occurrenceId' is not null then
  select * into occ from public.schedule_occurrences where id=(payload->'session'->>'occurrenceId')::uuid and owner_id=uid for update;
  if not found or occ.revision<>(payload->>'occurrenceRevision')::integer or payload->>'occurrenceRevision' is null or
    occ.programme_id::text<>payload->'session'->>'programmeId' or occ.day_id::text<>payload->'session'->>'dayId' then raise exception 'Occurrence changed; review selection' using errcode='40001'; end if;
 end if;
 select * into w from public.workout_sessions where id=eid and owner_id=uid for update;
 if found then
  insert into public.workout_revisions(owner_id,session_id,revision,operation_id,snapshot) values(uid,eid,w.revision,oid,to_jsonb(w)||jsonb_build_object('sets',(select coalesce(jsonb_agg(to_jsonb(s)),'[]') from public.performed_sets s where session_id=eid))) on conflict(session_id,revision) do nothing;
 end if;
 if kind in ('set.edit','session.delete','session.restore') then
  if w.id is null or w.revision<>base then raise exception 'Workout changed; review current version' using errcode='40001'; end if;
  if exists(select 1 from jsonb_array_elements_text(coalesce(p_operation->'dependencies','[]')) d where not exists(select 1 from public.mutation_outcomes where id=d::uuid and owner_id=uid)) then raise exception 'Dependency pending' using errcode='40001'; end if;
  if kind='set.edit' then
   if w.deleted_at is not null or w.status='discarded' then raise exception 'Workout unavailable' using errcode='40001'; end if;
   sd:=payload->'set';
   select x into instance from jsonb_array_elements(w.instances) x where x->>'id'=sd->>'instanceId';
   if instance is null or (instance->'exercise'->>'type' in ('resistance','bodyweight') and sd->>'reps' is null) or
    (instance->'exercise'->>'type'='resistance' and sd->>'loadKg' is null) or
    (instance->'exercise'->>'type' in ('timed','distance') and sd->>'durationSeconds' is null) or
    (instance->'exercise'->>'type'='distance' and sd->>'distanceMetres' is null) then raise exception 'Invalid set' using errcode='22023'; end if;
   update public.performed_sets set reps=(sd->>'reps')::integer,load_kg=(sd->>'loadKg')::numeric,duration_seconds=(sd->>'durationSeconds')::integer,distance_metres=(sd->>'distanceMetres')::numeric,
    rpe=(sd->>'rpe')::numeric,rir=(sd->>'rir')::integer,set_type=sd->>'type',notes=coalesce(sd->>'notes',''),revision=revision+1
    where id=(sd->>'id')::uuid and owner_id=uid and session_id=eid and instance_id=(sd->>'instanceId')::uuid and revision=(payload->>'setRevision')::integer and deleted_at is null;
   if not found then raise exception 'Set changed' using errcode='40001'; end if;
  elsif kind='session.delete' then
   if w.status<>'completed' or w.deleted_at is not null then raise exception 'Completed workout required' using errcode='22023'; end if;
   update public.workout_sessions set deleted_at=now() where id=eid;
   update public.schedule_occurrences set session_id=null,status=case when status='cancelled' then 'cancelled' when local_date<(now() at time zone timezone)::date then 'missed' else 'pending' end,revision=revision+1 where id=w.occurrence_id and session_id=eid and owner_id=uid;
  else
   if w.deleted_at is null or w.deleted_at<now()-interval '10 seconds' then raise exception 'Undo window expired' using errcode='40001'; end if;
   if w.occurrence_id is not null then
    select * into occ from public.schedule_occurrences where id=w.occurrence_id and owner_id=uid for update;
    if occ.session_id is not null or occ.status='cancelled' then raise exception 'Occurrence no longer available' using errcode='40001'; end if;
    update public.schedule_occurrences set session_id=eid,status='completed',revision=revision+1 where id=occ.id;
   end if;
   update public.workout_sessions set deleted_at=null where id=eid;
  end if;
  update public.workout_sessions set revision=revision+1 where id=eid;
  result:=jsonb_build_object('id',eid,'revision',base+1);
  insert into public.mutation_outcomes(id,owner_id,entity_id,kind,result,request_hash) values(oid,uid,eid,kind,result,fingerprint);
  return result;
 end if;
 return private.apply_member_operation_core(p_operation);
end $$;
revoke all on function private.apply_member_operation(jsonb) from public,anon;
grant execute on function private.apply_member_operation(jsonb) to authenticated;
create or replace function public.apply_operation_v1(p_operation jsonb) returns jsonb language sql security invoker set search_path='' as $$select private.apply_member_operation(p_operation)$$;
revoke all on function private.apply_member_operation_core(jsonb) from authenticated;
