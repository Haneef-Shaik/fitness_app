-- Training formula contract v1 (PRD 8.2): set eligibility, external set volume and Epley e1RM.
-- Pure private functions for the member summaries (MB-4). No table, grant or public API changes.
-- One shared fixture, packages/domain/fixtures/ac03-training.v1.json, checks these functions
-- (scripts/backend/sql/training-fixtures.sql) and the TypeScript calculators (docs/architecture/003 4.13).
-- Session status (completed sessions only) is the caller's filter, not part of a set formula.

-- Working, drop and failure sets count; warm-ups, deleted sets and unknown values do not.
create function private.training_set_eligible_v1(p_set_type text,p_deleted boolean) returns boolean
language sql immutable parallel safe security invoker set search_path='' as $$
 select p_deleted is false and coalesce(p_set_type in ('working','drop','failure'),false)
$$;
revoke all on function private.training_set_eligible_v1(text,boolean) from public,anon,authenticated;

-- reps x load_kg x saved multiplier for eligible resistance and externally loaded bodyweight sets.
-- Assisted, timed and distance sets, and a missing reps or load, have no kg volume: null, never 0.
create function private.external_set_volume_v1(p_logging_type text,p_load_basis text,p_multiplier integer,p_set_type text,p_reps integer,p_load_kg numeric,p_deleted boolean)
returns numeric language sql immutable parallel safe security invoker set search_path='' as $$
 select case when private.training_set_eligible_v1(p_set_type,p_deleted)
   and p_logging_type in ('resistance','bodyweight') and p_load_basis in ('total','per_hand','none')
  then p_reps*p_load_kg*p_multiplier else null end
$$;
revoke all on function private.external_set_volume_v1(text,text,integer,text,integer,numeric,boolean) from public,anon,authenticated;

-- Epley v1, load_kg x (1 + reps/30), for eligible resistance sets with a positive load and 1-30 reps.
-- It uses the displayed load basis (per hand stays per hand), so it takes no volume multiplier.
-- Written load_kg x (30 + reps) / 30 so the final division is the only inexact step. Nothing is
-- rounded here: comparisons and PRs use the unrounded value (003 4.9).
create function private.epley_e1rm_v1(p_logging_type text,p_load_basis text,p_set_type text,p_reps integer,p_load_kg numeric,p_deleted boolean)
returns numeric language sql immutable parallel safe security invoker set search_path='' as $$
 select case when private.training_set_eligible_v1(p_set_type,p_deleted)
   and p_logging_type='resistance' and p_load_basis in ('total','per_hand','none')
   and p_reps between 1 and 30 and p_load_kg>0
  then p_load_kg*(30+p_reps)/30 else null end
$$;
revoke all on function private.epley_e1rm_v1(text,text,text,integer,numeric,boolean) from public,anon,authenticated;
