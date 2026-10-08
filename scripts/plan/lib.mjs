// Shared logic for the local plan board: reads docs/plan/GOALS.md, keeps statuses in
// docs/plan/status.json and the update feed in docs/plan/activity.json. Nothing here
// talks to the network. Writes take a lock file, so the board server and any number of
// CLI sessions can write at once without losing each other's changes.
import {
  closeSync, existsSync, fsyncSync, openSync, readFileSync, renameSync, statSync, unlinkSync, writeSync,
} from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

export const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "../..");
export const PLAN_DIR = join(ROOT, "docs/plan");
export const STATUSES = Object.freeze(["not started", "claimed", "in review", "done", "on hold"]);
export const FEED_LIMIT = 60;

const ALIASES = new Map(Object.entries({
  start: "claimed", claim: "claimed", running: "claimed", run: "claimed",
  review: "in review", "in-review": "in review",
  hold: "on hold", "on-hold": "on hold",
  reset: "not started", todo: "not started", "not-started": "not started",
  finished: "done",
}));
const ID = /^[A-Za-z0-9_\-.~:@+]{1,200}$/;
const FIELD_LIMITS = Object.freeze({ who: 80, ref: 200, note: 1000 });
const LOCK_STALE_MS = 10_000;
const LOCK_TIMEOUT_MS = 15_000;
const LOCK_RETRY_MS = 15;

/** An error the caller can show as-is: bad input, a stale page, a blocked claim. */
export class PlanError extends Error {
  constructor(code, message) {
    super(message);
    this.code = code;
  }
}

export const paths = (dir = PLAN_DIR) => ({
  goals: join(dir, "GOALS.md"),
  plan: join(dir, "plan.json"),
  status: join(dir, "status.json"),
  activity: join(dir, "activity.json"),
  board: join(dir, "board.html"),
  lock: join(dir, ".plan.lock"),
});

export function normaliseStatus(value) {
  const s = String(value ?? "").trim().toLowerCase();
  if (STATUSES.includes(s)) return s;
  if (ALIASES.has(s)) return ALIASES.get(s);
  throw new PlanError("bad_request", `unknown status "${value}"; use one of: ${STATUSES.join(", ")}`);
}

function readJson(path, fallback) {
  if (!existsSync(path)) return fallback;
  return JSON.parse(readFileSync(path, "utf8"));
}

/** Write to a temp file, flush it to disk, then rename over the target. */
export function writeJsonAtomic(path, value) {
  const tmp = `${path}.${process.pid}.${Date.now()}.tmp`;
  try {
    const fd = openSync(tmp, "w");
    try {
      writeSync(fd, JSON.stringify(value, null, 2) + "\n");
      fsyncSync(fd);
    } finally {
      closeSync(fd);
    }
    renameSync(tmp, path);
  } catch (e) {
    try { unlinkSync(tmp); } catch { /* already gone */ }
    throw e;
  }
  try { const d = openSync(dirname(path), "r"); fsyncSync(d); closeSync(d); } catch { /* not every platform syncs a directory */ }
}

const sleep = ms => Atomics.wait(new Int32Array(new SharedArrayBuffer(4)), 0, 0, ms);

/** Run `fn` while holding docs/plan/.plan.lock. A lock older than 10 s is treated as abandoned. */
export function withLock(dir, fn) {
  const lock = paths(dir).lock;
  const deadline = Date.now() + LOCK_TIMEOUT_MS;
  for (;;) {
    try {
      const fd = openSync(lock, "wx");
      writeSync(fd, `${process.pid} ${new Date().toISOString()}\n`);
      closeSync(fd);
      break;
    } catch (e) {
      if (e.code !== "EEXIST") throw e;
      try {
        if (Date.now() - statSync(lock).mtimeMs > LOCK_STALE_MS) { unlinkSync(lock); continue; }
      } catch { continue; /* released between the open and the stat */ }
      if (Date.now() > deadline) throw new Error(`could not take ${lock} within ${LOCK_TIMEOUT_MS / 1000} s; delete it if no other writer is running`);
      sleep(LOCK_RETRY_MS);
    }
  }
  try {
    return fn();
  } finally {
    try { unlinkSync(lock); } catch { /* someone judged it stale; nothing to release */ }
  }
}

/* ---------- GOALS.md → plan ---------- */

const GOAL_HEADING = /^###\s+([A-Za-z0-9_\-.~:@+]+)\s+·\s+(.+?)\s*$/;
const KEYS = new Set(["lane", "needs", "size", "track", "milestone", "label"]);
const SEGMENT = /^\*\*([A-Za-z]+):\*\*\s*([^*]+?)\s*$/;
// GitHub's heading slug: lower-case, drop punctuation, one hyphen per space.
const slug = text => text.trim().toLowerCase().replace(/[^\p{L}\p{N}\s_-]/gu, "").replace(/\s/g, "-");
const splitIds = v => (/^(—|-|none|nothing)$/i.test(v.trim()) ? [] : v.split(/[,\s]+/).map(s => s.trim()).filter(Boolean));

/** Parse a goal's field block: list items right under its heading, wrapped lines joined. */
function parseFieldBlock(id, lines) {
  const items = [];
  for (const line of lines) {
    if (/^\s*[-*]\s+/.test(line)) items.push(line.replace(/^\s*[-*]\s+/, "").trim());
    else items[items.length - 1] += " " + line.trim();
  }
  const out = {};
  for (const item of items) {
    for (const seg of item.split(/\s+·\s+(?=\*\*)/)) {
      const m = seg.match(SEGMENT);
      if (!m || !KEYS.has(m[1].toLowerCase())) throw new Error(`${id}: cannot read the field "${seg}"`);
      const key = m[1].toLowerCase();
      if (key in out) throw new Error(`${id}: the field ${m[1]} appears twice`);
      out[key] = m[2].trim();
    }
  }
  return out;
}

/**
 * Turn GOALS.md into the board builder's plan. The first fenced ```json block holds title,
 * people, tracks, syncPoints and config. Every goal is a `### ID · Title` heading followed
 * directly by its field list (`- **Lane:** … · **Size:** …`, `- **Needs:** …`). Everything
 * after the first blank line is prose for people. Lane and Needs are required.
 */
export function parseGoalsMarkdown(text, { docPath = "docs/plan/GOALS.md" } = {}) {
  const fence = text.match(/```json\s*\n([\s\S]*?)\n```/);
  if (!fence) throw new Error("GOALS.md has no ```json front-matter block");
  const head = JSON.parse(fence[1]);
  const goals = [];
  let current = null;
  let inFields = false;
  let inCode = false;
  for (const line of text.split("\n")) {
    if (/^\s*```/.test(line)) { inCode = !inCode; inFields = false; continue; }
    if (inCode) continue;
    const h = line.match(GOAL_HEADING);
    if (h) {
      current = { id: h[1], title: h[2], heading: line.replace(/^###\s+/, ""), fieldLines: [] };
      goals.push(current);
      inFields = true;
      continue;
    }
    if (/^###\s/.test(line)) throw new Error(`"${line}" is a level-3 heading but not a goal; goals are "### ID · Title"`);
    if (/^#{1,2}\s/.test(line)) { current = null; inFields = false; continue; }
    if (!inFields) continue;
    const isItem = /^\s*[-*]\s+\*\*/.test(line);
    const isWrap = /^\s+\S/.test(line) && current.fieldLines.length > 0;
    if (isItem || isWrap) current.fieldLines.push(line);
    else inFields = false;
  }
  const planGoals = goals.map(g => {
    const f = parseFieldBlock(g.id, g.fieldLines);
    if (!f.lane) throw new Error(`${g.id} has no **Lane:** field`);
    if (f.needs === undefined) throw new Error(`${g.id} has no **Needs:** field (write — for none)`);
    return {
      id: g.id,
      title: g.title,
      owner: f.lane,
      needs: splitIds(f.needs),
      ...(f.size ? { size: f.size } : {}),
      // The board's "track" is the milestone a goal ships in; lanes already say the area.
      ...(f.milestone || f.track ? { track: f.milestone || f.track } : {}),
      ...(f.label ? { label: f.label } : {}),
      doc: `${docPath}#${slug(g.heading)}`,
    };
  });
  return { ...head, goals: planGoals };
}

/* ---------- validation and derived state ---------- */

export function validatePlan(plan) {
  const ids = new Set();
  const lanes = new Set((plan.people || []).map(p => (typeof p === "string" ? p : p.name)));
  for (const g of plan.goals) {
    if (!ID.test(g.id)) throw new Error(`goal id ${g.id} has characters the board cannot store`);
    if (ids.has(g.id)) throw new Error(`duplicate goal id ${g.id}`);
    if (lanes.size && !lanes.has(g.owner)) throw new Error(`${g.id} is in lane "${g.owner}", which is not in the people list`);
    ids.add(g.id);
  }
  for (const g of plan.goals) {
    for (const n of g.needs) {
      if (!ids.has(n)) throw new Error(`${g.id} needs ${n}, which is not a goal in the plan`);
      if (n === g.id) throw new Error(`${g.id} needs itself`);
    }
  }
  const byId = new Map(plan.goals.map(g => [g.id, g]));
  const seen = new Map();
  const visit = (id, trail) => {
    if (seen.get(id) === "done") return;
    if (seen.get(id) === "visiting") throw new Error(`the needs form a cycle: ${[...trail, id].join(" -> ")}`);
    seen.set(id, "visiting");
    for (const n of byId.get(id).needs) visit(n, [...trail, id]);
    seen.set(id, "done");
  };
  for (const g of plan.goals) visit(g.id, []);
  return plan;
}

export function loadPlan(dir = PLAN_DIR) {
  const p = paths(dir);
  if (!existsSync(p.plan)) throw new Error(`${p.plan} is missing; run: node scripts/plan/build.mjs`);
  return validatePlan(readJson(p.plan));
}

/** Always `{ goals: {…} }`, even for a missing or hand-damaged file shape. */
export function loadStatus(dir = PLAN_DIR) {
  const raw = readJson(paths(dir).status, null);
  const base = raw && typeof raw === "object" && !Array.isArray(raw) ? raw : {};
  const goals = base.goals && typeof base.goals === "object" && !Array.isArray(base.goals) ? base.goals : {};
  return { ...base, goals };
}

export function loadActivity(dir = PLAN_DIR) {
  const raw = readJson(paths(dir).activity, []);
  return Array.isArray(raw) ? raw : [];
}

export function statusOf(status, id) {
  const raw = status.goals[id]?.status;
  return typeof raw === "string" && STATUSES.includes(raw) ? raw : "not started";
}

/** The board's derived state: ready and blocked are never stored. */
export function stateOf(plan, status, id) {
  const s = statusOf(status, id);
  if (s === "done") return "done";
  if (s === "in review") return "review";
  if (s === "claimed") return "running";
  if (s === "on hold") return "hold";
  const goal = plan.goals.find(g => g.id === id);
  return goal.needs.some(n => statusOf(status, n) !== "done") ? "blocked" : "ready";
}

export const openNeeds = (plan, status, id) =>
  plan.goals.find(g => g.id === id).needs.filter(n => statusOf(status, n) !== "done");

export const dependentsOf = (plan, id) => plan.goals.filter(g => g.needs.includes(id)).map(g => g.id);

/* ---------- writes ---------- */

function cleanFields(fields) {
  const out = {};
  for (const [k, max] of Object.entries(FIELD_LIMITS)) {
    const v = fields[k];
    if (v == null) continue;
    if (typeof v !== "string") throw new PlanError("bad_request", `${k} must be text`);
    out[k] = v.trim().slice(0, max);
  }
  return out;
}

const feedId = at => `a-${Date.parse(at)}-${Math.random().toString(36).slice(2, 8)}`;

/**
 * Set one goal's status and add a feed entry, under the lock. Both files are read before
 * either is written, so a damaged feed cannot leave a status saved behind a reported failure.
 * Moving into "claimed" while a need is open is refused unless `force`.
 */
export function setStatus(dir, id, fields, { by = null, source = null, kind = "update", force = false } = {}) {
  const plan = loadPlan(dir);
  if (!plan.goals.some(g => g.id === id)) throw new PlanError("stale", `no goal ${id} in the plan; reload the board or rebuild it`);
  const status = normaliseStatus(fields.status);
  const clean = cleanFields(fields);
  return withLock(dir, () => {
    const status0 = loadStatus(dir);
    const feed0 = loadActivity(dir);
    const prev = status0.goals[id] || {};
    const prevStatus = statusOf(status0, id);
    if (status === "claimed" && prevStatus !== "claimed" && !force) {
      const open = openNeeds(plan, status0, id);
      if (open.length) throw new PlanError("blocked", `${id} is blocked by ${open.join(", ")}; finish those first or pass --force`);
    }
    const at = new Date().toISOString();
    const next = {
      status,
      who: prev.who || "",
      ref: prev.ref || "",
      note: prev.note || "",
      ...clean,
      by,
      at,
      ...(source ? { source } : {}),
    };
    const entry = {
      kind, goal: id, from: prevStatus, to: status, who: next.who, ref: next.ref,
      note: next.note !== (prev.note || "") ? next.note : "", by, at, id: feedId(at),
    };
    writeJsonAtomic(paths(dir).status, { ...status0, goals: { ...status0.goals, [id]: next } });
    writeJsonAtomic(paths(dir).activity, [...feed0, entry]);
    return { prev: prevStatus, next };
  });
}

export function appendActivity(dir, entry) {
  return withLock(dir, () => {
    const at = entry.at || new Date().toISOString();
    const id = feedId(at);
    writeJsonAtomic(paths(dir).activity, [...loadActivity(dir), { ...entry, at, id }]);
    return id;
  });
}

/** Newest first. The file is append-only, so later entries win ties on the same timestamp. */
export const recentActivity = (dir = PLAN_DIR, limit = FEED_LIMIT) =>
  loadActivity(dir)
    .map((a, i) => ({ a, i }))
    .sort((x, y) => String(y.a.at).localeCompare(String(x.a.at)) || y.i - x.i)
    .slice(0, limit)
    .map(x => x.a);
