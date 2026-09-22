# Goal prompts

One prompt per goal in [10-EXECUTION-GOALS.md](../10-EXECUTION-GOALS.md). Each file is **the whole
prompt** — paste it as the first message of a fresh session, started from the repo root
`/Users/Adya/personals/fitness_app`. Nothing else needs to be said to start a goal.

| Prompt | Goal | Outcome | Size | Blocked by |
|--------|------|---------|------|-----------|
| [G0.md](G0.md) | Make the client spec describe the client we are building | `docs/03` names packages that exist on React Native | S | — |
| [G1.md](G1.md) | Give the client a spine | Generated types, cached reads, a tested harness | M | G0 |
| [G2.md](G2.md) | Catalog and planning on a phone | AC-01 reachable | M | G1 |
| [G3.md](G3.md) | **The logger** | AC-02 · AC-04 reachable — offline, one-handed, no duplicates | **L** | G2 |
| [G4.md](G4.md) | Prove the critical path on hardware | AC-01 · AC-02 · AC-04 proven · DR4 closed | M | G3 |
| [G5.md](G5.md) | Retrieval | AC-03 · AC-05 | M | G4 |
| [G6.md](G6.md) | Analytics | AC-06 | M | G5 |
| [G7.md](G7.md) | Nutrition core | AC-07 | L | G5 · **Q1** |
| [G8.md](G8.md) | AI nutrition | AC-08 · AC-09 · AC-10 | L | G7 |
| [G9.md](G9.md) | Body, goals, dashboard | AC-11 | M | G6 · G8 |
| [G10.md](G10.md) | Hardening | NFR sign-off | M | G9 |

## How to use one

1. Start a fresh session in the repo root. A goal is a session's worth of work; do not start two.
2. Paste the file's full contents as the first message.
3. The prompt runs its own entry gate first. **If the gate fails, the previous goal is not
   finished** — close that one before starting this one.
4. The prompt ends by writing a handoff record into the tracker changelog and ticking the
   goal's rows in the [handoff ledger](../10-EXECUTION-GOALS.md#3--the-handoff-ledger). An
   unticked row means the handoff did not happen, whatever else was said.

## Why the prompts repeat themselves

Every prompt restates the standing rules, the invariants it can break, and the close-out loop.
That repetition is deliberate: a prompt is read by a session with no memory of the last one, and
a rule that lives only in a document nobody was told to read is not a rule.

## What these prompts are not

They are not a status page ([09-PROJECT-TRACKER.md](../09-PROJECT-TRACKER.md) owns that) and not a
task list ([TODO.md](../TODO.md) owns the current goal's granular steps). They carry the **contract**
— entry gate, scope, mechanics, verification, handoff — from the execution goals document into a
form a session can act on directly.
