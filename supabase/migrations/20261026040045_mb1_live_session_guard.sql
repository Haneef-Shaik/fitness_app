-- MB-1 (QA-1 F-2, 003 §3.7): a profile read needs the caller's live session and active account, as every other member
-- policy does. A signed-out or revoked session, a disabled or deletion-pending profile and a banned user read no row.
alter policy profile_read on public.profiles using (id=(select auth.uid()) and (select private.member_active()));
