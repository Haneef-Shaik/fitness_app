# tap → set rendered · measured

<!-- Re-run scripts/measure-p95.sh rather than editing this by hand. -->

| | |
|---|---|
| **Reading** | `tap → rendered · p50 244 ms · p95 396.4 ms · worst 407.6 ms · n=99` |
| **Verdict** | **OVER BUDGET** — the budget is p95 < 100 ms ([D16](../08-PROJECT-CHARTER.md#6-decision-log)) |
| Device | Samsung SM-E546B, Android 16 |
| Build | Expo Go over LAN, `__DEV__` |
| Samples | 100 commits requested, 99 recorded, all on one exercise |
| Measured | 2026-09-22 |

## What the span covers

`performance.now()` at the top of the tap handler, to a `requestAnimationFrame`
inside `runAfterInteractions` after the commit — validate → reduce → publish →
**paint**. It excludes the upload, which is not on the commit path (**I10**).

## The number is dominated by list length, and that is the finding

Two runs the same day, differing only in how many rows were already on screen:

| rows already logged | p95 |
|---|---|
| ~33 | 184.8 ms |
| ~100 | **396.4 ms** |

Commit cost **scales with the number of sets already logged** — every commit
re-renders the whole list. That is a concrete defect with a concrete fix
(memoise the row, or virtualise the list), not a vague "it is slow".

## Two honest caveats, neither of which discounts the number

**It is a `__DEV__` bundle.** [DR4](../08-PROJECT-CHARTER.md#7-delivery-risks) rules
out producing a release build on this machine, so this carries dev-mode overhead
and a release build can only be faster. By how much is **not measured**, so the
figure is reported as taken rather than adjusted by a guess.

**100 sets on one exercise is not a session.** Three to five per exercise is.
`commit-p95-realistic.md` records the same measurement over a short session,
which is what a user actually meets. The 100-sample figure above remains **the**
number, because it is the one the goal asked for.

## Consequence

D16 stands at p95 < 100 ms. It is **not met**, it is now **known**, and it is a
tracker item rather than a quietly rewritten target.
