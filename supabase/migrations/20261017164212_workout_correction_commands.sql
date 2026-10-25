create or replace function private.apply_member_operation(p_operation jsonb) returns jsonb language plpgsql security definer set search_path='' as $$
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
 if kind in ('set.edit','set.delete','set.restore','session.delete','session.restore') then
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
  elsif kind in ('set.delete','set.restore') then
   if w.deleted_at is not null or w.status='discarded' then raise exception 'Workout unavailable' using errcode='40001'; end if;
   if kind='set.delete' then
    update public.performed_sets set deleted_at=now(),revision=revision+1 where id=(payload->>'setId')::uuid and session_id=eid and owner_id=uid and revision=(payload->>'setRevision')::integer and deleted_at is null;
   else
    update public.performed_sets set deleted_at=null,revision=revision+1 where id=(payload->>'setId')::uuid and session_id=eid and owner_id=uid and revision=(payload->>'setRevision')::integer and deleted_at>=now()-interval '10 seconds';
   end if;
   if not found then raise exception 'Set changed or undo window expired' using errcode='40001'; end if;
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
