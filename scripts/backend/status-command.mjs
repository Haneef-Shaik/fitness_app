import { execFileSync } from 'node:child_process';
import { parseStatusOutput } from './status-output.mjs';

// Reads `supabase status -o json` for verify.mjs, verify-gym.mjs and verify-freezes.mjs (QA-9 phase 3N gap G5, fix F4).
// A failed command throws an error that carries what the command printed: its stdout, its output list, and a message
// that can quote them. That output holds keys, so the thrown value is dropped unbound and unread, and a new error with
// one fixed message, no cause and no field takes its place. What a successful command printed goes to parseStatusOutput
// outside that catch, so a bad parse keeps the helper's own fixed refusal. Loading this module runs nothing: the real
// command is only the default of `run`, used when a suite calls the export with no argument; tests pass a fake. The
// command, its arguments and its options are the ones the suites ran. It decides no target: each suite asserts API_URL.

const FAILED = 'supabase status -o json failed; its error and output are not shown because they can hold keys';
const FAILED_RUN = Symbol('failed run');

/** What the status command printed, or FAILED_RUN. The thrown value is never bound, so nothing here can read it. */
function capturedOrFailed(run) {
  try {
    return run('pnpm', ['exec', 'supabase', 'status', '-o', 'json'], { encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'] });
  } catch {
    return FAILED_RUN;
  }
}

/** The local stack's status object. A failed command throws the fixed message above; bad output, the helper's own. */
export function readLocalStatus(run = execFileSync) {
  const output = capturedOrFailed(run);
  if (output === FAILED_RUN) throw new Error(FAILED);
  return parseStatusOutput(output);
}
