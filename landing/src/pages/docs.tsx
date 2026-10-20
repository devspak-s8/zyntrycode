import { PageShell, PageSection, Note } from "../router";

export function Docs() {
  return (
    <PageShell kicker="Resources" title="Documentation">
      <PageSection heading="Quickstart">
        <ol style={{ margin: 0, paddingLeft: 20, display: "flex", flexDirection: "column", gap: 10 }}>
          <li>Install the Zyntry Code extension in VS Code.</li>
          <li>Open the project you want to work on.</li>
          <li>Run <strong style={{ color: "var(--text-primary)" }}>Zyntry: Ingest Repo Snapshot</strong> so planning happens against your actual files.</li>
          <li>Run <strong style={{ color: "var(--text-primary)" }}>Zyntry: Create Task</strong>, describe the work, and choose Run now or Stream.</li>
        </ol>
        <p>
          That is the whole setup — the extension arrives connected. No keys, no
          configuration, nothing to copy from a console.
        </p>
      </PageSection>

      <PageSection heading="What you will see">
        <p>
          Every task produces a plan with ordered stages, a live progress trail while it
          runs, a diff of what changed, and an evidence pack that records which checks
          ran and what they found. Verification is honest: a check that could not run is
          reported as a limitation, never claimed as passed.
        </p>
      </PageSection>

      <PageSection heading="Review and deliver">
        <p>
          You review changes before they are authorized. Delivery is approval-gated at
          every dangerous step — commit first, then push and pull request only when you
          say so. CI results arrive on the task timeline automatically.
        </p>
      </PageSection>

      <Note label="Need help?">
        Issues and feature requests go through the repository — see the footer or the
        extension's output channel for diagnostics.
      </Note>
    </PageShell>
  );
}