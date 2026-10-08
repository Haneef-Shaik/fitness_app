// node --test scripts/plan/lib.test.mjs
import assert from "node:assert/strict";
import { spawn } from "node:child_process";
import { existsSync, mkdtempSync, readFileSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { test } from "node:test";
import { fileURLToPath } from "node:url";
import {
  loadActivity, loadStatus, normaliseStatus, parseGoalsMarkdown, paths, recentActivity, setStatus, stateOf, validatePlan,
  writeJsonAtomic,
} from "./lib.mjs";

const LIB = fileURLToPath(new URL("./lib.mjs", import.meta.url));

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
