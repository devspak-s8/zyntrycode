import { Section, SectionHeading } from "./Section";
import { Badge } from "./Badge";

const stages = [
  {
    step: "01",
    title: "Task assessment",
    body: "Zyntry Code analyzes the incoming change request — complexity, risk surface, affected dependencies, and blast radius — to determine what kind of engineering work this is.",
    artifact: <AssessArtifact />,
  },
  {
    step: "02",
    title: "Dependency-aware planning",
    body: "The planner builds a task graph: which stages can run concurrently, which depend on prior output, and where verification gates must sit between them.",
    artifact: <PlanArtifact />,
  },
  {
    step: "03",
    title: "Per-stage model routing",
    body: "Each stage is routed to the model best suited for it — weighted by capability, risk, cost, and historical failure rates for that stage type.",
    artifact: <RouteArtifact />,
  },
  {
    step: "04",
    title: "Budgeted execution",
    body: "Stages execute concurrently where the graph allows, with per-attempt token and cost budgets enforced. Multi-provider fallback keeps execution resilient.",
    artifact: <ExecuteArtifact />,
  },
  {
    step: "05",
    title: "Verification & evidence",
    body: "Every attempt runs through verification — tests, type checks, security gates. Failures produce structured evidence: what failed, where, and why.",
    artifact: <VerifyArtifact />,
  },
  {
    step: "06",
    title: "Escalation & delivery",
    body: "Failed verifications drive retries or escalation to a stronger model. On full pass, changes are delivered as an approval-gated Git artifact — a tracked, reviewable PR.",
    artifact: <DeliverArtifact />,
  },
];

export function Walkthrough() {
  return (
    <Section id="walkthrough" style={{ paddingTop: "100px" }}>
      <SectionHeading
        eyebrow="How it works"
        title="From request to verified delivery"
        description="Every change follows a structured orchestration pipeline. No stage runs without a plan; no result ships without evidence."
        align="center"
      />

      <div style={{ display: "flex", flexDirection: "column", gap: "0" }}>
        {stages.map((stage, i) => (
          <div
            key={i}
            style={{
              display: "grid",
              gridTemplateColumns: "1fr 1fr",
              gap: "64px",
              alignItems: "center",
              paddingBottom: i < stages.length - 1 ? "80px" : 0,
              position: "relative",
            }}
            className="walkthrough-row"
          >
            <div
              style={{
                order: i % 2 === 0 ? 1 : 2,
              }}
              className="walkthrough-text"
            >
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "14px",
                  marginBottom: "20px",
                }}
              >
                <span
                  style={{
                    fontFamily: "var(--font-mono)",
                    fontSize: "14px",
                    fontWeight: 600,
                    color: "var(--accent)",
                    letterSpacing: "0.05em",
                  }}
                >
                  {stage.step}
                </span>
                <div
                  style={{
                    height: "1px",
                    width: "40px",
                    background: "var(--border-default)",
                  }}
                />
              </div>
              <h3
                style={{
                  fontSize: "26px",
                  fontWeight: 600,
                  letterSpacing: "-0.02em",
                  color: "var(--text-primary)",
                  marginBottom: "14px",
                }}
              >
                {stage.title}
              </h3>
              <p
                style={{
                  fontSize: "16px",
                  lineHeight: 1.65,
                  color: "var(--text-secondary)",
                  maxWidth: "440px",
                }}
              >
                {stage.body}
              </p>
            </div>
            <div
              style={{
                order: i % 2 === 0 ? 2 : 1,
              }}
              className="walkthrough-artifact"
            >
              {stage.artifact}
            </div>
          </div>
        ))}
      </div>
    </Section>
  );
}

function ArtifactFrame({ children }: { children: React.ReactNode }) {
  return (
    <div
      style={{
        padding: "24px",
        borderRadius: "var(--radius-lg)",
        background: "var(--bg-surface)",
        border: "1px solid var(--border-default)",
        boxShadow: "0 20px 40px -16px rgba(0,0,0,0.5)",
      }}
    >
      {children}
    </div>
  );
}

function AssessArtifact() {
  const rows = [
    { label: "Complexity", value: "Moderate", pct: 55, color: "var(--warning)" },
    { label: "Risk surface", value: "High", pct: 78, color: "var(--error)" },
    { label: "Dependencies", value: "4 modules", pct: 60, color: "var(--info)" },
    { label: "Blast radius", value: "Contained", pct: 35, color: "var(--success)" },
  ];
  return (
    <ArtifactFrame>
      <ArtifactLabel>Task assessment report</ArtifactLabel>
      {rows.map((r) => (
        <div key={r.label} style={{ marginBottom: "16px" }}>
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              fontSize: "13px",
              marginBottom: "6px",
            }}
          >
            <span style={{ color: "var(--text-secondary)" }}>{r.label}</span>
            <span style={{ color: "var(--text-primary)", fontFamily: "var(--font-mono)", fontSize: "12px" }}>
              {r.value}
            </span>
          </div>
          <div
            style={{
              height: "4px",
              background: "var(--bg-elevated-hover)",
              borderRadius: "2px",
              overflow: "hidden",
            }}
          >
            <div
              style={{
                width: `${r.pct}%`,
                height: "100%",
                background: r.color,
                borderRadius: "2px",
                opacity: 0.8,
              }}
            />
          </div>
        </div>
      ))}
      <div
        style={{
          marginTop: "20px",
          padding: "12px",
          borderRadius: "var(--radius-sm)",
          background: "var(--warning-dim)",
          fontSize: "12px",
          fontFamily: "var(--font-mono)",
          color: "var(--warning)",
          lineHeight: 1.5,
        }}
      >
        ⚠ Requires approval gate — risk surface exceeds threshold
      </div>
    </ArtifactFrame>
  );
}

function PlanArtifact() {
  return (
    <ArtifactFrame>
      <ArtifactLabel>Task dependency graph</ArtifactLabel>
      <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
        <GraphRow label="Assess" indent={0} concurrent={false} />
        <GraphRow label="Plan" indent={0} concurrent={false} />
        <div style={{ display: "flex", gap: "8px" }}>
          <GraphRow label="auth-module" indent={1} concurrent={true} />
          <GraphRow label="session-store" indent={1} concurrent={true} />
        </div>
        <GraphRow label="middleware" indent={1} concurrent={false} />
        <div style={{ display: "flex", gap: "8px" }}>
          <GraphRow label="test suite" indent={1} concurrent={true} />
          <GraphRow label="type check" indent={1} concurrent={true} />
        </div>
        <GraphRow label="Deliver PR" indent={0} concurrent={false} />
      </div>
      <div style={{ marginTop: "16px", display: "flex", gap: "8px", flexWrap: "wrap" }}>
        <Badge variant="success">2 concurrent pairs</Badge>
        <Badge variant="info">6 stages</Badge>
        <Badge variant="default">2 gates</Badge>
      </div>
    </ArtifactFrame>
  );
}

function GraphRow({
  label,
  indent,
  concurrent,
}: {
  label: string;
  indent: number;
  concurrent: boolean;
}) {
  return (
    <div
      style={{
        marginLeft: indent * 24,
        padding: "8px 14px",
        borderRadius: "var(--radius-sm)",
        background: concurrent ? "var(--accent-glow)" : "var(--bg-elevated)",
        border: `1px solid ${concurrent ? "rgba(103,232,249,0.2)" : "var(--border-subtle)"}`,
        fontSize: "12px",
        fontFamily: "var(--font-mono)",
        color: "var(--text-secondary)",
        display: "flex",
        alignItems: "center",
        gap: "8px",
        flex: concurrent ? 1 : "none",
      }}
    >
      <span
        style={{
          width: "5px",
          height: "5px",
          borderRadius: "50%",
          background: concurrent ? "var(--accent)" : "var(--text-muted)",
        }}
      />
      {label}
    </div>
  );
}

function RouteArtifact() {
  const routes = [
    { stage: "auth-module", model: "claude-sonnet", reason: "security-critical", cost: "$0.08" },
    { stage: "session-store", model: "gpt-4o", reason: "schema work", cost: "$0.12" },
    { stage: "middleware", model: "claude-haiku", reason: "low-risk boilerplate", cost: "$0.03" },
  ];
  return (
    <ArtifactFrame>
      <ArtifactLabel>Model routing decisions</ArtifactLabel>
      {routes.map((r) => (
        <div
          key={r.stage}
          style={{
            display: "grid",
            gridTemplateColumns: "1fr auto",
            padding: "14px 0",
            borderBottom: "1px solid var(--border-subtle)",
            gap: "12px",
            alignItems: "center",
          }}
        >
          <div>
            <div
              style={{
                fontSize: "13px",
                fontFamily: "var(--font-mono)",
                color: "var(--text-primary)",
                marginBottom: "4px",
              }}
            >
              {r.stage}
            </div>
            <div style={{ fontSize: "11px", color: "var(--text-muted)", fontFamily: "var(--font-mono)" }}>
              {r.reason}
            </div>
          </div>
          <div style={{ textAlign: "right" }}>
            <Badge variant="accent">{r.model}</Badge>
            <div
              style={{
                fontSize: "11px",
                color: "var(--text-muted)",
                fontFamily: "var(--font-mono)",
                marginTop: "6px",
              }}
            >
              {r.cost}
            </div>
          </div>
        </div>
      ))}
    </ArtifactFrame>
  );
}

function ExecuteArtifact() {
  return (
    <ArtifactFrame>
      <ArtifactLabel>Execution timeline</ArtifactLabel>
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          gap: "6px",
          fontFamily: "var(--font-mono)",
          fontSize: "12px",
        }}
      >
        {[
          { t: "0:00", event: "→ auth-module started (sonnet)", color: "var(--text-secondary)" },
          { t: "0:00", event: "→ session-store started (gpt-4o)", color: "var(--text-secondary)" },
          { t: "0:01", event: "✓ auth-module complete — 1.2s", color: "var(--success)" },
          { t: "0:02", event: "✓ session-store complete — 2.1s", color: "var(--success)" },
          { t: "0:02", event: "→ middleware started (haiku)", color: "var(--text-secondary)" },
          { t: "0:03", event: "✕ middleware failed verification", color: "var(--error)" },
          { t: "0:03", event: "↻ escalating to sonnet", color: "var(--warning)" },
          { t: "0:04", event: "→ middleware retry started (sonnet)", color: "var(--info)" },
        ].map((row, i) => (
          <div
            key={i}
            style={{
              display: "flex",
              gap: "14px",
              padding: "6px 10px",
              borderRadius: "var(--radius-sm)",
              background: i % 2 === 0 ? "var(--bg-elevated)" : "transparent",
            }}
          >
            <span style={{ color: "var(--text-muted)", flexShrink: 0 }}>{row.t}</span>
            <span style={{ color: row.color }}>{row.event}</span>
          </div>
        ))}
      </div>
    </ArtifactFrame>
  );
}

function VerifyArtifact() {
  return (
    <ArtifactFrame>
      <ArtifactLabel>Verification report</ArtifactLabel>
      <div
        style={{
          padding: "16px",
          borderRadius: "var(--radius-md)",
          background: "var(--bg-elevated)",
          border: "1px solid var(--border-subtle)",
          marginBottom: "12px",
        }}
      >
        <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "12px" }}>
          <span style={{ fontSize: "13px", color: "var(--text-primary)" }}>Unit tests</span>
          <span style={{ fontSize: "13px", color: "var(--success)", fontFamily: "var(--font-mono)" }}>24/24 ✓</span>
        </div>
        <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "12px" }}>
          <span style={{ fontSize: "13px", color: "var(--text-primary)" }}>Type check</span>
          <span style={{ fontSize: "13px", color: "var(--success)", fontFamily: "var(--font-mono)" }}>0 errors ✓</span>
        </div>
        <div style={{ display: "flex", justifyContent: "space-between" }}>
          <span style={{ fontSize: "13px", color: "var(--text-primary)" }}>CSRF check</span>
          <span style={{ fontSize: "13px", color: "var(--error)", fontFamily: "var(--font-mono)" }}>1 failed ✕</span>
        </div>
      </div>
      <div
        style={{
          padding: "14px",
          borderRadius: "var(--radius-sm)",
          background: "var(--error-dim)",
          fontSize: "12px",
          fontFamily: "var(--font-mono)",
          color: "var(--error)",
          lineHeight: 1.6,
        }}
      >
        FAILURE: middleware/csrf.ts:42 — Missing CSRF token validation on POST /api/auth/session.
        Expected: csrfVerify(req) before session.create(). Got: no call.
      </div>
    </ArtifactFrame>
  );
}

function DeliverArtifact() {
  return (
    <ArtifactFrame>
      <ArtifactLabel>Delivery — approval-gated PR</ArtifactLabel>
      <div
        style={{
          padding: "16px",
          borderRadius: "var(--radius-md)",
          background: "var(--bg-elevated)",
          border: "1px solid var(--border-subtle)",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "14px" }}>
          <span
            style={{
              padding: "3px 8px",
              borderRadius: "var(--radius-sm)",
              background: "var(--success-dim)",
              color: "var(--success)",
              fontSize: "11px",
              fontFamily: "var(--font-mono)",
              fontWeight: 600,
            }}
          >
            +142
          </span>
          <span
            style={{
              padding: "3px 8px",
              borderRadius: "var(--radius-sm)",
              background: "var(--error-dim)",
              color: "var(--error)",
              fontSize: "11px",
              fontFamily: "var(--font-mono)",
              fontWeight: 600,
            }}
          >
            −28
          </span>
          <span style={{ fontSize: "13px", color: "var(--text-secondary)", fontFamily: "var(--font-mono)" }}>
            refactor-auth-session
          </span>
        </div>
        <div style={{ fontFamily: "var(--font-mono)", fontSize: "12px", lineHeight: 1.8 }}>
          <div style={{ color: "var(--text-muted)" }}>diff --git a/src/auth/middleware.ts</div>
          <div style={{ color: "var(--error)" }}>-  if (req.method === "POST") {"{"}</div>
          <div style={{ color: "var(--error)", paddingLeft: "16px" }}>    return handleSession(req);</div>
          <div style={{ color: "var(--error)" }}>-  {"}"}</div>
          <div style={{ color: "var(--success)" }}>+  if (req.method === "POST") {"{"}</div>
          <div style={{ color: "var(--success)", paddingLeft: "16px" }}>+   const token = csrfVerify(req);</div>
          <div style={{ color: "var(--success)", paddingLeft: "16px" }}>+   if (!token) return res.status(403).end();</div>
          <div style={{ color: "var(--success)", paddingLeft: "16px" }}>+   return handleSession(req);</div>
          <div style={{ color: "var(--success)" }}>+  {"}"}</div>
        </div>
        <div
          style={{
            marginTop: "16px",
            display: "flex",
            gap: "8px",
            flexWrap: "wrap",
          }}
        >
          <Badge variant="success" dot>All verifications passed</Badge>
          <Badge variant="default">Awaiting approval</Badge>
        </div>
      </div>
    </ArtifactFrame>
  );
}

function ArtifactLabel({ children }: { children: React.ReactNode }) {
  return (
    <div
      style={{
        fontSize: "11px",
        fontFamily: "var(--font-mono)",
        fontWeight: 600,
        color: "var(--text-muted)",
        textTransform: "uppercase",
        letterSpacing: "0.1em",
        marginBottom: "20px",
      }}
    >
      {children}
    </div>
  );
}
