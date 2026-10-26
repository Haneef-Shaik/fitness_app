# AR-1 · Architecture record approval (G-1): decided by delegation

> **DECIDED BY DELEGATION, 26 October 2026. No answer is needed from you.**
> You told the coordinator: "i dont wanted to get involved i wanted you to act as the final decision
> make and guide the claude". Codex accepted, and is recorded as your explicitly delegated
> decision-maker in [tracker row AUTH-01](../../09-PROJECT-TRACKER.md#decision-log). Acting in that role,
> Codex approved 003 in [tracker row ARCH-01](../../09-PROJECT-TRACKER.md#decision-log). You did not
> personally review or sign 003, and no record says you did.
>
> *Historical: this page was first prepared on 26 October 2026 as a request for your review, "READY FOR
> REVIEW. Not approved", while the two independent reviews were still running.*

**What was decided.** [003 — Architecture and contract freeze](../../architecture/003-architecture-freeze.md)
(revision 3, with the final low corrections N-1 to N-5) is approved as a whole, with no exceptions. That
is option A below.

**Basis.** Independent [proposal review 4](../../evidence/AR-1/proposal-review4.json) and the independent
[guard review](../../evidence/AR-1/guard-review.json) both PASS, and the local gates listed under
"The engineering evidence behind it" pass.

**Why a record was needed.** AR-1's first Done box ends "…and the owner's or an explicitly delegated
decision-maker's approval is in the tracker decision log" ([GOALS.md, AR-1](../GOALS.md)).
- Only a dated row in [docs/09 §Decision log](../../09-PROJECT-TRACKER.md#decision-log) counts. ARCH-01 is
  that row.
- This page, a review verdict or a chat message does not count on its own.
- QA-2 needs AR-1. Sync point SP0 also hands this record and the contract package to every lane
  (GOALS.md).

## What 003 decides

These are routine, reversible engineering choices, now frozen by the delegated approval. Any of them can
later change through a new record or a new migration.

| # | Choice | 003 |
|---|---|---|
| 1 | PostgreSQL 17 on Supabase is the only system of record, with Supabase Auth, private Storage buckets, Edge Functions, and `pg_cron` with `pg_net` for schedules | §2, §3.3, §3.6 |
| 2 | The API is `_v1` database functions for data and `-v1` Edge Functions for providers, webhooks, files and health. JSON is camelCase, with one success shape and one error shape. Error codes include `PRO_REQUIRED`, raised before any AI job or provider call | §4.1–§4.5, §4.14 |
| 3 | Every change carries a client operation ID, so a retry never repeats work. A stale revision returns a conflict for review, never a silent overwrite. Rejected requests count against rate limits; replays do not | §4.3, §4.6, §4.7, §4.12 |
| 4 | Lists use cursors (50 per page by default, 100 at most). Member sync is an ordered change feed | §4.8 |
| 5 | Planned, not yet on the wire: decimals as exact strings, and money as integer minor units with a currency | §4.9 |
| 6 | Background jobs live in Postgres with one Edge worker. A separate worker host is used only if measured limits fail | §3.5 |
| 7 | Subscriptions, AI, messaging and error tracking sit behind provider-neutral adapters. Only the worker calls an AI provider. Real messages stay capped at zero until G23 | §3.8–§3.11 |
| 8 | Privacy: private buckets with short-lived links; gym documents behind a proxy whose revocation is immediate; no staff access to members' health data; erasure through an external tombstone list, so a backup restore cannot bring back an erased account | §3.3, §3.4, §6 |
| 9 | Contract package `@fitlog/domain` version `0.1.0` holds today's schemas only. Snapshots are immutable. Versions stay `0.x` until MS-3, then `1.0.0`. A backend change merges before the screens that use it (SP3) | §4.1, §8 |
| 10 | Migrations are append-only. No SQL lives outside migrations except the two seeds. Every database change replays from empty with an empty schema diff | §7 |

## What the approval does not decide

ARCH-01 does not decide R-1 to R-7:
- **R-1, region.** Mumbai is only the engineering recommendation.
- **R-2, accounts and plans.** Supabase, EAS, the store accounts and the tombstone-store account.
- **R-3, vendors.** RevenueCat, the error tracker, SMTP, SMS, WhatsApp, Expo push and the tombstone store.
- **R-4, legal positions and retention.**
- **R-5, prices and SKUs.**
- **R-6, the AI model and vendor.**
- **R-7, photo and object backups.**

Under AUTH-01, routine technical and vendor-technical choices among these now belong to Codex, each in
its own goal and dated record. The delegation does not create evidence: opening accounts, payments,
external messages, legal and licence positions, and device proof still need real evidence. Nothing has
been provisioned, no terms have been accepted, and no account has been opened. No native build, store
build or device result is claimed or approved here
([003 §11](../../architecture/003-architecture-freeze.md#11-approval-and-owner-reserved-items)).

## The engineering evidence behind it (local only)

Every item comes from the [handoff](../runs/AR-1/handoff.md).
- **Contract version.** `CONTRACT_VERSION` `0.1.0` is exported. A schema change without a version bump
  was seen to fail the tests. The database's 8 stored schemas match the snapshot.
- **Replay.** All 15 migrations replay from empty on an isolated local copy, and the schema diff is
  empty.
- **Shared fixture.** One AC03 fixture file drives the TypeScript and SQL tests: session volume 1920, and
  e1RM 101.333333 for 80 kg × 8. Deliberately broken copies fail.
- **Gates.** 185 tests in `pnpm check` and 39 guard tests pass.
- **Not yet shown:**
  - hosted CI;
  - one bundled run of the full backend test command (the coordinator runs it after applying the
    additive formula migration to the shared local stack; no result is assumed here);
  - device and release results.

## Decision taken

- **A. Approve 003 as is.** ← chosen by Codex as your delegated decision-maker, 26 October 2026 (ARCH-01)
- B. Approve with exceptions. Not chosen.
- C. Not yet. Not chosen.

No question is open for you on this page.

## Historical draft decision-log row (superseded by ARCH-01 as entered)

> HISTORICAL DRAFT, kept for the record. The row actually entered is ARCH-01 in the tracker, together
> with AUTH-01.

| Date | ID | Decision | Why | Linked requirement / goal |
| --- | --- | --- | --- | --- |
| YYYY-MM-DD | ARCH-01 | Approve architecture record 003, revision 3, as the AR-1 freeze[, except: …]. R-1 to R-7 remain owner-reserved | Freezes interfaces so member, gym and client lanes can build in parallel (PRD §26.1 M0) | AR-1 box 1; DEC-02 (technical part); QA-2; [003](architecture/003-architecture-freeze.md) |

## After the decision

1. **Done:** ARCH-01 and AUTH-01 are in the tracker decision log.
2. **Next:** the bundled backend test run, then a fresh independent verifier checks all four AR-1 boxes.
3. **Only after that verifier passes:** AR-1 is integrated locally into `main` and marked Done through
   the status tool.

Steps 2 and 3 have not happened yet. AR-1 is not Done.
