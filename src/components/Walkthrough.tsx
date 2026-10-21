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

/* ---------- shared artifact chrome ---------- */

function iconProps() {
  return {
    width: 14,
    height: 14,
    fill: "none",
    stroke: "currentColor",
    strokeWidth: 1.8,
    strokeLinecap: "round" as const,
    strokeLinejoin: "round" as const,
  };
}

function GaugeIcon() {
  return (
    <svg viewBox="0 0 24 24" {...iconProps()}>
      <path d="M4 14 a8 8 0 1 1 16 0" />
      <path d="M12 14 L16 9" />
      <circle cx="12" cy="14" r="1.4" />
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

function RouteIcon() {
  return (
    <svg viewBox="0 0 24 24" {...iconProps()}>
      <circle cx="6" cy="6" r="2" />
      <circle cx="18" cy="6" r="2" />
      <circle cx="12" cy="18" r="2" />
      <path d="M6 8 L6 12 Q6 14 8 14 L10 14 Q12 14 12 16" />
      <path d="M18 8 L18 12 Q18 14 16 14 L14 14 Q12 14 12 16" />
    </svg>
  );
}

function BoltIcon() {
  return (
    <svg viewBox="0 0 24 24" {...iconProps()}>
      <path d="M13 3 L5 13 L11 13 L10 21 L19 10 L12.5 10 Z" />
    </svg>
  );
}

function ShieldCheckIcon() {
  return (
    <svg viewBox="0 0 24 24" {...iconProps()}>
      <path d="M12 3 L20 6 L20 12 Q20 17 12 21 Q4 17 4 12 L4 6 Z" />
      <path d="M9 12 L11 14 L15 10" />
    </svg>
  );
}

function GitPullIcon() {
  return (
    <svg viewBox="0 0 24 24" {...iconProps()}>
      <circle cx="6" cy="6" r="2.2" />
      <circle cx="6" cy="18" r="2.2" />
      <circle cx="18" cy="18" r="2.2" />
      <path d="M6 8.2 L6 15.8" />
      <path d="M18 15.8 L18 12 Q18 9 15 9 L12 9" />
      <path d="M14 7 L12 9 L14 11" />
    </svg>
  );
}

function ArtifactFrame({
  icon,
  label,
  status,
  children,
}: {
  icon: React.ReactNode;
  label: string;
  status?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <div className="ws-card" style={{ overflow: "hidden" }}>
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: "10px",
          padding: "12px 16px",
          borderBottom: "1px solid rgba(255,255,255,0.06)",
          background: "var(--bg-elevated)",
        }}
      >
        <div
          style={{
            width: "26px",
            height: "26px",
            borderRadius: "var(--radius-sm)",
            background: "var(--accent-glow)",
            border: "1px solid rgba(147,197,253,0.25)",
            color: "var(--accent)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            flexShrink: 0,
          }}
        >
          {icon}
        </div>
        <div
          style={{
            fontSize: "11px",
            fontFamily: "var(--font-mono)",
            fontWeight: 600,
            color: "var(--text-muted)",
            textTransform: "uppercase",
            letterSpacing: "0.1em",
          }}
        >
          {label}
        </div>
        {status && <div style={{ marginLeft: "auto" }}>{status}</div>}
      </div>
      <div style={{ padding: "18px 16px" }}>{children}</div>
    </div>
  );
}

/* ---------- 01 · assessment ---------- */

function AssessArtifact() {
  const rows = [
    { label: "Complexity", value: "Moderate", pct: 55, color: "var(--warning)" },
    { label: "Risk surface", value: "High", pct: 78, color: "var(--error)" },
    { label: "Dependencies", value: "4 modules", pct: 60, color: "var(--info)" },
    { label: "Blast radius", value: "Contained", pct: 35, color: "var(--success)" },
  ];
  return (
    <ArtifactFrame
      icon={<GaugeIcon />}
      label="Task assessment report"
      status={<Badge variant="warning" dot>gate</Badge>}
    >
      {rows.map((r) => (
        <div key={r.label} style={{ marginBottom: "16px" }}>
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "baseline",
              fontSize: "13px",
              marginBottom: "7px",
            }}
          >
            <span style={{ color: "var(--text-secondary)" }}>{r.label}</span>
            <span
              style={{
                color: r.color,
                fontFamily: "var(--font-mono)",
                fontSize: "12px",
                fontWeight: 600,
              }}
            >
              {r.value}
            </span>
          </div>
          <div
            style={{
              height: "6px",
              background: "var(--bg-elevated-hover)",
              borderRadius: "999px",
              overflow: "hidden",
            }}
          >
            <div
              style={{
                width: `${r.pct}%`,
                height: "100%",
                background: `linear-gradient(90deg, transparent 0%, ${r.color} 100%)`,
                borderRadius: "999px",
              }}
            />
          </div>
        </div>
      ))}
      <div
        style={{
          marginTop: "18px",
          display: "flex",
          alignItems: "center",
          gap: "10px",
          padding: "11px 12px",
          borderRadius: "var(--radius-md)",
          background: "var(--warning-dim)",
          border: "1px solid rgba(244,199,106,0.2)",
          fontSize: "12px",
          fontFamily: "var(--font-mono)",
          color: "var(--warning)",
          lineHeight: 1.5,
        }}
      >
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}>
          <path d="M12 4 L21 19 L3 19 Z" />
          <path d="M12 10 L12 14" />
          <path d="M12 16.5 L12 16.6" />
        </svg>
        Requires approval gate — risk surface exceeds threshold
      </div>
    </ArtifactFrame>
  );
}

/* ---------- 02 · plan ---------- */

function PlanArtifact() {
  return (
    <ArtifactFrame
      icon={<GraphIcon />}
      label="Task dependency graph"
      status={<Badge variant="info">6 stages</Badge>}
    >
      <div
        style={{
          position: "relative",
          display: "flex",
          flexDirection: "column",
          gap: "8px",
          paddingLeft: "14px",
        }}
      >
        {/* connector rail */}
        <div
          style={{
            position: "absolute",
            left: "4px",
            top: "14px",
            bottom: "14px",
            width: "1px",
            background: "var(--border-default)",
          }}
        />
        <GraphRow label="Assess" depth={0} />
        <GraphRow label="Plan" depth={0} />
        <div style={{ display: "flex", gap: "8px" }}>
          <GraphRow label="auth-module" depth={1} concurrent />
          <GraphRow label="session-store" depth={1} concurrent />
        </div>
        <GraphRow label="middleware" depth={1} />
        <div style={{ display: "flex", gap: "8px" }}>
          <GraphRow label="test suite" depth={1} concurrent />
          <GraphRow label="type check" depth={1} concurrent />
        </div>
        <GraphRow label="Deliver PR" depth={0} gate />
      </div>
      <div style={{ marginTop: "16px", display: "flex", gap: "8px", flexWrap: "wrap" }}>
        <Badge variant="success">2 concurrent pairs</Badge>
        <Badge variant="info">6 stages</Badge>
        <Badge variant="warning">2 gates</Badge>
      </div>
    </ArtifactFrame>
  );
}

function GraphRow({
  label,
  depth,
  concurrent,
  gate,
}: {
  label: string;
  depth: number;
  concurrent?: boolean;
  gate?: boolean;
}) {
  const dot = gate ? "var(--warning)" : concurrent ? "var(--accent)" : "var(--success)";
  return (
    <div
      style={{
        position: "relative",
        marginLeft: depth * 18,
        padding: "8px 14px",
        borderRadius: "var(--radius-sm)",
        background: concurrent ? "var(--accent-glow)" : "var(--bg-elevated)",
        border: `1px solid ${concurrent ? "rgba(147,197,253,0.2)" : "var(--border-subtle)"}`,
        fontSize: "12px",
        fontFamily: "var(--font-mono)",
        color: concurrent ? "var(--text-primary)" : "var(--text-secondary)",
        display: "flex",
        alignItems: "center",
        gap: "8px",
        flex: concurrent ? 1 : "none",
      }}
    >
      {/* rail connector tick */}
      <span
        style={{
          position: "absolute",
          left: depth > 0 ? "-14px" : undefined,
          top: "50%",
          width: "14px",
          height: "1px",
          background: "var(--border-default)",
        }}
      />
      <span
        style={{
          width: "6px",
          height: "6px",
          borderRadius: "50%",
          background: dot,
          flexShrink: 0,
          boxShadow: concurrent || gate ? `0 0 8px ${dot}` : "none",
        }}
      />
      {label}
      {gate && (
        <span
          style={{
            marginLeft: "auto",
            fontSize: "10px",
            color: "var(--warning)",
            letterSpacing: "0.06em",
          }}
        >
          GATE
        </span>
      )}
    </div>
  );
}

/* ---------- 03 · routing ---------- */

const modelDots: Record<string, string> = {
  "claude-sonnet": "var(--accent)",
  "claude-haiku": "var(--success)",
  "gpt-4o": "var(--info)",
};

function ModelChip({ model }: { model: string }) {
  const dot = modelDots[model] ?? "var(--accent)";
  return (
    <span
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: "7px",
        padding: "4px 10px",
        borderRadius: "999px",
        background: "var(--accent-glow)",
        border: "1px solid rgba(147,197,253,0.2)",
        fontFamily: "var(--font-mono)",
        fontSize: "11px",
        color: "var(--text-primary)",
        whiteSpace: "nowrap",
      }}
    >
      <span
        style={{
          width: "6px",
          height: "6px",
          borderRadius: "50%",
          background: dot,
          boxShadow: `0 0 6px ${dot}`,
        }}
      />
      {model}
    </span>
  );
}

function RouteArtifact() {
  const routes = [
    { stage: "auth-module", model: "claude-sonnet", reason: "security-critical", cost: "$0.08" },
    { stage: "session-store", model: "gpt-4o", reason: "schema work", cost: "$0.12" },
    { stage: "middleware", model: "claude-haiku", reason: "low-risk boilerplate", cost: "$0.03" },
  ];
  return (
    <ArtifactFrame
      icon={<RouteIcon />}
      label="Model routing decisions"
      status={<Badge variant="info">3 stages</Badge>}
    >
      {routes.map((r, i) => (
        <div
          key={r.stage}
          style={{
            display: "flex",
            alignItems: "center",
            gap: "12px",
            padding: "12px 0",
            borderBottom: i < routes.length - 1 ? "1px solid var(--border-subtle)" : "none",
          }}
        >
          <div style={{ flex: 1, minWidth: 0 }}>
            <div
              style={{
                fontSize: "13px",
                fontFamily: "var(--font-mono)",
                color: "var(--text-primary)",
                marginBottom: "3px",
              }}
            >
              {r.stage}
            </div>
            <div style={{ fontSize: "11px", color: "var(--text-muted)", fontFamily: "var(--font-mono)" }}>
              {r.reason}
            </div>
          </div>
          <ModelChip model={r.model} />
          <span
            style={{
              fontSize: "12px",
              color: "var(--text-secondary)",
              fontFamily: "var(--font-mono)",
              width: "44px",
              textAlign: "right",
            }}
          >
            {r.cost}
          </span>
        </div>
      ))}
    </ArtifactFrame>
  );
}

/* ---------- 04 · execution ---------- */

function ExecuteArtifact() {
  const rows = [
    { t: "0:00", icon: "→", color: "var(--info)", event: "auth-module started (sonnet)" },
    { t: "0:00", icon: "→", color: "var(--info)", event: "session-store started (gpt-4o)" },
    { t: "0:01", icon: "✓", color: "var(--success)", event: "auth-module complete — 1.2s" },
    { t: "0:02", icon: "✓", color: "var(--success)", event: "session-store complete — 2.1s" },
    { t: "0:02", icon: "→", color: "var(--info)", event: "middleware started (haiku)" },
    { t: "0:03", icon: "✕", color: "var(--error)", event: "middleware failed verification" },
    { t: "0:03", icon: "↻", color: "var(--warning)", event: "escalating to sonnet" },
    { t: "0:04", icon: "→", color: "var(--info)", event: "middleware retry started (sonnet)" },
  ];
  return (
    <ArtifactFrame
      icon={<BoltIcon />}
      label="Execution timeline"
      status={<Badge variant="warning" dot>1 retry</Badge>}
    >
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          gap: "4px",
          fontFamily: "var(--font-mono)",
          fontSize: "12px",
        }}
      >
        {rows.map((row, i) => (
          <div
            key={i}
            style={{
              display: "flex",
              alignItems: "center",
              gap: "10px",
              padding: "6px 10px",
              borderRadius: "var(--radius-sm)",
              background: i % 2 === 0 ? "var(--bg-elevated)" : "transparent",
            }}
          >
            <span style={{ color: "var(--text-muted)", flexShrink: 0 }}>{row.t}</span>
            <span
              style={{
                color: row.color,
                width: "14px",
                textAlign: "center",
                flexShrink: 0,
                fontWeight: 700,
              }}
            >
              {row.icon}
            </span>
            <span style={{ color: "var(--text-secondary)" }}>{row.event}</span>
          </div>
        ))}
      </div>
    </ArtifactFrame>
  );
}

/* ---------- 05 · verification ---------- */

function VerifyArtifact() {
  const checks = [
    { label: "Unit tests", value: "24/24", ok: true },
    { label: "Type check", value: "0 errors", ok: true },
    { label: "CSRF check", value: "1 failed", ok: false },
  ];
  return (
    <ArtifactFrame
      icon={<ShieldCheckIcon />}
      label="Verification report"
      status={<Badge variant="error" dot>1 failed</Badge>}
    >
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          gap: "8px",
          marginBottom: "14px",
        }}
      >
        {checks.map((c) => (
          <div
            key={c.label}
            style={{
              display: "flex",
              alignItems: "center",
              gap: "10px",
              padding: "9px 12px",
              borderRadius: "var(--radius-md)",
              background: "var(--bg-elevated)",
              border: "1px solid var(--border-subtle)",
            }}
          >
            <span
              style={{
                width: "20px",
                height: "20px",
                borderRadius: "var(--radius-sm)",
                background: c.ok ? "var(--success-dim)" : "var(--error-dim)",
                color: c.ok ? "var(--success)" : "var(--error)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: "11px",
                fontWeight: 700,
                fontFamily: "var(--font-mono)",
                flexShrink: 0,
              }}
            >
              {c.ok ? "✓" : "✕"}
            </span>
            <span style={{ fontSize: "13px", color: "var(--text-primary)", flex: 1 }}>{c.label}</span>
            <span
              style={{
                fontSize: "12px",
                fontFamily: "var(--font-mono)",
                color: c.ok ? "var(--success)" : "var(--error)",
                fontWeight: 600,
              }}
            >
              {c.value}
            </span>
          </div>
        ))}
      </div>
      <div
        style={{
          display: "flex",
          gap: "10px",
          padding: "12px",
          borderRadius: "var(--radius-md)",
          background: "var(--error-dim)",
          border: "1px solid rgba(255,125,125,0.2)",
          fontSize: "12px",
          fontFamily: "var(--font-mono)",
          color: "var(--error)",
          lineHeight: 1.6,
        }}
      >
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0, marginTop: "2px" }}>
          <path d="M12 4 L21 19 L3 19 Z" />
          <path d="M12 10 L12 14" />
          <path d="M12 16.5 L12 16.6" />
        </svg>
        <span>
          middleware/csrf.ts:42 — Missing CSRF token validation on POST /api/auth/session.
          Expected csrfVerify(req) before session.create().
        </span>
      </div>
    </ArtifactFrame>
  );
}

/* ---------- 06 · delivery ---------- */

function DeliverArtifact() {
  return (
    <ArtifactFrame
      icon={<GitPullIcon />}
      label="Delivery — approval-gated PR"
      status={<Badge variant="success" dot>verified</Badge>}
    >
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: "10px",
          marginBottom: "14px",
          flexWrap: "wrap",
        }}
      >
        <span
          style={{
            padding: "4px 10px",
            borderRadius: "999px",
            background: "var(--accent-glow)",
            border: "1px solid rgba(147,197,253,0.2)",
            color: "var(--text-primary)",
            fontSize: "12px",
            fontFamily: "var(--font-mono)",
          }}
        >
          refactor-auth-session
        </span>
        <span
          style={{
            padding: "3px 8px",
            borderRadius: "var(--radius-sm)",
            background: "var(--success-dim)",
            color: "var(--success)",
            fontSize: "11px",
            fontFamily: "var(--font-mono)",
            fontWeight: 700,
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
            fontWeight: 700,
          }}
        >
          −28
        </span>
      </div>
      <div
        style={{
          padding: "12px 14px",
          borderRadius: "var(--radius-md)",
          background: "var(--bg-base)",
          border: "1px solid var(--border-subtle)",
          fontFamily: "var(--font-mono)",
          fontSize: "12px",
          lineHeight: 1.9,
          overflowX: "auto",
        }}
      >
        <div style={{ color: "var(--text-muted)", marginBottom: "4px" }}>
          diff --git a/src/auth/middleware.ts
        </div>
        <div style={{ background: "rgba(255,125,125,0.08)", color: "var(--error)", borderRadius: "4px", padding: "0 10px", marginBottom: "2px" }}>
          -  if (req.method === "POST") {"{"}
        </div>
        <div style={{ background: "rgba(255,125,125,0.08)", color: "var(--error)", borderRadius: "4px", padding: "0 10px", marginBottom: "2px" }}>
          {"    return handleSession(req);"}
        </div>
        <div style={{ background: "rgba(255,125,125,0.08)", color: "var(--error)", borderRadius: "4px", padding: "0 10px", marginBottom: "6px" }}>
          -  {"}"}
        </div>
        <div style={{ background: "rgba(74,222,128,0.08)", color: "var(--success)", borderRadius: "4px", padding: "0 10px", marginBottom: "2px" }}>
          +  if (req.method === "POST") {"{"}
        </div>
        <div style={{ background: "rgba(74,222,128,0.08)", color: "var(--success)", borderRadius: "4px", padding: "0 10px", marginBottom: "2px" }}>
          {"    const token = csrfVerify(req);"}
        </div>
        <div style={{ background: "rgba(74,222,128,0.08)", color: "var(--success)", borderRadius: "4px", padding: "0 10px", marginBottom: "2px" }}>
          {"    if (!token) return res.status(403).end();"}
        </div>
        <div style={{ background: "rgba(74,222,128,0.08)", color: "var(--success)", borderRadius: "4px", padding: "0 10px", marginBottom: "2px" }}>
          {"    return handleSession(req);"}
        </div>
        <div style={{ background: "rgba(74,222,128,0.08)", color: "var(--success)", borderRadius: "4px", padding: "0 10px" }}>
          +  {"}"}
        </div>
      </div>
      <div
        style={{
          marginTop: "16px",
          display: "flex",
          gap: "8px",
          flexWrap: "wrap",
        }}
      >
        <Badge variant="success" dot>
          All verifications passed
        </Badge>
        <Badge variant="default">Awaiting approval</Badge>
      </div>
    </ArtifactFrame>
  );
}
