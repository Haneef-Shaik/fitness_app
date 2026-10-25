drop policy gym_read on public.gyms;
create policy gym_read on public.gyms for select to authenticated using(private.gym_role(id) is not null or exists(select 1 from public.gym_members gm where gm.gym_id=gyms.id and gm.linked_user_id=auth.uid()));
create or replace function private.allocate_credit(p_gym uuid,p_member uuid,p_operation uuid,p_payment uuid default null) returns void language plpgsql security definer set search_path='' as $$
declare p record;c record;available bigint;due bigint;amount bigint;
begin
 for p in select x.id,x.amount_paise-coalesce((select sum(amount_paise) from public.gym_principal_events where payment_id=x.id),0)-coalesce((select sum(delta_paise) from public.gym_allocations where payment_id=x.id),0) credit from public.gym_payments x where x.gym_id=p_gym and x.member_id=p_member and (p_payment is null or x.id=p_payment) order by received_at,id loop
  available:=p.credit;
  for c in select x.id,x.amount_paise+coalesce((select sum(delta_paise) from public.gym_charge_adjustments where charge_id=x.id),0)-coalesce((select sum(delta_paise) from public.gym_allocations where charge_id=x.id),0) due from public.gym_charges x where x.gym_id=p_gym and x.member_id=p_member order by due_on,created_at,id loop
   exit when available<=0; amount:=least(available,c.due); if amount<=0 then continue; end if;
   insert into public.gym_allocations(gym_id,member_id,payment_id,charge_id,delta_paise,operation_id,actor_id) values(p_gym,p_member,p.id,c.id,amount,p_operation,auth.uid()); available:=available-amount;
  end loop;
 end loop;
end $$;
revoke all on function private.allocate_credit(uuid,uuid,uuid,uuid) from public,anon,authenticated;
create or replace function private.gym_command(p_command jsonb) returns jsonb language plpgsql security definer set search_path='' as $$
declare gid uuid:=(p_command->>'gymId')::uuid;oid uuid:=(p_command->>'id')::uuid;kind text:=p_command->>'kind';body jsonb:=p_command->'payload';uid uuid:=auth.uid();
 role text;member public.gym_members;gym public.gyms;plan public.gym_plans;membership public.gym_memberships;payment public.gym_payments;charge public.gym_charges;
 previous public.gym_commands;fingerprint text:=md5(p_command::text);result jsonb;mid uuid;entity uuid;start_date date;end_date date;today date;amount bigint;available bigint;release bigint;used bigint;portion_start bigint;
 seq integer;issue_year integer;receipt_number text;r record;snapshot jsonb;occurred timestamptz;verification text;eligible boolean;
begin
 if not private.member_active() or gid is null or oid is null or body is null or jsonb_typeof(body)<>'object' then raise exception 'Active account and command required' using errcode='42501'; end if;
 if kind<>'gym.create' then
  role:=private.gym_role(gid);
  if role is null then raise exception 'Gym not found' using errcode='P0002'; end if;
 end if;
 perform pg_advisory_xact_lock(hashtextextended(gid::text,1));
 select * into previous from public.gym_commands where id=oid;
 if found then if previous.gym_id<>gid or previous.actor_id<>uid or previous.input_hash<>fingerprint then raise exception 'Command ID reused' using errcode='22023'; end if;return previous.result;end if;
 if kind='gym.create' then
  if not exists(select 1 from pg_timezone_names where name=body->>'timezone') then raise exception 'Invalid timezone' using errcode='22023'; end if;
  insert into public.gyms(id,code,name,address,contact,timezone) values(gid,upper(body->>'code'),btrim(body->>'name'),coalesce(body->>'address',''),coalesce(body->>'contact',''),body->>'timezone');
  insert into public.gym_roles(gym_id,user_id,role) values(gid,uid,'owner');result:=jsonb_build_object('id',gid);
 else
  select * into gym from public.gyms where id=gid for update;today:=(now() at time zone gym.timezone)::date;
  mid:=(body->>'memberId')::uuid;
  if mid is not null then
   select * into member from public.gym_members where id=mid and gym_id=gid for update;
   if not found and kind<>'member.save' then raise exception 'Member not found' using errcode='P0002';end if;
   if found and kind not in ('visit.record','member.save') and (body->>'expectedRevision' is null or member.revision<>(body->>'expectedRevision')::integer) then raise exception 'Member account changed; review current amounts' using errcode='40001';end if;
  end if;
  if kind not in ('plan.save','member.save') and member.id is null then raise exception 'Member required' using errcode='22023';end if;
  if kind='member.save' then
   if body->>'ageStatus' not in ('adult','unknown') then raise exception 'Minor records are disabled' using errcode='22023';end if;
   if coalesce(body->>'phone','')<>'' and exists(select 1 from public.gym_members where gym_id=gid and phone=body->>'phone' and id<>mid) and not (role in ('owner','manager') and coalesce((body->>'reviewSharedPhone')::boolean,false)) then raise exception 'Possible duplicate phone; owner review required' using errcode='40001';end if;
   if member.id is not null then
    if body->>'expectedRevision' is null or member.revision<>(body->>'expectedRevision')::integer then raise exception 'Member changed' using errcode='40001';end if;
    update public.gym_members set name=btrim(body->>'name'),phone=nullif(body->>'phone',''),email=nullif(body->>'email',''),age_status=body->>'ageStatus',tags=coalesce(array(select jsonb_array_elements_text(body->'tags')),'{}'),notes=coalesce(body->>'notes',''),revision=revision+1 where id=mid;
   else
    update public.gyms set member_sequence=member_sequence+1 where id=gid returning member_sequence into seq;
    insert into public.gym_members(id,gym_id,number,name,phone,email,age_status,joined_on,notes,notice_version) values(mid,gid,seq,btrim(body->>'name'),nullif(body->>'phone',''),nullif(body->>'email',''),body->>'ageStatus',(body->>'joinedOn')::date,coalesce(body->>'notes',''),body->>'noticeVersion');
   end if;result:=jsonb_build_object('id',mid);
  elsif kind='member.archive' then
   update public.gym_members set archived=(body->>'archived')::boolean,revision=revision+1 where id=mid;result:=jsonb_build_object('id',mid);
  elsif kind='plan.save' then
   if role not in ('owner','manager') then raise exception 'Membership permission required' using errcode='42501';end if;
   entity:=(body->>'planId')::uuid;select coalesce(max(version),0)+1 into seq from public.gym_plans where id=entity and gym_id=gid;
   if body->>'baseVersion' is null or seq<>(body->>'baseVersion')::integer+1 or exists(select 1 from public.gym_plans where id=entity and gym_id<>gid) then raise exception 'Plan changed' using errcode='40001';end if;
   insert into public.gym_plans(id,gym_id,version,code,name,duration_value,duration_unit,fee_paise,freeze_days,archived) values(entity,gid,seq,body->>'code',btrim(body->>'name'),(body->>'durationValue')::integer,body->>'durationUnit',(body->>'feePaise')::bigint,coalesce((body->>'freezeDays')::integer,30),coalesce((body->>'archived')::boolean,false));result:=jsonb_build_object('id',entity,'version',seq);
  elsif kind='membership.issue' then
   if role not in ('owner','manager') then raise exception 'Membership permission required' using errcode='42501';end if;
   if member.id is null or member.archived then raise exception 'Active register member required' using errcode='22023';end if;
   select * into plan from public.gym_plans where id=(body->>'planId')::uuid and gym_id=gid and version=(body->>'planVersion')::integer and not archived;
   if not found or plan.version<>(select max(version) from public.gym_plans where id=plan.id) then raise exception 'Plan changed; review price' using errcode='40001';end if;
   start_date:=(body->>'startsOn')::date;end_date:=private.membership_end(start_date,plan.duration_value,plan.duration_unit);
   if body->>'renewalOf' is not null then
    select * into membership from public.gym_memberships where id=(body->>'renewalOf')::uuid and gym_id=gid and member_id=mid;
    if not found or (membership.ends_on>=today and start_date<>membership.ends_on) then raise exception 'Renewal must start at previous exclusive end' using errcode='40001';end if;
   end if;
   if exists(select 1 from public.gym_memberships where gym_id=gid and member_id=mid and cancelled_on is null and daterange(starts_on,ends_on,'[)') && daterange(start_date,end_date,'[)')) then raise exception 'Membership dates overlap' using errcode='40001';end if;
   entity:=(body->>'membershipId')::uuid;snapshot:=to_jsonb(plan)-'gym_id'-'created_at';
   insert into public.gym_memberships(id,gym_id,member_id,plan_id,plan_version,starts_on,ends_on,original_ends_on,snapshot,renewal_of,actor_id) values(entity,gid,mid,plan.id,plan.version,start_date,end_date,end_date,snapshot,(body->>'renewalOf')::uuid,uid);
   insert into public.gym_charges(id,gym_id,member_id,membership_id,amount_paise,due_on,label,actor_id) values(gen_random_uuid(),gid,mid,entity,plan.fee_paise,start_date,plan.name,uid);
   update public.gym_members set revision=revision+1 where id=mid;result:=jsonb_build_object('id',entity,'endsOn',end_date,'balance',private.gym_balance(gid,mid));
  elsif kind='membership.cancel' then
   if role not in ('owner','manager') then raise exception 'Membership permission required' using errcode='42501';end if;
   if coalesce(length(btrim(body->>'reason')),0)=0 then raise exception 'Reason required' using errcode='22023';end if;
   update public.gym_memberships set cancelled_on=(body->>'effectiveDate')::date,cancel_reason=body->>'reason',revision=revision+1 where id=(body->>'membershipId')::uuid and gym_id=gid and member_id=mid and revision=(body->>'membershipRevision')::integer and cancelled_on is null;
   if not found then raise exception 'Membership changed' using errcode='40001';end if;
   update public.gym_members set revision=revision+1 where id=mid;result:=jsonb_build_object('id',body->>'membershipId');
  elsif kind='payment.record' then
   if member.id is null then raise exception 'Member required' using errcode='22023';end if;
   entity:=(body->>'paymentId')::uuid;amount:=(body->>'amountPaise')::bigint;occurred:=(body->>'receivedAt')::timestamptz;
   if occurred>now()+interval '5 minutes' then raise exception 'Received time is in the future' using errcode='22023';end if;
   if coalesce(body->>'reference','')<>'' and exists(select 1 from public.gym_payments where gym_id=gid and reference=body->>'reference') and not coalesce((body->>'reviewDuplicateReference')::boolean,false) then raise exception 'Possible duplicate payment reference; review required' using errcode='40001';end if;
   insert into public.gym_payments(id,gym_id,member_id,amount_paise,method,received_at,reference,note,actor_id) values(entity,gid,mid,amount,body->>'method',occurred,coalesce(body->>'reference',''),coalesce(body->>'note',''),uid);
   -- Explicit confirmation applies credit, including the just-received amount, to oldest open charges.
   perform private.allocate_credit(gid,mid,oid,entity);
   issue_year:=extract(year from now() at time zone gym.timezone)::integer;
   insert into public.gym_receipt_counters(gym_id,year,kind,last) values(gid,issue_year,'payment',1) on conflict(gym_id,year,kind) do update set last=gym_receipt_counters.last+1 returning last into seq;
   receipt_number:=gym.code||'/'||issue_year||'/'||lpad(seq::text,6,'0');
   snapshot:=jsonb_build_object('gym',jsonb_build_object('name',gym.name,'address',gym.address,'contact',gym.contact),'member',jsonb_build_object('name',member.name,'number',member.number),'amountPaise',amount,'method',body->>'method','reference',body->>'reference','receivedAt',occurred,'balance',private.gym_balance(gid,mid),'allocations',(select coalesce(jsonb_agg(jsonb_build_object('chargeId',charge_id,'amountPaise',delta_paise)),'[]') from public.gym_allocations where operation_id=oid));
   insert into public.gym_receipts(id,gym_id,member_id,payment_id,number,snapshot,kind) values(gen_random_uuid(),gid,mid,entity,receipt_number,snapshot,'payment');
   update public.gym_members set revision=revision+1 where id=mid;result:=jsonb_build_object('id',entity,'receipt',receipt_number,'balance',private.gym_balance(gid,mid));
  elsif kind='credit.apply' then
   perform private.allocate_credit(gid,mid,oid,null);update public.gym_members set revision=revision+1 where id=mid;result:=private.gym_balance(gid,mid);
  elsif kind='charge.waive' then
   if role not in ('owner','manager') then raise exception 'Finance correction permission required' using errcode='42501';end if;
   select * into charge from public.gym_charges where id=(body->>'chargeId')::uuid and gym_id=gid and member_id=mid;
   if not found then raise exception 'Charge not found' using errcode='P0002';end if;
   amount:=(body->>'amountPaise')::bigint;available:=charge.amount_paise+coalesce((select sum(delta_paise) from public.gym_charge_adjustments where charge_id=charge.id),0);
   if amount is null or amount<=0 or amount>available then raise exception 'Waiver exceeds remaining charge' using errcode='22023';end if;
   insert into public.gym_charge_adjustments(id,gym_id,member_id,charge_id,delta_paise,reason,actor_id) values(gen_random_uuid(),gid,mid,charge.id,-amount,body->>'reason',uid);
   release:=greatest(coalesce((select sum(delta_paise) from public.gym_allocations where charge_id=charge.id),0)-(available-amount),0);
   for r in select payment_id,sum(delta_paise) used from public.gym_allocations where charge_id=charge.id group by payment_id order by payment_id loop
    exit when release<=0;used:=least(release,r.used);if used<=0 then continue;end if;
    insert into public.gym_allocations(gym_id,member_id,payment_id,charge_id,delta_paise,operation_id,actor_id) values(gid,mid,r.payment_id,charge.id,-used,oid,uid);release:=release-used;
   end loop;
   update public.gym_members set revision=revision+1 where id=mid;result:=private.gym_balance(gid,mid);
  elsif kind in ('payment.refund','payment.reverse') then
   if role not in ('owner','manager') then raise exception 'Finance correction permission required' using errcode='42501';end if;
   select * into payment from public.gym_payments where id=(body->>'paymentId')::uuid and gym_id=gid and member_id=mid for update;
   if not found then raise exception 'Payment not found' using errcode='P0002';end if;
   amount:=(body->>'amountPaise')::bigint;portion_start:=(body->>'principalStartPaise')::bigint;
   if amount is null or portion_start is null or amount<=0 or portion_start<0 or portion_start+amount>payment.amount_paise then raise exception 'Invalid principal portion' using errcode='22023';end if;
   if exists(select 1 from public.gym_principal_events where payment_id=payment.id and int8range(start_paise,start_paise+amount_paise,'[)') && int8range(portion_start,portion_start+amount,'[)')) then raise exception 'This principal portion was already refunded or reversed' using errcode='40001';end if;
   available:=payment.amount_paise-coalesce((select sum(amount_paise) from public.gym_principal_events where payment_id=payment.id),0);
   used:=coalesce((select sum(delta_paise) from public.gym_allocations where payment_id=payment.id),0);release:=greatest(used-(available-amount),0);
   for r in select charge_id,sum(delta_paise) used from public.gym_allocations where payment_id=payment.id group by charge_id order by charge_id loop
    exit when release<=0;used:=least(release,r.used);if used<=0 then continue;end if;
    insert into public.gym_allocations(gym_id,member_id,payment_id,charge_id,delta_paise,operation_id,actor_id) values(gid,mid,payment.id,r.charge_id,-used,oid,uid);release:=release-used;
   end loop;
   entity:=gen_random_uuid();
   insert into public.gym_principal_events(id,gym_id,member_id,payment_id,event_type,start_paise,amount_paise,reason,method,reference,occurred_at,actor_id) values(entity,gid,mid,payment.id,case when kind='payment.refund' then 'refund' else 'reversal' end,portion_start,amount,body->>'reason',coalesce(body->>'method','correction'),coalesce(body->>'reference',''),coalesce((body->>'occurredAt')::timestamptz,now()),uid);
   if kind='payment.refund' then
    issue_year:=extract(year from now() at time zone gym.timezone)::integer;
    insert into public.gym_receipt_counters(gym_id,year,kind,last) values(gid,issue_year,'refund',1) on conflict(gym_id,year,kind) do update set last=gym_receipt_counters.last+1 returning last into seq;
    receipt_number:=gym.code||'/'||issue_year||'/RF/'||lpad(seq::text,6,'0');
    insert into public.gym_receipts(id,gym_id,member_id,payment_id,number,snapshot,kind) values(entity,gid,mid,payment.id,receipt_number,jsonb_build_object('amountPaise',amount,'reason',body->>'reason','originalPayment',payment.id,'balance',private.gym_balance(gid,mid)),'refund');
   end if;
   update public.gym_members set revision=revision+1 where id=mid;result:=jsonb_build_object('id',entity,'receipt',receipt_number,'balance',private.gym_balance(gid,mid));
  elsif kind='visit.record' then
   if member.id is null or member.archived then raise exception 'Active register record required' using errcode='22023';end if;
   if body ?| array['latitude','longitude','location','coords'] then raise exception 'Raw location is not accepted' using errcode='22023';end if;
   occurred:=(body->>'occurredAt')::timestamptz;start_date:=(occurred at time zone gym.timezone)::date;
   if occurred>now()+interval '5 minutes' then raise exception 'Visit cannot be in the future' using errcode='22023';end if;
   verification:=case when occurred<now()-interval '72 hours' then 'needs_review' else 'staff_verified' end;
   eligible:=member.age_status='adult' and exists(select 1 from public.gym_memberships m where m.gym_id=gid and m.member_id=mid and start_date>=m.starts_on and start_date<m.ends_on and (m.cancelled_on is null or start_date<m.cancelled_on) and not exists(select 1 from public.gym_freezes f where f.membership_id=m.id and f.status='approved' and start_date>=f.starts_on and start_date<f.ends_on));
   entity:=(body->>'visitId')::uuid;insert into public.gym_visits(id,gym_id,member_id,occurred_at,local_date,source,verification,eligible,reason,actor_id) values(entity,gid,mid,occurred,start_date,'staff',verification,eligible,case when eligible then 'Active adult membership' else 'Membership or age is ineligible for ranking' end,uid);result:=jsonb_build_object('id',entity,'verification',verification,'eligible',eligible);
  else raise exception 'Unsupported gym operation' using errcode='22023';end if;
 end if;
 insert into public.gym_commands(id,gym_id,actor_id,kind,input_hash,result) values(oid,gid,uid,kind,fingerprint,result);
 insert into public.gym_audit(gym_id,actor_id,operation_id,kind,detail) values(gid,uid,oid,kind,jsonb_build_object('result',result,'memberId',mid));
 return result;
end $$;
