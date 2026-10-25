SET local check_function_bodies = off;

CREATE OR REPLACE FUNCTION private.freeze_action (
  p_command jsonb,
  p_preview boolean
)
  RETURNS jsonb
  LANGUAGE plpgsql
  SECURITY DEFINER
  SET search_path TO ''
  AS $function$
declare gid uuid:=(p_command->>'gymId')::uuid;oid uuid:=(p_command->>'id')::uuid;kind text:=p_command->>'kind';body jsonb:=p_command->'payload';uid uuid:=auth.uid();
 role text;mid uuid:=(body->>'memberId')::uuid;fid uuid:=(body->>'freezeId')::uuid;f public.gym_freezes;m public.gym_members;target public.gym_memberships;g public.gyms;
 terms jsonb;freezes jsonb;review jsonb;hash text;item jsonb;result jsonb;previous public.gym_commands;fingerprint text:=md5(p_command::text);decision_text text:=btrim(body->>'reason');today date;shift boolean:=coalesce((body->>'shiftRenewals')::boolean,false);return_date date:=(body->>'returnOn')::date;
begin
 if not private.member_active() or gid is null or mid is null or kind not in ('request','approve','reject','cancel','unfreeze') or (not p_preview and oid is null) then raise exception 'Invalid freeze command' using errcode='22023';end if;
 perform pg_advisory_xact_lock(hashtextextended(gid::text,1));
 select * into g from public.gyms where id=gid and closed_at is null;
 select * into m from public.gym_members where id=mid and gym_id=gid for update;
 role:=private.gym_role(gid);
 if g.id is null or m.id is null or not private.gym_record_access(gid,mid) then raise exception 'Gym record not found' using errcode='PT404';end if;
 if kind in ('approve','reject','unfreeze') and coalesce(role,'') not in ('owner','manager') then raise exception 'Owner or manager approval required' using errcode='42501';end if;
 if not p_preview then
  select * into previous from public.gym_commands where id=oid;
  if found then
   if previous.gym_id<>gid or previous.actor_id<>uid or previous.input_hash<>fingerprint then raise exception 'Command ID reused' using errcode='22023';end if;
   return previous.result;
  end if;
 end if;
 today:=(now() at time zone g.timezone)::date;
 if kind='request' then
  if p_preview or m.archived or fid is null or coalesce(length(decision_text),0) not between 1 and 2000 then raise exception 'Choose a member, interval and administrative reason' using errcode='22023';end if;
  select * into target from public.gym_memberships where id=(body->>'membershipId')::uuid and gym_id=gid and member_id=mid and cancelled_on is null for update;
  if target.id is null or (body->>'startsOn')::date<target.starts_on or (body->>'startsOn')::date>=target.ends_on or (body->>'endsOn')::date<=(body->>'startsOn')::date then raise exception 'Freeze must start within the membership' using errcode='22023';end if;
  if (body->>'startsOn')::date<today and coalesce(role,'') not in ('owner','manager') then raise exception 'Backdated requests need owner or manager review' using errcode='42501';end if;
  if (select count(*) from public.gym_freezes where gym_id=gid and member_id=mid and status='pending')>=10 then raise exception 'Resolve existing freeze requests first' using errcode='22023';end if;
  if exists(select 1 from public.gym_freezes where membership_id=target.id and status='pending' and starts_on=(body->>'startsOn')::date and ends_on=(body->>'endsOn')::date) then raise exception 'This interval already has a pending request' using errcode='40001';end if;
  insert into public.gym_freezes(id,gym_id,member_id,membership_id,starts_on,ends_on,requested_ends_on,status,reason,actor_id) values(fid,gid,mid,target.id,(body->>'startsOn')::date,(body->>'endsOn')::date,(body->>'endsOn')::date,'pending',decision_text,uid);
  result:=jsonb_build_object('id',fid,'status','pending');
 else
  select * into f from public.gym_freezes where id=fid and gym_id=gid and member_id=mid for update;
  if not found then raise exception 'Freeze not found' using errcode='PT404';end if;
  if kind in ('reject','cancel') then
   if p_preview or f.status<>'pending' or body->>'requestRevision' is null or f.revision<>(body->>'requestRevision')::integer then raise exception 'Freeze request changed' using errcode='40001';end if;
   if kind='cancel' and f.actor_id<>uid and coalesce(role,'') not in ('owner','manager') then raise exception 'Only the requester or a manager can cancel this request' using errcode='42501';end if;
   if coalesce(length(decision_text),0) not between 1 and 2000 then raise exception 'Decision reason required' using errcode='22023';end if;
   update public.gym_freezes set status=case when kind='reject' then 'rejected' else 'cancelled' end,decided_by=uid,decision_reason=decision_text,revision=revision+1 where id=fid;
   result:=jsonb_build_object('id',fid,'status',case when kind='reject' then 'rejected' else 'cancelled' end);
  else
   -- Same gym lock as selling/renewing a membership, plus row locks on every sold term.
   perform 1 from public.gym_memberships where gym_id=gid and member_id=mid order by starts_on,id for update;
   select coalesce(jsonb_agg(to_jsonb(x) order by starts_on,id),'[]') into terms from public.gym_memberships x where gym_id=gid and member_id=mid;
   select coalesce(jsonb_agg(to_jsonb(x) order by id),'[]') into freezes from public.gym_freezes x where gym_id=gid and member_id=mid;
   hash:=md5(jsonb_build_object('terms',terms,'freezes',freezes,'memberRevision',m.revision,'date',today,'freezeId',fid,'kind',kind,'returnOn',return_date,'shift',shift)::text);
   if not p_preview and (body->>'previewHash' is null or body->>'previewHash'<>hash) then raise exception 'Membership changed; refresh the date preview' using errcode='40001';end if;
   review:=private.freeze_projection(terms,freezes,f.membership_id,fid,kind,return_date,today,shift);
   review:=review||jsonb_build_object('previewHash',hash,'freezeId',fid);
   if p_preview then return review;end if;
   if kind='approve' and (review->>'needsShift')::boolean and not shift then raise exception 'Approve the freeze and renewal shift together, or choose a shorter interval' using errcode='40001';end if;
   for item in select jsonb_array_elements(review->'changes') loop
    update public.gym_memberships set starts_on=(item->>'startsOn')::date,ends_on=(item->>'endsOn')::date,original_ends_on=(item->>'originalEndsOn')::date,revision=revision+1 where id=(item->>'id')::uuid and gym_id=gid and member_id=mid and revision=(item->>'revision')::integer;
    if not found then raise exception 'Membership changed' using errcode='40001';end if;
   end loop;
   if kind='approve' then update public.gym_freezes set status='approved',decided_by=uid,revision=revision+1 where id=fid;
   else
    if coalesce(length(decision_text),0) not between 1 and 2000 then raise exception 'Return reason required' using errcode='22023';end if;
    update public.gym_freezes set status=case when return_date=f.starts_on then 'cancelled' else 'approved' end,ends_on=case when return_date=f.starts_on then ends_on else return_date end,ended_early_on=return_date,decided_by=uid,decision_reason=decision_text,revision=revision+1 where id=fid;
   end if;
   update public.gym_members set revision=revision+1 where id=mid;
   result:=review||jsonb_build_object('id',fid,'status',case when kind='unfreeze' and return_date=f.starts_on then 'cancelled' else 'approved' end);
  end if;
 end if;
 insert into public.gym_commands(id,gym_id,actor_id,kind,input_hash,result) values(oid,gid,uid,'freeze.'||kind,fingerprint,result);
 insert into public.gym_audit(gym_id,actor_id,operation_id,kind,detail) values(gid,uid,oid,'freeze.'||kind,jsonb_build_object('memberId',mid,'before',to_jsonb(f),'result',result,'reason',decision_text));
 return result;
end $function$;

