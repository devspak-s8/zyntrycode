import { PageShell, PageSection, Note } from "../router";

export function ExtensionPage() {
  return (
    <PageShell kicker="Resources" title="VS Code extension">
      <PageSection heading="Install">
        <ol style={{ margin: 0, paddingLeft: 20, display: "flex", flexDirection: "column", gap: 8 }}>
          <li>Download <code style={{ fontFamily: "var(--font-mono)", color: "var(--accent)" }}>zyntry-code-0.2.0.vsix</code>.</li>
          <li>VS Code → Extensions → … → Install from VSIX.</li>
          <li>Open a project and run <strong style={{ color: "var(--text-primary)" }}>Zyntry: Create Task</strong>.</li>
        </ol>
      </PageSection>

      <PageSection heading="What it does">
        <p>
          The extension is the product client and the local execution runner in one:
          it creates, approves, runs, and streams tasks; ingests the open folder as a
          repo snapshot; creates local-runner workspaces; and executes the queued file
          and command operations that make verification real.
        </p>
      </PageSection>

      <PageSection heading="Local runner safety">
        <ul style={{ margin: 0, paddingLeft: 20, display: "flex", flexDirection: "column", gap: 8 }}>
          <li>File operations are confined to the open workspace folder (realpath-checked).</li>
          <li>Sensitive paths (.env, credentials, keys, certs) are never read, written, or snapshotted.</li>
          <li>Commands are parsed without a shell (no pipes, redirects, or command substitution).</li>
          <li>Unknown or dangerous commands wait for your explicit approval.</li>
          <li>Command output is redacted against the workspace's secret values.</li>
        </ul>
      </PageSection>

      <PageSection heading="Credentials">
        <p>
          The extension arrives connected; access is managed automatically. Workspace
          credentials stay inside the extension process and are never written to
          settings files or source. No provider API keys or tokens are ever packaged
          inside the extension.
        </p>
      </PageSection>

      <Note label="Settings:">
        <code style={{ fontFamily: "var(--font-mono)", color: "var(--accent)" }}>zyntry.backendUrl</code>{" "}
        (defaults to the production API),{" "}
        <code style={{ fontFamily: "var(--font-mono)", color: "var(--accent)" }}>zyntry.runnerPollSeconds</code>,{" "}
        and <code style={{ fontFamily: "var(--font-mono)", color: "var(--accent)" }}>zyntry.runnerMaxFiles</code>.
      </Note>
    </PageShell>
  );
}