"""Tests for the cross-model consensus review stage."""

import pytest

from conftest import fake_create_and_plan
from domain import consensus as consensus_domain
from domain.catalog import ModelSpec
from providers.base import LLMResult

_CAPS = frozenset({"code", "reason", "plan", "review", "security", "long_context"})
FAKE_A = ModelSpec("fake-a", "p1", "Fake A", 4, 128_000, 0.0, 0.0, _CAPS, "fast")
FAKE_B = ModelSpec("fake-b", "p2", "Fake B", 4, 128_000, 0.0, 0.0, _CAPS, "fast")
FAKE_C = ModelSpec("fake-c", "p1", "Fake C", 3, 128_000, 0.0, 0.0, _CAPS, "fast")
FAKE_D = ModelSpec("fake-d", "p3", "Fake D", 2, 128_000, 0.0, 0.0, _CAPS, "fast")

APPROVE = '{"verdict": "approve", "reasons": ["diff matches the task"], "evidence": ["src/math.ts:1"]}'
REJECT = ('{"verdict": "reject", "reasons": ["token is logged in the retry path"], '
          '"evidence": ["src/auth/session.ts:42"]}')
FIX_ARBITER = ('{"conclusion": "this_is_the_fix", "statement": "The panel agrees.", '
               '"blocking_reasons": [], "classification": [], "dismissed": []}')
VALID_PYTHON = "```python:src/ok.py\ndef ok():\n    return 1\n```"


class ScriptedProvider:
    """Fake provider with scriptable reviewer/arbiter/repair behavior."""

    name = "fake"

    def __init__(self, runtime, *, reviews=APPROVE, arbiter=FIX_ARBITER,
                 malformed_reviews=0):
        self.runtime = runtime
        self.reviews = reviews
        self.arbiter = arbiter
        self.malformed_reviews = malformed_reviews
        self.review_calls = 0
        self.arbiter_calls = 0
        self.repair_calls = 0

    async def complete(self, model, prompt, system=None, temperature=0.2, max_tokens=None):
        if system and "review priority" in system:
            self.review_calls += 1
            if self.review_calls <= self.malformed_reviews:
                return LLMResult(text="I think this looks fine, no notes.",
                                 model=model, provider="fake",
                                 tokens_in=10, tokens_out=10)
            return LLMResult(text=self.reviews, model=model, provider="fake",
                             tokens_in=10, tokens_out=10)
        if system and "You arbitrate a code-review panel" in system:
            self.arbiter_calls += 1
            return LLMResult(text=self.arbiter, model=model, provider="fake",
                             tokens_in=10, tokens_out=10)
        if system and "repairing an engineering change" in system:
            self.repair_calls += 1
            return LLMResult(text=VALID_PYTHON, model=model, provider="fake",
                             tokens_in=10, tokens_out=10)
        return LLMResult(text=VALID_PYTHON, model=model, provider="fake",
                         tokens_in=10, tokens_out=10)


def _patch_execution(monkeypatch, runtime, provider):
    import executor
    models = [FAKE_A, FAKE_B, FAKE_C, FAKE_D]
    monkeypatch.setattr("domain.catalog.MODELS", models)
    monkeypatch.setattr("domain.routing.MODELS", models)
    monkeypatch.setattr("domain.escalation.MODELS", models)
    monkeypatch.setattr(executor, "build_provider", lambda name, rt: provider)
    monkeypatch.setattr(executor, "available_providers", lambda rt: {"p1", "p2", "p3"})
    monkeypatch.setattr(executor, "provider_order", lambda rt: ["p1", "p2", "p3"])
    return runtime


def test_select_panel_prefers_specialist_and_heterogeneity():
    panel = consensus_domain.select_panel(
        [FAKE_A, FAKE_B, FAKE_C, FAKE_D], {"p1", "p2", "p3"}, specialist_id="fake-b")
    assert panel[0].id == "fake-b"
    assert len(panel) == 3
    assert len({m.provider for m in panel}) >= 2


def test_parse_json_and_verdict_normalization():
    assert consensus_domain._parse_json('{"verdict": "approve"}')["verdict"] == "approve"
    assert consensus_domain._norm_verdict("REJECT") == "reject"
    assert consensus_domain._norm_verdict("bogus") == ""


async def test_consensus_runs_and_agrees(runtime, monkeypatch):
    from executor import execute_task

    result = await fake_create_and_plan(runtime, prompt="Add a helper to the users service",
                                        repo=None, constraints={"consensus": True},
                                        max_attempts_per_stage=2, budget_usd=None)
    provider = ScriptedProvider(runtime)
    _patch_execution(monkeypatch, runtime, provider)

    summary = await execute_task(runtime, result["task"]["id"])

    assert summary["task"]["status"] == "completed"
    assert summary["consensus"] is not None
    assert summary["consensus"]["verdict"] == "approved"
    assert summary["consensus"]["agreement"]["approve"] == 3
    assert summary["consensus"]["reviewers"][0]["role"] == "integration"
    assert {r["role"] for r in summary["consensus"]["reviewers"]} >= {
        "correctness", "security", "integration"}
    assert any(e["type"] == "consensus_final" for e in summary["events"])


async def test_consensus_skipped_in_fast_mode(runtime, monkeypatch):
    from executor import execute_task

    result = await fake_create_and_plan(runtime, prompt="Add a helper to the users service",
                                        repo=None,
                                        constraints={"routing_mode": "fast",
                                                     "consensus": True},
                                        max_attempts_per_stage=2, budget_usd=None)
    _patch_execution(monkeypatch, runtime, ScriptedProvider(runtime))

    summary = await execute_task(runtime, result["task"]["id"])

    assert summary["task"]["status"] == "completed"
    assert summary["consensus"] is None


async def test_consensus_skipped_for_low_risk_by_default(runtime, monkeypatch):
    from executor import execute_task

    result = await fake_create_and_plan(runtime, prompt="Add a helper to the users service",
                                        repo=None, constraints=None,
                                        max_attempts_per_stage=2, budget_usd=None)
    _patch_execution(monkeypatch, runtime, ScriptedProvider(runtime))

    summary = await execute_task(runtime, result["task"]["id"])

    assert summary["task"]["status"] == "completed"
    assert summary["consensus"] is None


async def test_non_blocking_rejection_does_not_trigger_repair(runtime, monkeypatch):
    from executor import execute_task

    arbiter = ('{"conclusion": "this_is_the_fix", '
               '"statement": "Objection reviewed and dismissed.", '
               '"blocking_reasons": [], '
               '"classification": [{"reason": "token is logged in the retry path", '
               '"class": "non_blocking"}], "dismissed": []}')
    provider = ScriptedProvider(runtime, reviews=REJECT, arbiter=arbiter)
    result = await fake_create_and_plan(runtime, prompt="Add a helper to the users service",
                                        repo=None, constraints={"consensus": True},
                                        max_attempts_per_stage=2, budget_usd=None)
    _patch_execution(monkeypatch, runtime, provider)

    summary = await execute_task(runtime, result["task"]["id"])

    assert summary["task"]["status"] == "completed"
    assert summary["consensus"]["rounds"] == 1
    assert summary["consensus"]["verdict"] == "approved_with_concerns"
    assert provider.repair_calls == 0
    assert not any(e["type"] == "consensus_repaired" for e in summary["events"])
    assert any("token is logged" in d for d in summary["consensus"]["dissent"])


async def test_malformed_review_is_reasked_not_guessed(runtime, monkeypatch):
    from executor import execute_task

    provider = ScriptedProvider(runtime, malformed_reviews=1)
    result = await fake_create_and_plan(runtime, prompt="Add a helper to the users service",
                                        repo=None, constraints={"consensus": True},
                                        max_attempts_per_stage=2, budget_usd=None)
    _patch_execution(monkeypatch, runtime, provider)

    summary = await execute_task(runtime, result["task"]["id"])

    assert summary["task"]["status"] == "completed"
    # The malformed reviewer was re-asked and produced a valid verdict.
    assert provider.review_calls == 4  # 3 seats + 1 re-ask
    assert summary["consensus"]["verdict"] == "approved"


async def test_unavailable_seat_stays_visible(runtime, monkeypatch):
    from executor import execute_task

    provider = ScriptedProvider(runtime, malformed_reviews=2)
    result = await fake_create_and_plan(runtime, prompt="Add a helper to the users service",
                                        repo=None, constraints={"consensus": True},
                                        max_attempts_per_stage=2, budget_usd=None)
    _patch_execution(monkeypatch, runtime, provider)

    summary = await execute_task(runtime, result["task"]["id"])

    assert summary["task"]["status"] == "completed"
    # The seat that never answered is recorded, not hidden, and the panel
    # proceeds with the two valid reviews.
    assert len(summary["consensus"]["reviewers"]) == 3
    assert summary["consensus"]["reviewers"][0]["verdict"] == "unavailable"
    assert summary["consensus"]["agreement"]["approve"] == 2
    assert summary["consensus"]["verdict"] == "approved"


async def test_unresolved_classification_does_not_reject(runtime, monkeypatch):
    from executor import execute_task

    arbiter = ('{"conclusion": "this_is_the_fix", "statement": "Ready.", '
               '"blocking_reasons": [], '
               '"classification": [{"reason": "one seat did not answer", '
               '"class": "unresolved"}], "dismissed": []}')
    provider = ScriptedProvider(runtime, arbiter=arbiter)
    result = await fake_create_and_plan(runtime, prompt="Add a helper to the users service",
                                        repo=None, constraints={"consensus": True},
                                        max_attempts_per_stage=2, budget_usd=None)
    _patch_execution(monkeypatch, runtime, provider)

    summary = await execute_task(runtime, result["task"]["id"])

    assert summary["task"]["status"] == "completed"
    # An unresolved objection is recorded, not established — it must never
    # silently become a rejection.
    assert summary["consensus"]["verdict"] == "approved"
    assert summary["consensus"]["agreement"]["approve"] == 3