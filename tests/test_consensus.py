"""Tests for the cross-model consensus stage."""

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


def test_select_panel_prefers_specialist_and_heterogeneity():
    panel = consensus_domain.select_panel(
        [FAKE_A, FAKE_B, FAKE_C, FAKE_D], {"p1", "p2", "p3"}, specialist_id="fake-b")
    assert panel[0].id == "fake-b"           # specialist first
    ids = [m.id for m in panel]
    assert len(ids) == 3
    providers = {m.provider for m in panel}
    assert len(providers) >= 2                # heterogeneous


def test_select_panel_fills_down_tiers():
    panel = consensus_domain.select_panel(
        [FAKE_A, FAKE_C, FAKE_D], {"p1", "p3"}, specialist_id=None)
    assert len(panel) == 3


def test_parse_json_and_verdict_normalization():
    assert consensus_domain._parse_json('{"verdict": "approve", "reasons": []}')["verdict"] == "approve"
    assert consensus_domain._norm_verdict("REJECT") == "reject"
    assert consensus_domain._norm_verdict("bogus") == "concerns"


class _VerdictProvider:
    """Every call returns a strict approve JSON — the panel should agree."""

    name = "fake"

    def __init__(self, runtime):
        self.runtime = runtime

    async def complete(self, model, prompt, system=None, temperature=0.2, max_tokens=None):
        if "code-review panel" in system:
            return LLMResult(text='{"verdict": "approve", "reasons": []}',
                             model=model, provider="fake", tokens_in=10, tokens_out=10)
        if "arbitrate" in system:
            return LLMResult(text='{"conclusion": "this_is_the_fix", '
                                  '"statement": "The panel agrees.", "blocking_reasons": []}',
                             model=model, provider="fake", tokens_in=10, tokens_out=10)
        return LLMResult(text="```python:src/ok.py\ndef ok():\n    return 1\n```",
                         model=model, provider="fake", tokens_in=10, tokens_out=10)


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


async def test_consensus_runs_and_agrees(runtime, monkeypatch):
    from executor import execute_task

    result = await fake_create_and_plan(runtime, prompt="Add a helper to the users service",
                                        repo=None, constraints=None,
                                        max_attempts_per_stage=2, budget_usd=None)
    _patch_execution(monkeypatch, runtime, _VerdictProvider(runtime))

    summary = await execute_task(runtime, result["task"]["id"])

    assert summary["task"]["status"] == "completed"
    assert summary["consensus"] is not None
    assert summary["consensus"]["verdict"] == "approved"
    assert summary["consensus"]["agreement"]["approve"] == 3
    assert any(e["type"] == "consensus_final" for e in summary["events"])


async def test_consensus_skipped_in_fast_mode(runtime, monkeypatch):
    from executor import execute_task

    result = await fake_create_and_plan(runtime, prompt="Add a helper to the users service",
                                        repo=None, constraints={"routing_mode": "fast"},
                                        max_attempts_per_stage=2, budget_usd=None)
    _patch_execution(monkeypatch, runtime, _VerdictProvider(runtime))

    summary = await execute_task(runtime, result["task"]["id"])

    assert summary["task"]["status"] == "completed"
    assert summary["consensus"] is None
    assert not any(e["type"] == "consensus_started" for e in summary["events"])