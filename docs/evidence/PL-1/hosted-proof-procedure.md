# PL-1 · Hosted proof procedure (prepared, not run)

| Field | Value |
|---|---|
| Status | **Prepared for review. Nothing in this file has been run.** No push, pull request, branch-protection change or GitHub API call has happened |
| Prepared | 27 October 2026, from worktree `codex/fitlog-pl1-ci` based on `main` `c8a5d57`. Revised the same day for review 0535 (H1, H2, M1, M2, L6), then for review 0705 (F2 §5, F3 §3, F4 §1, F5 §4b) |
| Who acts | Every outward step needs the owner's explicit authorisation (docs/23 §6 and §9 rule 7; EXECUTION.md: external actions still escalate). Step owners are named below |
| Required checks | **Three:** `check` (mobile-ci.yml), `backend` (backend-ci.yml) and `ci-guard` (ci-guard.yml). Each is a job ID, and `scripts/ci/workflow-guard.mjs` pins all three |
| Boxes it proves | PL-1 box 1 (a green run of the jobs on `main`'s head, linked in the tracker), box 3 (branch protection, captured here) and box 2 (a failing check blocks merging, run linked). It also gives AR-1's open hosted pair and QA-9 R10's first Linux run |
| Order | Pre-flight (visibility, plan and allowance first) → box 1 (first push) → box 3 → box 2 → optional §4b → box 1 again on the head after the evidence merge (§2.5). Box 3 needs each check name to have run once; box 2 and §4b need box 3 |

## 0. Preconditions

1. The PL-1 diff has passed a fresh independent review. It is committed with `PL-1` in the subject and integrated into local `main` by the integrator. The diff is exactly:
   - `.github/workflows/backend-ci.yml` and `.github/workflows/ci-guard.yml`;
   - `scripts/ci/backend-ci.mjs`, `scripts/ci/workflow-guard.mjs`, `scripts/ci/workflow-text.mjs`;
   - `scripts/ci/backend-ci.test.mjs`, `scripts/ci/workflow-guard.test.mjs`, `scripts/ci/ci-guard.test.mjs`;
   - `docs/evidence/PL-1/*` and `docs/plan/runs/PL-1/*`.

   `mobile-ci.yml` is unchanged.
2. The standard gates pass on that local `main`: `pnpm install --frozen-lockfile`, `pnpm check`, `pnpm backend:test` on the local 55321 stack, `node --test scripts/ci/*.test.mjs` and `node scripts/ci/workflow-guard.mjs`.
3. The owner authorises each outward action separately: the push of `main`, the branch-protection change, and the probe branch with its pull request.

## 1. Pre-flight (local, read-only, before the first push)

**First: the repository's visibility, plan and Actions allowance** (review 0705 F4). The owner runs these. They only read: nothing here changes a setting or spends money.

```bash
gh api repos/<owner>/<repo> --jq '{visibility, owner_type: .owner.type}'
gh api user --jq '.plan.name'          # a personal account: the owner's own plan
gh api orgs/<org> --jq '.plan.name'    # an organisation: readable by its owners
```

| Result | What to do |
|---|---|
| `public` | Go on |
| `private` on a paid plan | Read this month's Actions usage on the billing page (read only). Go on only if the included minutes left cover §2 to §4 and the optional §4b. Those are three workflows per push and per pull-request update, and `backend` can take up to 30 minutes |
| `private` on GitHub Free, or the plan can't be read | **Stop. The owner decides.** Protected branches and rulesets on a private repository need a paid plan, and these runs would use the free minute allowance. **Do not** upgrade the plan, raise a spending limit, turn on overage or add a payment method as part of this procedure |

The plan rules above are from GitHub's documentation as last known. No network was used in this phase, so re-read GitHub's current plan and Actions billing pages at run time. If they differ, they win.

**Then: the first push's verdict.** The first push of `main` carries `before` = the remote's current `main`, and every guard judges against that commit. The last fetch here recorded `refs/remotes/origin/main` = `c8f6d7f750b0…`, while local `main` is `c8a5d57…`. QA-9 measured `origin/main` as 164 JavaScript and TypeScript files behind. So predict the verdict first, from a clean checkout of the exact `main` to be pushed:

```bash
rtk proxy git fetch origin                   # a read of the remote; the owner's call
BASE=$(git rev-parse origin/main)            # the `before` the push will carry
git merge-base --is-ancestor "$BASE" main && echo fast-forward
CI=1 FITLOG_BASE_REF="$BASE" node scripts/backend/check-sql-sources.mjs
CI=1 FITLOG_CONTRACT_BASELINE="$BASE" pnpm --filter @fitlog/domain test
node scripts/ci/workflow-guard.mjs
```

| Pre-flight result | What it means | What to do |
|---|---|---|
| Not an ancestor | The push would not be a fast-forward | **Stop.** Owner decision. Never force-push |
| All commands exit 0 | The first push should be green | Go to box 1 |
| A guard fails, for example `… was deleted or renamed since the base …` | The old remote `main` holds history the rebuild replaced, and the guard is right to report it | **Do not edit a guard, a migration or a snapshot.** The owner chooses: push anyway and record the expected red first run with its log line. The next push, whose `before` is the new head, must then be green |

If QA-9 is integrated by then, its own pre-flight (`docs/evidence/QA-9/ratchet-enforcement.md` §7) applies to `check` as well.

## 2. Box 1: a green run of every required job on `main`'s head

1. **Owner:** `git push origin main`.
2. Three workflow runs start for the pushed head: **Mobile foundation** (job `check`), **Backend replay** (job `backend`) and **CI guard** (job `ci-guard`).
3. Expected lines:

   | Job · step | Expected |
   |---|---|
   | `ci-guard` and `backend` · the three required workflows are as reviewed | `CI workflows as reviewed: backend-ci.yml (job backend), ci-guard.yml (job ci-guard) and mobile-ci.yml (job check), each judged from both the backend and the ci-guard job; no other workflow file` |
   | `ci-guard` and `backend` · test the CI helper and the workflow guard | `# tests 35`, `# pass 35`, `# fail 0` (more if later tests land) |
   | `backend` · require the event's own base | `Trusted base <before> from the push event, for FITLOG_BASE_REF and FITLOG_CONTRACT_BASELINE; it forks from HEAD at <before>` |
   | `backend` · refuse any tracked node_modules path | `Git tracks no path inside a node_modules folder` |
   | `backend` · local main | `Left the existing refs/heads/main at <head> unchanged; FITLOG_BASE_REF still names the trusted base <before>`. If the checkout has no local `main`: `Created refs/heads/main at the trusted base <before> …`, also correct |
   | `backend` · start the local stack | Exit 0; the status table with the local keys is not printed |
   | `backend` · replay | `All 15 migrations (20261017161031 to 20261025234317) are recorded as applied in supabase_db_fitlog_rebuild_20261017 at http://127.0.0.1:55321, and no other` (more, if later migrations have landed) |
   | `backend` · diff | `No schema changes found`, then `supabase db diff found no difference between the replayed schemas (public, private, storage) and a fresh shadow replay of every migration, in …` |
   | `backend` · lint | `No schema errors found`, then `supabase db lint found no warning or error in public, private, in …` |
   | `backend` · `pnpm backend:test` | `# pass 39` (or more), `SQL sources verified: … since <before>@<12 hex>`, then the six suite lines as in `docs/evidence/AR-1/bundled-backend.log` |

4. **The conclusion of each of the three jobs must be `success`, not `skipped`, on the same head SHA.** A skipped job counts as passing for a required check, so a skipped run proves nothing. Capture, read-only, for each run: `gh run view <run-id> --json event,headSha,conclusion,jobs`. Each must show `event: push`, the pushed `headSha`, and `conclusion: success`. In `jobs`, the one job must be `success`, with every step `success` except `backend`'s failure-only "Container states after a failure", which is `skipped`. Record the head SHA, the three run URLs, the conclusions and the expected lines in `docs/evidence/PL-1/hosted-runs.md`.
5. **After branch protection, the proof is the post-merge push run.** GitHub has no fast-forward merge: a merge commit, a squash and "Rebase and merge" all put a new commit on `main`. So a pull request's checks never ran on the head `main` ends up with. Box 1 is proven only by the **push** runs on the head `main` actually has after the merge. Recording the evidence of §2 to §4 itself needs a pull request once box 3 is on. After it merges, repeat step 4 for the push runs on that new head, with all three `success`. That run is the one the coordinator links in the tracker.
6. On any failure: do not re-run blindly or change inputs. Record the failing step and its log line, and fix it in a reviewed change. A re-run is right only for an infrastructure failure, such as an image pull timeout, and is recorded as one.

## 3. Box 3: branch protection on `main` (owner)

Needs box 1 first, because GitHub lists a status check for selection only after it has run.

Set it under GitHub → the repository → **Settings → Branches** (classic rule) or **Settings → Rules → Rulesets**, targeting `main`:

| Setting | Value | Why |
|---|---|---|
| Require a pull request before merging | On. Required approvals: **0**. This is Codex's delegated decision (M2, below), not enforced review | Nothing reaches `main` without the checks running on it |
| Require status checks to pass | On: **`check`**, **`backend`** and **`ci-guard`**, each with its source set to **GitHub Actions**, never "any source" | The three required jobs. `ci-guard` judges the other two from outside them. With "any source", a commit status named `backend`, posted through the Statuses API or by an installed app, would satisfy the rule (review 0705 F3) |
| Require branches to be up to date before merging | On | The checks then ran against the current base |
| Block force pushes | On | A force push would make `before` unreachable, and `base` would fail |
| Block deletions | On | — |
| **No bypass (mandatory)** | Classic: "Do not allow bypassing the above settings" on (`enforce_admins`). Ruleset: enforcement **Active** and an **empty** bypass list | The owner is the only merger. With a bypass, nothing actually blocks them, and box 2 cannot be shown. If a bypass is wanted, record that as a decision; boxes 2 and 3 then stay **unmet** |

**Review (M2).** No second-person review is enforced. Under the AUTH-01 delegation, Codex accepts that as a residual risk while the repository has one maintainer: GitHub does not let an author approve their own pull request, and there is no CODEOWNERS file. This is a delegated technical decision, not a personal owner review. Once a second maintainer exists, add CODEOWNERS for `.github/workflows/`, `scripts/ci/`, `scripts/quality/`, every `package.json`, `.npmrc` and `pnpm-workspace.yaml`, then turn on "Require review from Code Owners" with at least one approval.

**Capture** into `docs/evidence/PL-1/`, run by the owner, read-only. Show no token, secret or personal data:
- **Where the checks come from** (review 0705 F3). Read only, on box 1's head:
  `gh api repos/<owner>/<repo>/commits/<head-sha>/check-runs --jq '.check_runs[] | {name, app_id: .app.id, app: .app.slug}' > check-sources.json`.
  It must list `check`, `backend` and `ci-guard`, each with `app: "github-actions"` and one shared `app_id`. The review gives that ID as **15368**. It is used below only if this capture shows the same number. Otherwise, use the captured ID and record the difference.
- **Classic rule:** `gh api repos/<owner>/<repo>/branches/main/protection > branch-protection.json`. It must show:
  - `enforce_admins.enabled: true` and `required_status_checks.strict: true`;
  - the three checks in `required_status_checks.checks[]`, each with its `context` and an `app_id` equal to the GitHub Actions ID from `check-sources.json`. Any other value, including `null`, `-1` or a missing `app_id`, fails this capture;
  - `allow_force_pushes.enabled: false`, `allow_deletions.enabled: false`, and `required_pull_request_reviews` present.
- **Ruleset** (that endpoint returns 404 for rulesets):
  - `gh api repos/<owner>/<repo>/rulesets` to find the ruleset ID;
  - `gh api repos/<owner>/<repo>/rulesets/<id> > ruleset.json`, which must show:
    - `enforcement: "active"` and `bypass_actors: []`;
    - a condition that includes `main`;
    - the rules `pull_request`, `non_fast_forward` and `deletion`;
    - `required_status_checks`, with the three contexts, each with an `integration_id` equal to the GitHub Actions ID from `check-sources.json` (a missing `integration_id` means any source, and fails), and `strict_required_status_checks_policy: true`;
  - `gh api repos/<owner>/<repo>/rules/branches/main > rules-main.json`, the rules in effect on `main`.
- Optionally, a screenshot `branch-protection.png` of the same settings.

**Consequence.** From then on `main` moves only through pull requests. docs/23 §6 describes a local fast-forward by `goal-integrator`. With protection on, integration becomes:
1. Push the goal branch and open a pull request.
2. Let the three checks pass.
3. Merge.
4. Confirm the post-merge push runs (§2.5).

This is recorded as a decision for Codex in the handoff.

## 4. Box 2: a deliberately failing check blocks merging

Run this only after box 3, with no bypass.

1. From the protected `main`: `git switch -c pl1/probe-blocked-merge`.
2. Make exactly one deliberate failure, an edit to a migration already on the base. Append the line `-- PL-1 probe: must never merge` to `supabase/migrations/20261025234317_training_formula_v1.sql`. Commit it as `test(PL-1): probe that an edited base migration blocks merging`.
3. **Owner:** push the branch and open the pull request against `main` as a **draft**, titled `PL-1 probe - do not merge`. It is a draft only so that nothing can merge it while the runs execute.
4. Wait for all three runs on the pull request's head commit. Expected:
   - `check` passes. No file `pnpm check` reads changed, and QA-9's format check skips `.sql`.
   - `ci-guard` passes. No workflow or guard changed.
   - In `backend`, the workflow guard, `base`, the CI tests, `vendored`, `local-main` (`Created refs/heads/main at the trusted base <base.sha> …`), start, replay, diff and lint all pass, since a comment changes no schema.
   - `pnpm backend:test` then fails at its first command. Test 18 prints `not ok … this repository passes …` with `supabase/migrations/20261025234317_training_formula_v1.sql was modified since the base main@<base.sha, 12 hex>`, and the `&&` chain stops there with a non-zero exit.
5. **Owner:** mark the pull request **Ready for review** (`gh pr ready <n>`). No new run is expected: `pull_request` workflows run by default on opened, synchronize and reopened, and the three results stay on the head commit.
6. **Capture**, now that the pull request is not a draft, into `docs/evidence/PL-1/`:
   - the failing `backend` run URL;
   - a screenshot `merge-blocked.png` of the merge box. It must show `backend` as required and failing, `check` and `ci-guard` passing, merging blocked, and no bypass option;
   - `gh pr view <n> --json isDraft,mergeStateStatus,statusCheckRollup > merge-blocked.json`. It must show `isDraft: false` and `mergeStateStatus: "BLOCKED"`, with `backend` `FAILURE` and `check` and `ci-guard` `SUCCESS` in the rollup.

   If `mergeStateStatus` is `BEHIND`, `main` moved meanwhile: stop and record it, since nothing should have moved it. A capture taken while the pull request is still a draft proves nothing, because GitHub never lets a draft merge.
7. **Owner:** close the pull request without merging, and delete the branch. Nothing from the probe reaches `main`.

This also gives AR-1 its hosted pair: box 1 shows the SQL-source guard passing against the event base, and this probe shows it failing against the event base.

Optional, not needed for PL-1: AR-1's contract-baseline guard can be shown failing with M1.1 (`packages/domain/src/models.ts` `max(100)` → `max(101)` with no version bump), which fails `check`. Keep it a separate probe, so each run has one cause.

## 4b. Optional: the skip-proof design on GitHub (review 0705 F5)

This is not a Done-when box. Each step needs the owner's authorisation, as in §4. Box 2 shows only that a failing `backend` blocks a merge. The H1 design rests on two more things: GitHub reports a skipped job as passing, and the guard in the other workflow then blocks the merge. This probe shows both.

1. After §4, from the protected `main`: `git switch -c pl1/probe-skipped-job`. Add one line, `    if: false`, directly under `  backend:` in `.github/workflows/backend-ci.yml`. Commit it as `test(PL-1): probe that a skipped required job still blocks merging`.
2. **Owner:** push it and open a draft pull request titled `PL-1 skip probe - do not merge`. Mark it Ready for review once the three runs finish, as in §4.5.
3. Expected:
   - `backend` is **skipped**, which GitHub counts as passing;
   - `ci-guard` **fails** at its guard step with `.github/workflows/backend-ci.yml jobs.backend sets if; only runs-on, timeout-minutes, env, steps are allowed`;
   - `check` passes;
   - `gh pr view <n> --json isDraft,mergeStateStatus,statusCheckRollup > skip-blocked.json` shows `isDraft: false` and `mergeStateStatus: "BLOCKED"`.
4. Any other outcome: stop and record it verbatim (§5). Then close the pull request unmerged and delete the branch.

## 5. Stop conditions, cleanup and what this does not prove

- **Stop on any outcome that differs from the tables above.** Record it verbatim, and change nothing in the guards to make it pass.
- **No secret is needed.** The jobs run with `contents: read`, `persist-credentials: false` and no `secrets` context. The local stack's keys are never printed.
- **No probe is ever merged.** The probe branch and pull request are deleted after capture.
- **What the three checks cannot prove** (the general rule, review 0705 F2):
  - **The guard judges workflow files only.** It refuses one edit to a workflow file that skips, empties or redirects a required job. Everything the jobs run or configure is trusted to review, not to CI. That covers:
    - the root and package `package.json` scripts;
    - `.npmrc`, whose `node-options` becomes `NODE_OPTIONS` for both `pnpm check` and `pnpm backend:test`;
    - `pnpm-workspace.yaml`, and the scripts and tests those commands run;
    - the guard itself, edited alone or with the workflows.

    One such edit can turn `check` or `backend` green without proving anything, and both guard jobs stay green, since no workflow changed. For example, `node-options=--require ./x.cjs` in `.npmrc`, with `x.cjs` forcing exit 0.
  - **Package scripts in particular.** QA-9's pin of `check` runs inside `pnpm check`, and nothing pins `backend:test`.
  - **Review.** With one maintainer, no second-person review is enforced (M2). That decision is the whole control for the trusted files above.
