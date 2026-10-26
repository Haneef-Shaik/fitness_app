# AR-1 phase2B preparation

26 October2026: applied Supabase and Supabase Postgres Best Practices skill guidance.
Reviewed [official migration workflow](https://supabase.com/docs/guides/deployment/database-migrations),
[current changelog](https://supabase.com/changelog.md) and the linked
[Postgres17.11/15.19 notice](https://supabase.com/changelog/postgres-15-19-17-11-breaking-changes).
The notice lists extension/operator upgrade concerns; no environment upgrade or claim about current
extension state is made. Replay preflight must retain the existing pinned stack and test actual migrations.

Installed Supabase CLI2.121.0 `migration new --help` was read, then `supabase migration new training_formula_v1`
created `supabase/migrations/20261025234317_training_formula_v1.sql` in the isolated goal checkout.
Only an empty migration file was created; no database command, reset, apply or provisioning occurred.
Claude phase2B owns that new file plus the shared JSON, TypeScript fixture test/optional formatter,
rollback-only SQL fixture check and its phase report. SQL execution and replay will be a later
serialized isolated phase. No user/historical database may be reset.
