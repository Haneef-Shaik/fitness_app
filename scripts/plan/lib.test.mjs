// node --test scripts/plan/lib.test.mjs
import assert from "node:assert/strict";
import { spawn } from "node:child_process";
import { existsSync, mkdtempSync, readFileSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { test } from "node:test";
import { fileURLToPath } from "node:url";
import { generatedProblems } from "./sync.mjs";
import {
  ancestorsOf, cardChecks, checkContracts, checkLedger, gateReport, loadActivity, loadStatus, normaliseStatus,
  parseGoalsMarkdown, parseLedger, parsePrdAcceptance, paths, recentActivity, setStatus, stateOf, validatePlan,
  writeJsonAtomic,
} from "./lib.mjs";

const LIB = fileURLToPath(new URL("./lib.mjs", import.meta.url));

test("generated plan and board drift is rejected without executing embedded JavaScript", () => {
  const source = { goals: [{ id: 'A', title: 'Base', owner: 'S1', needs: [] }], people: ['S1'], config: { subtitle: 'Current' } };
  const board = { goals: [{ id: 'A', t: 'Base', o: 'S1', n: [], s: '', g: false, tr: '', l: 'Base', sp: '', doc: '', st: 0, r: 0 }], people: [{ name: 'S1', colour: '#fff' }], tracks: {}, syncPoints: [], config: source.config };
  const html = data => `const PLAN = ${JSON.stringify(data)};`;
  assert.deepEqual(generatedProblems(source, structuredClone(source), html(board)), []);
  assert.deepEqual(generatedProblems(source, source, `${html(board)} // injected by builder`), []);
  assert.match(generatedProblems(source, { goals: [] }, html(board)).join(' '), /plan.json differs/);
  const stale = structuredClone(board);
  stale.goals[0].n = ['missing'];
  assert.match(generatedProblems(source, source, html(stale)).join(' '), /goal data differs/);
  stale.goals = board.goals;
  stale.config = { subtitle: 'Old' };
  assert.match(generatedProblems(source, source, html(stale)).join(' '), /config.subtitle differs/);
  assert.match(generatedProblems(source, source, 'const PLAN = malicious();').join(' '), /no readable embedded plan/);
  assert.match(generatedProblems(source, source, 'const PLAN = {bad};').join(' '), /invalid embedded JSON/);
});

const GOALS = `# Plan

\`\`\`json
{"title": "Test plan", "people": ["S1", "S2"], "tracks": {"M1": "First"}}
\`\`\`

## Milestone M1

### A-1 · Lay the base
- **Lane:** S1 · **Size:** S · **Milestone:** M1
- **Needs:** —

Prose that the parser ignores, even when it mentions - **Lane:** S2 in passing.
- **Lane:** S2 written as a list item in the prose is not a field either.

\`\`\`md
# a heading inside a code block does not end the goal
### Z-9 · nor does this one start a goal
\`\`\`

### B-1 · Build on it
- **Lane:** S2 · **Size:** M · **Milestone:** M1 · **Label:** build
- **Needs:** A-1

### B-2 · Finish
- **Lane:** S2
- **Needs:** A-1,
  B-1
`;

function fixture(text = GOALS) {
  const dir = mkdtempSync(join(tmpdir(), "plan-"));
  writeFileSync(paths(dir).goals, text);
  writeJsonAtomic(paths(dir).plan, validatePlan(parseGoalsMarkdown(text)));
  return dir;
}

const planOf = dir => JSON.parse(readFileSync(paths(dir).plan, "utf8"));

test("parses goals, fields, wrapped needs and anchors", () => {
  const plan = parseGoalsMarkdown(GOALS);
  assert.equal(plan.title, "Test plan");
  assert.deepEqual(plan.goals.map(g => g.id), ["A-1", "B-1", "B-2"]);
  assert.equal(plan.goals[0].owner, "S1", "prose that mentions a field must not override it");
  assert.deepEqual(plan.goals[0].needs, []);
  assert.deepEqual(plan.goals[2].needs, ["A-1", "B-1"], "a wrapped Needs line keeps every id");
  assert.equal(plan.goals[1].label, "build");
  assert.equal(plan.goals[1].track, "M1");
  assert.equal(plan.goals[0].doc, "docs/plan/GOALS.md#a-1--lay-the-base");
});

test("malformed cards fail loudly instead of losing data", () => {
  const dupe = GOALS.replace("- **Lane:** S2\n- **Needs:** A-1,", "- **Lane:** S2 · **Lane:** S1\n- **Needs:** A-1,");
  assert.throws(() => parseGoalsMarkdown(dupe), /appears twice/);
  const starred = GOALS.replace("- **Needs:** A-1\n", "- **Needs:** **A-1**\n");
  assert.throws(() => parseGoalsMarkdown(starred), /cannot read the field/);
  const noNeeds = GOALS.replace("- **Lane:** S2\n- **Needs:** A-1,\n  B-1\n", "- **Lane:** S2\n");
  assert.throws(() => parseGoalsMarkdown(noNeeds), /no \*\*Needs:\*\* field/);
  const enDash = GOALS.replace("### B-2 · Finish", "### B-2 – Finish");
  assert.throws(() => parseGoalsMarkdown(enDash), /not a goal/);
  const unknownLane = GOALS.replace("- **Lane:** S2\n- **Needs:** A-1,", "- **Lane:** S9\n- **Needs:** A-1,");
  assert.throws(() => validatePlan(parseGoalsMarkdown(unknownLane)), /not in the people list/);
});

test("rejects unknown needs and cycles", () => {
  const cyclic = GOALS.replace("- **Needs:** —", "- **Needs:** B-2");
  assert.throws(() => validatePlan(parseGoalsMarkdown(cyclic)), /cycle/);
  const dangling = GOALS.replace("- **Needs:** A-1,\n  B-1", "- **Needs:** Z-9");
  assert.throws(() => validatePlan(parseGoalsMarkdown(dangling)), /not a goal/);
});

test("ready and blocked are derived from needs", () => {
  const dir = fixture();
  const plan = planOf(dir);
  assert.equal(stateOf(plan, loadStatus(dir), "A-1"), "ready");
  assert.equal(stateOf(plan, loadStatus(dir), "B-1"), "blocked");
  setStatus(dir, "A-1", { status: "done" }, { by: "session:S1" });
  assert.equal(stateOf(plan, loadStatus(dir), "B-1"), "ready");
  assert.equal(stateOf(plan, loadStatus(dir), "B-2"), "blocked");
});

test("claiming a blocked goal needs force, from any earlier status", () => {
  const dir = fixture();
  assert.throws(() => setStatus(dir, "B-1", { status: "claimed" }), /blocked by A-1/);
  setStatus(dir, "B-1", { status: "hold" });
  assert.throws(() => setStatus(dir, "B-1", { status: "claimed" }), /blocked by A-1/, "hold → claimed must not skip the guard");
  setStatus(dir, "B-1", { status: "claimed", who: "S2" }, { force: true });
  assert.equal(loadStatus(dir).goals["B-1"].status, "claimed");
});

test("writes keep earlier fields and record the true previous status in the feed", () => {
  const dir = fixture();
  setStatus(dir, "A-1", { status: "start", who: "S1", ref: "feat/a", note: "on it" }, { by: "session:S1" });
  const before = loadStatus(dir);
  setStatus(dir, "A-1", { status: "review" }, { by: "session:S1" });
  const after = loadStatus(dir).goals["A-1"];
  assert.equal(before.goals["A-1"].status, "claimed");
  assert.equal(after.status, "in review");
  assert.equal(after.ref, "feat/a");
  assert.equal(after.who, "S1");
  const feed = loadActivity(dir);
  assert.deepEqual(feed.map(a => [a.from, a.to]), [["not started", "claimed"], ["claimed", "in review"]]);
  assert.equal(feed[1].note, "");
  assert.equal(recentActivity(dir, 1)[0].to, "in review");
});

test("status words and aliases normalise; junk and prototype keys are refused", () => {
  assert.equal(normaliseStatus("Review"), "in review");
  assert.equal(normaliseStatus("hold"), "on hold");
  assert.equal(normaliseStatus("not started"), "not started");
  for (const bad of ["maybe", "blocked", "constructor", "__proto__", "toString"]) {
    assert.throws(() => normaliseStatus(bad), /unknown status/, bad);
  }
});

test("rejects unknown goals and non-text fields", () => {
  const dir = fixture();
  assert.throws(() => setStatus(dir, "Q-1", { status: "done" }), /no goal Q-1/);
  assert.throws(() => setStatus(dir, "A-1", { status: "done", note: 42 }), /must be text/);
});

test("a damaged status file shape still loads as empty goals", () => {
  const dir = fixture();
  writeFileSync(paths(dir).status, "{}");
  assert.deepEqual(loadStatus(dir).goals, {});
  writeFileSync(paths(dir).status, "null");
  assert.deepEqual(loadStatus(dir).goals, {});
  setStatus(dir, "A-1", { status: "done" });
  assert.equal(loadStatus(dir).goals["A-1"].status, "done");
});

test("concurrent writers from separate processes lose nothing", async () => {
  const many = Array.from({ length: 12 }, (_, i) => `### C-${i} · Goal ${i}\n- **Lane:** S1\n- **Needs:** —\n`).join("\n");
  const dir = fixture(GOALS + "\n" + many);
  const script = `import { setStatus } from ${JSON.stringify(LIB)};
    setStatus(process.argv[1], process.argv[2], { status: "hold", note: "parallel" }, { by: "session:test" });`;
  const run = id => new Promise((resolveRun, reject) => {
    const child = spawn(process.execPath, ["--input-type=module", "-e", script, dir, id], { stdio: "inherit" });
    child.on("exit", code => (code === 0 ? resolveRun() : reject(new Error(`${id} exited ${code}`))));
  });
  await Promise.all(Array.from({ length: 12 }, (_, i) => run(`C-${i}`)));
  const goals = loadStatus(dir).goals;
  assert.equal(Array.from({ length: 12 }, (_, i) => goals[`C-${i}`]?.status).filter(s => s === "on hold").length, 12);
  assert.equal(loadActivity(dir).length, 12);
  assert.equal(existsSync(paths(dir).lock), false, "the lock is released");
});

/* ---------- contracts, the acceptance ledger and declaring Done ---------- */

const GATED = `# Plan

\`\`\`json
{"title": "Gated plan", "people": ["S1", "Milestones"]}
\`\`\`

### A-1 · Build the thing
- **Lane:** S1
- **Needs:** —

**Done when.**
- [ ] AC01 passes on a release build
- [ ] The handoff links the run

Later prose with a box that is not part of the contract:
- [ ] not a check

### B-1 · Prove the thing
- **Lane:** S1
- **Needs:** A-1

**Done when.**
- [x] AC02 passes

\`\`\`md
- [ ] a box inside a code block is not a check
\`\`\`

### MS-1 · First gate
- **Lane:** Milestones
- **Needs:** B-1

**Exit checks.**
- [ ] Every ledger row gated at MS-1 has a pass

### MS-2 · Second gate
- **Lane:** Milestones
- **Needs:** MS-1

**Exit checks.**
- [ ] Every ledger row gated at MS-2 has a pass
`;

const PRD = `## 25. Acceptance scenarios

| ID / release | Given and action | Required observable result |
|---|---|---|
| AC01 / M | a | b |
| AC02 / M/G | a | b |

## 27. Assumptions

| ID | Current state | Accountable owner / milestone | Remaining external requirement |
|---|---|---|---|
| DEC-01 | a | b | c |
`;

const LEDGER = `# Ledger

| ID | Release | Requirement | Proved by | Gate | Result |
|---|---|---|---|---|---|
| AC01 | M | Chest day persists | A-1, B-1 | MS-1 | open |
| AC02 | M | Previous occurrence | B-1 | MS-1 | pass · 2026-10-25 · build 12 · docs/evidence/x.md |
| AC02 | G | Previous occurrence, gym | B-1 | MS-2 | open |
| DEC-01 | — | Brand cleared | A-1 | MS-2 | n/a · not needed for this test |
`;

const RULES = { member: "MS-1", gym: ["MS-2"] };

function gatedFixture(ledger = LEDGER) {
  const dir = fixture(GATED);
  writeFileSync(paths(dir).acceptance, ledger);
  return dir;
}

test("Done-when and Exit-check boxes belong to their card; prose and code boxes do not", () => {
  const checks = cardChecks(GATED);
  assert.deepEqual(checks.get("A-1").map(c => c.text), ["AC01 passes on a release build", "The handoff links the run"]);
  assert.deepEqual(checks.get("B-1"), [{ text: "AC02 passes", ticked: true }]);
  assert.deepEqual(checks.get("MS-1").map(c => c.text), ["Every ledger row gated at MS-1 has a pass"]);
});

test("every goal must carry a contract", () => {
  const plan = parseGoalsMarkdown(GATED);
  assert.deepEqual(checkContracts(plan, cardChecks(GATED)), []);
  const bare = GATED.replace("**Done when.**\n- [x] AC02 passes\n", "");
  assert.deepEqual(checkContracts(parseGoalsMarkdown(bare), cardChecks(bare)), ["B-1 has no Done-when or Exit-checks boxes"]);
});

test("ancestors follow needs transitively", () => {
  const plan = parseGoalsMarkdown(GATED);
  assert.deepEqual([...ancestorsOf(plan, "MS-2")].sort(), ["A-1", "B-1", "MS-1"]);
});

test("the ledger parses rows and their proving goals", () => {
  const rows = parseLedger(LEDGER);
  assert.equal(rows.length, 4);
  assert.deepEqual(rows[0], { id: "AC01", release: "M", requirement: "Chest day persists", goals: ["A-1", "B-1"], gate: "MS-1", result: "open" });
  assert.equal(rows[3].release, "—");
});

test("the PRD's acceptance and decision ids are read from their tables", () => {
  const prd = parsePrdAcceptance(PRD);
  assert.deepEqual([...prd.acs], [["AC01", "M"], ["AC02", "M/G"]]);
  assert.deepEqual([...prd.decs], ["DEC-01"]);
});

test("a complete ledger passes the coverage check", () => {
  const plan = parseGoalsMarkdown(GATED);
  assert.deepEqual(checkLedger(plan, parseLedger(LEDGER), parsePrdAcceptance(PRD), RULES), []);
});

test("the coverage check names every gap", () => {
  const plan = parseGoalsMarkdown(GATED);
  const prd = parsePrdAcceptance(PRD);
  const errs = (ledger) => checkLedger(plan, parseLedger(ledger), prd, RULES);
  const without = (id, release) => LEDGER.split("\n").filter(l => !l.startsWith(`| ${id} | ${release} `)).join("\n");

  assert.match(errs(without("AC01", "M")).join("\n"), /AC01 \(M\) is in the PRD but has no ledger row/);
  assert.match(errs(without("AC02", "G")).join("\n"), /AC02 \(G\) is in the PRD but has no ledger row/);
  assert.match(errs(without("DEC-01", "—")).join("\n"), /DEC-01 is in the PRD but has no ledger row/);
  assert.match(errs(LEDGER + "| AC99 | M | Invented | A-1 | MS-1 | open |\n").join("\n"), /AC99 \(M\) is not in the PRD/);
  assert.match(errs(LEDGER.replace("| A-1, B-1 | MS-1 |", "| A-1, Q-7 | MS-1 |")).join("\n"), /AC01: Q-7 is not a goal/);
  assert.match(errs(LEDGER.replace("| B-1 | MS-1 | pass", "| B-1 | A-1 | pass")).join("\n"), /AC02: gate A-1 is not a milestone/);
  assert.match(errs(LEDGER.replace("| A-1, B-1 | MS-1 |", "| A-1, B-1 | MS-2 |")).join("\n"), /AC01 \(M\) must be gated at MS-1/);
  assert.match(errs(LEDGER.replace("| B-1 | MS-2 | open |", "| B-1 | MS-1 | open |")).join("\n"), /AC02 \(G\) must be gated at MS-2/);
  assert.match(errs(LEDGER.replace("| AC01 | M | Chest day persists | A-1, B-1 | MS-1 | open |\n", "| AC01 | M | Chest day persists | A-1, B-1 | MS-1 | open |\n| AC01 | M | Again | A-1 | MS-1 | open |\n")).join("\n"), /AC01 appears twice at MS-1/);
  assert.match(errs(LEDGER.replace("| MS-1 | open |", "| MS-1 | done |")).join("\n"), /AC01: result "done"/);
  assert.match(errs(LEDGER.replace("pass · 2026-10-25 · build 12", "pass · yesterday · build 12")).join("\n"), /AC02: result/);
});

test("a gate must actually wait on a goal that proves the row", () => {
  const unrelated = GATED + `
### C-1 · Unrelated
- **Lane:** S1
- **Needs:** —

**Done when.**
- [ ] something
`;
  const plan = parseGoalsMarkdown(unrelated);
  const ledger = LEDGER.replace("| A-1, B-1 | MS-1 |", "| C-1 | MS-1 |");
  assert.match(checkLedger(plan, parseLedger(ledger), parsePrdAcceptance(PRD), RULES).join("\n"),
    /AC01: MS-1 does not wait on any of C-1/);
});

test("Done is refused while a need is open, unless overridden with a reason", () => {
  const dir = gatedFixture();
  assert.throws(() => setStatus(dir, "B-1", { status: "done" }), /B-1 cannot be Done: A-1 is not Done/);
  assert.throws(() => setStatus(dir, "B-1", { status: "done" }, { override: "  " }), /cannot be Done/, "a blank reason is no reason");
  setStatus(dir, "B-1", { status: "done" }, { override: "A-1 merged in the same commit" });
  const row = loadStatus(dir).goals["B-1"];
  assert.equal(row.status, "done");
  assert.match(row.note, /override: A-1 merged in the same commit/);
});

test("a milestone is declared only when its needs are Done and its ledger rows pass", () => {
  const dir = gatedFixture();
  setStatus(dir, "A-1", { status: "done" });
  setStatus(dir, "B-1", { status: "done" });
  assert.throws(() => setStatus(dir, "MS-1", { status: "done" }), /MS-1 cannot be Done: ledger rows still open: AC01 \(open\)/);
  writeFileSync(paths(dir).acceptance, LEDGER.replace("| A-1, B-1 | MS-1 | open |", "| A-1, B-1 | MS-1 | pass · 2026-10-25 · build 12 · docs/evidence/a.md |"));
  setStatus(dir, "MS-1", { status: "done", ref: "gate verdict" });
  assert.equal(loadStatus(dir).goals["MS-1"].status, "done");
});

test("the gate report says whether a milestone can be declared and why not", () => {
  const dir = gatedFixture();
  const plan = planOf(dir);
  const report = gateReport(plan, loadStatus(dir), parseLedger(LEDGER), cardChecks(GATED), "MS-1");
  assert.equal(report.declarable, false);
  assert.deepEqual(report.openNeeds, ["B-1"]);
  assert.deepEqual(report.openRows.map(r => r.id), ["AC01"]);
  assert.deepEqual(report.checks.map(c => c.text), ["Every ledger row gated at MS-1 has a pass"]);
  assert.throws(() => gateReport(plan, loadStatus(dir), [], cardChecks(GATED), "A-1"), /A-1 is not a milestone/);
});
