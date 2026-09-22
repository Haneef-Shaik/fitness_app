#!/usr/bin/env bash
# G0 gate — the client spec must describe the client we actually build.
#
# Run it:  bash scripts/check-client-spec.sh
# Exit 0 = the spec is aligned with D1/D14/D15/D16. Exit 1 = something regressed.
#
# Why a script and not a grep pasted into the docs: the gate names the packages
# it forbids, so any document that inlines it fails its own check. The terms live
# here, once; the documents reference the script.
set -uo pipefail
cd "$(dirname "$0")/.."

# Rejected web stack (D1) — must not appear in the frontend spec at all.
BANNED='Next\.js|Tailwind|shadcn|Dexie|IndexedDB|Playwright|Server Component|LCP|gzip'
# Rejected browser database (D14) — must not appear in ANY specification document.
BANNED_DB='IndexedDB|Dexie'

# Documents that quote the rejected platform on purpose and are therefore exempt:
#   docs/prompts/            — the goal prompts carry the finding into a fresh session
#   docs/10-EXECUTION-GOALS  — §4.2 Finding 1 IS the record of why G0 existed
#   docs/09-PROJECT-TRACKER  — the G0 handoff record quotes this gate's evidence
#   scripts/                 — this file
EXEMPT=(--exclude-dir=prompts --exclude=10-EXECUTION-GOALS.md --exclude=09-PROJECT-TRACKER.md)

fail=0
check() { # <label> <expected> <actual>
  if [ "$3" = "$2" ]; then printf '  \033[32mPASS\033[0m  %-58s %s\n' "$1" "$3"
  else printf '  \033[31mFAIL\033[0m  %-58s %s (want %s)\n' "$1" "$3" "$2"; fail=1; fi
}

echo "G0 gate — client spec alignment"

a=$(grep -rnoE "$BANNED" docs/03-FRONTEND-ARCHITECTURE.md | wc -l | tr -d ' ')
check "rejected web stack in docs/03" 0 "$a"

b=$(grep -rnoE "$BANNED_DB" docs/ "${EXEMPT[@]}" | wc -l | tr -d ' ')
check "browser database in any spec doc" 0 "$b"

c=$(grep -cE 'D14|D15|D16' docs/08-PROJECT-CHARTER.md | tr -d ' ')
[ "$c" -ge 3 ] && printf '  \033[32mPASS\033[0m  %-58s %s\n' "D14/D15/D16 recorded in the charter" "$c" \
               || { printf '  \033[31mFAIL\033[0m  %-58s %s (want >=3)\n' "D14/D15/D16 recorded in the charter" "$c"; fail=1; }

d=$(grep -c 'expo-sqlite' docs/03-FRONTEND-ARCHITECTURE.md | tr -d ' ')
[ "$d" -ge 1 ] && printf '  \033[32mPASS\033[0m  %-58s %s\n' "docs/03 names the persistence mechanism" "$d" \
               || { printf '  \033[31mFAIL\033[0m  %-58s %s (want >=1)\n' "docs/03 names the persistence mechanism" "$d"; fail=1; }

e=$(grep -c 'Maestro' docs/03-FRONTEND-ARCHITECTURE.md | tr -d ' ')
[ "$e" -ge 1 ] && printf '  \033[32mPASS\033[0m  %-58s %s\n' "docs/03 §11 names the E2E runner" "$e" \
               || { printf '  \033[31mFAIL\033[0m  %-58s %s (want >=1)\n' "docs/03 §11 names the E2E runner" "$e"; fail=1; }

[ "$fail" -eq 0 ] && echo "gate: PASS" || echo "gate: FAIL"
exit "$fail"
