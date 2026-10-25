alter table public.mutation_outcomes add column request_hash text not null default '';

-- Privileged implementation lives outside the exposed API schema. Public wrappers are invokers.
alter function public.complete_onboarding(text,date,text,text,text,text) set schema private;
revoke all on function private.complete_onboarding(text,date,text,text,text,text) from public,anon;
grant execute on function private.complete_onboarding(text,date,text,text,text,text) to authenticated;
create function public.complete_onboarding(p_name text,p_dob date,p_timezone text,p_locale text,p_terms text,p_privacy text)
returns public.profiles language sql security invoker set search_path='' as $$
 select private.complete_onboarding(p_name,p_dob,p_timezone,p_locale,p_terms,p_privacy)
$$;
revoke all on function public.complete_onboarding(text,date,text,text,text,text) from public,anon;
grant execute on function public.complete_onboarding(text,date,text,text,text,text) to authenticated;

create function private.apply_member_operation(p_operation jsonb) returns jsonb
language plpgsql security definer set search_path='' as $$
declare
 uid uuid:=auth.uid(); oid uuid:=(p_operation->>'id')::uuid; eid uuid:=(p_operation->>'entityId')::uuid;
 kind text:=p_operation->>'kind'; payload jsonb:=p_operation->'payload';
 base integer:=(p_operation->>'baseRevision')::integer;
 fingerprint text:=md5(jsonb_build_object('entity',eid,'kind',kind,'base',base,'payload',payload)::text);
 old_outcome public.mutation_outcomes; workout public.workout_sessions; src jsonb; set_data jsonb;
 instance jsonb; ex_type text; ex_basis text; result jsonb; dep text; occ public.schedule_occurrences;
begin
 if uid is null or not private.member_active() or (p_operation->>'ownerId')::uuid<>uid then raise exception 'Active verified account required' using errcode='42501'; end if;
 if oid is null or eid is null or base is null or base<0 or kind is null or payload is null then raise exception 'Invalid operation' using errcode='22023'; end if;
 perform pg_advisory_xact_lock(hashtextextended(uid::text,0));
 select * into old_outcome from public.mutation_outcomes where id=oid;
 if found then
   if old_outcome.owner_id<>uid or old_outcome.request_hash<>fingerprint then raise exception 'Operation ID reused with different input' using errcode='22023'; end if;
   return old_outcome.result;
 end if;
 for dep in select jsonb_array_elements_text(coalesce(p_operation->'dependencies','[]')) loop
  if not exists(select 1 from public.mutation_outcomes where id=dep::uuid and owner_id=uid) then raise exception 'Operation dependency pending' using errcode='40001'; end if;
 end loop;

 if kind='programme.save' then
   src:=payload->'programme';
   if (src->>'id')::uuid<>eid or length(btrim(src->>'name')) not between 1 and 100 or jsonb_typeof(src->'days')<>'array' then raise exception 'Invalid programme' using errcode='22023'; end if;
   if exists(select 1 from public.programmes where id=eid and (owner_id<>uid or version<>base)) or
      (base>0 and not exists(select 1 from public.programmes where id=eid and owner_id=uid)) then raise exception 'Programme changed; review current version' using errcode='40001'; end if;
   if exists(select 1 from jsonb_array_elements(src->'days') d cross join lateral jsonb_array_elements(d->'exercises') p
      where (p->>'sets')::integer not between 1 and 50 or (p->>'repsMin')::integer not between 1 and 1000 or
       (p->>'repsMax')::integer not between (p->>'repsMin')::integer and 1000 or (p->>'restSeconds')::integer not between 0 and 3600 or
       not exists(select 1 from public.exercises e where e.id=(p->'exercise'->>'id')::uuid and e.version=(p->'exercise'->>'version')::integer and (e.owner_id is null or e.owner_id=uid))) then raise exception 'Invalid prescription' using errcode='22023'; end if;
   if coalesce((src->>'current')::boolean,false) then update public.programmes set current=false where owner_id=uid and current; end if;
   insert into public.programmes(id,owner_id,name,description,version,days,archived,current,created_at,updated_at)
   values(eid,uid,btrim(src->>'name'),coalesce(src->>'description',''),base+1,src->'days',coalesce((src->>'archived')::boolean,false),coalesce((src->>'current')::boolean,false),(src->>'createdAt')::timestamptz,now())
   on conflict(id) do update set name=excluded.name,description=excluded.description,version=excluded.version,days=excluded.days,archived=excluded.archived,current=excluded.current,updated_at=now();
   result:=jsonb_build_object('id',eid,'revision',base+1);
 elsif kind='programme.archive' then
   update public.programmes set archived=true,current=false,version=version+1,updated_at=now() where id=eid and owner_id=uid and version=base;
   if not found then raise exception 'Programme changed' using errcode='40001'; end if;
   update public.schedule_occurrences set status='cancelled',revision=revision+1 where owner_id=uid and programme_id=eid and status='pending' and local_date>=(now() at time zone timezone)::date;
   result:=jsonb_build_object('id',eid,'revision',base+1);
 elsif kind='session.create' then
   src:=payload->'session';
   if base<>0 or (src->>'id')::uuid<>eid or src->>'status'<>'in_progress' or jsonb_array_length(src->'sets')<>0 then raise exception 'Invalid workout start' using errcode='22023'; end if;
   if exists(select 1 from public.workout_sessions where owner_id=uid and status='in_progress' and deleted_at is null) then raise exception 'Another workout is active' using errcode='40001'; end if;
   if src->>'occurrenceId' is not null then
     select * into occ from public.schedule_occurrences where id=(src->>'occurrenceId')::uuid and owner_id=uid for update;
     if not found or occ.status='cancelled' or occ.session_id is not null or ((src->>'startedAt')::timestamptz at time zone occ.timezone)::date not between occ.local_date and occ.local_date+7 then raise exception 'Occurrence unavailable' using errcode='40001'; end if;
   end if;
   insert into public.workout_sessions(id,owner_id,name,programme_id,day_id,occurrence_id,started_at,local_date,timezone,status,instances,pauses,revision)
   values(eid,uid,src->>'name',(src->>'programmeId')::uuid,(src->>'dayId')::uuid,(src->>'occurrenceId')::uuid,(src->>'startedAt')::timestamptz,(src->>'localDate')::date,src->>'timezone','in_progress',src->'instances','[]',1);
   if occ.id is not null then update public.schedule_occurrences set session_id=eid,revision=revision+1 where id=occ.id; end if;
   result:=jsonb_build_object('id',eid,'revision',1);
 else
   select * into workout from public.workout_sessions where id=eid and owner_id=uid for update;
   if not found then raise exception 'Workout not found' using errcode='42501'; end if;
   if workout.revision<>base then raise exception 'Workout changed; review conflict' using errcode='40001'; end if;
   if workout.status<>'in_progress' then raise exception 'Workout is no longer active' using errcode='40001'; end if;
   if kind='set.commit' then
     set_data:=payload->'set';
     if (set_data->>'mutationId')::uuid<>oid or set_data->>'deletedAt' is not null then raise exception 'Invalid performed set' using errcode='22023'; end if;
     select x into instance from jsonb_array_elements(workout.instances) x where x->>'id'=set_data->>'instanceId';
     if instance is null then raise exception 'Exercise instance not found' using errcode='22023'; end if;
     ex_type:=instance->'exercise'->>'type'; ex_basis:=instance->'exercise'->>'loadBasis';
     if (ex_type in ('resistance','bodyweight') and set_data->>'reps' is null) or (ex_type='resistance' and set_data->>'loadKg' is null)
        or (ex_type in ('timed','distance') and set_data->>'durationSeconds' is null) or (ex_type='distance' and set_data->>'distanceMetres' is null) then raise exception 'Required set values missing' using errcode='22023'; end if;
     insert into public.performed_sets(id,owner_id,session_id,instance_id,mutation_id,reps,load_kg,duration_seconds,distance_metres,rpe,rir,set_type,notes,performed_at)
     values((set_data->>'id')::uuid,uid,eid,(set_data->>'instanceId')::uuid,oid,(set_data->>'reps')::integer,(set_data->>'loadKg')::numeric,(set_data->>'durationSeconds')::integer,(set_data->>'distanceMetres')::numeric,(set_data->>'rpe')::numeric,(set_data->>'rir')::integer,set_data->>'type',coalesce(set_data->>'notes',''),(set_data->>'performedAt')::timestamptz);
   elsif kind='set.delete' then
     update public.performed_sets set deleted_at=now(),revision=revision+1 where id=(payload->>'setId')::uuid and owner_id=uid and session_id=eid and revision=(payload->>'setRevision')::integer;
     if not found then raise exception 'Set changed' using errcode='40001'; end if;
   elsif kind='session.update' then
     src:=payload->'session';
     if exists(select 1 from public.performed_sets s where s.session_id=eid and s.deleted_at is null and not exists(select 1 from jsonb_array_elements(src->'instances') x where x->>'id'=s.instance_id::text)) then raise exception 'Cannot remove performed exercise' using errcode='22023'; end if;
     update public.workout_sessions set instances=src->'instances',notes=coalesce(src->>'notes',''),pauses=src->'pauses' where id=eid;
   elsif kind='session.finish' then
     if payload->>'status' not in ('completed','discarded') then raise exception 'Invalid finish state' using errcode='22023'; end if;
     if payload->>'status'='completed' and not exists(select 1 from public.performed_sets where session_id=eid and deleted_at is null) then raise exception 'Log a set before finishing' using errcode='22023'; end if;
     update public.workout_sessions set status=payload->>'status',ended_at=(payload->>'endedAt')::timestamptz,notes=coalesce(payload->>'notes','') where id=eid;
     if workout.occurrence_id is not null then
       update public.schedule_occurrences set status=case when payload->>'status'='completed' then 'completed' when local_date<(now() at time zone timezone)::date then 'missed' else 'pending' end,
       session_id=case when payload->>'status'='completed' then eid else null end,revision=revision+1 where id=workout.occurrence_id and owner_id=uid and session_id=eid;
       if not found then raise exception 'Occurrence changed' using errcode='40001'; end if;
     end if;
   else raise exception 'Unsupported operation' using errcode='22023';
   end if;
   update public.workout_sessions set revision=revision+1 where id=eid;
   result:=jsonb_build_object('id',eid,'revision',base+1);
 end if;
 insert into public.mutation_outcomes(id,owner_id,entity_id,kind,result,request_hash) values(oid,uid,eid,kind,result,fingerprint);
 return result;
end $$;
revoke all on function private.apply_member_operation(jsonb) from public,anon;
grant execute on function private.apply_member_operation(jsonb) to authenticated;
create function public.apply_operation_v1(p_operation jsonb) returns jsonb language sql security invoker set search_path='' as $$
 select private.apply_member_operation(p_operation)
$$;
revoke all on function public.apply_operation_v1(jsonb) from public,anon;
grant execute on function public.apply_operation_v1(jsonb) to authenticated;

-- Explicit column grants prevent clients changing account state, DOB or accepted notice versions.
grant update(display_name,timezone,locale,weight_unit,length_unit,weekly_goal,updated_at) on public.profiles to authenticated;
create policy profile_update on public.profiles for update to authenticated using(id=(select auth.uid()) and (select private.member_active())) with check(id=(select auth.uid()) and (select private.member_active()));
