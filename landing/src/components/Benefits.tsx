import { Section, SectionHeading } from "./Section";

const audiences = [
  {
    label: "Individual developers",
    title: "Ship complex changes with confidence",
    points: [
      "Stop manually validating every AI suggestion — verification is built in",
      "Get structured execution traces for every change, not just code output",
      "Stay within token budgets with per-attempt cost controls",
      "Run locally through the VS Code extension — no infra to manage",
    ],
  },
  {
    label: "Startups",
    title: "Engineering leverage without the headcount",
    points: [
      "Route expensive tasks to cheaper models when risk is low",
      "Enforce approval gates so nothing risky ships unchecked",
      "Track every change as a reviewable Git artifact",
      "Multi-provider fallback means your workflow survives outages",
    ],
  },
  {
    label: "Engineering teams",
    title: "Structured, auditable AI-assisted delivery",
    points: [
      "Full execution traces: model selection, attempts, cost, verification",
      "Risk-based gates keep high-blast-radius changes under human review",
      "Concurrent stage execution reduces wall-clock time on complex tasks",
      "Remote container workers integrate with your existing CI pipelines",
    ],
  },
];

export function Benefits() {
  return (
    <Section id="benefits" style={{ paddingTop: "100px" }}>
      <SectionHeading
        eyebrow="Who it's for"
        title="Orchestration that scales with you"
        description="Whether you're an individual developer, a startup team, or a larger engineering org, Zyntry Code brings structure and evidence to AI-assisted engineering."
        align="center"
      />

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))",
          gap: "20px",
        }}
      >
        {audiences.map((aud, i) => (
          <div
            key={i}
            style={{
              padding: "32px 28px",
              borderRadius: "var(--radius-lg)",
              background: "var(--bg-surface)",
              border: "1px solid var(--border-subtle)",
              transition: "border-color var(--transition)",
              display: "flex",
              flexDirection: "column",
            }}
            onMouseEnter={(e) => (e.currentTarget.style.borderColor = "var(--border-default)")}
            onMouseLeave={(e) => (e.currentTarget.style.borderColor = "var(--border-subtle)")}
          >
            <div
              style={{
                fontSize: "12px",
                fontFamily: "var(--font-mono)",
                fontWeight: 600,
                color: "var(--accent)",
                letterSpacing: "0.08em",
                textTransform: "uppercase",
                marginBottom: "16px",
              }}
            >
              {aud.label}
            </div>
            <h3
              style={{
                fontSize: "20px",
                fontWeight: 600,
                color: "var(--text-primary)",
                marginBottom: "24px",
                letterSpacing: "-0.01em",
                lineHeight: 1.3,
              }}
            >
              {aud.title}
            </h3>
            <ul style={{ listStyle: "none", padding: 0, margin: 0, display: "flex", flexDirection: "column", gap: "14px" }}>
              {aud.points.map((point, j) => (
                <li
                  key={j}
                  style={{
                    display: "flex",
                    gap: "12px",
                    fontSize: "14px",
                    lineHeight: 1.55,
                    color: "var(--text-secondary)",
                  }}
                >
                  <span
                    style={{
                      color: "var(--accent)",
                      flexShrink: 0,
                      marginTop: "1px",
                      fontSize: "14px",
                      fontFamily: "var(--font-mono)",
                    }}
                  >
                    →
                  </span>
                  {point}
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
    </Section>
  );
}
