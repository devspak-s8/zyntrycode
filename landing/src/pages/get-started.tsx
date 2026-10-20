import { PageShell, PageSection, Note } from "../router";

export function GetStarted() {
  return (
    <PageShell kicker="Company" title="Get started">
      <PageSection heading="1 · Install">
        <p>
          Install the Zyntry Code extension in VS Code. It arrives connected — there is
          nothing to configure.
        </p>
      </PageSection>

      <PageSection heading="2 · Open your project">
        <p>
          Open the repository you want to work on and run{" "}
          <strong style={{ color: "var(--text-primary)" }}>Zyntry: Ingest Repo Snapshot</strong>{" "}
          so planning happens against your actual files.
        </p>
      </PageSection>

      <PageSection heading="3 · Describe a task">
        <p>
          Run <strong style={{ color: "var(--text-primary)" }}>Zyntry: Create Task</strong> and describe the work in
          plain language — "add rate limiting to the public API", "fix the token refresh
          race", "add tests for the session store". Choose Run now or Stream to watch it
          live.
        </p>
      </PageSection>

      <PageSection heading="4 · Let verification run in your repo">
        <p>
          Create a local-runner workspace and attach it to the task, then re-run. Tests,
          lint, and typechecks now execute in your real repository and their results
          close the verification loop.
        </p>
      </PageSection>

      <PageSection heading="5 · Review, then deliver">
        <p>
          Review the diff and the evidence pack. Deliver when ready — commit runs
          immediately, push and pull request wait for your approval, and CI reports back
          automatically.
        </p>
      </PageSection>

      <Note label="Prefer a plan first?">
        In the web companion, choose <strong style={{ color: "var(--text-primary)" }}>Plan</strong> mode — the full
        implementation plan opens for review before anything executes.
      </Note>
    </PageShell>
  );
}