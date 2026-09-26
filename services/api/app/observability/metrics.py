"""RED metrics — rate, errors, duration ([02 §9]).

**In-process counters exported in the Prometheus text format**, and no client
library. A metrics SDK is a dependency, a lifecycle and a failure mode, and what
this needs is three dictionaries and a histogram. When a real backend arrives it
scrapes `/metrics` exactly as it would any other exporter.

Two decisions that keep the numbers usable:

**The route label is the TEMPLATE**, `/v1/goals/{goal_id}`, never the path. A
label carrying an id gives one time series per row, which is how a metrics
backend falls over and how a p95 stops meaning anything.

**A 4xx is not an error.** A 404 is the API working. Counting it as an error is
how a dashboard cries wolf until nobody looks at it — so status is bucketed
`2xx`/`3xx`/`4xx`/`5xx` and only the last one is what the alert table means by
"failed write".
"""
from __future__ import annotations

import threading
from bisect import bisect_left
from collections import defaultdict

#: Seconds. Chosen around the two numbers that matter: the 300 ms API budget
#: (PRD §9) and the 20 s AI latency alert (02 §9).
HTTP_BUCKETS = (0.005, 0.01, 0.025, 0.05, 0.1, 0.3, 0.5, 1.0, 2.5, 5.0, 10.0)
AI_BUCKETS = (0.5, 1.0, 2.5, 5.0, 10.0, 20.0, 30.0, 60.0, 120.0)

_lock = threading.Lock()


class Histogram:
    """Cumulative buckets, a sum and a count — the Prometheus shape."""

    def __init__(self, buckets: tuple[float, ...]) -> None:
        self.buckets = buckets
        self.counts: dict[tuple, list[int]] = defaultdict(
            lambda: [0] * (len(buckets) + 1)
        )
        self.sums: dict[tuple, float] = defaultdict(float)
        self.totals: dict[tuple, int] = defaultdict(int)

    def observe(self, labels: tuple, seconds: float) -> None:
        index = bisect_left(self.buckets, seconds)
        with _lock:
            self.counts[labels][index] += 1
            self.sums[labels] += seconds
            self.totals[labels] += 1

    def quantile(self, labels: tuple, q: float) -> float | None:
        """An estimate from the buckets — the upper edge of the bucket the
        quantile falls in. Good enough to alert on, and honest about being an
        estimate: a histogram cannot give an exact p95."""
        total = self.totals.get(labels, 0)
        if total == 0:
            return None
        target = q * total
        seen = 0
        for i, count in enumerate(self.counts[labels]):
            seen += count
            if seen >= target:
                return self.buckets[i] if i < len(self.buckets) else float("inf")
        return float("inf")


class Registry:
    def __init__(self) -> None:
        self.reset()

    def reset(self) -> None:
        """Used by the suite between runs. Counters are process-global, and a
        test that inherits another test's numbers proves nothing."""
        self.http_requests: dict[tuple, int] = defaultdict(int)
        self.http_duration = Histogram(HTTP_BUCKETS)
        self.set_commits: dict[str, int] = defaultdict(int)
        self.ai_analyses: dict[str, int] = defaultdict(int)
        self.ai_duration = Histogram(AI_BUCKETS)
        self.food_resolution: dict[str, int] = defaultdict(int)

    # ---------------------------------------------------------- recording

    def record_http(self, method: str, route: str, status: int, seconds: float) -> None:
        bucket = f"{status // 100}xx"
        with _lock:
            self.http_requests[(method, route, bucket)] += 1
        self.http_duration.observe((method, route), seconds)

    def record_set_commit(self, outcome: str) -> None:
        with _lock:
            self.set_commits[outcome] += 1

    def record_analysis(self, outcome: str, seconds: float | None = None) -> None:
        with _lock:
            self.ai_analyses[outcome] += 1
        if seconds is not None:
            self.ai_duration.observe((), seconds)

    def record_resolution(self, resolved: bool) -> None:
        """Ladder step 5 is legitimate, but a high rate of it is a data-coverage
        problem — and it is the one Q1 would close (02 §9)."""
        with _lock:
            self.food_resolution["resolved" if resolved else "unresolved"] += 1

    # ------------------------------------------------------------ reading

    def snapshot(self) -> dict[str, float]:
        """The numbers the alert rules evaluate against. Same source as
        `/metrics`, so a dashboard and an alert can never disagree."""
        failed_writes = sum(
            n for (method, _route, bucket), n in self.http_requests.items()
            if bucket == "5xx" and method in ("POST", "PATCH", "PUT", "DELETE")
        )
        total_writes = sum(
            n for (method, _route, _bucket), n in self.http_requests.items()
            if method in ("POST", "PATCH", "PUT", "DELETE")
        )
        resolved = self.food_resolution["resolved"]
        unresolved = self.food_resolution["unresolved"]

        return {
            "writes_total": total_writes,
            "writes_failed": failed_writes,
            "set_commits_total": sum(self.set_commits.values()),
            "set_commits_failed": self.set_commits["failed"],
            "ai_analyses_total": sum(self.ai_analyses.values()),
            "ai_analyses_failed": self.ai_analyses["failed"],
            "ai_latency_p95": self.ai_duration.quantile((), 0.95) or 0.0,
            "food_resolutions_total": resolved + unresolved,
            "food_resolutions_unresolved": unresolved,
        }

    def render(self) -> str:
        """Prometheus text exposition, format version 0.0.4."""
        lines: list[str] = []
        out = lines.append

        out("# HELP fitlog_http_requests_total HTTP requests by route template and status class.")
        out("# TYPE fitlog_http_requests_total counter")
        for (method, route, bucket), n in sorted(self.http_requests.items()):
            out(f'fitlog_http_requests_total{{method="{method}",route="{route}",'
                f'status="{bucket}"}} {n}')

        out("# HELP fitlog_http_request_duration_seconds Request duration.")
        out("# TYPE fitlog_http_request_duration_seconds histogram")
        for labels in sorted(self.http_duration.totals):
            method, route = labels
            cumulative = 0
            for i, edge in enumerate(HTTP_BUCKETS):
                cumulative += self.http_duration.counts[labels][i]
                out(f'fitlog_http_request_duration_seconds_bucket{{method="{method}",'
                    f'route="{route}",le="{edge}"}} {cumulative}')
            total = self.http_duration.totals[labels]
            out(f'fitlog_http_request_duration_seconds_bucket{{method="{method}",'
                f'route="{route}",le="+Inf"}} {total}')
            out(f'fitlog_http_request_duration_seconds_sum{{method="{method}",'
                f'route="{route}"}} {self.http_duration.sums[labels]}')
            out(f'fitlog_http_request_duration_seconds_count{{method="{method}",'
                f'route="{route}"}} {total}')

        out("# HELP fitlog_set_commits_total Set commits — the core loop (02 §9).")
        out("# TYPE fitlog_set_commits_total counter")
        for outcome, n in sorted(self.set_commits.items()):
            out(f'fitlog_set_commits_total{{outcome="{outcome}"}} {n}')

        out("# HELP fitlog_ai_analyses_total Food analyses by outcome.")
        out("# TYPE fitlog_ai_analyses_total counter")
        for outcome, n in sorted(self.ai_analyses.items()):
            out(f'fitlog_ai_analyses_total{{outcome="{outcome}"}} {n}')

        out("# HELP fitlog_ai_analysis_duration_seconds Time from queued to finished.")
        out("# TYPE fitlog_ai_analysis_duration_seconds histogram")
        cumulative = 0
        for i, edge in enumerate(AI_BUCKETS):
            cumulative += self.ai_duration.counts[()][i]
            out(f'fitlog_ai_analysis_duration_seconds_bucket{{le="{edge}"}} {cumulative}')
        total = self.ai_duration.totals[()]
        out(f'fitlog_ai_analysis_duration_seconds_bucket{{le="+Inf"}} {total}')
        out(f"fitlog_ai_analysis_duration_seconds_sum {self.ai_duration.sums[()]}")
        out(f"fitlog_ai_analysis_duration_seconds_count {total}")

        out("# HELP fitlog_food_resolutions_total Analysis items matched to a canonical food.")
        out("# TYPE fitlog_food_resolutions_total counter")
        for outcome, n in sorted(self.food_resolution.items()):
            out(f'fitlog_food_resolutions_total{{outcome="{outcome}"}} {n}')

        return "\n".join(lines) + "\n"


#: One registry per process. The worker has its own, which is correct: it is a
#: separate process and its numbers are separately scraped.
registry = Registry()
