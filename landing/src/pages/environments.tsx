import { PageShell, PageSection, Note } from "../router";

export function EnvironmentsPage() {
  return (
    <PageShell kicker="Platform" title="Environments">
      <p>
        Zyntry Code runs in three places, and you choose where your tasks execute. The
        same engine and the same evidence model run everywhere; only where the compute
        happens changes.
      </p>

      <PageSection heading="Local backend (development)">
        <p>
          A plain FastAPI server (uvicorn) backed by in-memory SQLite. It is the fastest
          way to develop against the API: no Cloudflare account needed, everything resets
          on restart. Execution runs synchronously in the request and streams events
          live to the UI. Verification commands run in your attached runner only; the
          local backend never pretends a repo check passed.
        </p>
      </PageSection>

      <PageSection heading="Cloud backend (production)">
        <p>
          The production backend is a Cloudflare Worker with three bindings:
        </p>
        <ul style={{ margin: 0, paddingLeft: 20, display: "flex", flexDirection: "column", gap: 8 }}>
          <li><strong style={{ color: "var(--text-primary)" }}>D1 (SQLite):</strong> tasks, plans, stages, events, workspaces, and routing statistics persist durably.</li>
          <li><strong style={{ color: "var(--text-primary)" }}>Workflows:</strong> long-running executions run as durable workflows and survive tab closes and laptop sleep.</li>
          <li><strong style={{ color: "var(--text-primary)" }}>Workers AI:</strong> edge inference as an additional provider, alongside OpenAI and Anthropic keys stored as Cloudflare secrets.</li>
        </ul>
        <p>
          The service ships open and unauthenticated; self-hosters can set an API token
          to require bearer auth on every endpoint except the health check.
        </p>
      </PageSection>

      <PageSection heading="Execution runner (your repository)">
        <p>
          Verification that needs your real code runs in a runner attached to a workspace:
        </p>
        <ul style={{ margin: 0, paddingLeft: 20, display: "flex", flexDirection: "column", gap: 8 }}>
          <li><strong style={{ color: "var(--text-primary)" }}>VS Code extension (local):</strong> files stay inside your workspace folder; commands are parsed without a shell; dangerous or unknown commands wait for your approval.</li>
          <li><strong style={{ color: "var(--text-primary)" }}>Remote worker (cloud):</strong> for sandboxed execution on cloud infrastructure when you do not want the runner on your machine.</li>
        </ul>
        <p>
          The runner long-polls for tool requests and posts real results back; those
          results become the verification reports that close the loop.
        </p>
      </PageSection>

      <PageSection heading="Web app vs. VS Code extension">
        <p>
          The web app is the local companion surface: plan review, evidence, transcripts,
          and cloud workflow results. The VS Code extension is the product client: it
          also serves as the local runner and keeps its workspace credentials inside the
          extension process.
          The public web deployment is the landing page only.
        </p>
      </PageSection>

      <Note label="Choosing:">
        use local for development, cloud for anything long-running or shared, and the
        runner for real verification in your repository.
      </Note>
    </PageShell>
  );
}