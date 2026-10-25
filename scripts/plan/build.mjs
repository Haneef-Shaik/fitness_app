#!/usr/bin/env node
// Rebuild the plan board from docs/plan/GOALS.md:
//   GOALS.md  →  plan.json (checked: ids, needs, cycles)  →  board.html (the dependency-board builder)
//
//   node scripts/plan/build.mjs            # rebuild plan.json and board.html
//   node scripts/plan/build.mjs --check    # only parse and validate GOALS.md
//
// Both modes also check that every card has a Done-when (or, for a milestone, Exit-checks) list,
// and that docs/plan/ACCEPTANCE.md has a row for every PRD acceptance scenario and external
// decision, each proved by real goals that its gate waits on.
//
// The page builder is the owner's `dependency-board` skill. Set DEPENDENCY_BOARD_SKILL if it
// lives somewhere other than ~/.claude/skills/dependency-board.
import { spawnSync } from "node:child_process";
import { existsSync, readFileSync, renameSync, rmSync } from "node:fs";
import { homedir } from "node:os";
import { join, relative } from "node:path";
import {
  ROOT, cardChecks, checkContracts, checkLedger, loadStatus, parseGoalsMarkdown, parseLedger, parsePrdAcceptance, paths,
  validatePlan, writeJsonAtomic,
} from "./lib.mjs";
import { generatedProblems } from "./sync.mjs";

const p = paths();
const checkOnly = process.argv.includes("--check");

function fail(msg) {
  console.error(`plan build: ${msg}`);
  process.exit(1);
}

const PRD = join(ROOT, "docs/PRD.md");

let plan;
let goalsText;
try {
  goalsText = readFileSync(p.goals, "utf8");
  plan = validatePlan(parseGoalsMarkdown(goalsText, { docPath: relative(ROOT, p.goals) }));
} catch (e) {
  fail(e.message);
}
const rules = plan.config?.acceptanceGates;
if (!rules?.member || !Array.isArray(rules.gym)) fail("GOALS.md config needs acceptanceGates: {\"member\": \"MS-…\", \"gym\": [\"MS-…\"]}");
if (!existsSync(p.acceptance)) fail(`${relative(ROOT, p.acceptance)} is missing; every PRD acceptance scenario needs a ledger row`);
let ledgerRows;
try {
  ledgerRows = parseLedger(readFileSync(p.acceptance, "utf8"));
} catch (e) {
  fail(e.message);
}
const problems = [
  ...checkContracts(plan, cardChecks(goalsText)),
  ...checkLedger(plan, ledgerRows, parsePrdAcceptance(readFileSync(PRD, "utf8")), rules),
];
if (problems.length) fail(`${problems.length} problem(s):\n  ${problems.join("\n  ")}`);
const unknown = Object.keys(loadStatus().goals).filter(id => !plan.goals.some(g => g.id === id));
if (unknown.length) console.warn(`plan build: status.json has goals no longer in the plan (kept, not shown): ${unknown.join(", ")}`);

const lanes = [...new Set(plan.goals.map(g => g.owner))];
console.log(`GOALS.md: ${plan.goals.length} goals, ${plan.goals.reduce((n, g) => n + g.needs.length, 0)} needs, ${lanes.length} lanes; `
  + `ACCEPTANCE.md: ${ledgerRows.length} ledger rows, every PRD scenario and decision covered`);
if (checkOnly) {
  try {
    const drift = generatedProblems(plan, JSON.parse(readFileSync(p.plan, 'utf8')), readFileSync(p.board, 'utf8'));
    if (drift.length) fail(drift.join('\n  '));
  } catch (e) {
    fail(`cannot check generated artifacts: ${e.message}; run pnpm plan:build`);
  }
  console.log('plan.json and board.html match GOALS.md');
  process.exit(0);
}

const skill = process.env.DEPENDENCY_BOARD_SKILL || join(homedir(), ".claude/skills/dependency-board");
const builder = join(skill, "scripts/build_board.py");
if (!existsSync(builder)) fail(`the board builder is not at ${builder}; set DEPENDENCY_BOARD_SKILL`);

// Build from a candidate file; plan.json only changes once board.html has been built from it,
// so the server, the CLI and the page never disagree about the plan.
const candidate = `${p.plan}.next`;
writeJsonAtomic(candidate, plan);
const run = spawnSync("python3", ["-I", builder, candidate, "-o", p.board], { stdio: "inherit" });
if (run.status !== 0) {
  rmSync(candidate, { force: true });
  fail("the board builder failed (see above); plan.json and board.html are unchanged");
}
renameSync(candidate, p.plan);
console.log(`open it with: node scripts/plan/serve.mjs (an open board reloads itself)`);
