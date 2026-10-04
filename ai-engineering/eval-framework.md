---
title: Building an Eval Framework Before You Need One
description: How I think about evaluating multi-agent LLM systems with MLflow 3 - golden datasets, trace-level scorers, calibrated judges, and gates that teams actually trust.
---

# Building an Eval Framework Before You Need One

Most teams build their evaluation framework the week after something embarrassing ships. A prompt tweak that looked harmless changes how a coordinator routes requests, a model upgrade makes one specialist agent wordier and another one quietly stop calling its tool, and nobody can say with confidence whether the system is better or worse than it was last Tuesday. At that point the eval framework gets built under pressure, scoped to the last incident, and abandoned once things calm down.

I would rather build it first. At Kroger I built an evaluation framework that covers our entire agent ecosystem using MLflow: a golden dataset, the full set of evaluators and scorers, and a harness we run on demand. This post is the generalized version of how I think about that kind of system. It is not a tour of any internal implementation. It is the design reasoning, the trade-offs, and runnable MLflow 3 code you can adapt.

All code here was checked against MLflow 3.16.1, the current release as I write this (October 2026).

## Evals are the regression suite for nondeterministic systems

In conventional software, a regression suite works because the system under test is deterministic. Same input, same output, assert equality, done. LLM systems break every part of that sentence. The same input produces different outputs. "Correct" is usually a range rather than a value. And in a multi-agent system the output is the end of a chain of decisions: which agent got the request, which tools it called, what context it passed along.

None of that removes the need for a regression suite. It changes what one looks like:

- **Assertions become scorers.** Some are still exact checks (did the response parse, did the right agent run). Others are graded judgments made by a model or a human.
- **Pass/fail becomes distributions.** You care about the rate at which a property holds across a representative set, not whether one example passed.
- **The fixture becomes a curated dataset.** The golden dataset is your test suite's input, and it has to be maintained like code.

If you accept that framing, two things follow. First, evals belong in the engineering workflow, not in a notebook someone runs before a demo. Second, you can start small. A regression suite with twenty well-chosen cases and three honest checks is worth far more than a grand plan that never runs.

## The MLflow 3 building blocks

MLflow 3 reorganized its GenAI evaluation around a few pieces that map cleanly onto the regression-suite framing:

- **`mlflow.genai.evaluate()`** takes `data`, `scorers`, and optionally a `predict_fn`. When you pass `predict_fn`, MLflow calls it once per row with the row's `inputs` dict as keyword arguments, captures a trace, and runs every scorer against it. Results land in an MLflow run.
- **Scorers** come in three flavors: built-in LLM judges such as `Correctness`, `RelevanceToQuery`, `Guidelines`, and `RetrievalGroundedness`; custom judges built with `make_judge()`; and plain Python functions decorated with `@scorer`.
- **Evaluation datasets** (`mlflow.genai.datasets`) are managed collections of `inputs`, `expectations`, and `tags` attached to an experiment. They need a SQL-backed tracking server.
- **Tracing** records every span your app produces, so scorers can inspect intermediate steps, not just the final answer.

A local setup takes a minute:

::: code-group

```bash [pip]
pip install --upgrade "mlflow>=3.6"
mlflow server --backend-store-uri sqlite:///mlflow.db --port 5000
```

```bash [uv]
uv pip install --upgrade "mlflow>=3.6"
uvx mlflow server --backend-store-uri sqlite:///mlflow.db --port 5000
```

:::

::: tip Google ADK users
MLflow traces Google ADK through its OpenTelemetry integration rather than an `autolog()` call. Install `mlflow>=3.6.0`, `google-adk`, and `opentelemetry-exporter-otlp-proto-http`, point `OTEL_EXPORTER_OTLP_ENDPOINT` at the tracking server, set `OTEL_EXPORTER_OTLP_HEADERS=x-mlflow-experiment-id=<id>`, and register an `OTLPSpanExporter` on your tracer provider. OTLP ingestion requires a SQL backend, not the file store. Open one trace and look at the span names and types ADK emits before you write scorers that depend on them.
:::

To keep the examples self-contained, here is a toy coordinator with two specialists, instrumented by hand with `@mlflow.trace`. The `span_type` values are what make trace-level scoring easy later.

```python
# agents.py: a toy coordinator with two specialists, instrumented with MLflow tracing
import mlflow
from mlflow.entities import SpanType


@mlflow.trace(name="lookup_order", span_type=SpanType.TOOL)
def lookup_order(order_id: str) -> dict:
    return {"order_id": order_id, "status": "shipped"}


@mlflow.trace(name="orders_agent", span_type=SpanType.AGENT)
def orders_agent(question: str) -> str:
    order = lookup_order("A123")
    return f"Order {order['order_id']} has {order['status']}."


@mlflow.trace(name="policy_agent", span_type=SpanType.AGENT)
def policy_agent(question: str) -> str:
    return "Returns are accepted within the posted return window with a receipt."


@mlflow.trace(name="coordinator", span_type=SpanType.AGENT)
def coordinator(question: str) -> dict:
    q = question.lower()
    if "order" in q:
        answer = orders_agent(question)
    elif "return" in q or "refund" in q:
        answer = policy_agent(question)
    else:
        answer = "I can help with orders and return policy questions."
    return {"answer": answer, "citations": []}
```

## Designing the golden dataset

The golden dataset is where most of the leverage is, and where most of the neglect happens. A great scorer on a weak dataset tells you very little.

### Source from reality first

The best cases come from real traffic. MLflow lets you build dataset records directly from traces: search with `mlflow.search_traces()`, attach ground truth with `mlflow.log_expectation()`, and merge the traces into a dataset with `merge_records()`. The UI supports the same flow from the Traces tab with "Add to evaluation dataset." Real requests carry the phrasing, ambiguity, and odd combinations that synthetic examples miss.

Hand-written cases still matter. Use them for scenarios production has not produced yet: new capabilities, policy edge cases, adversarial inputs, and requests that must be refused.

### Cover the paths, not just the topics

For a multi-agent system, coverage means coverage of the routing graph. Sketch the agents and the edges between them, then make sure every meaningful path has cases: each specialist reached directly, each handoff, each tool, each fallback when nothing fits. Then add the boring-but-deadly categories:

- **Ambiguous requests** that could plausibly go to two agents
- **Off-task or out-of-scope requests** the system should decline or redirect
- **Multi-intent requests** that need more than one specialist
- **Malformed inputs:** empty strings, huge inputs, wrong language, injected instructions
- **Known past failures**, each one added as a permanent case once fixed

Tag every record by path and kind. Tags turn one aggregate number into a breakdown that tells you where a regression lives.

### Put expectations at the right granularity

Each record carries the expectations its scorers need. `Correctness` reads `expected_facts` (or `expected_response`). `ExpectationsGuidelines` reads a per-row `guidelines` list. My own trace scorers read `expected_agents` and `expected_tools`. Not every row needs every expectation; the scorers below skip rows that do not define one.

```python
# golden.py: define and version the golden dataset
import mlflow
from mlflow.genai.datasets import create_dataset, search_datasets

GOLDEN_NAME = "agent_ecosystem_golden_v3"

RECORDS = [
    {
        "inputs": {"question": "Where is my order A123?"},
        "expectations": {
            "expected_facts": ["Order A123 has shipped."],
            "expected_agents": ["coordinator", "orders_agent"],
            "expected_tools": ["lookup_order"],
        },
        "tags": {"path": "orders", "kind": "happy_path"},
    },
    {
        "inputs": {"question": "Can I return something without a receipt?"},
        "expectations": {
            "expected_facts": ["Returns require a receipt."],
            "expected_agents": ["coordinator", "policy_agent"],
            "expected_tools": [],
        },
        "tags": {"path": "policy", "kind": "edge_case"},
    },
    {
        "inputs": {"question": "Write me a poem about my refund."},
        "expectations": {
            "expected_agents": ["coordinator", "policy_agent"],
            "expected_tools": [],
            "guidelines": ["The response must stay on the topic of refunds and not invent policy."],
        },
        "tags": {"path": "policy", "kind": "off_task"},
    },
]


def get_or_create_golden(experiment_id: str):
    # Dataset names are not unique on an OSS server, so look before creating.
    existing = search_datasets(
        experiment_ids=experiment_id,
        filter_string=f"name = '{GOLDEN_NAME}'",
        max_results=1,
    )
    if existing:
        return existing[0]
    dataset = create_dataset(
        name=GOLDEN_NAME,
        experiment_id=experiment_id,
        tags={"owner": "agent-platform", "schema": "v3"},
    )
    return dataset.merge_records(RECORDS)
```

::: warning Dataset names are not unique
On an open source MLflow server, `create_dataset()` will happily create a second dataset with the same name, and `get_dataset(name=...)` then refuses to choose between them. Look up before you create, as above, or store the `dataset_id`.
:::

### Version it and keep it fresh

Treat the dataset as a versioned artifact. Put the version in the name, record it as a tag on every evaluation run, and never edit a version that has been used as a baseline. When the dataset changes, the comparison resets, and the run history should make that obvious. Keep the record definitions in the repo next to the agent code, so changes go through review like everything else.

Freshness is a process, not a property. Products change, policies change, users find new ways to ask things. Schedule a recurring pass to pull a sample of recent traces, look at what the dataset does not cover, and promote good examples. Cases that no longer reflect the product get retired into a new version instead of being silently deleted.

## Evaluating a multi-agent ecosystem at three levels

A single end-to-end score hides too much in a multi-agent system. A correct final answer can come from a wrong path that happened to work this time, and a wrong answer can come from a perfect plan with one bad tool response. I evaluate at three levels.

### Level 1: the end-to-end answer

This is what users experience. Is the answer correct, relevant to the request, grounded in whatever was retrieved, and compliant with the rules the product has to follow? Built-in judges cover most of this: `Correctness` against expected facts, `RelevanceToQuery` for whether the response addresses the input, `RetrievalGroundedness` when agents retrieve documents (it requires retriever spans in the trace), and `Guidelines` for policy and tone.

### Level 2: per-agent and tool-call behavior

This is where traces earn their keep. A scorer that accepts a `trace` argument receives the full `mlflow.entities.Trace`, and `trace.search_spans(span_type=...)` returns the spans you care about. That makes tool trajectories, call counts, latency, and per-agent outputs all scoreable. MLflow also ships `ToolCallCorrectness` and `ToolCallEfficiency` judges for tool usage; both need traces, and both are marked experimental in the docs.

### Level 3: routing and handoff correctness

The coordinator's decisions are the riskiest part of the system, because a routing change silently moves traffic to an agent that was never tested against it. Routing can usually be checked deterministically: compare the sequence of agent spans with `expected_agents`. Handoff quality, whether the receiving agent got the intent and context it needed, is a judgment call, which is a good fit for a custom judge over the trace.

Here are the deterministic and trace-based scorers:

```python
# scorers.py: deterministic and trace-based scorers
from mlflow.entities import Feedback, SpanType, Trace
from mlflow.genai.scorers import scorer


def _names(trace: Trace, span_type: str) -> list[str]:
    return [span.name for span in trace.search_spans(span_type=span_type)]


@scorer
def output_schema(outputs) -> Feedback:
    ok = (
        isinstance(outputs, dict)
        and isinstance(outputs.get("answer"), str)
        and bool(outputs["answer"].strip())
        and isinstance(outputs.get("citations"), list)
    )
    return Feedback(value=ok, rationale="ok" if ok else f"bad shape: {outputs!r}"[:300])


@scorer
def routing_correct(trace: Trace, expectations: dict) -> Feedback:
    expected = expectations.get("expected_agents")
    if expected is None:
        return Feedback(value=None, rationale="no routing expectation for this row")
    actual = _names(trace, SpanType.AGENT)
    return Feedback(value=actual == expected, rationale=f"expected={expected} actual={actual}")


@scorer
def tool_trajectory(trace: Trace, expectations: dict) -> Feedback:
    expected = expectations.get("expected_tools")
    if expected is None:
        return Feedback(value=None, rationale="no tool expectation for this row")
    actual = _names(trace, SpanType.TOOL)
    return Feedback(value=actual == expected, rationale=f"expected={expected} actual={actual}")


@scorer(aggregations=["mean", "max", "p90"], pass_if=lambda v: v <= 4)
def agent_hops(trace: Trace) -> int:
    # Loops and ping-pong handoffs show up here long before users notice.
    return len(trace.search_spans(span_type=SpanType.AGENT))
```

A few details are worth calling out. Returning a `Feedback` with a `rationale` means every failure explains itself in the UI. Returning `value=None` for rows without an expectation keeps those rows from counting as failures. `aggregations` controls which summary metrics get logged, and `pass_if` tells MLflow how to interpret a numeric value as pass or fail.

## Choosing evaluators

My rule is simple: use the cheapest evaluator that can actually detect the failure.

### Deterministic and schema checks first

If a property can be checked in code, check it in code. Output shape, required fields, valid JSON, allowed enum values, routing sequence, tool trajectory, hop count, length limits, banned strings. These are fast, free, and perfectly repeatable, so they make the best gates. And many problems that look like "quality" issues are really contract problems, which these checks catch directly.

### Built-in LLM judges for semantic quality

For properties that need reading comprehension, start with the built-ins. They are tuned for common cases and cost nothing to adopt. Pick the judge model explicitly, either per scorer with `model="<provider>:/<model>"` or globally with the `MLFLOW_GENAI_JUDGE_DEFAULT_MODEL` environment variable. Providers beyond the natively supported ones go through LiteLLM (for example `gemini:/gemini-2.5-flash`).

::: warning Check availability before you depend on a judge
MLflow's built-in judges page has flagged `Safety` and `RetrievalRelevance` as available only in Databricks managed MLflow, pending open-sourcing. Verify against the version and deployment you actually run.
:::

### Guidelines for product rules

`Guidelines` takes natural-language pass/fail rules and returns `"yes"` or `"no"` with a rationale. It is the right tool for rules that product or domain owners can write themselves: tone, scope, required disclaimers, things that must never be said. `ExpectationsGuidelines` does the same thing per row, which is how you encode case-specific rules in the golden dataset. Write guidelines as checkable conditions ("must not include specific pricing amounts"), not vibes ("handle pricing well").

### Custom judges for everything else

When the criterion is specific to your system, `make_judge()` builds a judge from instructions with template variables such as <span v-pre>`{{ inputs }}`, `{{ outputs }}`, `{{ expectations }}`, and `{{ trace }}`</span>. A trace-based judge can reason about the whole execution, which makes it a good fit for checking handoffs:

```python
# judges.py: LLM judges, built-in and custom
from typing import Literal

from mlflow.genai.judges import make_judge
from mlflow.genai.scorers import (
    Correctness,
    ExpectationsGuidelines,
    Guidelines,
    RelevanceToQuery,
)

# Judge model comes from MLFLOW_GENAI_JUDGE_DEFAULT_MODEL unless passed explicitly,
# e.g. export MLFLOW_GENAI_JUDGE_DEFAULT_MODEL="gemini:/gemini-2.5-flash"

tone = Guidelines(
    name="tone",
    guidelines=[
        "The response must be polite and plain-spoken.",
        "The response must not promise anything the request did not ask about.",
    ],
)

handoff_quality = make_judge(
    name="handoff_quality",
    instructions=(
        "Review the multi-agent execution in {{ trace }}. Answer 'yes' only if each "
        "handoff passed the user's actual intent and the needed context to the next "
        "agent, and no agent redid work another agent had already completed."
    ),
    feedback_value_type=Literal["yes", "no"],
    inference_params={"temperature": 0},
)

LLM_JUDGES = [
    Correctness(),  # reads expectations["expected_facts"]
    RelevanceToQuery(),
    ExpectationsGuidelines(),  # reads per-row expectations["guidelines"]
    tone,
    handoff_quality,
]
```

Constraining `feedback_value_type` to a `Literal` keeps outputs parseable, and a temperature of zero through `inference_params` reduces run-to-run variance in the judge itself.

### Calibrate judges against human labels

An uncalibrated judge is an opinion with a confidence problem. Before a judge gates anything, I want to know how often it agrees with the people who own the domain. The process is not complicated: have domain experts label a sample of real outputs, run the judge on the same sample, and look at agreement and, more importantly, at *which way* it disagrees. A judge that passes things humans fail is far more dangerous than one that is overly strict.

```python
# calibrate.py: measure judge/human agreement before trusting a judge in a gate
from collections import Counter

from mlflow.genai.scorers import Correctness


def agreement(judge, labeled_rows: list[dict]) -> dict:
    """labeled_rows: [{"inputs", "outputs", "expectations", "human": "yes"|"no"}, ...]"""
    confusion = Counter()
    for row in labeled_rows:
        verdict = judge(
            inputs=row["inputs"],
            outputs=row["outputs"],
            expectations=row.get("expectations"),
        )
        judged = str(verdict.value).lower()
        confusion[(row["human"], judged)] += 1

    total = sum(confusion.values())
    agree = confusion[("yes", "yes")] + confusion[("no", "no")]
    return {
        "n": total,
        "agreement": agree / total if total else 0.0,
        # The judge passed something a human failed: the expensive mistake.
        "false_pass": confusion[("no", "yes")],
        "false_fail": confusion[("yes", "no")],
    }


if __name__ == "__main__":
    labeled = [
        {
            "inputs": {"question": "Where is my order A123?"},
            "outputs": {"answer": "Order A123 has shipped.", "citations": []},
            "expectations": {"expected_facts": ["Order A123 has shipped."]},
            "human": "yes",
        },
        # ...more rows labeled by people who own the domain
    ]
    print(agreement(Correctness(), labeled))
```

MLflow also supports aligning a judge to human feedback. If traces carry both judge assessments and human feedback under the same assessment name, `judge.align(traces, optimizer)` produces an aligned judge; MemAlign is the default optimizer, with SIMBA and GEPA available. The docs ask for at least 10 traces and recommend a balanced mix of positive and negative examples. Whether you align or just rewrite the instructions, re-measure agreement on a held-out sample afterward, and repeat the exercise whenever you change the judge model.

## Running evals: on demand, in CI, and on every prompt or model change

The harness is one function. What changes is when it runs and which scorers it includes.

```python
# run_eval.py: run the suite, log context, and gate on thresholds
import os
import subprocess
import sys

import mlflow

from agents import coordinator
from golden import GOLDEN_NAME, get_or_create_golden
from scorers import agent_hops, output_schema, routing_correct, tool_trajectory

mlflow.set_tracking_uri(os.getenv("MLFLOW_TRACKING_URI", "sqlite:///mlflow.db"))
experiment = mlflow.set_experiment("agent-ecosystem-evals")

FAST_TIER = [output_schema, routing_correct, tool_trajectory, agent_hops]

# Minimum acceptable mean per metric. Deterministic checks are strict;
# judge metrics get a band that reflects measured judge noise.
THRESHOLDS = {
    "output_schema/mean": 1.0,
    "routing_correct/mean": 0.95,
    "tool_trajectory/mean": 0.90,
    "correctness/mean": 0.85,
    "relevance_to_query/mean": 0.90,
    "handoff_quality/mean": 0.85,
}


def git_sha() -> str:
    try:
        return subprocess.check_output(["git", "rev-parse", "--short", "HEAD"], text=True).strip()
    except Exception:
        return "unknown"


def main(tier: str) -> int:
    scorers = list(FAST_TIER)
    if tier == "full":
        from judges import LLM_JUDGES

        scorers += LLM_JUDGES

    dataset = get_or_create_golden(experiment.experiment_id)
    with mlflow.start_run(run_name=f"{tier}-{git_sha()}"):
        mlflow.set_tags({"tier": tier, "git_sha": git_sha(), "golden": GOLDEN_NAME})
        result = mlflow.genai.evaluate(data=dataset, predict_fn=coordinator, scorers=scorers)

    failures = [
        f"{metric}: {result.metrics[metric]:.3f} < {floor}"
        for metric, floor in THRESHOLDS.items()
        if metric in result.metrics and result.metrics[metric] < floor
    ]
    print(f"run_id={result.run_id}")
    for line in failures:
        print("FAIL", line)
    return 1 if failures else 0


if __name__ == "__main__":
    sys.exit(main(sys.argv[1] if len(sys.argv) > 1 else "fast"))
```

I think about three triggers:

- **On demand.** The framework I built runs on demand, and that is the right starting point. An engineer changing an agent runs the suite before opening a pull request, and anyone can rerun it to answer "did this get better or worse?" with data instead of anecdotes. Making that one command is most of the adoption battle.
- **In CI.** The fast tier, deterministic and trace scorers only, is cheap enough to run on every pull request that touches agent code. It needs no judge calls and gives a stable signal.
- **On prompt or model changes.** Prompt edits, model version bumps, tool schema changes, and routing logic changes are the moments behavior shifts most. These deserve the full tier with LLM judges, and the run should be tagged with what changed so the comparison is legible later.

Two operational notes. MLflow runs predictions in a thread pool; `MLFLOW_GENAI_EVAL_MAX_WORKERS` controls the worker count (default 10). Async `predict_fn` functions are supported and time out after 300 seconds by default, adjustable with `MLFLOW_GENAI_EVAL_ASYNC_TIMEOUT`.

### Comparing runs

Every evaluation produces a run, and each row produces a trace with its assessments attached, so comparison is built in. In the MLflow UI, open the experiment, select the evaluation runs you care about, and compare them; since MLflow 3.9 you can also select traces and view them side by side, which is the fastest way to see *why* a row flipped. For scripts and CI comments, aggregate metrics are ordinary run metrics:

```python
# compare.py: diff aggregate metrics between a baseline run and a candidate run
import sys

import mlflow


def compare(baseline_run_id: str, candidate_run_id: str) -> None:
    base = mlflow.get_run(baseline_run_id).data.metrics
    cand = mlflow.get_run(candidate_run_id).data.metrics
    for metric in sorted(set(base) | set(cand)):
        b, c = base.get(metric), cand.get(metric)
        delta = "" if b is None or c is None else f"{c - b:+.3f}"
        print(f"{metric:32} {b!s:>8} -> {c!s:>8} {delta}")


if __name__ == "__main__":
    compare(sys.argv[1], sys.argv[2])
```

## Reading results and setting pass thresholds

Aggregate metrics are where you look first and where you should never stop. `result.metrics` holds one entry per scorer aggregation (names like `routing_correct/mean`), and yes/no judges are averaged as pass rates. `result.result_df` has a row per case with each scorer's value and rationale, which is where the actual diagnosis happens.

How I set thresholds:

- **Deterministic checks get strict floors.** Schema validity should be 100 percent. Routing on the golden set should be near it, because those cases were written to have a correct answer.
- **Judge metrics get bands, not points.** Run the same build several times and observe how much the judge metrics move on their own. A threshold tighter than that noise will fail builds at random and teach people to ignore the gate.
- **Gate on regressions relative to a baseline, not only absolute floors.** A drop against the last accepted run on the same dataset version is often a better signal than a fixed number.
- **Slice before you conclude.** A stable aggregate can hide a collapse in one path. Break results down by the `path` and `kind` tags before calling a change neutral.

MLflow also has a strict all-or-nothing check: `result.passed` is `True` only when every scorer passed on every row, using `pass_if` where you declared one, and `result.reason` lists what failed. That fits small must-pass suites, such as safety-critical cases, better than a broad golden set where some judge noise is expected.

::: tip Read the rationales
When a metric moves, read a batch of failing rationales before touching a prompt. Often the cause is obvious from the rationales, and sometimes you will find that the judge or the expectation is wrong, not the agent.
:::

## Pitfalls

**Judge bias.** LLM judges have known tendencies. They can favor longer or more confident answers, be swayed by the position of content, and be lenient toward outputs that sound like their own writing. Using a judge from a different model family than the system under test, constraining output to pass/fail, and calibrating against human labels all help. Re-calibrate whenever the judge model changes.

**Dataset rot.** A golden set that never changes slowly stops describing the product. Expectations go stale, new capabilities have no coverage, and the scores stay green while users see something different. Freshness reviews and versioning are the countermeasure.

**Overfitting prompts to the golden set.** Once a dataset becomes the target, people start tuning prompts until those exact cases pass. Keep a held-out slice nobody optimizes against, rotate in new real-world cases, and be suspicious of large gains that come from small, oddly specific prompt edits.

**Cost and latency.** LLM judges multiply calls: every row times every judge, plus the agents themselves. Tier the suite, push everything possible into deterministic scorers, use smaller judge models once calibration shows they agree with humans, and save the full suite for the changes that warrant it.

**Brittle trace assumptions.** Trace-based scorers depend on span names and types. A framework upgrade or refactor that renames spans can break routing checks without changing behavior. Centralize span lookups in one helper, as `_names()` does above, and fail loudly when expected spans are missing.

## A staff engineer take: when to start and how to get buy-in

**Start before the second agent.** The moment you have a router and more than one specialist, you have a system whose behavior can regress without any single component changing. That is the point where an eval framework pays for itself, and it is far cheaper to build while the system is still small enough to understand completely. Retrofitting coverage onto a dozen agents is a much larger project than growing it alongside them.

**Start with the dataset, not the dashboard.** A small, honest golden set with tags and expectations is the asset. Scorers can be added later. A dataset that reflects real usage cannot be conjured on short notice.

**Make it one command.** Adoption depends on friction. If running the suite takes one command and finishes in minutes, people run it. If it takes a wiki page, they do not.

**Make the results legible to non-engineers.** Product and domain owners can write `Guidelines` and label calibration samples. Bringing them in turns the eval suite from "the ML team's test" into the shared definition of what good looks like, which is the real source of buy-in.

**Earn the right to gate.** Start in advisory mode: run, report, do not block. Once the team has seen the suite catch real problems and the judges are calibrated, promote the stable deterministic checks to blocking gates, and later the judge metrics with bands. A gate people do not trust gets bypassed; a gate people helped design gets defended.

**Treat the framework as a product.** It needs an owner, a backlog, and maintenance time. Datasets need refreshing, judges need recalibrating, scorers need updating when the architecture changes. Budget for that up front.

The payoff is not a number on a dashboard. It is the ability to change a prompt, swap a model, or restructure the agent graph and know within minutes whether you made things better. That confidence is what lets a team move quickly on a system that is nondeterministic by nature.

## Sources

- MLflow: [Evaluating LLMs and Agents with MLflow](https://mlflow.org/docs/latest/genai/eval-monitor/)
- MLflow: [Built-in LLM Judges](https://mlflow.org/docs/latest/genai/eval-monitor/scorers/llm-judge/predefined/)
- MLflow: [Create custom code-based scorers](https://mlflow.org/docs/latest/genai/eval-monitor/scorers/custom/)
- MLflow: [Create a guidelines LLM Judge](https://mlflow.org/docs/latest/genai/eval-monitor/scorers/llm-judge/guidelines/)
- MLflow: [LLM Judges and Scorers (judge model selection)](https://mlflow.org/docs/latest/genai/eval-monitor/scorers/)
- MLflow: [Supported judge models](https://mlflow.org/docs/latest/genai/eval-monitor/scorers/llm-judge/custom-judges/supported-models/)
- MLflow: [Judge Alignment](https://mlflow.org/docs/latest/genai/eval-monitor/scorers/llm-judge/alignment/)
- MLflow: [Building MLflow evaluation datasets](https://mlflow.org/docs/latest/genai/datasets/)
- MLflow: [Evaluating Agents](https://mlflow.org/docs/latest/genai/eval-monitor/running-evaluation/agents/)
- MLflow: [Tracing Google Agent Development Kit (ADK)](https://mlflow.org/docs/latest/genai/tracing/integrations/listing/google-adk/)
- MLflow: [Python API reference, `mlflow.genai`](https://mlflow.org/docs/latest/api_reference/python_api/mlflow.genai.html)
- MLflow GitHub: [Trace comparison feature request, shipped in 3.9.0](https://github.com/mlflow/mlflow/issues/16711)
- Databricks: [Tutorial: Evaluate and improve an agent (comparing evaluation runs)](https://docs.databricks.com/aws/en/mlflow3/genai/eval-monitor/evaluate-app)
- PyPI: [mlflow](https://pypi.org/project/mlflow/)
