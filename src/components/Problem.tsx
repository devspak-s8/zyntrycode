import { Section, SectionHeading } from "./Section";

const problems = [
  {
    title: "Generation is not execution",
    body: "Code-generating chat interfaces produce text. They don't assess risk, build dependency-aware plans, route stages to the right model, or verify that the output actually works.",
  },
  {
    title: "No verification, no trust",
    body: "Without structured verification — tests, type checks, security gates — AI-generated changes are unreviewable at scale. You're left manually validating every suggestion.",
  },
  {
    title: "Costs spiral without budgets",
    body: "Powerful models are expensive. Without per-stage routing and enforced budgets, a single complex task can burn through tokens with no evidence the result is correct.",
  },
  {
    title: "Single-model fragility",
    body: "When one provider rate-limits or goes down, your workflow stops. Production engineering needs fallback, retry, and escalation built into the execution layer.",
  },
];

export function Problem() {
  return (
    <Section id="problem" style={{ paddingTop: "100px", paddingBottom: "100px" }}>
      <SectionHeading
        eyebrow="The gap"
        title="Code generation alone is not engineering"
        description="Most AI coding tools stop at producing code. Engineering requires planning, execution, verification, and delivery — with evidence at every step."
      />

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))",
          gap: "20px",
        }}
      >
        {problems.map((p, i) => (
          <div
            key={i}
            style={{
              padding: "28px",
              borderRadius: "var(--radius-lg)",
              background: "var(--bg-surface)",
              border: "1px solid var(--border-subtle)",
              transition: "border-color var(--transition)",
            }}
            onMouseEnter={(e) => (e.currentTarget.style.borderColor = "var(--border-default)")}
            onMouseLeave={(e) => (e.currentTarget.style.borderColor = "var(--border-subtle)")}
          >
            <div
              style={{
                width: "32px",
                height: "32px",
                borderRadius: "var(--radius-sm)",
                background: "var(--error-dim)",
                color: "var(--error)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontFamily: "var(--font-mono)",
                fontSize: "14px",
                fontWeight: 700,
                marginBottom: "20px",
              }}
            >
              {String(i + 1).padStart(2, "0")}
            </div>
            <h3
              style={{
                fontSize: "17px",
                fontWeight: 600,
                color: "var(--text-primary)",
                marginBottom: "10px",
                letterSpacing: "-0.01em",
              }}
            >
              {p.title}
            </h3>
            <p
              style={{
                fontSize: "15px",
                lineHeight: 1.6,
                color: "var(--text-secondary)",
              }}
            >
              {p.body}
            </p>
          </div>
        ))}
      </div>
    </Section>
  );
}
