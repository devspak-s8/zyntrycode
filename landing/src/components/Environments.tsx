import { Section, SectionHeading } from "./Section";
import { Badge } from "./Badge";

export function Environments() {
  return (
    <Section id="environments" style={{ paddingTop: "100px" }}>
      <SectionHeading
        eyebrow="Execution environments"
        title="Run locally or remotely — same orchestration, same evidence"
        description="Zyntry Code runs wherever your code lives. Use the VS Code extension for local development, or dispatch to a container worker for remote execution in your CI pipeline."
        align="center"
      />

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "1fr 1fr",
          gap: "20px",
        }}
        className="env-grid"
      >
        {/* Local */}
        <div
          style={{
            padding: "32px 28px",
            borderRadius: "var(--radius-lg)",
            background: "var(--bg-surface)",
            border: "1px solid var(--border-default)",
          }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "12px",
              marginBottom: "20px",
            }}
          >
            <div
              style={{
                width: "40px",
                height: "40px",
                borderRadius: "var(--radius-md)",
                background: "var(--bg-elevated)",
                border: "1px solid var(--border-subtle)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                color: "var(--accent)",
              }}
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                <rect x="3" y="3" width="18" height="18" rx="2" />
                <path d="M3 9 L21 9" />
                <path d="M9 21 L9 9" />
              </svg>
            </div>
            <div>
              <h3 style={{ fontSize: "17px", fontWeight: 600, color: "var(--text-primary)" }}>
                Local execution
              </h3>
              <div style={{ fontSize: "13px", color: "var(--text-muted)", fontFamily: "var(--font-mono)" }}>
                VS Code extension
              </div>
            </div>
            <Badge variant="accent" >
              available
            </Badge>
          </div>
          <p style={{ fontSize: "14px", lineHeight: 1.6, color: "var(--text-secondary)", marginBottom: "20px" }}>
            Run orchestration directly in your editor. The extension integrates task assessment,
            routing, execution, and verification into your local development cycle — no external
            services required.
          </p>
          <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
            {[
              "Trigger orchestration from the command palette",
              "View execution traces in the sidebar panel",
              "Approval gates surface as inline notifications",
              "Changes apply to your working tree for review",
            ].map((point) => (
              <div
                key={point}
                style={{
                  display: "flex",
                  gap: "10px",
                  fontSize: "13px",
                  color: "var(--text-secondary)",
                  fontFamily: "var(--font-mono)",
                }}
              >
                <span style={{ color: "var(--accent)" }}>→</span>
                {point}
              </div>
            ))}
          </div>
        </div>

        {/* Remote */}
        <div
          style={{
            padding: "32px 28px",
            borderRadius: "var(--radius-lg)",
            background: "var(--bg-surface)",
            border: "1px solid var(--border-default)",
          }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "12px",
              marginBottom: "20px",
            }}
          >
            <div
              style={{
                width: "40px",
                height: "40px",
                borderRadius: "var(--radius-md)",
                background: "var(--bg-elevated)",
                border: "1px solid var(--border-subtle)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                color: "var(--accent)",
              }}
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 2 L12 6" />
                <rect x="4" y="6" width="16" height="14" rx="2" />
                <path d="M8 10 L8 10" />
                <path d="M12 10 L12 10" />
                <path d="M16 10 L16 10" />
              </svg>
            </div>
            <div>
              <h3 style={{ fontSize: "17px", fontWeight: 600, color: "var(--text-primary)" }}>
                Remote execution
              </h3>
              <div style={{ fontSize: "13px", color: "var(--text-muted)", fontFamily: "var(--font-mono)" }}>
                Container worker
              </div>
            </div>
            <Badge variant="accent">
              available
            </Badge>
          </div>
          <p style={{ fontSize: "14px", lineHeight: 1.6, color: "var(--text-secondary)", marginBottom: "20px" }}>
            Dispatch orchestration to an isolated container worker. Ideal for CI pipelines and
            long-running tasks — the worker executes the full pipeline and returns the verified
            artifact and execution trace.
          </p>
          <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
            {[
              "Isolated container per run — no host contamination",
              "Integrates with existing CI/CD pipelines",
              "Returns verified Git artifact + full trace",
              "Scales horizontally for concurrent task dispatch",
            ].map((point) => (
              <div
                key={point}
                style={{
                  display: "flex",
                  gap: "10px",
                  fontSize: "13px",
                  color: "var(--text-secondary)",
                  fontFamily: "var(--font-mono)",
                }}
              >
                <span style={{ color: "var(--accent)" }}>→</span>
                {point}
              </div>
            ))}
          </div>
        </div>
      </div>
    </Section>
  );
}
