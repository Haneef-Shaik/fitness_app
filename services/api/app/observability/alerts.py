"""The alert table from [02 §9], as rules that are actually evaluated.

**An alert nobody has seen fire is a configuration file.** These are not a YAML
document a monitoring system may or may not be reading: they run in-process
against the same counters `/metrics` exports, `GET /v1/admin/alerts` shows what
is firing right now, and `scripts/trigger-alert.sh` makes one fire on demand so
that "we have alerting" is a thing somebody has watched happen.

**Every rate rule has a minimum sample.** Without one, the first minute of
traffic after a deploy fires every rate alert — one failure out of three is 33%
and means nothing — and the team turns them off within a week. That is how
alerting dies, and it dies quietly.
"""
from __future__ import annotations

from dataclasses import dataclass


@dataclass(frozen=True, slots=True)
class Rule:
    name: str
    #: The row of the table in docs/02 §9 this implements, verbatim.
    doc: str
    #: The numerator and denominator in `Registry.snapshot()`, or a single key
    #: for a rule that is already a value rather than a rate.
    numerator: str
    denominator: str | None
    threshold: float
    #: Below this many observations the rule does not fire at all.
    minimum_sample: int
    unit: str = "ratio"


@dataclass(frozen=True, slots=True)
class Alert:
    rule: Rule
    value: float
    message: str


RULES: tuple[Rule, ...] = (
    Rule(
        name="failed_writes",
        doc="Failed writes (5xx on any POST/PATCH) | any sustained rate > 0.5%",
        numerator="writes_failed", denominator="writes_total",
        threshold=0.005, minimum_sample=200,
    ),
    Rule(
        name="set_commit_failures",
        doc="Set-commit failures specifically | > 0.1% — this is the core loop",
        numerator="set_commits_failed", denominator="set_commits_total",
        # Five times tighter than the general rule, on purpose.
        threshold=0.001, minimum_sample=200,
    ),
    Rule(
        name="ai_latency_p95",
        doc="AI analysis latency p95 | > 20 s",
        numerator="ai_latency_p95", denominator=None,
        threshold=20.0, minimum_sample=0, unit="seconds",
    ),
    Rule(
        name="ai_failure_rate",
        doc="AI failure rate (`status = failed`) | > 5% over 15 min",
        numerator="ai_analyses_failed", denominator="ai_analyses_total",
        threshold=0.05, minimum_sample=20,
    ),
    Rule(
        name="food_resolution_failure_rate",
        doc="Food resolution failure rate (`food_id IS NULL` on confirm) | > 25% "
            "over 24 h — signals a data-coverage problem",
        numerator="food_resolutions_unresolved", denominator="food_resolutions_total",
        threshold=0.25, minimum_sample=50,
    ),
    Rule(
        name="outbox_age_p95",
        doc="Outbox depth / age (client-reported) | p95 age > 5 min",
        numerator="outbox_age_p95_seconds", denominator=None,
        threshold=300.0, minimum_sample=0, unit="seconds",
    ),
    Rule(
        name="abandoned_sessions",
        doc="Sessions abandoned in `in_progress` > 24 h | trend watch",
        numerator="abandoned_sessions", denominator=None,
        threshold=1.0, minimum_sample=0, unit="count",
    ),
)


def evaluate(snapshot: dict[str, float]) -> list[Alert]:
    """Which rules are breaching, with the number that caused it.

    An alert that says "something is wrong" without saying what or how much is
    an alert people learn to close without reading.
    """
    firing: list[Alert] = []

    for rule in RULES:
        value = _value_for(rule, snapshot)
        if value is None or value <= rule.threshold:
            continue
        firing.append(Alert(rule=rule, value=value, message=_describe(rule, value)))

    return firing


def _value_for(rule: Rule, snapshot: dict[str, float]) -> float | None:
    if rule.denominator is None:
        return snapshot.get(rule.numerator)

    total = snapshot.get(rule.denominator, 0)
    if total < rule.minimum_sample or total == 0:
        # Too few observations to mean anything. Silence is the right answer.
        return None
    return snapshot.get(rule.numerator, 0) / total


def _describe(rule: Rule, value: float) -> str:
    if rule.unit == "ratio":
        return (
            f"{rule.name}: {value * 100:.2f}% "
            f"(threshold {rule.threshold * 100:.2f}%)"
        )
    if rule.unit == "seconds":
        return f"{rule.name}: {value:.1f}s (threshold {rule.threshold:.0f}s)"
    return f"{rule.name}: {value:.0f} (threshold {rule.threshold:.0f})"
