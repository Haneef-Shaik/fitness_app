// MB-1 replay runner, the Docker binding of a stack and the route proof (SF-7; review 2026-10-27T0405Z finding 1, in the scope
// of review 2026-10-27T0605Z). Pure: it parses what one `docker inspect` and one `migration list` printed, and runs nothing.
// Fixtures only so far: the label key is the string the installed CLI binary holds (read as a file, never run), and no live
// Docker output has been read, so an IPv4-plus-IPv6 binding pair is refused (fail closed) until a reviewed first live read.
import { CANDIDATE, migrationListResult } from './mb1-replay-evidence.mjs';
import { BASE_MIGRATIONS, REPLAY_PORTS, SHARED } from './mb1-replay-target.mjs';

/** The label the Supabase CLI puts on every container of a project, with the project ID as its value. */
export const BINDING_LABEL = 'com.supabase.cli.project';
/** One line per container: its full ID, its name, its project label and Docker's map of its published ports. */
export const BINDING_FORMAT = `{{.Id}}|{{.Name}}|{{index .Config.Labels "${BINDING_LABEL}"}}|{{json .NetworkSettings.Ports}}`;
const HOST_IPS = Object.freeze(['127.0.0.1', '0.0.0.0']);
const ID = /^[0-9a-f]{64}$/;
const PORT_KEY = /^\d{1,5}\/(tcp|udp|sctp)$/;

/** A stack's binding: its project label, its database's 5432/tcp at `dbPort` and its Kong's 8000/tcp (the API) at `apiPort`. */
const stackBinding = (projectId, dbPort, apiPort) => Object.freeze({
  projectId,
  containers: Object.freeze([
    Object.freeze({ name: `supabase_db_${projectId}`, port: '5432/tcp', hostPort: dbPort }),
    Object.freeze({ name: `supabase_kong_${projectId}`, port: '8000/tcp', hostPort: apiPort }),
  ]),
});
/** The shared 55321 stack: where migration up writes (127.0.0.1:55322) must be the container the snapshots read. */
export const SHARED_BINDING = stackBinding(SHARED.projectId, SHARED.dbPort, new URL(SHARED.apiUrl).port);
/** The replay's mirror, at its 56422 and 56421. Held: no command checks it until a reviewed first live read of Docker's shape. */
export const replayBinding = (target) => stackBinding(target.projectId, REPLAY_PORTS['db.port'], REPLAY_PORTS['api.port']);
/** SF-7b (review 2026-10-27T0905Z L2): --type container, so a missing container never falls through to a same-named volume. */
export const bindingArgs = (binding) => ['inspect', '--type', 'container', '--format', BINDING_FORMAT, ...binding.containers.map((container) => container.name)];
export const bindingLine = (binding) => `# Docker publishes ${binding.containers.map(({ name, port, hostPort }) => `${name} ${port} only at ${hostPort}`).join(' and ')} (on ${HOST_IPS.join(' or ')}), each labelled ${BINDING_LABEL}=${binding.projectId}`;

const isBinding = (entry) => entry !== null && typeof entry === 'object' && !Array.isArray(entry) && Object.keys(entry).length === 2
  && typeof entry.HostIp === 'string' && typeof entry.HostPort === 'string';
/** Docker's port map ({"5432/tcp": [{HostIp, HostPort}] or null, …}), or null for anything else. */
function portMap(json) {
  let ports;
  try { ports = JSON.parse(json); } catch { return null; }
  if (ports === null || typeof ports !== 'object' || Array.isArray(ports)) return null;
  const valid = Object.entries(ports).every(([key, list]) => PORT_KEY.test(key) && (list === null || (Array.isArray(list) && list.every(isBinding))));
  return valid ? ports : null;
}
/** One container's line against what it must be. Problems name the container and the rule, never what Docker printed. */
function containerResult(line, want, projectId) {
  const fields = line.split('|');
  if (fields.length < 4) return { problems: [`${want.name}: the line is not <id>|<name>|<label>|<ports>`] };
  const [id, name, label] = fields;
  const ports = portMap(fields.slice(3).join('|'));
  const problems = [];
  if (!ID.test(id)) problems.push(`${want.name}: the container id is not 64 lowercase hex digits`);
  if (name !== `/${want.name}`) problems.push(`${want.name}: the line names another container`);
  if (label !== projectId) problems.push(`${want.name}: its ${BINDING_LABEL} label is not ${projectId}`);
  if (!ports) return { problems: [...problems, `${want.name}: its ports are not Docker's port map`] };
  const published = ports[want.port] ?? [];
  if (!published.length) problems.push(`${want.name}: ${want.port} is not published`);
  else if (!published.every((entry) => HOST_IPS.includes(entry.HostIp) && entry.HostPort === want.hostPort)) problems.push(`${want.name}: ${want.port} is published other than only at ${HOST_IPS.join(' or ')} port ${want.hostPort}`);
  const others = Object.keys(ports).filter((key) => key !== want.port && ports[key]?.length).sort();
  if (others.length) problems.push(`${want.name}: it also publishes ${others.join(', ')}`);
  const at = published.map((entry) => `${entry.HostIp}:${entry.HostPort}`).sort().join(',');
  return { problems, id, value: `${id} ${want.name} ${label} ${want.port}=${at}` };
}
/** A refused binding: its problems, and no value or ID to rely on. */
const refused = (problems) => ({ problems, value: null, ids: null });
/**
 * What `docker inspect --type container --format BINDING_FORMAT <db> <kong>` printed, against `binding`: exactly one line per
 * container, in order, each with a 64-hex ID, its own name, the project label, and its port published only at the expected
 * host port on 127.0.0.1 or 0.0.0.0, nothing else published. Returns the problems and, only when there are none, a value that
 * changes with any container ID, label or published address, so a later inspect can be compared with it, and the proven IDs
 * by container name (SF-7b, review 2026-10-27T0905Z L2), so a later docker exec reaches that container and no other.
 */
export function bindingProblems(stdout, binding) {
  const lines = String(stdout).split('\n').map((line) => line.replace(/\r$/, ''));
  if (lines.at(-1) === '') lines.pop();
  const count = binding.containers.length;
  if (lines.length !== count) return refused([`docker inspect printed ${lines.length} line(s), not ${count} (one per container, in order)`]);
  const results = binding.containers.map((want, at) => containerResult(lines[at], want, binding.projectId));
  const problems = results.flatMap((result) => result.problems);
  if (!problems.length && new Set(results.map((result) => result.id)).size !== count) problems.push('the containers share one id');
  if (problems.length) return refused(problems);
  const ids = Object.freeze(Object.fromEntries(binding.containers.map((want, at) => [want.name, results[at].id])));
  return { problems, value: results.map((result) => result.value).join('; '), ids };
}
/** The inspect's run: one that failed or did not finish proves nothing, and is never read as a binding or as "absent". */
export function bindingResult(run, binding) {
  if (run.status === null) return refused([`docker inspect did not finish (${run.error ?? 'no exit status'})`]);
  if (run.status !== 0) return refused([`docker inspect failed (exit ${run.status})`]);
  return bindingProblems(run.stdout, binding);
}

/**
 * The route proof: `migration list --local` for shared-apply's staged workdir reads the database migration up will write. It
 * holds only when the replay ran exactly the 15 base migrations and the candidate, and the list shows all 16 local, exactly
 * the 15 base remote and the candidate local only (migrationListResult: row by row, in order, nothing else).
 */
export function routeProof(text, migrations) {
  const base = migrations.filter((file) => file !== CANDIDATE);
  if (base.length !== BASE_MIGRATIONS || migrations.length !== BASE_MIGRATIONS + 1) {
    return { ok: false, problems: [`the replay ran ${migrations.length} migration(s); the route proof expects the ${BASE_MIGRATIONS} base and ${CANDIDATE}`], rows: [] };
  }
  const version = (file) => file.slice(0, 14);
  return migrationListResult(text, { local: migrations.map(version), applied: base.map(version) });
}
