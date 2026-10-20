import { Section, SectionHeading } from "./Section";

const features = [
  {
    icon: RouteIcon,
    title: "Per-stage model routing",
    body: "Each task stage is routed to the model best matched by capability, risk, cost, and historical failure rate — not just the most powerful model for everything.",
  },
  {
    icon: GraphIcon,
    title: "Dependency-aware task graphs",
    body: "The planner builds a directed graph of stages. Independent stages execute concurrently; dependent stages wait. No wasted sequential time.",
  },
  {
    icon: RetryIcon,
    title: "Verification-driven retries",
    body: "When verification fails, the system retries — escalating to a stronger model when needed, with structured evidence of what went wrong.",
  },
  {
    icon: BudgetIcon,
    title: "Enforced execution budgets",
    body: "Per-attempt token and cost limits prevent runaway spending. You set the ceiling; Zyntry Code stays within it or asks before exceeding.",
  },
  {
    icon: ShieldIcon,
    title: "Multi-provider fallback",
    body: "If a model provider rate-limits or fails, execution falls back to an alternative. Your workflow doesn't stop because one API did.",
  },
  {
    icon: TraceIcon,
    title: "Full execution traces",
    body: "Every run produces a trace: model selection, attempts, latency, cost, verification results, and limitations — auditable end to end.",
  },
  {
    icon: GateIcon,
    title: "Risk-based approval gates",
    body: "Changes above a risk threshold pause for human approval before execution. Low-risk changes flow through automatically.",
  },
  {
    icon: CodeIcon,
    title: "Approval-gated Git delivery",
    body: "Verified changes are delivered as tracked, reviewable pull requests. Nothing reaches your main branch without an explicit approval.",
  },
];

export function Features() {
  return (
    <Section id="features" style={{ paddingTop: "100px" }}>
      <SectionHeading
        eyebrow="Capabilities"
        title="Built for serious engineering workflows"
        description="Zyntry Code is not a chat interface that writes code. It's an orchestration layer that brings structure, control, and evidence to AI-assisted engineering."
        align="center"
      />

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))",
          gap: "16px",
        }}
      >
        {features.map((f, i) => {
          const Icon = f.icon;
          return (
            <div key={i} className="ws-card" style={{ padding: "30px 28px" }}>
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
                  marginBottom: "20px",
                  color: "var(--accent)",
                }}
              >
                <Icon />
              </div>
              <h3
                style={{
                  fontSize: "16px",
                  fontWeight: 600,
                  color: "var(--text-primary)",
                  marginBottom: "10px",
                  letterSpacing: "-0.01em",
                }}
              >
                {f.title}
              </h3>
              <p
                style={{
                  fontSize: "14px",
                  lineHeight: 1.6,
                  color: "var(--text-secondary)",
                }}
              >
                {f.body}
              </p>
            </div>
          );
        })}
      </div>
    </Section>
  );
}

function iconProps() {
  return { width: 20, height: 20, fill: "none", stroke: "currentColor", strokeWidth: 1.5, strokeLinecap: "round" as const, strokeLinejoin: "round" as const };
}

function RouteIcon() {
  return (
    <svg viewBox="0 0 24 24" {...iconProps()}>
      <circle cx="6" cy="6" r="2" />
      <circle cx="18" cy="6" r="2" />
      <circle cx="12" cy="18" r="2" />
      <path d="M6 8 L6 12 Q6 14 8 14 L10 14 Q12 14 12 16 L12 16" />
      <path d="M18 8 L18 12 Q18 14 16 14 L14 14 Q12 14 12 16" />
    </svg>
  );
}

function GraphIcon() {
  return (
    <svg viewBox="0 0 24 24" {...iconProps()}>
      <rect x="3" y="3" width="6" height="5" rx="1" />
      <rect x="15" y="3" width="6" height="5" rx="1" />
      <rect x="9" y="16" width="6" height="5" rx="1" />
      <path d="M6 8 L12 16" />
      <path d="M18 8 L12 16" />
    </svg>
  );
}

function RetryIcon() {
  return (
    <svg viewBox="0 0 24 24" {...iconProps()}>
      <path d="M21 12 a9 9 0 1 1 -3 -6.7" />
      <path d="M21 4 L21 8 L17 8" />
    </svg>
  );
}

function BudgetIcon() {
  return (
    <svg viewBox="0 0 24 24" {...iconProps()}>
      <circle cx="12" cy="12" r="9" />
      <path d="M12 7 L12 17" />
      <path d="M15 9.5 Q15 8 12 8 Q9 8 9 10 Q9 12 12 12 Q15 12 15 14 Q15 16 12 16 Q9 16 9 14.5" />
    </svg>
  );
}

function ShieldIcon() {
  return (
    <svg viewBox="0 0 24 24" {...iconProps()}>
      <path d="M12 3 L20 6 L20 12 Q20 17 12 21 Q4 17 4 12 L4 6 Z" />
      <path d="M9 12 L11 14 L15 10" />
    </svg>
  );
}

function TraceIcon() {
  return (
    <svg viewBox="0 0 24 24" {...iconProps()}>
      <path d="M4 6 L20 6" />
      <path d="M4 12 L14 12" />
      <path d="M4 18 L10 18" />
      <circle cx="18" cy="12" r="1.5" />
      <circle cx="14" cy="18" r="1.5" />
    </svg>
  );
}

function GateIcon() {
  return (
    <svg viewBox="0 0 24 24" {...iconProps()}>
      <path d="M5 3 L5 21" />
      <path d="M19 3 L19 21" />
      <path d="M5 8 L19 8" />
      <path d="M5 16 L19 16" />
      <circle cx="12" cy="12" r="2" />
    </svg>
  );
}

function CodeIcon() {
  return (
    <svg viewBox="0 0 24 24" {...iconProps()}>
      <path d="M8 8 L4 12 L8 16" />
      <path d="M16 8 L20 12 L16 16" />
      <path d="M14 6 L10 18" />
    </svg>
  );
}
