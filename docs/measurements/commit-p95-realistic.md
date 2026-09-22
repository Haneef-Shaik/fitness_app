# tap → set rendered · a session someone would actually do

<!-- Re-run: FLOW=measure-commit-p95-short.yaml bash scripts/measure-p95.sh -->

Companion to [`commit-p95.md`](commit-p95.md), which holds **the** number the goal
asked for (100 commits). This one asks a different question: does a *real*
session meet the budget? Three to five sets per exercise is a session. One
hundred on a single exercise is not.

| | |
|---|---|
| **Reading** | `tap → rendered · p50 106.4 ms · p95 118.7 ms · worst 118.7 ms · n=9` |
| **Verdict** | **OVER BUDGET** — p95 < 100 ms ([D16](../08-PROJECT-CHARTER.md#6-decision-log)) |
| Device | Samsung SM-E546B, Android 16 |
| Build | Expo Go over LAN, `__DEV__` |
| Flow | `measure-commit-p95-short.yaml` — 10 commits |
| Measured | 2026-09-23 |

## The answer is no, and that matters

| rows already logged | p95 |
|---|---|
| 10 | **118.7 ms** |
| 33 | 184.8 ms |
| 100 | 396.4 ms |

Two separate costs, and the short run is what separates them:

1. **A baseline of roughly 110 ms**, present from the very first sets.
2. **Growth with list length** on top of it, because every commit re-renders the
   whole list.

Had only the 100-sample run been taken, (2) would have looked like the whole
story and "long sessions degrade" the whole fix. It is not: **the budget is
missed at the shortest length measured**, before list growth can explain
anything.

## Why `n` is one short

The readout is taken immediately after the final tap, and a sample lands in a
`requestAnimationFrame` inside `runAfterInteractions` — so the last commit has
not been painted yet when the reading is scraped. 9 of 10, and 99 of 100. It
costs one sample and is not worth a sleep in the flow.

## Still a `__DEV__` build

[DR4](../08-PROJECT-CHARTER.md#7-delivery-risks) rules out a release build on this
machine. A release build can only be faster, by an amount **nobody has
measured** — so this is reported as taken. Closing the gap by asserting an
unmeasured speedup would be exactly the move D16 exists to prevent.
