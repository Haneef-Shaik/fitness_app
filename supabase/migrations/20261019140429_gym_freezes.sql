SET local check_function_bodies = off;

ALTER TABLE "public"."gym_freezes"
  ADD COLUMN "revision" integer NOT NULL DEFAULT 1;

ALTER TABLE "public"."gym_freezes"
  ADD COLUMN "decided_by" uuid;

ALTER TABLE "public"."gym_freezes"
  ADD COLUMN "decision_reason" text;

ALTER TABLE "public"."gym_freezes"
  ADD COLUMN "requested_ends_on" date;

ALTER TABLE "public"."gym_freezes"
  ADD COLUMN "ended_early_on" date;

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
   review:=private.freeze_projection(terms,freezes,f.membership_id,fid,kind,return_date,today,shift);
   hash:=md5(jsonb_build_object('terms',terms,'freezes',freezes,'memberRevision',m.revision,'date',today,'kind',kind,'returnOn',return_date,'shift',shift)::text);
   review:=review||jsonb_build_object('previewHash',hash,'freezeId',fid);
   if p_preview then return review;end if;
   if body->>'previewHash' is null or body->>'previewHash'<>hash then raise exception 'Membership changed; refresh the date preview' using errcode='40001';end if;
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

CREATE OR REPLACE FUNCTION private.freeze_projection (
  p_terms   jsonb,
  p_freezes jsonb,
  p_target  uuid,
  p_freeze  uuid,
  p_mode    text,
  p_return  date,
  p_today   date,
  p_shift   boolean
)
  RETURNS jsonb
  LANGUAGE plpgsql
  STABLE
  SET search_path TO ''
  AS $function$
declare term jsonb;f jsonb;r jsonb;changes jsonb:='[]'::jsonb;proposed jsonb:='[]'::jsonb;used integer;allowance integer;delta integer;days integer;new_end date;old_cursor date;new_cursor date;next_start date;next_end date;new_original date;needs_shift boolean:=false;gap integer:=0;first_future boolean:=true;remaining integer;
begin
 select x into term from jsonb_array_elements(p_terms) x where (x->>'id')::uuid=p_target;
 select x into f from jsonb_array_elements(p_freezes) x where (x->>'id')::uuid=p_freeze and (x->>'membership_id')::uuid=p_target;
 if term is null or f is null or term->>'cancelled_on' is not null then raise exception 'Membership or freeze unavailable' using errcode='22023';end if;
 allowance:=(term->'snapshot'->>'freeze_days')::integer;
 if allowance is null or allowance<0 then raise exception 'Sold allowance unavailable' using errcode='22023';end if;
 select coalesce(sum((x->>'ends_on')::date-(x->>'starts_on')::date),0) into used from jsonb_array_elements(p_freezes) x where (x->>'membership_id')::uuid=p_target and x->>'status'='approved';
 days:=(f->>'ends_on')::date-(f->>'starts_on')::date;
 if p_mode='approve' then
  if f->>'status'<>'pending' or days<1 or (f->>'starts_on')::date<(term->>'starts_on')::date or (f->>'starts_on')::date>=(term->>'ends_on')::date then raise exception 'Freeze must start within the effective membership' using errcode='22023';end if;
  if used+days>allowance then raise exception 'Freeze exceeds the sold allowance; choose a shorter interval' using errcode='22023';end if;
  if exists(select 1 from jsonb_array_elements(p_freezes) x where (x->>'membership_id')::uuid=p_target and x->>'status'='approved' and daterange((x->>'starts_on')::date,(x->>'ends_on')::date,'[)') && daterange((f->>'starts_on')::date,(f->>'ends_on')::date,'[)')) then raise exception 'Freeze overlaps an approved interval' using errcode='40001';end if;
  delta:=days;remaining:=allowance-used-days;
 elsif p_mode='unfreeze' then
  if f->>'status'<>'approved' or p_return is null or p_return<(f->>'starts_on')::date or p_return>=(f->>'ends_on')::date or p_return>p_today then raise exception 'Choose an elapsed return date within the approved freeze' using errcode='22023';end if;
  delta:=p_return-(f->>'ends_on')::date;days:=p_return-(f->>'starts_on')::date;remaining:=allowance-used-delta;
 else raise exception 'Invalid freeze action' using errcode='22023';end if;
 new_end:=(term->>'ends_on')::date+delta;
 if new_end<=(term->>'starts_on')::date then raise exception 'Invalid resulting membership period' using errcode='22023';end if;
 if p_mode='unfreeze' and exists(select 1 from jsonb_array_elements(p_freezes) x where (x->>'membership_id')::uuid=p_target and (x->>'id')::uuid<>p_freeze and x->>'status'='approved' and (x->>'starts_on')::date>=new_end) then raise exception 'Review other approved freezes before shortening this membership' using errcode='40001';end if;
 changes:=jsonb_build_array(jsonb_build_object('id',p_target,'revision',(term->>'revision')::integer,'oldStartsOn',term->>'starts_on','oldEndsOn',term->>'ends_on','startsOn',term->>'starts_on','endsOn',new_end,'originalEndsOn',term->>'original_ends_on'));
 old_cursor:=(term->>'ends_on')::date;new_cursor:=new_end;
 for r in select x from jsonb_array_elements(p_terms) x where (x->>'id')::uuid<>p_target and x->>'cancelled_on' is null and (x->>'starts_on')::date>=old_cursor order by (x->>'starts_on')::date,x->>'id' loop
  if p_mode='approve' then next_start:=greatest((r->>'starts_on')::date,new_cursor);
  else next_start:=new_cursor+greatest((r->>'starts_on')::date-old_cursor,0);end if;
  if first_future and p_mode='unfreeze' and not p_shift then gap:=greatest((r->>'starts_on')::date-new_end,0);end if;first_future:=false;
  next_end:=(r->>'ends_on')::date;new_original:=(r->>'original_ends_on')::date;
  if next_start<>(r->>'starts_on')::date then
   needs_shift:=true;
   if (r->>'starts_on')::date<=p_today and (p_mode='approve' or p_shift) then raise exception 'An already-started renewal cannot move; choose a shorter freeze' using errcode='40001';end if;
   new_original:=private.membership_end(next_start,(r->'snapshot'->>'duration_value')::integer,r->'snapshot'->>'duration_unit');
   next_end:=new_original+((r->>'ends_on')::date-(r->>'original_ends_on')::date);
   if exists(select 1 from jsonb_array_elements(p_freezes) x where (x->>'membership_id')::uuid=(r->>'id')::uuid and x->>'status'='approved' and ((x->>'starts_on')::date<next_start or (x->>'starts_on')::date>=next_end)) then raise exception 'Review approved freezes on the affected renewal before shifting dates' using errcode='40001';end if;
   proposed:=proposed||jsonb_build_array(jsonb_build_object('id',r->>'id','revision',(r->>'revision')::integer,'oldStartsOn',r->>'starts_on','oldEndsOn',r->>'ends_on','startsOn',next_start,'endsOn',next_end,'originalEndsOn',new_original));
   if p_shift then changes:=changes||jsonb_build_array(proposed->(jsonb_array_length(proposed)-1));end if;
  end if;
  old_cursor:=(r->>'ends_on')::date;new_cursor:=next_end;
 end loop;
 return jsonb_build_object('changes',changes,'proposedRenewals',proposed,'needsShift',needs_shift,'remainingDays',remaining,'consumedDays',days,'restoredDays',greatest(-delta,0),'gapDays',gap,'returnOn',p_return,'mode',p_mode);
end $function$;

CREATE OR REPLACE FUNCTION public.freeze_command_v1 (
  p_command jsonb
)
  RETURNS jsonb
  LANGUAGE plpgsql
  SET search_path TO ''
  AS $function$
begin return private.freeze_action(p_command,false);
exception when serialization_failure then raise exception '%',SQLERRM using errcode='PT409';end $function$;

REVOKE ALL ON FUNCTION "public"."freeze_command_v1"(jsonb) FROM PUBLIC, "anon";

CREATE OR REPLACE FUNCTION public.freeze_preview_v1 (
  p_command jsonb
)
  RETURNS jsonb
  LANGUAGE plpgsql
  SET search_path TO ''
  AS $function$
begin return private.freeze_action(p_command,true);
exception when serialization_failure then raise exception '%',SQLERRM using errcode='PT409';end $function$;

REVOKE ALL ON FUNCTION "public"."freeze_preview_v1"(jsonb) FROM PUBLIC, "anon";

CREATE OR REPLACE FUNCTION public.gym_account_v1 (
  p_gym    uuid,
  p_member uuid
)
  RETURNS jsonb
  LANGUAGE sql
  SET search_path TO ''
  AS $function$
 select private.gym_account(p_gym,p_member)||jsonb_build_object('freezes',(select coalesce(jsonb_agg(to_jsonb(f) order by starts_on,id),'[]') from public.gym_freezes f where gym_id=p_gym and member_id=p_member))
$function$;

ALTER TABLE "public"."gym_freezes"
  ADD CONSTRAINT "gym_freezes_decided_by_fkey" FOREIGN KEY (decided_by) REFERENCES public.profiles(id);

CREATE INDEX gym_freezes_term ON public.gym_freezes USING btree (gym_id, member_id, membership_id, starts_on);

REVOKE ALL ON FUNCTION "private"."freeze_action"(jsonb, boolean) FROM PUBLIC;

GRANT EXECUTE ON FUNCTION "private"."freeze_action"(jsonb, boolean) TO "authenticated";

REVOKE ALL ON FUNCTION "private"."freeze_projection"(jsonb, jsonb, uuid, uuid, text, date, date, boolean) FROM PUBLIC;

GRANT EXECUTE ON FUNCTION "public"."freeze_command_v1"(jsonb) TO "authenticated";

REVOKE ALL ON FUNCTION "public"."freeze_command_v1"(jsonb) FROM "postgres";

GRANT EXECUTE ON FUNCTION "public"."freeze_command_v1"(jsonb) TO "postgres";

GRANT EXECUTE ON FUNCTION "public"."freeze_command_v1"(jsonb) TO "service_role";

GRANT EXECUTE ON FUNCTION "public"."freeze_preview_v1"(jsonb) TO "authenticated";

REVOKE ALL ON FUNCTION "public"."freeze_preview_v1"(jsonb) FROM "postgres";

GRANT EXECUTE ON FUNCTION "public"."freeze_preview_v1"(jsonb) TO "postgres";

GRANT EXECUTE ON FUNCTION "public"."freeze_preview_v1"(jsonb) TO "service_role";

