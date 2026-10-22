"""Cross-model consensus review: the final verdict on a finished execution.

After all stages complete, a small panel of heterogeneous models reviews the
final diff + evidence and returns independent verdicts (approve / concerns /
reject). Each reviewer has a distinct priority — correctness, integration,
security — so independence comes from role as well as model identity.

A required arbiter classifies rejections (confirmed_blocking / unresolved /
non_blocking) and either declares "this is the fix" or sends confirmed
blocking concerns back through ONE repair round. There is no deterministic
fallback: malformed verdicts are re-asked once, and without a usable arbiter
the stage honestly reports "unavailable" instead of guessing.

Consensus is evidence, not proof. Dissent, classifications, and any checks
that could not run are recorded separately and never averaged away.
"""

import asyncio
import json
import re
from typing import Any

from domain import escalation
from domain.catalog import ModelSpec, MODELS
from util import truncate

PANEL_SIZE = 3
ROLES = ("correctness", "integration", "security")
MAX_REVIEW_TOKENS = 1500
MAX_REPAIR_TOKENS = 2500
MAX_ARBITER_TOKENS = 800


def _max_tokens_for(model: ModelSpec, base: int) -> int:
    """Reasoning models spend completion tokens on hidden reasoning before the
    visible answer — gpt-5 with a small cap returns EMPTY content. Give the
    reasoning families real headroom so their verdicts actually arrive."""
    mid = model.id.lower()
    if mid.startswith("gpt-5"):
        return 8000
    if mid.startswith(("o1", "o3", "o4")):
        return max(base, 4000)
    return base
MAX_ROUNDS = 2
# Conservative per-reviewer cost used by the budget guard before running.
CONSENSUS_COST_CAP_USD = 0.02
MAX_DIFF_CHARS = 12000
MAX_EVIDENCE_CHARS = 3000

ROLE_FOCUS = {
    "correctness": (
        "Logic, edge cases, error handling, concurrency, and whether the change "
        "actually does what the task asks. Cite files/functions."),
    "integration": (
        "Cross-module contracts, API signatures, imports, dependency changes, and "
        "regressions against the rest of the codebase. Cite files/functions."),
    "security": (
        "Injection, secrets handling, authentication/authorization, crypto misuse, "
        "and data exposure. A security finding must be treated as serious. "
        "Cite files/functions."),
}

REVIEW_SYSTEM = (
    "You are an independent reviewer on a code-review panel. Your review "
    "priority is {role}. You receive the final diff of an engineering task and "
    "its execution evidence. Return EXACTLY a JSON object, no markdown fences:\n"
    '{{"verdict": "approve" | "concerns" | "reject", '
    '"reasons": ["specific reasons"], '
    '"evidence": ["file:line or function references supporting each reason"]}}\n'
    "- approve: this is the fix.\n"
    "- concerns: correct, but with non-blocking notes.\n"
    "- reject: there is a blocking problem.\n"
    "Priority focus: {focus}\n"
    "Every reason MUST cite concrete files or functions from the diff. A "
    "generic \"looks good\" demonstrates nothing — be specific.\n"
    "Return ONLY the JSON object, nothing else. Keep each reason under 40 words."
)

ARBITER_SYSTEM = (
    "You arbitrate a code-review panel. Several reviewers (with different "
    "priorities) reviewed a finished engineering task. Decide whether the work "
    "is ready. Return EXACTLY a JSON object, no markdown fences:\n"
    '{{"conclusion": "this_is_the_fix" | "repair", '
    '"statement": "one sentence", '
    '"blocking_reasons": ["..."], '
    '"classification": [{{"reason": "...", '
    '"class": "confirmed_blocking" | "unresolved" | "non_blocking"}}], '
    '"dismissed": [{{"reason": "...", "why": "..."}}]}}\n'
    "Rules:\n"
    "- A rejection backed by concrete diff evidence is confirmed_blocking.\n"
    "- A security-priority rejection is blocking UNLESS you can factually refute "
    "it with references from the diff.\n"
    "- Majority agreement does NOT dismiss a serious finding; you decide on the "
    "evidence, not the vote count.\n"
    '- Use "repair" only when at least one confirmed_blocking reason exists. '
    "Non-blocking objections never trigger a repair — they are recorded."
)

REPAIR_SYSTEM = (
    "You are repairing an engineering change after review. Given the original "
    "task, the current diff, and the reviewers' confirmed blocking concerns, "
    "produce the corrected code. Use fenced code blocks with file paths "
    "(```language:path) so the changes can be applied. Address every blocking "
    "concern explicitly."
)

_JSON_RE = re.compile(r"\{.*\}", re.DOTALL)
# Read the model's own stated verdict when it wrapped it in prose/fences or was
# truncated mid-JSON. Accepts both quote styles — models often emit Python-style
# dicts ('verdict': 'approve'). This extracts the model's words — never invents.
_VERDICT_WORD_RE = re.compile(r"""["']verdict["']\s*:\s*["']([a-z_]+)["']""", re.IGNORECASE)
_CONCLUSION_WORD_RE = re.compile(r"""["']conclusion["']\s*:\s*["']([a-z_]+)["']""", re.IGNORECASE)


def _parse_json(text: str) -> dict:
    match = _JSON_RE.search(text or "")
    if not match:
        return {}
    try:
        data = json.loads(match.group(0))
        return data if isinstance(data, dict) else {}
    except (json.JSONDecodeError, TypeError):
        return {}


def _norm_verdict(value: str) -> str:
    value = (value or "").strip().lower()
    # Prefix matching: "approve with caveats", "concerns — non-blocking", and
    # "reject: unsafe" all carry the model's verdict as the first word. Still
    # only ever the model's own stated verdict — nothing is inferred or invented.
    if value.startswith(("approve", "approved", "yes")):
        return "approve"
    if value.startswith(("concern", "warn", "note")):
        return "concerns"
    if value.startswith(("reject", "rejected", "fail", "failed", "deny")):
        return "reject"
    return ""  # unrecognized — caller re-asks rather than guessing


def _norm_conclusion(value: str) -> str:
    value = (value or "").strip().lower()
    if value in ("repair", "reject", "rejected", "fail", "failed"):
        return "repair"
    if value in ("this_is_the_fix", "fix", "approve", "approved", "accept",
                 "accepted", "pass", "passed"):
        return "this_is_the_fix"
    return ""  # unrecognized — the stage reports unavailable instead of guessing


def select_panel(models: list[ModelSpec], available_providers: set[str],
                 specialist_id: str | None) -> list[ModelSpec]:
    """Build the review panel: the specialist that wrote the code, then the
    highest-tier models from DIFFERENT providers (heterogeneity is the point).
    Providers with reliable JSON-following behavior are preferred; the free
    Workers AI models only fill seats when nothing else is available, because
    an unreadable verdict is a wasted seat."""
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

    def fill(candidates: list[ModelSpec], allow_same_provider: bool) -> None:
        for m in sorted(candidates, key=lambda x: x.tier, reverse=True):
            if len(panel) >= PANEL_SIZE:
                return
            if m.id in used_ids:
                continue
            if not allow_same_provider and m.provider in used_providers:
                continue
            panel.append(m)
            used_ids.add(m.id)
            used_providers.add(m.provider)

    real = [m for m in eligible if m.provider != "workers_ai"]
    free = [m for m in eligible if m.provider == "workers_ai"]
    for min_tier in (4, 3):
        tiered = [m for m in real if m.tier >= min_tier]
        fill(tiered, allow_same_provider=False)
        if len(panel) >= PANEL_SIZE:
            break
        fill(tiered, allow_same_provider=True)
        if len(panel) >= PANEL_SIZE:
            break
    if len(panel) < PANEL_SIZE:
        fill(real, allow_same_provider=True)
    if len(panel) < PANEL_SIZE:
        fill(free, allow_same_provider=True)
    return panel


def pick_arbiter(models: list[ModelSpec], available_providers: set[str],
                 panel_ids: set[str] | None = None) -> ModelSpec | None:
    """Pick the arbiter: a capable (tier >= 3) model, ideally not already on
    the panel. Workers AI cannot follow the strict JSON contract and is
    excluded. Falls back to tier >= 2, then to any eligible model."""
    eligible = [m for m in models
                if m.provider in available_providers and m.provider != "workers_ai"]
    if not eligible:
        return None
    if panel_ids:
        off_panel = [m for m in eligible if m.id not in panel_ids]
        pool = off_panel if off_panel else eligible
    else:
        pool = eligible
    for min_tier in (3, 2):
        candidates = [m for m in pool if m.tier >= min_tier]
        if candidates:
            return min(candidates, key=lambda m: (m.cost_in + m.cost_out, m.tier))
    return min(pool, key=lambda m: (m.cost_in + m.cost_out, m.tier))


def build_review_prompt(task: dict, diff_text: str, evidence_text: str,
                        role: str) -> str:
    system = REVIEW_SYSTEM.format(role=role, focus=ROLE_FOCUS[role])
    prompt = "\n\n".join([
        f"# Task\n{task.get('prompt', '')}",
        "# Final diff\n" + (diff_text or "(no diff recorded)"),
        "# Execution evidence\n" + (evidence_text or "(no evidence)"),
        "# Instructions\nFill in this exact JSON structure and return nothing else:\n"
        "{\"verdict\": \"approve\"|\"concerns\"|\"reject\", \"reasons\": [\"...\"], "
        "\"evidence\": [\"...\"]}",
    ])
    return system, prompt


def build_arbiter_prompt(task: dict, verdicts: list[dict]) -> str:
    lines = [f"# Task\n{task.get('prompt', '')}", "# Panel verdicts"]
    for v in verdicts:
        lines.append(
            f"- [{v['role']}] {v['model']}: verdict={v['verdict']} "
            f"reasons={json.dumps(v['reasons'])} evidence={json.dumps(v['evidence'])}")
    lines.append("# Instructions\nFill in this exact JSON structure and return nothing else:\n"
                 "{\"conclusion\": \"this_is_the_fix\"|\"repair\", \"statement\": \"...\", "
                 "\"blocking_reasons\": [\"...\"], \"classification\": [{\"reason\": \"...\", "
                 "\"class\": \"confirmed_blocking\"|\"unresolved\"|\"non_blocking\"}], "
                 "\"dismissed\": [{\"reason\": \"...\", \"why\": \"...\"}]}")
    return "\n\n".join(lines)


def build_repair_prompt(task: dict, diff_text: str, blocking_reasons: list[str]) -> str:
    return "\n\n".join([
        f"# Task\n{task.get('prompt', '')}",
        "# Current diff\n" + (diff_text or "(none)"),
        "# Confirmed blocking review concerns\n" + "\n".join(f"- {r}" for r in blocking_reasons),
        "# Instructions\nProduce the corrected code with fenced file paths.",
    ])


def _record(ctx: Any, model: ModelSpec, res: Any) -> None:
    tokens_in = int(res.tokens_in or 0)
    tokens_out = int(res.tokens_out or 0)
    ctx.record_spend(escalation.attempt_cost(model, tokens_in, tokens_out),
                     tokens_in, tokens_out)


async def _review_once(ctx: Any, model: ModelSpec, role: str, task: dict,
                       diff_text: str, evidence_text: str) -> dict:
    """One review attempt; malformed JSON is re-asked once, then the seat is
    honestly marked unavailable — never guessed."""
    provider = ctx.provider_for(model.provider)
    system, prompt = build_review_prompt(task, diff_text, evidence_text, role)
    max_tokens = _max_tokens_for(model, MAX_REVIEW_TOKENS)
    last_raw = ""
    for attempt in range(2):
        try:
            res = await provider.complete(model.id, prompt, system=system,
                                          temperature=0.0, max_tokens=max_tokens)
        except Exception as exc:  # noqa: BLE001
            return {"model": model.id, "role": role, "verdict": "unavailable",
                    "reasons": [f"reviewer error: {str(exc)[:120]}"],
                    "evidence": []}
        _record(ctx, model, res)
        if res.error:
            return {"model": model.id, "role": role, "verdict": "unavailable",
                    "reasons": [f"reviewer error: {res.error[:120]}"],
                    "evidence": []}
        last_raw = res.text or ""
        data = _parse_json(res.text)
        verdict = _norm_verdict(str(data.get("verdict", "")))
        if not verdict:
            # The model may have wrapped the verdict in prose or fences, or been
            # truncated. Read its own stated verdict word; never guess one.
            word = _VERDICT_WORD_RE.search(res.text or "")
            verdict = _norm_verdict(word.group(1)) if word else ""
        if verdict:
            return {
                "model": model.id, "role": role, "verdict": verdict,
                "reasons": [str(r)[:300] for r in (data.get("reasons") or [])],
                "evidence": [str(e)[:200] for e in (data.get("evidence") or [])],
            }
        # Malformed response — one explicit re-ask with the schema.
        prompt = ("Your previous response was not valid JSON. Return EXACTLY one "
                  "JSON object with keys verdict, reasons, evidence. No prose, "
                  "no markdown fences.\n\n" + prompt)
    snippet = " ".join((last_raw or "").split())[:160]
    return {"model": model.id, "role": role, "verdict": "unavailable",
            "reasons": ["reviewer returned an invalid verdict after being re-asked"
                        + (f": {snippet}" if snippet else "")],
            "evidence": []}


async def run(ctx: Any, *, task: dict, diff_text: str, evidence_text: str,
              specialist_id: str | None, models: list[ModelSpec],
              catalog: list[ModelSpec], available_providers: set[str],
              unverified_checks: list[str]) -> dict:
    """Run the consensus review panel for a finished execution.

    ``ctx`` provides ``provider_for``, ``emit`` and ``record_spend`` (the
    executor's run context). No deterministic verdict fallback exists: without
    enough valid reviews or a usable arbiter the stage reports "unavailable".
    """
    verdict_history: list[dict] = []
    result: dict = {
        "ran": True, "rounds": 0, "verdict": "unavailable", "statement": "",
        "agreement": {"approve": 0, "concerns": 0, "reject": 0},
        "dissent": [], "reviewers": [], "models": [], "classification": [],
        "unverified_checks": unverified_checks, "error": None,
    }
    current_diff = diff_text
    blocking: list[str] = []
    final_statement = ""

    await ctx.emit("consensus_started",
                   "Cross-model consensus review is checking the finished work",
                   {"models": [m.id for m in models]})

    for round_no in range(1, MAX_ROUNDS + 1):
        await ctx.emit("consensus_round", f"Consensus review round {round_no}",
                       {"round": round_no})

        # Role priorities: the specialist reviews integration (it knows the intent);
        # the independent reviewers get correctness and security.
        priority_order = ["correctness", "security", "integration"]
        assigned: list[str] = []
        used_roles: set[str] = set()
        for model in models:
            if specialist_id and model.id == specialist_id:
                role = "integration"
            else:
                role = next((r for r in priority_order if r not in used_roles),
                            "correctness")
            assigned.append(role)
            used_roles.add(role)

        reviews = []
        for model, role in zip(models, assigned):
            review = await _review_once(ctx, model, role, task, current_diff, evidence_text)
            reviews.append(review)
            await ctx.emit("consensus_verdict",
                           f"{role} reviewer {model.id}: {review['verdict']}",
                           review)

        valid = [r for r in reviews if r["verdict"] != "unavailable"]
        if len(valid) < 2:
            result["error"] = "consensus unavailable: fewer than two valid reviews"
            await ctx.emit("verification_limited", result["error"],
                           {"limitations": [result["error"]]})
            await ctx.emit("consensus_final", "Consensus unavailable",
                           result)
            return result

        # Arbiter is required — no vote-counting fallback.
        arbiter = pick_arbiter(catalog, available_providers,
                               panel_ids={m.id for m in models})
        if arbiter is None:
            result["error"] = "consensus unavailable: no arbiter model"
            await ctx.emit("verification_limited", result["error"],
                           {"limitations": [result["error"]]})
            await ctx.emit("consensus_final", "Consensus unavailable", result)
            return result

        conclusion, statement, blocking = "this_is_the_fix", "", []
        classification: list[dict] = []
        dismissed: list[dict] = []
        try:
            provider = ctx.provider_for(arbiter.provider)
            prompt = build_arbiter_prompt(task, reviews)
            data = {}
            norm_concl = ""
            last_raw = ""
            for attempt in range(2):
                res = await provider.complete(arbiter.id, prompt, system=ARBITER_SYSTEM,
                                              temperature=0.0,
                                              max_tokens=_max_tokens_for(arbiter, MAX_ARBITER_TOKENS))
                _record(ctx, arbiter, res)
                if not res.error:
                    last_raw = res.text or ""
                    data = _parse_json(res.text)
                    norm_concl = _norm_conclusion(str(data.get("conclusion", "")))
                    if norm_concl:
                        break
                    # Read the arbiter's own stated conclusion if the JSON was
                    # wrapped in prose or truncated; never guess one.
                    word = _CONCLUSION_WORD_RE.search(res.text or "")
                    norm_concl = _norm_conclusion(word.group(1)) if word else ""
                    if norm_concl:
                        data = {"conclusion": norm_concl, "statement": "",
                                "blocking_reasons": [], "classification": [],
                                "dismissed": []}
                        break
                    prompt = ("Your previous response was not valid JSON. Return EXACTLY "
                              "one JSON object with keys conclusion, statement, "
                              "blocking_reasons, classification, dismissed. No prose.\n\n"
                              + prompt)
            if not norm_concl:
                snippet = " ".join((last_raw or "").split())[:160]
                result["error"] = ("consensus unavailable: arbiter returned "
                                   "no usable conclusion"
                                   + (f" (arbiter {arbiter.id} said: {snippet})"
                                      if snippet else f" (arbiter {arbiter.id})"))
                await ctx.emit("verification_limited", result["error"],
                               {"limitations": [result["error"]]})
                await ctx.emit("consensus_final", "Consensus unavailable", result)
                return result
            if norm_concl == "repair":
                conclusion = "repair"
            statement = str(data.get("statement") or "")[:300]
            blocking = [str(r)[:300] for r in (data.get("blocking_reasons") or [])]
            classification = [{"reason": str(c.get("reason", ""))[:300],
                               "class": str(c.get("class", "unresolved"))[:40]}
                              for c in (data.get("classification") or [])
                              if isinstance(c, dict)]
            dismissed = [{"reason": str(d.get("reason", ""))[:300],
                          "why": str(d.get("why", ""))[:200]}
                         for d in (data.get("dismissed") or [])
                         if isinstance(d, dict)]
        except Exception as exc:  # noqa: BLE001
            result["error"] = f"consensus unavailable: arbiter error: {str(exc)[:120]}"
            await ctx.emit("verification_limited", result["error"],
                           {"limitations": [result["error"]]})
            await ctx.emit("consensus_final", "Consensus unavailable", result)
            return result

        if not blocking:
            conclusion = "this_is_the_fix"

        verdict_history.append({"round": round_no, "reviews": reviews,
                                "conclusion": conclusion, "statement": statement,
                                "classification": classification,
                                "dismissed": dismissed})
        await ctx.emit("consensus_arbitrated", f"Arbiter: {conclusion}",
                       {"conclusion": conclusion, "statement": statement,
                        "blocking_reasons": blocking, "classification": classification,
                        "dismissed": dismissed})

        if conclusion == "this_is_the_fix":
            final_statement = statement
            break

        # One repair round with the confirmed blocking concerns.
        repair_text = ""
        if specialist_id and blocking:
            specialist = next((m for m in models if m.id == specialist_id), models[0])
            try:
                provider = ctx.provider_for(specialist.provider)
                res = await provider.complete(
                    specialist.id, build_repair_prompt(task, current_diff, blocking),
                    system=REPAIR_SYSTEM, temperature=0.1, max_tokens=MAX_REPAIR_TOKENS)
                _record(ctx, specialist, res)
                if not res.error and res.text:
                    repair_text = res.text
            except Exception:  # noqa: BLE001
                pass
        await ctx.emit("consensus_repaired",
                       "Consensus repair round produced a corrected diff",
                       {"blocking_reasons": blocking,
                        "repair_applied": bool(repair_text)})
        if repair_text:
            current_diff = repair_text
        final_statement = statement

    # Summarize the last round.
    last = verdict_history[-1] if verdict_history else None
    agreement = {"approve": 0, "concerns": 0, "reject": 0}
    dissent: list[str] = []
    reviewers = []
    if last is not None:
        for v in last["reviews"]:
            # Unavailable seats stay visible — hiding them would overstate
            # how much of the panel actually reviewed the work.
            if v["verdict"] != "unavailable":
                agreement[v["verdict"]] = agreement.get(v["verdict"], 0) + 1
            reviewers.append({
                "model": v["model"], "role": v["role"], "verdict": v["verdict"],
                "reasons": v["reasons"][:2], "evidence": v["evidence"][:2],
            })
            if v["verdict"] in ("concerns", "reject"):
                dissent.extend(f"[{v['role']}] {r}" for r in v["reasons"][:2])
        # Classified-but-unfixed rejections remain dissent after a repair round.
        for c in last.get("classification", []):
            if c["class"] == "confirmed_blocking":
                dissent.append(f"[arbiter] {c['reason']}")

    final_conclusion = (last or {}).get("conclusion", "this_is_the_fix")
    # Only the arbiter's confirmed blocking findings (or a "repair" conclusion
    # after the final round) reject the work. "unresolved" objections were
    # weighed by the arbiter and recorded, not established — they never
    # silently become rejections, and neither does a seat that never answered.
    has_confirmed_blocking = any(
        c["class"] == "confirmed_blocking"
        for c in (last or {}).get("classification", []))
    if final_conclusion == "repair" or has_confirmed_blocking:
        final_verdict = "rejected_after_repair"
    elif dissent:
        final_verdict = "approved_with_concerns"
    else:
        final_verdict = "approved"
    result.update({
        "rounds": len(verdict_history),
        "verdict": final_verdict,
        "statement": final_statement,
        "agreement": agreement,
        "dissent": dissent[:12],
        "reviewers": reviewers,
        "models": [m.id for m in models],
        "classification": (last or {}).get("classification", []),
        "dismissed": (last or {}).get("dismissed", []),
        "history": verdict_history,
    })
    result["diff"] = current_diff if current_diff != diff_text else None

    await ctx.emit("consensus_final",
                   f"Consensus review verdict: {result['verdict']} "
                   f"({agreement['approve']}/{sum(agreement.values()) or 1} approve)",
                   result)
    return result