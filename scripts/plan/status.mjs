#!/usr/bin/env node
// Read and update the plan's statuses from a terminal or a Claude Code session.
// Writes docs/plan/status.json and docs/plan/activity.json; the board picks changes up live.
//
//   node scripts/plan/status.mjs summary                 milestones and lanes at a glance
//   node scripts/plan/status.mjs ready [--lane S3]       goals whose needs are all done
//   node scripts/plan/status.mjs list [--lane S3] [--state blocked]
//   node scripts/plan/status.mjs show <ID>               needs, unblocks, status, doc anchor
//   node scripts/plan/status.mjs set <ID> <status> [--who S3] [--ref feat/x] [--note "…"] [--force]
//
// <status> is one of: not started, claimed (alias: start), in review (review), done, on hold (hold).
import { parseArgs } from "node:util";
import { PLAN_DIR, dependentsOf, loadPlan, loadStatus, openNeeds, setStatus, stateOf } from "./lib.mjs";

const STATE_LABEL = { done: "Done", review: "In review", running: "Running", hold: "On hold", ready: "Ready", blocked: "Blocked" };
const OPTIONS = {
  who: { type: "string" }, ref: { type: "string" }, note: { type: "string" },
  lane: { type: "string" }, state: { type: "string" }, force: { type: "boolean" },
};

let o;
try {
  const { values, positionals } = parseArgs({ args: process.argv.slice(2), options: OPTIONS, strict: true, allowPositionals: true });
  o = { ...values, _: positionals.slice(1), cmd: positionals[0] || "summary" };
  if (o.state && !Object.hasOwn(STATE_LABEL, o.state)) throw new Error(`--state must be one of: ${Object.keys(STATE_LABEL).join(", ")}`);
} catch (e) {
  console.error(`plan status: ${e.message}`);
  process.exit(1);
}
const cmd = o.cmd;
const plan = loadPlan();
const status = loadStatus();
const st = id => stateOf(plan, status, id);
const row = g => `${g.id.padEnd(9)} ${STATE_LABEL[st(g.id)].padEnd(9)} ${g.owner.padEnd(16)} ${g.title}`;
const byLane = goals => (o.lane ? goals.filter(g => g.owner.toLowerCase().startsWith(o.lane.toLowerCase())) : goals);

function summary() {
  const listed = (plan.people || []).map(x => (typeof x === "string" ? x : x.name));
  const lanes = [...new Set([...listed, ...plan.goals.map(g => g.owner)])].filter(l => plan.goals.some(g => g.owner === l));
  const tracks = [...new Set(plan.goals.map(g => g.track).filter(Boolean))];
  const count = goals => {
    const c = {};
    for (const g of goals) c[st(g.id)] = (c[st(g.id)] || 0) + 1;
    return Object.entries(STATE_LABEL).filter(([k]) => c[k]).map(([k, l]) => `${l} ${c[k]}`).join(" · ");
  };
  console.log(`${plan.title}: ${plan.goals.length} goals — ${count(plan.goals)}\n`);
  console.log("By milestone");
  for (const t of tracks) console.log(`  ${t.padEnd(5)} ${(plan.tracks?.[t] || "").padEnd(44)} ${count(plan.goals.filter(g => g.track === t))}`);
  console.log("\nBy lane");
  for (const l of lanes) console.log(`  ${l.padEnd(22)} ${count(plan.goals.filter(g => g.owner === l))}`);
}

function show(id) {
  const g = plan.goals.find(x => x.id === id);
  if (!g) throw new Error(`no goal ${id}`);
  const r = status.goals[id] || {};
  console.log(`${g.id} · ${g.title}`);
  console.log(`  lane ${g.owner} · milestone ${g.track || "—"} · size ${g.size || "—"} · state ${STATE_LABEL[st(id)]}`);
  if (r.at) console.log(`  status "${r.status}"${r.who ? ` · ${r.who}` : ""}${r.ref ? ` · ${r.ref}` : ""} · ${r.at}${r.note ? `\n  note: ${r.note}` : ""}`);
  console.log(`  needs:    ${g.needs.map(n => `${n} (${STATE_LABEL[st(n)]})`).join(", ") || "nothing"}`);
  console.log(`  unblocks: ${dependentsOf(plan, id).join(", ") || "nothing"}`);
  console.log(`  spec:     ${g.doc}`);
}

try {
  if (cmd === "summary") summary();
  else if (cmd === "ready") byLane(plan.goals).filter(g => st(g.id) === "ready").forEach(g => console.log(row(g)));
  else if (cmd === "list") byLane(plan.goals).filter(g => !o.state || st(g.id) === o.state).forEach(g => console.log(row(g)));
  else if (cmd === "show") show(o._[0]);
  else if (cmd === "set") {
    const [id, ...words] = o._;
    if (!id || !words.length) throw new Error("usage: set <ID> <status> [--who …] [--ref …] [--note …] [--force]");
    const who = o.who;
    const { prev, next } = setStatus(PLAN_DIR, id, { status: words.join(" "), who, ref: o.ref, note: o.note },
      { by: who ? `session:${who}` : "session:cli", force: !!o.force });
    console.log(`${id}: ${prev} → ${next.status}`);
    const fresh = loadStatus();
    if (next.status === "done") {
      const opened = dependentsOf(plan, id).filter(d => stateOf(plan, fresh, d) === "ready");
      if (opened.length) console.log(`now ready: ${opened.join(", ")}`);
    }
    const still = openNeeds(plan, fresh, id);
    if (next.status === "claimed" && still.length) console.log(`warning: forced past open needs ${still.join(", ")}`);
  } else throw new Error(`unknown command ${cmd}; see the header of scripts/plan/status.mjs`);
} catch (e) {
  console.error(`plan status: ${e.message}`);
  process.exit(1);
}
