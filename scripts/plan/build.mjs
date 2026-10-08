#!/usr/bin/env node
// Rebuild the plan board from docs/plan/GOALS.md:
//   GOALS.md  →  plan.json (checked: ids, needs, cycles)  →  board.html (the dependency-board builder)
//
//   node scripts/plan/build.mjs            # rebuild plan.json and board.html
//   node scripts/plan/build.mjs --check    # only parse and validate GOALS.md
//
// The page builder is the owner's `dependency-board` skill. Set DEPENDENCY_BOARD_SKILL if it
// lives somewhere other than ~/.claude/skills/dependency-board.
import { spawnSync } from "node:child_process";
import { existsSync, readFileSync, renameSync, rmSync } from "node:fs";
import { homedir } from "node:os";
import { join, relative } from "node:path";
import { ROOT, parseGoalsMarkdown, paths, validatePlan, writeJsonAtomic, loadStatus } from "./lib.mjs";

const p = paths();
const checkOnly = process.argv.includes("--check");

function fail(msg) {
  console.error(`plan build: ${msg}`);
  process.exit(1);
}

let plan;
try {
  plan = validatePlan(parseGoalsMarkdown(readFileSync(p.goals, "utf8"), { docPath: relative(ROOT, p.goals) }));
} catch (e) {
  fail(e.message);
}
const unknown = Object.keys(loadStatus().goals).filter(id => !plan.goals.some(g => g.id === id));
if (unknown.length) console.warn(`plan build: status.json has goals no longer in the plan (kept, not shown): ${unknown.join(", ")}`);

const lanes = [...new Set(plan.goals.map(g => g.owner))];
console.log(`GOALS.md: ${plan.goals.length} goals, ${plan.goals.reduce((n, g) => n + g.needs.length, 0)} needs, ${lanes.length} lanes`);
if (checkOnly) process.exit(0);

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
