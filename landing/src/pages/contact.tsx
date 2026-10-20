import { PageShell, PageSection, Note } from "../router";

export function Contact() {
  return (
    <PageShell kicker="Company" title="Contact">
      <PageSection heading="Get in touch">
        <ul style={{ margin: 0, paddingLeft: 20, display: "flex", flexDirection: "column", gap: 10 }}>
          <li>
            <strong style={{ color: "var(--text-primary)" }}>Repository:</strong>{" "}
            <a href="https://github.com/devspak-s8/zyntrycode" target="_blank" rel="noreferrer noopener" style={{ color: "var(--accent)" }}>
              github.com/devspak-s8/zyntrycode
            </a>
          </li>
          <li>
            <strong style={{ color: "var(--text-primary)" }}>Issues / bugs / feature requests:</strong>{" "}
            open an issue in the repository above.
          </li>
          <li>
            <strong style={{ color: "var(--text-primary)" }}>Access requests:</strong>{" "}
            mention the beta access request in the issue tracker, or use the{" "}
            <a href="#/sign-in" style={{ color: "var(--accent)" }}>Sign in</a> page for how access works.
          </li>
          <li>
            <strong style={{ color: "var(--text-primary)" }}>Security reports:</strong>{" "}
            see the <a href="#/security" style={{ color: "var(--accent)" }}>Security</a> page — report responsibly and
            do not include live tokens or keys.
          </li>
        </ul>
      </PageSection>

      <PageSection heading="Response times">
        <p>
          This is an early-stage product. Expect replies within a few working days for
          issues, faster for security reports. Pull requests with tests are very welcome.
        </p>
      </PageSection>

      <Note label="Please include:">
        your platform and VS Code version, the extension version, and a redacted copy of
        the output-channel log when reporting a bug.
      </Note>
    </PageShell>
  );
}