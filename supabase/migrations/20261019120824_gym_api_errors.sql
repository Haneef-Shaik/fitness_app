alter function private.gym_command(jsonb) rename to gym_command_core;
revoke all on function private.gym_command_core(jsonb) from authenticated;
create function private.gym_command(p_command jsonb) returns jsonb language plpgsql security definer set search_path='' as $$
begin
 return private.gym_command_core(p_command);
exception when no_data_found then raise exception 'Gym record not found' using errcode='PT404';
end $$;
revoke all on function private.gym_command(jsonb) from public,anon;
grant execute on function private.gym_command(jsonb) to authenticated;
create or replace function public.gym_command_v1(p_command jsonb) returns jsonb language sql security invoker set search_path='' as $$select private.gym_command(p_command)$$;
