-- Operational gym records are a separate tenant boundary. No policy grants staff health access.
create table public.gyms (
 id uuid primary key, code text not null unique check(code ~ '^[A-Z0-9]{2,12}$'), name text not null check(length(btrim(name)) between 1 and 100),
 address text not null default '',contact text not null default '',timezone text not null default 'Asia/Kolkata', currency text not null default 'INR' check(currency='INR'),
 opening_days integer[] not null default '{1,2,3,4,5,6}',coverage_mode text not null default 'partial' check(coverage_mode in ('partial','complete')),
 member_sequence integer not null default 0,closed_at timestamptz,revision integer not null default 1,created_at timestamptz not null default now()
);
create table public.gym_roles (
 gym_id uuid not null references public.gyms(id),user_id uuid not null references public.profiles(id),role text not null check(role in ('owner','manager','front_desk')),
 revoked_at timestamptz,created_at timestamptz not null default now(),primary key(gym_id,user_id)
);
create index gym_roles_user on public.gym_roles(user_id);
create function private.gym_role(p_gym uuid) returns text language sql stable security definer set search_path='' as $$
 select r.role from public.gym_roles r join public.gyms g on g.id=r.gym_id where r.gym_id=p_gym and r.user_id=auth.uid() and r.revoked_at is null and g.closed_at is null and private.member_active()
$$;
revoke all on function private.gym_role(uuid) from public,anon;
grant execute on function private.gym_role(uuid) to authenticated;
create table public.gym_members (
 id uuid primary key,gym_id uuid not null references public.gyms(id),number integer not null,name text not null check(length(btrim(name)) between 1 and 100),
 phone text check(phone is null or phone ~ '^\+91[6-9][0-9]{9}$'),email text,age_status text not null check(age_status in ('adult','unknown')),
 joined_on date not null,tags text[] not null default '{}',notes text not null default '' check(length(notes)<=2000),notice_version text not null,
 linked_user_id uuid references public.profiles(id),archived boolean not null default false,revision integer not null default 1,created_at timestamptz not null default now(),
 unique(gym_id,number),unique(gym_id,id)
);
create unique index one_linked_member_per_gym on public.gym_members(gym_id,linked_user_id) where linked_user_id is not null;
create index gym_members_user on public.gym_members(linked_user_id);
create index gym_members_search on public.gym_members(gym_id,number,id);
create function private.gym_record_access(p_gym uuid,p_member uuid) returns boolean language sql stable security definer set search_path='' as $$
 select private.member_active() and (private.gym_role(p_gym) is not null or exists(select 1 from public.gym_members where gym_id=p_gym and id=p_member and linked_user_id=auth.uid()))
$$;
revoke all on function private.gym_record_access(uuid,uuid) from public,anon;
grant execute on function private.gym_record_access(uuid,uuid) to authenticated;
create table public.gym_plans (
 id uuid not null,gym_id uuid not null references public.gyms(id),version integer not null,code text not null,name text not null,
 duration_value integer not null check(duration_value between 1 and 3660),duration_unit text not null check(duration_unit in ('days','months')),
 fee_paise bigint not null check(fee_paise>=0 and fee_paise<=100000000000),freeze_days integer not null default 30 check(freeze_days between 0 and 366),archived boolean not null default false,
 primary key(id,version),unique(gym_id,id,version),created_at timestamptz not null default now()
);
create table public.gym_memberships (
 id uuid primary key,gym_id uuid not null,member_id uuid not null,plan_id uuid not null,plan_version integer not null,
 starts_on date not null,ends_on date not null,original_ends_on date not null,snapshot jsonb not null,renewal_of uuid,
 cancelled_on date,cancel_reason text,revision integer not null default 1,actor_id uuid not null references public.profiles(id),created_at timestamptz not null default now(),
 foreign key(gym_id,member_id) references public.gym_members(gym_id,id),foreign key(gym_id,plan_id,plan_version) references public.gym_plans(gym_id,id,version),check(ends_on>starts_on),unique(gym_id,member_id,id)
);
create table public.gym_freezes (
 id uuid primary key,gym_id uuid not null,member_id uuid not null,membership_id uuid not null,starts_on date not null,ends_on date not null,
 status text not null check(status in ('pending','approved','rejected','cancelled')),reason text not null,actor_id uuid not null references public.profiles(id),created_at timestamptz not null default now(),
 foreign key(gym_id,member_id,membership_id) references public.gym_memberships(gym_id,member_id,id),check(ends_on>starts_on)
);
create table public.gym_charges (
 id uuid primary key,gym_id uuid not null,member_id uuid not null,membership_id uuid,amount_paise bigint not null check(amount_paise>=0 and amount_paise<=100000000000),
 due_on date not null,label text not null,actor_id uuid not null references public.profiles(id),created_at timestamptz not null default now(),
 foreign key(gym_id,member_id) references public.gym_members(gym_id,id),foreign key(gym_id,member_id,membership_id) references public.gym_memberships(gym_id,member_id,id),unique(gym_id,member_id,id)
);
create table public.gym_charge_adjustments (
 id uuid primary key,gym_id uuid not null,member_id uuid not null,charge_id uuid not null,delta_paise bigint not null check(delta_paise<>0),reason text not null check(length(btrim(reason))>0),
 actor_id uuid not null references public.profiles(id),created_at timestamptz not null default now(),foreign key(gym_id,member_id,charge_id) references public.gym_charges(gym_id,member_id,id)
);
create table public.gym_payments (
 id uuid primary key,gym_id uuid not null,member_id uuid not null,amount_paise bigint not null check(amount_paise>0 and amount_paise<=100000000000),
 method text not null check(method in ('cash','upi','bank','card_external','other')),received_at timestamptz not null,reference text not null default '',note text not null default '',
 actor_id uuid not null references public.profiles(id),created_at timestamptz not null default now(),foreign key(gym_id,member_id) references public.gym_members(gym_id,id),unique(gym_id,member_id,id)
);
create table public.gym_principal_events (
 id uuid primary key,gym_id uuid not null,member_id uuid not null,payment_id uuid not null,event_type text not null check(event_type in ('refund','reversal')),
 start_paise bigint not null check(start_paise>=0),amount_paise bigint not null check(amount_paise>0),reason text not null check(length(btrim(reason))>0),
 method text not null,reference text not null,occurred_at timestamptz not null,actor_id uuid not null references public.profiles(id),created_at timestamptz not null default now(),
 foreign key(gym_id,member_id,payment_id) references public.gym_payments(gym_id,member_id,id)
);
create table public.gym_allocations (
 id uuid primary key default gen_random_uuid(),gym_id uuid not null,member_id uuid not null,payment_id uuid not null,charge_id uuid not null,
 delta_paise bigint not null check(delta_paise<>0),operation_id uuid not null,actor_id uuid not null references public.profiles(id),created_at timestamptz not null default now(),
 foreign key(gym_id,member_id,payment_id) references public.gym_payments(gym_id,member_id,id),foreign key(gym_id,member_id,charge_id) references public.gym_charges(gym_id,member_id,id)
);
create table public.gym_receipt_counters (gym_id uuid not null references public.gyms(id),year integer not null,kind text not null,last integer not null,primary key(gym_id,year,kind));
create table public.gym_receipts (
 id uuid primary key,gym_id uuid not null,member_id uuid not null,payment_id uuid not null,number text not null,snapshot jsonb not null,kind text not null check(kind in ('payment','refund')),
 issued_at timestamptz not null default now(),foreign key(gym_id,member_id,payment_id) references public.gym_payments(gym_id,member_id,id),unique(gym_id,number)
);
create table public.gym_visits (
 id uuid primary key,gym_id uuid not null,member_id uuid not null,occurred_at timestamptz not null,local_date date not null,
 source text not null check(source in ('staff','self')),verification text not null check(verification in ('staff_verified','unverified','needs_review')),
 eligible boolean not null,reason text not null,actor_id uuid not null references public.profiles(id),received_at timestamptz not null default now(),
 foreign key(gym_id,member_id) references public.gym_members(gym_id,id)
);
create index gym_visits_counting on public.gym_visits(gym_id,member_id,local_date);
create table public.gym_commands (
 id uuid primary key,gym_id uuid not null references public.gyms(id),actor_id uuid not null references public.profiles(id),kind text not null,input_hash text not null,result jsonb not null,created_at timestamptz not null default now()
);
create table public.gym_audit (
 id uuid primary key default gen_random_uuid(),gym_id uuid not null references public.gyms(id),actor_id uuid not null references public.profiles(id),operation_id uuid not null,kind text not null,detail jsonb not null,created_at timestamptz not null default now()
);

do $$declare t text;begin
 foreach t in array array['gyms','gym_roles','gym_members','gym_plans','gym_memberships','gym_freezes','gym_charges','gym_charge_adjustments','gym_payments','gym_principal_events','gym_allocations','gym_receipts','gym_receipt_counters','gym_visits','gym_commands','gym_audit'] loop
  execute format('alter table public.%I enable row level security',t);
  execute format('revoke all on public.%I from anon,authenticated',t);
  if t<>'gym_receipt_counters' then execute format('grant select on public.%I to authenticated',t); end if;
  if t in ('gym_memberships','gym_freezes','gym_charges','gym_charge_adjustments','gym_payments','gym_principal_events','gym_allocations','gym_receipts','gym_visits') then
   execute format('create policy gym_record_read on public.%I for select to authenticated using(private.gym_record_access(gym_id,member_id))',t);
   execute format('create index %I on public.%I(gym_id,member_id)',t||'_member',t);
  elsif t in ('gym_commands','gym_audit') then execute format('create policy gym_admin_read on public.%I for select to authenticated using(private.gym_role(gym_id) in (''owner'',''manager''))',t);
  end if;
 end loop;
end $$;
create policy gym_read on public.gyms for select to authenticated using(private.gym_role(id) is not null or exists(select 1 from public.gym_members where gym_id=id and linked_user_id=auth.uid()));
create policy role_read on public.gym_roles for select to authenticated using(user_id=auth.uid() or private.gym_role(gym_id)='owner');
create policy register_read on public.gym_members for select to authenticated using(private.gym_role(gym_id) is not null or linked_user_id=auth.uid());
create policy plans_read on public.gym_plans for select to authenticated using(private.gym_role(gym_id) is not null or exists(select 1 from public.gym_members where gym_id=gym_plans.gym_id and linked_user_id=auth.uid()));

create function private.membership_end(p_start date,p_value integer,p_unit text) returns date language plpgsql immutable set search_path='' as $$
declare target_month date; candidate date;
begin
 if p_unit='days' then return p_start+p_value; end if;
 if p_unit<>'months' then raise exception 'Invalid duration' using errcode='22023'; end if;
 target_month:=(date_trunc('month',p_start)+make_interval(months=>p_value))::date;
 candidate:=target_month+(extract(day from p_start)::integer-1);
 return case when date_trunc('month',candidate)=target_month then candidate else (target_month+interval '1 month')::date end;
end $$;
revoke all on function private.membership_end(date,integer,text) from public,anon,authenticated;

create function private.gym_balance(p_gym uuid,p_member uuid) returns jsonb language sql stable security definer set search_path='' as $$
 with c as(select coalesce(sum(amount_paise),0)+(select coalesce(sum(delta_paise),0) from public.gym_charge_adjustments where gym_id=p_gym and member_id=p_member) amount from public.gym_charges where gym_id=p_gym and member_id=p_member),
 p as(select coalesce(sum(amount_paise),0)-(select coalesce(sum(amount_paise),0) from public.gym_principal_events where gym_id=p_gym and member_id=p_member) amount from public.gym_payments where gym_id=p_gym and member_id=p_member),
 a as(select coalesce(sum(delta_paise),0) amount from public.gym_allocations where gym_id=p_gym and member_id=p_member)
 select jsonb_build_object('charges',c.amount,'principal',p.amount,'allocated',a.amount,'due',c.amount-a.amount,'credit',p.amount-a.amount,'net',c.amount-p.amount) from c,p,a
$$;
revoke all on function private.gym_balance(uuid,uuid) from public,anon,authenticated;

create function private.allocate_credit(p_gym uuid,p_member uuid,p_operation uuid) returns void language plpgsql security definer set search_path='' as $$
declare p record;c record;available bigint;due bigint;amount bigint;
begin
 for p in select x.id,x.amount_paise-coalesce((select sum(amount_paise) from public.gym_principal_events where payment_id=x.id),0)-coalesce((select sum(delta_paise) from public.gym_allocations where payment_id=x.id),0) credit from public.gym_payments x where x.gym_id=p_gym and x.member_id=p_member order by received_at,id loop
  available:=p.credit;
  for c in select x.id,x.amount_paise+coalesce((select sum(delta_paise) from public.gym_charge_adjustments where charge_id=x.id),0)-coalesce((select sum(delta_paise) from public.gym_allocations where charge_id=x.id),0) due from public.gym_charges x where x.gym_id=p_gym and x.member_id=p_member order by due_on,created_at,id loop
   exit when available<=0; amount:=least(available,c.due); if amount<=0 then continue; end if;
   insert into public.gym_allocations(gym_id,member_id,payment_id,charge_id,delta_paise,operation_id,actor_id) values(p_gym,p_member,p.id,c.id,amount,p_operation,auth.uid()); available:=available-amount;
  end loop;
 end loop;
end $$;
revoke all on function private.allocate_credit(uuid,uuid,uuid) from public,anon,authenticated;

create function private.gym_command(p_command jsonb) returns jsonb language plpgsql security definer set search_path='' as $$
declare gid uuid:=(p_command->>'gymId')::uuid;oid uuid:=(p_command->>'id')::uuid;kind text:=p_command->>'kind';body jsonb:=p_command->'payload';uid uuid:=auth.uid();
 role text;member public.gym_members;gym public.gyms;plan public.gym_plans;membership public.gym_memberships;payment public.gym_payments;charge public.gym_charges;
 previous public.gym_commands;fingerprint text:=md5(p_command::text);result jsonb;mid uuid;entity uuid;start_date date;end_date date;today date;amount bigint;available bigint;release bigint;used bigint;portion_start bigint;
 seq integer;issue_year integer;receipt_number text;r record;snapshot jsonb;occurred timestamptz;verification text;eligible boolean;
begin
 if not private.member_active() or gid is null or oid is null or body is null then raise exception 'Active account and command required' using errcode='42501'; end if;
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
  if kind='member.save' then
   if body->>'ageStatus' not in ('adult','unknown') then raise exception 'Minor records are disabled' using errcode='22023';end if;
   if coalesce(body->>'phone','')<>'' and exists(select 1 from public.gym_members where gym_id=gid and phone=body->>'phone' and id<>mid) and not (role in ('owner','manager') and coalesce((body->>'reviewSharedPhone')::boolean,false)) then raise exception 'Possible duplicate phone; owner review required' using errcode='40001';end if;
   if member.id is not null then
    if member.revision<>(body->>'expectedRevision')::integer then raise exception 'Member changed' using errcode='40001';end if;
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
   if seq<>(body->>'baseVersion')::integer+1 or exists(select 1 from public.gym_plans where id=entity and gym_id<>gid) then raise exception 'Plan changed' using errcode='40001';end if;
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
   perform private.allocate_credit(gid,mid,oid);
   issue_year:=extract(year from now() at time zone gym.timezone)::integer;
   insert into public.gym_receipt_counters(gym_id,year,kind,last) values(gid,issue_year,'payment',1) on conflict(gym_id,year,kind) do update set last=gym_receipt_counters.last+1 returning last into seq;
   receipt_number:=gym.code||'/'||issue_year||'/'||lpad(seq::text,6,'0');
   snapshot:=jsonb_build_object('gym',jsonb_build_object('name',gym.name,'address',gym.address,'contact',gym.contact),'member',jsonb_build_object('name',member.name,'number',member.number),'amountPaise',amount,'method',body->>'method','reference',body->>'reference','receivedAt',occurred,'balance',private.gym_balance(gid,mid),'allocations',(select coalesce(jsonb_agg(jsonb_build_object('chargeId',charge_id,'amountPaise',delta_paise)),'[]') from public.gym_allocations where operation_id=oid));
   insert into public.gym_receipts(id,gym_id,member_id,payment_id,number,snapshot,kind) values(gen_random_uuid(),gid,mid,entity,receipt_number,snapshot,'payment');
   update public.gym_members set revision=revision+1 where id=mid;result:=jsonb_build_object('id',entity,'receipt',receipt_number,'balance',private.gym_balance(gid,mid));
  elsif kind='credit.apply' then
   perform private.allocate_credit(gid,mid,oid);update public.gym_members set revision=revision+1 where id=mid;result:=private.gym_balance(gid,mid);
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
revoke all on function private.gym_command(jsonb) from public,anon;
grant execute on function private.gym_command(jsonb) to authenticated;
create function public.gym_command_v1(p_command jsonb) returns jsonb language sql security invoker set search_path='' as $$select private.gym_command(p_command)$$;
revoke all on function public.gym_command_v1(jsonb) from public,anon;
grant execute on function public.gym_command_v1(jsonb) to authenticated;
