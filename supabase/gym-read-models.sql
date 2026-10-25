-- A single database statement reads the full account consistently, without API row-limit truncation.
create function private.gym_account(p_gym uuid,p_member uuid) returns jsonb language plpgsql stable security definer set search_path='' as $$
declare result jsonb;
begin
 if not private.gym_record_access(p_gym,p_member) then raise exception 'Gym record not found' using errcode='PT404'; end if;
 select jsonb_build_object('member',to_jsonb(m),
  'memberships',(select coalesce(jsonb_agg(to_jsonb(x) order by starts_on desc,id),'[]') from public.gym_memberships x where gym_id=p_gym and member_id=p_member),
  'charges',(select coalesce(jsonb_agg(to_jsonb(x) order by due_on,id),'[]') from public.gym_charges x where gym_id=p_gym and member_id=p_member),
  'adjustments',(select coalesce(jsonb_agg(to_jsonb(x)),'[]') from public.gym_charge_adjustments x where gym_id=p_gym and member_id=p_member),
  'payments',(select coalesce(jsonb_agg(to_jsonb(x) order by received_at desc,id),'[]') from public.gym_payments x where gym_id=p_gym and member_id=p_member),
  'receipts',(select coalesce(jsonb_agg(to_jsonb(x) order by issued_at desc,id),'[]') from public.gym_receipts x where gym_id=p_gym and member_id=p_member),
  'principal',(select coalesce(jsonb_agg(to_jsonb(x)),'[]') from public.gym_principal_events x where gym_id=p_gym and member_id=p_member),
  'allocations',(select coalesce(jsonb_agg(to_jsonb(x)),'[]') from public.gym_allocations x where gym_id=p_gym and member_id=p_member),
  'visits',(select coalesce(jsonb_agg(to_jsonb(x) order by occurred_at desc,id),'[]') from (select * from public.gym_visits where gym_id=p_gym and member_id=p_member order by occurred_at desc,id limit 100) x),
  'balance',private.gym_balance(p_gym,p_member)) into result from public.gym_members m where gym_id=p_gym and id=p_member;
 if result is null then raise exception 'Member not found' using errcode='PT404';end if;
 return result;
end $$;
revoke all on function private.gym_account(uuid,uuid) from public,anon;
grant execute on function private.gym_account(uuid,uuid) to authenticated;
create function public.gym_account_v1(p_gym uuid,p_member uuid) returns jsonb language sql security invoker set search_path='' as $$select private.gym_account(p_gym,p_member)$$;
revoke all on function public.gym_account_v1(uuid,uuid) from public,anon;
grant execute on function public.gym_account_v1(uuid,uuid) to authenticated;

create function private.gym_dashboard(p_gym uuid) returns jsonb language plpgsql stable security definer set search_path='' as $$
declare today date; result jsonb;
begin
 if private.gym_role(p_gym) is null then raise exception 'Gym not found' using errcode='PT404';end if;
 select (now() at time zone timezone)::date into today from public.gyms where id=p_gym;
 with charge_balances as (select c.amount_paise+coalesce((select sum(delta_paise) from public.gym_charge_adjustments where charge_id=c.id),0)-coalesce((select sum(delta_paise) from public.gym_allocations where charge_id=c.id),0) due,c.due_on from public.gym_charges c where gym_id=p_gym)
 select jsonb_build_object('date',today,'dueToday',coalesce(sum(due) filter(where due_on=today),0),'overdue',coalesce(sum(due) filter(where due_on<today),0),'totalDue',coalesce(sum(due),0),
 'visitsToday',(select count(distinct member_id) from public.gym_visits where gym_id=p_gym and local_date=today),
 'activeMembers',(select count(distinct m.member_id) from public.gym_memberships m join public.gym_members r on r.id=m.member_id where m.gym_id=p_gym and not r.archived and today>=m.starts_on and today<m.ends_on and (m.cancelled_on is null or today<m.cancelled_on) and not exists(select 1 from public.gym_freezes f where f.membership_id=m.id and f.status='approved' and today>=f.starts_on and today<f.ends_on)),
 'collections',(select coalesce(sum(amount_paise),0) from public.gym_payments where gym_id=p_gym)-(select coalesce(sum(amount_paise),0) from public.gym_principal_events where gym_id=p_gym),
 'recentPayments',(select coalesce(jsonb_agg(to_jsonb(x)),'[]') from (select p.id,p.member_id,p.amount_paise,p.method,p.received_at,m.name from public.gym_payments p join public.gym_members m on m.id=p.member_id where p.gym_id=p_gym order by p.received_at desc,p.id limit 10) x)
 ) into result from charge_balances;
 return result;
end $$;
revoke all on function private.gym_dashboard(uuid) from public,anon;
grant execute on function private.gym_dashboard(uuid) to authenticated;
create function public.gym_dashboard_v1(p_gym uuid) returns jsonb language sql security invoker set search_path='' as $$select private.gym_dashboard(p_gym)$$;
revoke all on function public.gym_dashboard_v1(uuid) from public,anon;
grant execute on function public.gym_dashboard_v1(uuid) to authenticated;
