import { PageShell, PageSection, Note } from "../router";
import { navigate } from "../router";

export function GetStarted() {
  return (
    <PageShell kicker="Company" title="Get started">
      <PageSection heading="1 · Install the extension">
        <p>
          Install <code style={{ fontFamily: "var(--font-mono)", color: "var(--accent)" }}>zyntry-code-0.2.0.vsix</code>{" "}
          in VS Code, then run <strong style={{ color: "var(--text-primary)" }}>Zyntry: Set API Token</strong> and
          paste your token. That is the only configuration step — the extension already
          points at the production backend.
        </p>
      </PageSection>

      <PageSection heading="2 · Open your project">
        <p>
          Open the repository you want to work on. Run{" "}
          <strong style={{ color: "var(--text-primary)" }}>Zyntry: Ingest Repo Snapshot</strong> so planning happens
          against your actual files.
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
          Run <strong style={{ color: "var(--text-primary)" }}>Zyntry: Create Workspace (local runner)</strong> and
          attach it to the task, then re-run. Tests, lint, and typechecks now execute in
          your real repository and their results close the verification loop.
        </p>
      </PageSection>

      <PageSection heading="5 · Review, then deliver">
        <p>
          Review the diff and the evidence pack. Deliver when ready — commit runs
          immediately, push and pull request wait for your approval, and CI reports back
          through the webhook.
        </p>
      </PageSection>

      <Note label="Prefer a plan first?">
        In the web app, choose <strong style={{ color: "var(--text-primary)" }}>Plan</strong> mode — the full
        implementation plan opens for review before anything executes. See{" "}
        <a href="#/how-it-works" onClick={() => navigate("how-it-works")} style={{ color: "var(--accent)" }}>
          How it works
        </a>{" "}
        for the pipeline.
      </Note>
    </PageShell>
  );
}