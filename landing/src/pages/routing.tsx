import { PageShell, PageSection, Note } from "../router";

export function Routing() {
  return (
    <PageShell kicker="Resources" title="Model routing guide">
      <p>
        Zyntry Code does not use one model for everything. Every stage of a plan is
        routed independently: the cheapest model that is actually qualified, by
        capability, tier, risk, and its historical success rate on that kind of work.
      </p>

      <PageSection heading="Tiers are a starting point, not a ranking">
        <ul style={{ margin: 0, paddingLeft: 20, display: "flex", flexDirection: "column", gap: 8 }}>
          <li><strong style={{ color: "var(--text-primary)" }}>Tier 1 (fast/cheap):</strong> simple completions, documentation, low-risk edits.</li>
          <li><strong style={{ color: "var(--text-primary)" }}>Tier 2 (balanced):</strong> general implementation and analysis.</li>
          <li><strong style={{ color: "var(--text-primary)" }}>Tier 3 (planning-class):</strong> decomposition, review, contract work.</li>
          <li><strong style={{ color: "var(--text-primary)" }}>Tier 4 (frontier reasoning):</strong> security review, critical risk, deep reasoning mode.</li>
        </ul>
        <p>
          Higher tiers are not automatically better at every task. A specialized code
          model can outperform a frontier general-purpose model on certain
          implementation work, which is exactly what the evidence layer measures.
        </p>
      </PageSection>

      <PageSection heading="Stage kinds and risk">
        <p>
          Each stage kind has a minimum tier and a required capability set (for example,
          implement needs code generation, security_review needs tier 4). The task's
          assessed risk level raises the minimum: a critical-risk task never routes
          understand/analyze work below the reasoning tier.
        </p>
      </PageSection>

      <PageSection heading="Task-specific reliability estimates">
        <p>
          Every attempt records its outcome per (stage kind, risk level, model). Routing
          computes a reliability estimate for each candidate, a Bayesian estimate that
          trusts the task-specific record more as it accumulates attempts, but never
          fully ignores the model's global record. Effective cost is the sticker price
          divided by that reliability, so a cheap model with a bad history on this kind
          of stage loses to a pricier model that actually succeeds. This replaces a
          single global success score with per-task-type evidence.
        </p>
      </PageSection>

      <PageSection heading="The budget guard covers the whole retry path">
        <p>
          Before any attempt, the guard projects the complete worst-case cost of
          finishing the stage: every remaining retry with growing input context (failure
          context accumulates), model output, escalation to the next stronger model, and
          verification operations. If the projection cannot fit the remaining budget,
          the stage is skipped with a report that names what was included: input
          context, output, retries, verification.
        </p>
      </PageSection>

      <PageSection heading="Repair first, escalate second">
        <p>
          When verification fails, the check output is fed back to the same model once
          (a repair pass). Only if the repair fails does the engine escalate to a
          stronger model. Provider errors fall back across providers first, then up the
          tiers.
        </p>
      </PageSection>

      <Note label="In the UI:">
        the Tier menu (auto / fast / balanced / quality) sets the starting tier, and
        the Deep reasoning toggle forces tier 4 for planning and execution.
      </Note>
    </PageShell>
  );
}