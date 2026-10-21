import { PageShell, PageSection, Note } from "../router";

export function SecurityPage() {
  return (
    <PageShell kicker="Company" title="Security">
      <p>
        Zyntry Code treats your repository and credentials as the most sensitive assets
        in the system. The design rules below are enforced in code, not just documented.
      </p>

      <PageSection heading="Authentication and access">
        <p>
          Every endpoint except the health check requires a bearer token; comparisons use
          constant-time HMAC so timing cannot leak the secret. Runner-owned workspaces
          additionally require a per-workspace runner token, and CI webhooks must sign
          their payloads with an HMAC over the raw body within a five-minute window.
        </p>
      </PageSection>

      <PageSection heading="Secrets at rest">
        <p>
          Workspace secrets (push tokens, API keys) are encrypted before they touch the
          database with a Fernet key that lives only in Cloudflare secrets, never in the
          repository, the extension, or logs. Legacy plaintext values are rejected, not
          read. The extension packages no provider keys and no encryption keys.
        </p>
      </PageSection>

      <PageSection heading="Your repository stays yours">
        <ul style={{ margin: 0, paddingLeft: 20, display: "flex", flexDirection: "column", gap: 8 }}>
          <li>Snapshots exclude sensitive paths (.env, .ssh, .aws, .gnupg, credentials, keys, certs) in both the extension and the web app.</li>
          <li>The local runner confines every file operation to the open workspace (realpath-verified) and refuses sensitive paths.</li>
          <li>Commands are parsed without a shell; unknown or dangerous commands require your approval.</li>
          <li>Command output is redacted against workspace secret values before it is stored or shown.</li>
        </ul>
      </PageSection>

      <PageSection heading="Honest verification">
        <p>
          A check that could not run is reported as a limitation, never claimed as
          passed. Budget limits are enforced before attempts start, and raw errors shown
          in the UI are sanitized (tokens, URLs, emails, IPs, and paths are redacted).
        </p>
      </PageSection>

      <PageSection heading="Rate limiting">
        <p>
          Mutating requests are rate-limited per client. The production deployment keeps
          rate limits, token requirements, and encryption secrets configured as
          Cloudflare secrets rather than code.
        </p>
      </PageSection>

      <Note label="Reporting:">
        if you find a vulnerability, report it through the repository issues without
        including live tokens, keys, or customer data, we treat security reports with
        priority.
      </Note>
    </PageShell>
  );
}