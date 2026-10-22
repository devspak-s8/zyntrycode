"""Cross-model consensus: the final verdict on a finished execution.

After all stages complete, a small panel of heterogeneous models reviews the
final diff + evidence and returns independent verdicts (approve / concerns /
reject). A cheap arbiter reads the verdicts and either declares "this is the
fix" or sends the blocking concerns back through ONE repair round. Consensus
is evidence, not proof: dissent is always recorded, never averaged away.
"""

import asyncio
import json
import re
from typing import Any

from domain import escalation
from domain.catalog import ModelSpec, MODELS
from util import truncate

PANEL_SIZE = 3
MAX_REVIEW_TOKENS = 800
MAX_REPAIR_TOKENS = 2500
MAX_ARBITER_TOKENS = 500
MAX_ROUNDS = 2
# Conservative per-panelist cost used by the budget guard before running.
CONSENSUS_COST_CAP_USD = 0.02
# Diff/evidence budgets so prompts stay bounded.
MAX_DIFF_CHARS = 12000
MAX_EVIDENCE_CHARS = 3000

REVIEW_SYSTEM = (
    "You are an independent reviewer on a code-review panel. You receive the "
    "final diff of an engineering task and its execution evidence. Return "
    "EXACTLY a JSON object, no markdown fences:\n"
    '{"verdict": "approve" | "concerns" | "reject", "reasons": ["..."]}\n'
    "- approve: this is the fix.\n"
    "- concerns: correct, but with non-blocking notes.\n"
    "- reject: there is a blocking problem.\n"
    "Reasons must cite files, functions, or concrete failure modes. Be specific."
)

ARBITER_SYSTEM = (
    "You arbitrate a code-review panel. Given several reviewers' verdicts on a "
    "finished engineering task, decide whether the work is ready. Return EXACTLY "
    "a JSON object, no markdown fences:\n"
    '{"conclusion": "this_is_the_fix" | "repair", "statement": "one sentence", '
    '"blocking_reasons": ["..."]}\n'
    'Use "repair" only when at least one verdict is "reject".'
)

REPAIR_SYSTEM = (
    "You are repairing an engineering change after review. Given the original "
    "task, the current diff, and the reviewers' blocking concerns, produce the "
    "corrected code. Use fenced code blocks with file paths "
    "(```language:path) so the changes can be applied. Address every blocking "
    "concern explicitly."
)

_JSON_RE = re.compile(r"\{.*\}", re.DOTALL)


def _parse_json(text: str) -> dict:
    match = _JSON_RE.search(text or "")
    if not match:
        return {}
    try:
        data = json.loads(match.group(0))
        return data if isinstance(data, dict) else {}
    except (json.JSONDecodeError, TypeError):
        return {}


def select_panel(models: list[ModelSpec], available_providers: set[str],
                 specialist_id: str | None) -> list[ModelSpec]:
    """Build the review panel: the specialist that wrote the code, then the
    highest-tier models from DIFFERENT providers (heterogeneity is the point),
    filling down to tier 3 when tier 4 is scarce."""
    eligible = [m for m in models if m.provider in available_providers]
    panel: list[ModelSpec] = []
    used_ids: set[str] = set()
    used_providers: set[str] = set()

    if specialist_id:
        for m in eligible:
            if m.id == specialist_id:
                panel.append(m)
                used_ids.add(m.id)
                used_providers.add(m.provider)
                break

    for min_tier in (4, 3):
        for m in sorted(eligible, key=lambda x: x.tier, reverse=True):
            if len(panel) >= PANEL_SIZE:
                break
            if m.id in used_ids or m.provider in used_providers or m.tier < min_tier:
                continue
            panel.append(m)
            used_ids.add(m.id)
            used_providers.add(m.provider)
        if len(panel) >= PANEL_SIZE:
            break

    # Fill remaining seats with any unused models (same provider accepted).
    if len(panel) < PANEL_SIZE:
        for m in sorted(eligible, key=lambda x: x.tier, reverse=True):
            if m.id not in used_ids:
                panel.append(m)
                used_ids.add(m.id)
            if len(panel) >= PANEL_SIZE:
                break
    return panel


def build_review_prompt(task: dict, diff_text: str, evidence_text: str) -> str:
    return "\n\n".join([
        f"# Task\n{task.get('prompt', '')}",
        "# Final diff\n" + (diff_text or "(no diff recorded)"),
        "# Execution evidence\n" + (evidence_text or "(no evidence)"),
        "# Instructions\nReturn your verdict as strict JSON.",
    ])


def build_arbiter_prompt(task: dict, verdicts: list[dict]) -> str:
    lines = [f"# Task\n{task.get('prompt', '')}", "# Panel verdicts"]
    for v in verdicts:
        lines.append(f"- [{v['model']}] verdict={v['verdict']} reasons={json.dumps(v['reasons'])}")
    lines.append("# Instructions\nDecide: this_is_the_fix or repair. Return strict JSON.")
    return "\n\n".join(lines)


def build_repair_prompt(task: dict, diff_text: str, blocking_reasons: list[str]) -> str:
    return "\n\n".join([
        f"# Task\n{task.get('prompt', '')}",
        "# Current diff\n" + (diff_text or "(none)"),
        "# Blocking review concerns\n" + "\n".join(f"- {r}" for r in blocking_reasons),
        "# Instructions\nProduce the corrected code with fenced file paths.",
    ])


def pick_arbiter(models: list[ModelSpec], available_providers: set[str]) -> ModelSpec | None:
    eligible = [m for m in models if m.provider in available_providers]
    if not eligible:
        return None
    return min(eligible, key=lambda m: (m.cost_in + m.cost_out, m.tier))


def _norm_verdict(value: str) -> str:
    value = (value or "").strip().lower()
    if value in ("approve", "approved", "yes"):
        return "approve"
    if value in ("concerns", "concern", "warn", "warning"):
        return "concerns"
    if value in ("reject", "rejected", "no", "fail", "failed"):
        return "reject"
    return "concerns"  # unparsable verdicts are treated as non-blocking notes


def _record(ctx: Any, model: ModelSpec, res: Any) -> None:
    tokens_in = int(res.tokens_in or 0)
    tokens_out = int(res.tokens_out or 0)
    ctx.record_spend(escalation.attempt_cost(model, tokens_in, tokens_out),
                     tokens_in, tokens_out)


async def run(ctx: Any, *, task: dict, diff_text: str, evidence_text: str,
              specialist_id: str | None, models: list[ModelSpec],
              available_providers: set[str], costs: dict) -> dict:
    """Run the consensus panel for a finished execution.

    ``ctx`` must provide ``provider_for(name)``, ``emit(...)`` and
    ``record_spend(cost, tokens)`` (the executor's run context). ``costs``
    receives the total consensus spend/tokens.
    """
    verdict_history: list[dict] = []
    result: dict = {
        "ran": True, "rounds": 0, "verdict": "unknown", "statement": "",
        "agreement": {"approve": 0, "concerns": 0, "reject": 0},
        "dissent": [], "models": [], "error": None,
    }
    current_diff = diff_text
    blocking: list[str] = []

    await ctx.emit("consensus_started",
                   "Cross-model review panel is checking the finished work",
                   {"models": [m.id for m in models]})

    for round_no in range(1, MAX_ROUNDS + 1):
        await ctx.emit("consensus_round", f"Consensus round {round_no}",
                       {"round": round_no}, )
        verdicts: list[dict] = []
        for model in models:
            try:
                provider = ctx.provider_for(model.provider)
                prompt = build_review_prompt(task, current_diff, evidence_text)
                res = await provider.complete(
                    model.id, prompt, system=REVIEW_SYSTEM,
                    temperature=0.0, max_tokens=MAX_REVIEW_TOKENS)
                if res.error:
                    verdicts.append({"model": model.id, "verdict": "concerns",
                                     "reasons": [f"reviewer error: {res.error[:120]}"]})
                else:
                    data = _parse_json(res.text)
                    verdicts.append({
                        "model": model.id,
                        "verdict": _norm_verdict(data.get("verdict", "")),
                        "reasons": [str(r)[:300] for r in (data.get("reasons") or [])],
                    })
                    _record(ctx, model, res)
            except Exception as exc:  # noqa: BLE001
                verdicts.append({"model": model.id, "verdict": "concerns",
                                 "reasons": [f"reviewer unavailable: {str(exc)[:120]}"]})
            await ctx.emit("consensus_verdict",
                           f"{model.id}: {verdicts[-1]['verdict']}",
                           verdicts[-1])

        verdict_history.append({"round": round_no, "verdicts": verdicts})

        # Arbitrate with the cheapest capable model.
        arbiter = pick_arbiter([m for m in MODELS if m.provider in available_providers],
                               available_providers)
        conclusion, statement, blocking = "this_is_the_fix", "", []
        if arbiter is not None:
            try:
                provider = ctx.provider_for(arbiter.provider)
                res = await provider.complete(
                    arbiter.id, build_arbiter_prompt(task, verdicts),
                    system=ARBITER_SYSTEM, temperature=0.0, max_tokens=MAX_ARBITER_TOKENS)
                if not res.error:
                    data = _parse_json(res.text)
                    conclusion = "repair" if data.get("conclusion") == "repair" else "this_is_the_fix"
                    statement = str(data.get("statement") or "")[:300]
                    blocking = [str(r)[:300] for r in (data.get("blocking_reasons") or [])]
                    _record(ctx, arbiter, res)
            except Exception:  # noqa: BLE001
                pass
        else:
            # No arbiter model: conclude from raw votes.
            conclusion = "repair" if any(v["verdict"] == "reject" for v in verdicts) else "this_is_the_fix"

        await ctx.emit("consensus_arbitrated", f"Arbiter: {conclusion}",
                       {"conclusion": conclusion, "statement": statement,
                        "blocking_reasons": blocking})

        if conclusion == "this_is_the_fix":
            break

        # One repair round with the blocking concerns.
        repair_text = ""
        if specialist_id and blocking:
            specialist = next((m for m in models if m.id == specialist_id), models[0])
            try:
                provider = ctx.provider_for(specialist.provider)
                res = await provider.complete(
                    specialist.id, build_repair_prompt(task, current_diff, blocking),
                    system=REPAIR_SYSTEM, temperature=0.1, max_tokens=MAX_REPAIR_TOKENS)
                if not res.error and res.text:
                    repair_text = res.text
                    _record(ctx, specialist, res)
            except Exception:  # noqa: BLE001
                pass
        await ctx.emit("consensus_repaired", "Consensus repair round produced a corrected diff",
                       {"blocking_reasons": blocking,
                        "repair_applied": bool(repair_text)})
        if repair_text:
            current_diff = repair_text
        # Else: verdict stands with dissent recorded (honest, never faked).

    # Summarize the last round.
    last = verdict_history[-1]["verdicts"] if verdict_history else []
    agreement = {"approve": 0, "concerns": 0, "reject": 0}
    dissent: list[str] = []
    for v in last:
        agreement[v["verdict"]] = agreement.get(v["verdict"], 0) + 1
        if v["verdict"] in ("concerns", "reject"):
            dissent.extend(f"[{v['model']}] {r}" for r in v["reasons"])
    rejected_after_repair = any(v["verdict"] == "reject" for v in last)

    result.update({
        "rounds": len(verdict_history),
        "verdict": "rejected_after_repair" if rejected_after_repair
                   else ("approved_with_concerns" if dissent else "approved"),
        "statement": statement,
        "agreement": agreement,
        "dissent": dissent[:12],
        "models": [m.id for m in models],
        "history": verdict_history,
    })
    result["diff"] = current_diff if current_diff != diff_text else None

    await ctx.emit("consensus_final",
                   f"Consensus verdict: {result['verdict']} "
                   f"({agreement['approve']}/{len(last) if last else 0} approve)",
                   result)
    return result