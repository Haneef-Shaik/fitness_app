#!/usr/bin/env node
// The plan board, served locally. Nothing leaves this machine.
//
//   node scripts/plan/serve.mjs [--port 4317]     then open http://127.0.0.1:4317
//
// Serves docs/plan/board.html with a stand-in for the runtime the page expects. Saving a
// status on the page writes docs/plan/status.json and docs/plan/activity.json; edits made by
// the CLI (scripts/plan/status.mjs) or by hand show up on the page within a couple of seconds.
import { createHash } from "node:crypto";
import { spawnSync } from "node:child_process";
import { existsSync, readFileSync, statSync } from "node:fs";
import { createServer } from "node:http";
import { PlanError, loadPlan, loadStatus, paths, recentActivity, setStatus, PLAN_DIR } from "./lib.mjs";

const PORT = Number(process.argv[process.argv.indexOf("--port") + 1]) || 4317;
const HOST = "127.0.0.1";
const MAX_BODY = 16 * 1024;
const p = paths();

const localUser = (() => {
  const fromEnv = process.env.PLAN_BOARD_USER;
  if (fromEnv) return fromEnv;
  const git = spawnSync("git", ["config", "user.name"], { encoding: "utf8" });
  return git.status === 0 && git.stdout.trim() ? git.stdout.trim() : "Owner";
})();

const mtime = f => (existsSync(f) ? statSync(f).mtimeMs : 0);
const boardVersion = () => String(mtime(p.board));

function etag() {
  const h = createHash("sha1");
  for (const f of [p.status, p.activity, p.plan, p.board]) {
    if (existsSync(f)) { const s = statSync(f); h.update(`${f}:${s.mtimeMs}:${s.size};`); }
  }
  return h.digest("hex").slice(0, 16);
}

// JSON inside an inline <script>: escape "<" so no value can close the tag.
const inline = v => JSON.stringify(v).replace(/</g, "\\u003c");

const shim = () => `<script>
// LOCAL BOARD RUNTIME: a stand-in for the hosted runtime, backed by scripts/plan/serve.mjs.
(function(){
  var ME = ${inline({ id: "local:" + localUser, name: localUser })}, BOARD = ${inline(boardVersion())};
  var POLL_MS = 2000, meta = {fromCache:false, hasPendingWrites:false};
  var state = {etag:null, goals:{}, activity:[]}, subs = {goals:[], activity:[]}, errs = [], failed = false;
  var sent = 0, applied = 0;
  function doc(id, data){ return {id:id, exists:true, data:function(){ return data; }, metadata:meta}; }
  function snap(docs){ return {docs:docs, size:docs.length, empty:!docs.length, metadata:meta, docChanges:function(){ return []; }}; }
  function goalsSnap(){ var g = state.goals || {}; return snap(Object.keys(g).map(function(k){ return doc(k, g[k]); })); }
  function feedSnap(){ return snap((state.activity || []).map(function(a){ return doc(a.id, a); })); }
  function emit(){ subs.goals.forEach(function(f){ f(goalsSnap()); }); subs.activity.forEach(function(f){ f(feedSnap()); }); }
  function poll(){
    var seq = ++sent;
    return fetch("/api/state", {cache:"no-store"}).then(function(r){ if (!r.ok) throw new Error("HTTP " + r.status); return r.json(); })
      .then(function(s){
        failed = false;
        if (s.board && s.board !== BOARD) { location.reload(); return; }   // the plan was rebuilt
        if (seq < applied) return;                                         // an older poll finished late
        applied = seq;
        if (s.etag !== state.etag) { state = s; emit(); }
      })
      .catch(function(e){ if (!failed) { failed = true; errs.forEach(function(f){ f({code:"unavailable", message:String(e)}); }); } });
  }
  function send(method, url, body){
    return fetch(url, {method:method, headers:{"content-type":"application/json"}, body:JSON.stringify(body)})
      .then(function(r){ return r.json().catch(function(){ return {}; }).then(function(j){
        if (!r.ok) { var e = new Error(j.message || ("HTTP " + r.status)); e.code = j.code || "unavailable"; throw e; }
        return poll(); }); });
  }
  function collection(name){
    var q = {
      orderBy:function(){ return q; }, limit:function(){ return q; },
      // The server writes the feed entry with the true previous status when the goal is saved.
      add:function(){ return Promise.resolve({id:"server"}); },
      doc:function(id){ return {set:function(data){ return send("PUT", "/api/goals/" + encodeURIComponent(id), data); }}; },
      onSnapshot:function(next, onErr){
        (subs[name] = subs[name] || []).push(next); if (onErr) errs.push(onErr);
        if (state.etag) setTimeout(function(){ next(name === "goals" ? goalsSnap() : feedSnap()); }, 0);
        return function(){};
      }
    };
    return q;
  }
  var db = {collection:collection, doc:function(path){ var i = path.indexOf("/"); return collection(path.slice(0, i)).doc(path.slice(i + 1)); }};
  function avatar(name){
    var t = String(name || "?").replace(/^(session|local):/, "").trim(), init = (t.match(/[A-Za-z0-9]/g) || ["?"]).slice(0, 2).join("").toUpperCase();
    var svg = '<svg xmlns="http://www.w3.org/2000/svg" width="40" height="40"><rect width="40" height="40" rx="20" fill="#0f6c74"/><text x="20" y="25" font-family="sans-serif" font-size="14" fill="#fff" text-anchor="middle">' + init + '</text></svg>';
    return "data:image/svg+xml," + encodeURIComponent(svg);
  }
  function label(id){ return id === ME.id ? ME.name : String(id).replace(/^session:/, "Session ").replace(/^local:/, ""); }
  var user = {
    id:function(){ return Promise.resolve(ME.id); },
    can:function(){ return Promise.resolve(true); },
    profiles:function(ids){ var out = {}; ids.forEach(function(id){ out[id] = {name:label(id), avatarUrl:avatar(label(id))}; }); return Promise.resolve(out); }
  };
  var downloads = {save:function(f){
    var url = URL.createObjectURL(new Blob([f.data], {type:"text/csv"})), a = document.createElement("a");
    a.href = url; a.download = f.filename; document.body.appendChild(a); a.click(); a.remove();
    setTimeout(function(){ URL.revokeObjectURL(url); }, 1000); return Promise.resolve();
  }};
  window.claude = {use:function(n){ return Promise.resolve(n === "db" ? db : n === "user" ? user : n === "downloads" ? downloads : null); }};
  poll(); setInterval(poll, POLL_MS);
})();
</script>`;

function page() {
  if (!existsSync(p.board)) return null;
  return `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover">
<style>:root{color-scheme:light}body{margin:0}[hidden]{display:none!important}</style></head><body>${shim()}
${readFileSync(p.board, "utf8")}</body></html>`;
}

const BASE_HEADERS = {
  "cache-control": "no-store",
  "x-content-type-options": "nosniff",
  "x-frame-options": "DENY",
  "content-security-policy": "frame-ancestors 'none'",
};

function send(res, code, body, type = "application/json; charset=utf-8") {
  res.writeHead(code, { ...BASE_HEADERS, "content-type": type });
  res.end(type.startsWith("application/json") ? JSON.stringify(body) : body);
}

function readBody(req) {
  return new Promise((resolveBody, reject) => {
    let size = 0;
    const chunks = [];
    req.on("data", c => {
      size += c.length;
      if (size > MAX_BODY) { reject(new PlanError("bad_request", "body too large")); req.destroy(); }
      else chunks.push(c);
    });
    req.on("end", () => {
      try { resolveBody(JSON.parse(Buffer.concat(chunks).toString("utf8") || "{}")); }
      catch { reject(new PlanError("bad_request", "body is not JSON")); }
    });
    req.on("error", reject);
  });
}

// Reads: this server's own host name only (blocks DNS rebinding). Writes: also this server's
// own origin, as JSON (blocks other pages, including other local ones, from posting forms).
function trusted(req) {
  const host = String(req.headers.host || "");
  if (host !== `${HOST}:${PORT}` && host !== `localhost:${PORT}`) return false;
  if (req.method === "GET" || req.method === "HEAD") return true;
  const json = String(req.headers["content-type"] || "").startsWith("application/json");
  const sameOrigin = req.headers.origin === `http://${host}` || req.headers["sec-fetch-site"] === "same-origin";
  return json && sameOrigin;
}

const STATUS_FOR = { bad_request: 400, blocked: 409, stale: 409 };

async function handle(req, res) {
  if (!trusted(req)) return send(res, 403, { code: "not_granted", message: "local, same-origin requests only" });
  const pathname = String(req.url || "/").split("?")[0];
  if (req.method === "GET" && (pathname === "/" || pathname === "/index.html")) {
    const html = page();
    return html ? send(res, 200, html, "text/html; charset=utf-8")
      : send(res, 404, "docs/plan/board.html is missing. Run: node scripts/plan/build.mjs", "text/plain; charset=utf-8");
  }
  if (req.method === "GET" && pathname === "/api/state") {
    return send(res, 200, { etag: etag(), board: boardVersion(), goals: loadStatus().goals, activity: recentActivity() });
  }
  const goal = pathname.match(/^\/api\/goals\/([^/]+)$/);
  if (req.method === "PUT" && goal) {
    let id;
    try { id = decodeURIComponent(goal[1]); } catch { throw new PlanError("bad_request", "bad goal id"); }
    const body = await readBody(req);
    const by = typeof body.by === "string" ? body.by.slice(0, 120) : null;
    // A person on the board may move any goal; the CLI is the one that guards blocked claims.
    const { prev, next } = setStatus(PLAN_DIR, id, { status: body.status, who: body.who, ref: body.ref, note: body.note }, { by, force: true });
    return send(res, 200, { prev, next });
  }
  if (req.method === "POST" && pathname === "/api/activity") return send(res, 200, { id: "server" });
  return send(res, 404, { code: "not_found", message: "no such route" });
}

const server = createServer((req, res) => {
  handle(req, res).catch(e => {
    const known = e instanceof PlanError;
    if (!known) console.error("plan board:", e);
    // Unknown failures (a damaged JSON file, a full disk) are "internal", so the page shows the
    // message instead of deciding the viewer has no write access.
    if (!res.headersSent) send(res, known ? STATUS_FOR[e.code] || 400 : 500, { code: known ? e.code : "internal", message: e.message });
  });
});

server.listen(PORT, HOST, () => {
  const plan = existsSync(p.plan) ? loadPlan() : { goals: [] };
  console.log(`plan board: http://${HOST}:${PORT}  (${plan.goals.length} goals; writes go to docs/plan/status.json)`);
  console.log("local only — stop with Ctrl+C");
});
