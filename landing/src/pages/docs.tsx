import { PageShell, PageSection, Note } from "../router";

export function Docs() {
  return (
    <PageShell kicker="Resources" title="Documentation">
      <PageSection heading="Quickstart (VS Code)">
        <ol style={{ margin: 0, paddingLeft: 20, display: "flex", flexDirection: "column", gap: 10 }}>
          <li>Install the extension: open <code style={{ fontFamily: "var(--font-mono)", color: "var(--accent)" }}>zyntry-code-0.2.0.vsix</code> in VS Code (Extensions → … → Install from VSIX).</li>
          <li>Run <strong style={{ color: "var(--text-primary)" }}>Zyntry: Set API Token</strong> and paste your token. It is stored in VS Code SecretStorage, never in settings or source.</li>
          <li>Open your project folder and run <strong style={{ color: "var(--text-primary)" }}>Zyntry: Ingest Repo Snapshot</strong> (attach it to your last task or create the task first).</li>
          <li>Run <strong style={{ color: "var(--text-primary)" }}>Zyntry: Create Task</strong>, describe the work, and choose Run now or Stream.</li>
        </ol>
      </PageSection>

      <PageSection heading="Extension commands">
        <ul style={{ margin: 0, paddingLeft: 20, display: "flex", flexDirection: "column", gap: 6 }}>
          <li><strong style={{ color: "var(--text-primary)" }}>Create Task</strong> — plan a task; high-risk tasks ask for approval first.</li>
          <li><strong style={{ color: "var(--text-primary)" }}>Approve / Reject Task</strong> — decide on a high-risk plan.</li>
          <li><strong style={{ color: "var(--text-primary)" }}>Run Task (sync)</strong> — execute and print the summary.</li>
          <li><strong style={{ color: "var(--text-primary)" }}>Run Task (stream)</strong> — execute with live SSE events in the output channel.</li>
          <li><strong style={{ color: "var(--text-primary)" }}>Ingest Repo Snapshot</strong> — snapshot the open folder for planning.</li>
          <li><strong style={{ color: "var(--text-primary)" }}>Create Workspace (local runner)</strong> — make this VS Code instance the execution runner.</li>
          <li><strong style={{ color: "var(--text-primary)" }}>Attach Workspace to Task</strong> — wire an existing workspace to a task.</li>
          <li><strong style={{ color: "var(--text-primary)" }}>Start / Stop Local Runner</strong> — poll and execute queued tool requests.</li>
          <li><strong style={{ color: "var(--text-primary)" }}>Set API Token</strong> — store the bearer token in SecretStorage.</li>
        </ul>
      </PageSection>

      <PageSection heading="Backend API basics">
        <p>
          The API is a FastAPI app served by the Cloudflare Worker. Create a task with{" "}
          <code style={{ fontFamily: "var(--font-mono)", color: "var(--accent)" }}>POST /tasks</code>,
          ingest with <code style={{ fontFamily: "var(--font-mono)", color: "var(--accent)" }}>POST /tasks/:id/repo</code>,
          execute with <code style={{ fontFamily: "var(--font-mono)", color: "var(--accent)" }}>POST /tasks/:id/execute</code>{" "}
          (or the streaming variant), and inspect{" "}
          <code style={{ fontFamily: "var(--font-mono)", color: "var(--accent)" }}>GET /tasks/:id</code>. All routes
          except <code style={{ fontFamily: "var(--font-mono)", color: "var(--accent)" }}>/health</code> require{" "}
          <code style={{ fontFamily: "var(--font-mono)", color: "var(--accent)" }}>Authorization: Bearer &lt;token&gt;</code>.
        </p>
      </PageSection>

      <PageSection heading="Workspaces, runners, and verification">
        <p>
          Create a workspace (<code style={{ fontFamily: "var(--font-mono)", color: "var(--accent)" }}>POST /workspaces</code>)
          and attach it to a task. The runner polls{" "}
          <code style={{ fontFamily: "var(--font-mono)", color: "var(--accent)" }}>/workspaces/:id/tool-requests/next</code>,
          executes the operation, and posts results back — those results become
          verification reports. Workspace-scoped secrets, MCP servers, and repo rule
          packs (regex, command, constitution) configure what verification means for
          your project.
        </p>
      </PageSection>

      <PageSection heading="Delivery and CI">
        <p>
          <code style={{ fontFamily: "var(--font-mono)", color: "var(--accent)" }}>POST /workspaces/:id/deliver</code>{" "}
          queues commit (immediate) and push + pull request (approval-gated). After push,
          CI posts <code style={{ fontFamily: "var(--font-mono)", color: "var(--accent)" }}>POST /webhooks/ci</code>{" "}
          with an HMAC signature over the body; the status lands on the task and appears
          in the UI.
        </p>
      </PageSection>

      <Note label="Troubleshooting:">
        "auth_not_configured" means the backend has no API_TOKEN — check the deployment
        secrets. "Backend unreachable" means the URL or network is wrong; the badge in
        the web app shows live status.
      </Note>
    </PageShell>
  );
}