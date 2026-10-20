import { PageShell, PageSection, Note } from "../router";

export function SignIn() {
  return (
    <PageShell kicker="Company" title="Sign in">
      <PageSection heading="How access works today">
        <p>
          Zyntry Code is in closed beta and does not yet have per-user accounts. Access
          is granted with a single <strong style={{ color: "var(--text-primary)" }}>API token</strong> issued to
          you by the team. The backend authenticates every request with a bearer token;
          anything without one is rejected on every endpoint except the health check.
        </p>
      </PageSection>

      <PageSection heading="Where the token goes">
        <ul style={{ margin: 0, paddingLeft: 20, display: "flex", flexDirection: "column", gap: 8 }}>
          <li>
            <strong style={{ color: "var(--text-primary)" }}>VS Code extension:</strong> run{" "}
            <strong style={{ color: "var(--text-primary)" }}>Zyntry: Set API Token</strong> — stored in SecretStorage,
            never in settings or source.
          </li>
          <li>
            <strong style={{ color: "var(--text-primary)" }}>Web app (local companion):</strong> the connection
            badge stores the URL locally and the token in session storage only.
          </li>
        </ul>
      </PageSection>

      <PageSection heading="Request access">
        <p>
          To request a token, reach out through the{" "}
          <a href="#/contact" style={{ color: "var(--accent)" }}>Contact</a> page. When accounts arrive,
          this page will become the real sign-in — for now, your token is your identity.
        </p>
      </PageSection>

      <Note label="Security:">
        tokens are compared in constant time, secrets at rest are encrypted with a
        key that lives only in Cloudflare secrets, and tokens are never packaged in
        the extension.
      </Note>
    </PageShell>
  );
}