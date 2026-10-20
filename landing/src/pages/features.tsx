import { PageShell, PageSection, Note } from "../router";

export function FeaturesPage() {
  return (
    <PageShell kicker="Platform" title="Features">
      <PageSection heading="Repo-first planning">
        <p>
          Attach a folder or ingest your workspace snapshot and the planner works against
          your actual files — dependency structure, languages, and entry points — instead
          of guessing. Snapshots are capped in size and stripped of sensitive paths.
        </p>
      </PageSection>

      <PageSection heading="Adaptive model routing">
        <p>
          Four tiers of models, matched to the stage's kind and the task's risk level.
          Routing reads historical success rates per stage kind and divides effective
          cost by reliability — so the cheapest sticker price stops winning when the
          evidence says it fails this kind of work. Deep reasoning mode forces the
          strongest tier for planning and execution.
        </p>
      </PageSection>

      <PageSection heading="Plan review (Plan mode)">
        <p>
          Choose Plan mode to stop after planning: you get the complete implementation
          plan — every stage, its description, dependencies, and checks — in its own tab.
          Uncheck stages you do not want, then run. Every other mode starts immediately.
        </p>
      </PageSection>

      <PageSection heading="Deterministic verification">
        <p>
          Structure, syntax, and code-presence checks run locally on every stage. Repo-side
          checks (tests, lint, typecheck, build) execute through the runner you attach.
          Reports merge into one honest outcome: passed, failed, or limited.
        </p>
      </PageSection>

      <PageSection heading="Evidence pack">
        <p>
          Every execution produces an evidence pack: what changed, why, which files,
          which checks ran with what results, which models were used, and what it cost.
          Export the full session as Markdown or JSON at any time.
        </p>
      </PageSection>

      <PageSection heading="Budget guard with full retry projection">
        <p>
          Set a budget per task. Before each attempt the guard reserves the projected
          cost of the entire remaining path — input context growth, model output,
          escalation, and verification operations — and skips with a clear report when
          it cannot fit. You are never silently overcharged.
        </p>
      </PageSection>

      <PageSection heading="Durable cloud execution">
        <p>
          On the Cloudflare backend, tasks run as durable workflows: close the tab, shut
          the laptop — execution continues in the cloud and the results are polled back
          when you return. Locally, execution streams token-by-token live into the chat.
        </p>
      </PageSection>

      <PageSection heading="Local execution runner">
        <p>
          The VS Code extension doubles as the runner: file operations stay confined to
          your workspace folder, commands are parsed without a shell, unknown or dangerous
          commands require approval, and outputs are redacted against workspace secrets.
        </p>
      </PageSection>

      <Note label="Also included:">
        command palette (Cmd/Ctrl+K), semantic repo search over embeddings, retry of a
        single failed stage with prior outputs reused, one-click revert of a task's
        changes, per-file approval, CI status in the timeline, and notification toggles.
      </Note>
    </PageShell>
  );
}