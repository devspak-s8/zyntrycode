import { Section, SectionHeading } from "./Section";
import { Badge } from "./Badge";

export function Demo() {
  return (
    <Section id="demo" style={{ paddingTop: "100px" }}>
      <SectionHeading
        eyebrow="Product demonstration"
        title="A real task, end to end — with evidence"
        description="Watch how Zyntry Code handles a security-sensitive refactoring task: from assessment through routing, execution, verification failure, escalation, and final delivery."
        align="center"
      />

      <div
        style={{
          borderRadius: "var(--radius-xl)",
          background: "var(--bg-surface)",
          border: "1px solid var(--border-default)",
          overflow: "hidden",
          boxShadow: "0 40px 80px -24px rgba(0,0,0,0.5)",
        }}
      >
        {/* Task header */}
        <div
          style={{
            padding: "24px 28px",
            borderBottom: "1px solid var(--border-subtle)",
            background: "var(--bg-base)",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            flexWrap: "wrap",
            gap: "16px",
          }}
        >
          <div>
            <div
              style={{
                fontSize: "11px",
                fontFamily: "var(--font-mono)",
                color: "var(--text-muted)",
                textTransform: "uppercase",
                letterSpacing: "0.1em",
                marginBottom: "6px",
              }}
            >
              Task
            </div>
            <div
              style={{
                fontSize: "18px",
                fontWeight: 600,
                color: "var(--text-primary)",
                letterSpacing: "-0.01em",
              }}
            >
              Add CSRF token validation to session authentication flow
            </div>
          </div>
          <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
            <Badge variant="warning" dot>risk: high</Badge>
            <Badge variant="default">budget: $1.00</Badge>
            <Badge variant="info">run #4821</Badge>
          </div>
        </div>

        {/* Timeline */}
        <div style={{ padding: "28px" }}>
          <DemoStep
            num="1"
            title="Assessment"
            status="complete"
            time="0:00"
          >
            <DemoDetail
              label="Analysis"
              items={[
                { k: "Complexity", v: "Moderate — 3 files affected" },
                { k: "Risk surface", v: "High — authentication security path" },
                { k: "Approval gate", v: "Required — risk exceeds auto-run threshold" },
              ]}
            />
          </DemoStep>

          <DemoStep
            num="2"
            title="Planning — dependency graph"
            status="complete"
            time="0:01"
          >
            <div
              style={{
                fontFamily: "var(--font-mono)",
                fontSize: "12px",
                lineHeight: 1.8,
                color: "var(--text-secondary)",
                padding: "16px",
                background: "var(--bg-elevated)",
                borderRadius: "var(--radius-md)",
                border: "1px solid var(--border-subtle)",
              }}
            >
              <div style={{ color: "var(--text-primary)" }}>auth-module ──┐</div>
              <div style={{ color: "var(--text-primary)" }}>                 ├─→ middleware ──→ verify ──→ deliver</div>
              <div style={{ color: "var(--text-primary)" }}>session-store ──┘</div>
              <div style={{ marginTop: "10px", color: "var(--text-muted)" }}>
                Concurrent: auth-module + session-store (no shared deps)
              </div>
            </div>
          </DemoStep>

          <DemoStep
            num="3"
            title="Model routing"
            status="complete"
            time="0:01"
          >
            <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
              <RouteRow stage="auth-module" model="claude-sonnet" reason="Security-critical path — needs strong reasoning" cost="$0.08" />
              <RouteRow stage="session-store" model="gpt-4o" reason="Schema manipulation — strong structured output" cost="$0.12" />
              <RouteRow stage="middleware" model="claude-haiku" reason="Low-risk boilerplate insertion" cost="$0.03" />
            </div>
          </DemoStep>

          <DemoStep
            num="4"
            title="Execution — attempt 1"
            status="failed"
            time="0:03"
          >
            <DemoDetail
              label="Results"
              items={[
                { k: "auth-module", v: "✓ passed — 1.2s, $0.08" },
                { k: "session-store", v: "✓ passed — 2.1s, $0.12" },
                { k: "middleware (haiku)", v: "✕ verification failed" },
              ]}
            />
            <div
              style={{
                marginTop: "12px",
                padding: "14px",
                borderRadius: "var(--radius-md)",
                background: "var(--error-dim)",
                border: "1px solid rgba(248,113,113,0.15)",
                fontSize: "12px",
                fontFamily: "var(--font-mono)",
                color: "var(--error)",
                lineHeight: 1.6,
              }}
            >
              VERIFICATION FAILURE — csrf-check
              <br />
              middleware/csrf.ts:42 — Missing CSRF token validation on POST /api/auth/session.
              <br />
              Expected: csrfVerify(req) before session.create()
              <br />
              Got: no csrfVerify() call present
            </div>
          </DemoStep>

          <DemoStep
            num="5"
            title="Escalation — attempt 2"
            status="complete"
            time="0:04"
          >
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: "12px",
                padding: "14px 16px",
                borderRadius: "var(--radius-md)",
                background: "var(--warning-dim)",
                border: "1px solid rgba(251,191,36,0.15)",
                marginBottom: "12px",
              }}
            >
              <span style={{ fontSize: "13px", fontFamily: "var(--font-mono)", color: "var(--warning)" }}>
                claude-haiku
              </span>
              <span style={{ color: "var(--text-muted)", fontFamily: "var(--font-mono)", fontSize: "12px" }}>→</span>
              <span style={{ fontSize: "13px", fontFamily: "var(--font-mono)", color: "var(--accent)" }}>
                claude-sonnet
              </span>
              <span
                style={{
                  fontSize: "12px",
                  color: "var(--text-secondary)",
                  fontFamily: "var(--font-mono)",
                  marginLeft: "auto",
                }}
              >
                escalated — verification failure on attempt 1
              </span>
            </div>
            <CodeDiff />
          </DemoStep>

          <DemoStep
            num="6"
            title="Verification — all passing"
            status="complete"
            time="0:05"
          >
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))", gap: "10px" }}>
              <VerifyStat label="Unit tests" value="24/24" status="pass" />
              <VerifyStat label="Type check" value="0 errors" status="pass" />
              <VerifyStat label="CSRF check" value="validated" status="pass" />
              <VerifyStat label="Integration" value="8/8" status="pass" />
            </div>
          </DemoStep>

          <DemoStep
            num="7"
            title="Delivery — approval-gated PR"
            status="delivered"
            time="0:06"
            last
          >
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: "16px",
                padding: "18px 20px",
                borderRadius: "var(--radius-md)",
                background: "var(--bg-elevated)",
                border: "1px solid var(--border-subtle)",
                flexWrap: "wrap",
              }}
            >
              <div>
                <div
                  style={{
                    fontSize: "14px",
                    fontFamily: "var(--font-mono)",
                    color: "var(--text-primary)",
                    marginBottom: "4px",
                  }}
                >
                  refactor/auth-csrf-validation
                </div>
                <div style={{ fontSize: "12px", color: "var(--text-muted)", fontFamily: "var(--font-mono)" }}>
                  +42 −8 · 3 files changed · run #4821
                </div>
              </div>
              <div style={{ marginLeft: "auto", display: "flex", gap: "8px", flexWrap: "wrap" }}>
                <Badge variant="success" dot>All gates passed</Badge>
                <Badge variant="accent">Awaiting review</Badge>
              </div>
            </div>
            <div
              style={{
                marginTop: "12px",
                display: "flex",
                gap: "24px",
                fontFamily: "var(--font-mono)",
                fontSize: "12px",
                color: "var(--text-muted)",
              }}
            >
              <span>Total cost: <span style={{ color: "var(--text-secondary)" }}>$0.34 / $1.00</span></span>
              <span>Attempts: <span style={{ color: "var(--text-secondary)" }}>2</span></span>
              <span>Escalations: <span style={{ color: "var(--text-secondary)" }}>1</span></span>
              <span>Duration: <span style={{ color: "var(--text-secondary)" }}>6m 12s</span></span>
            </div>
          </DemoStep>
        </div>
      </div>
    </Section>
  );
}

function DemoStep({
  num,
  title,
  status,
  time,
  last,
  children,
}: {
  num: string;
  title: string;
  status: "complete" | "failed" | "delivered";
  time: string;
  last?: boolean;
  children: React.ReactNode;
}) {
  const statusConfig = {
    complete: { color: "var(--success)", bg: "var(--success-dim)", label: "complete" },
    failed: { color: "var(--error)", bg: "var(--error-dim)", label: "failed" },
    delivered: { color: "var(--accent)", bg: "var(--accent-glow)", label: "delivered" },
  };
  const sc = statusConfig[status];
  return (
    <div style={{ display: "flex", gap: "20px", paddingBottom: last ? 0 : "32px" }}>
      {/* Timeline rail */}
      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", flexShrink: 0 }}>
        <div
          style={{
            width: "28px",
            height: "28px",
            borderRadius: "50%",
            background: sc.bg,
            border: `1px solid ${sc.color}`,
            color: sc.color,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: "12px",
            fontFamily: "var(--font-mono)",
            fontWeight: 600,
            flexShrink: 0,
          }}
        >
          {num}
        </div>
        {!last && (
          <div
            style={{
              width: "1px",
              flex: 1,
              background: "var(--border-default)",
              marginTop: "4px",
              minHeight: "20px",
            }}
          />
        )}
      </div>

      {/* Content */}
      <div style={{ flex: 1, minWidth: 0 }}>
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "12px",
            marginBottom: "14px",
            flexWrap: "wrap",
          }}
        >
          <h3
            style={{
              fontSize: "16px",
              fontWeight: 600,
              color: "var(--text-primary)",
              letterSpacing: "-0.01em",
            }}
          >
            {title}
          </h3>
          <span
            style={{
              fontSize: "11px",
              fontFamily: "var(--font-mono)",
              color: sc.color,
              padding: "2px 8px",
              borderRadius: "var(--radius-sm)",
              background: sc.bg,
            }}
          >
            {sc.label}
          </span>
          <span
            style={{
              fontSize: "11px",
              fontFamily: "var(--font-mono)",
              color: "var(--text-muted)",
              marginLeft: "auto",
            }}
          >
            {time}
          </span>
        </div>
        {children}
      </div>
    </div>
  );
}

function DemoDetail({
  label,
  items,
}: {
  label: string;
  items: { k: string; v: string }[];
}) {
  return (
    <div
      style={{
        padding: "16px 18px",
        borderRadius: "var(--radius-md)",
        background: "var(--bg-elevated)",
        border: "1px solid var(--border-subtle)",
      }}
    >
      <div
        style={{
          fontSize: "11px",
          fontFamily: "var(--font-mono)",
          color: "var(--text-muted)",
          textTransform: "uppercase",
          letterSpacing: "0.08em",
          marginBottom: "12px",
        }}
      >
        {label}
      </div>
      {items.map((item, i) => (
        <div
          key={i}
          style={{
            display: "flex",
            justifyContent: "space-between",
            padding: "6px 0",
            borderBottom: i < items.length - 1 ? "1px solid var(--border-subtle)" : "none",
            fontSize: "13px",
            gap: "16px",
          }}
        >
          <span style={{ color: "var(--text-secondary)" }}>{item.k}</span>
          <span
            style={{
              color: "var(--text-primary)",
              fontFamily: "var(--font-mono)",
              fontSize: "12px",
              textAlign: "right",
            }}
          >
            {item.v}
          </span>
        </div>
      ))}
    </div>
  );
}

function RouteRow({
  stage,
  model,
  reason,
  cost,
}: {
  stage: string;
  model: string;
  reason: string;
  cost: string;
}) {
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: "14px",
        padding: "12px 16px",
        borderRadius: "var(--radius-md)",
        background: "var(--bg-elevated)",
        border: "1px solid var(--border-subtle)",
      }}
    >
      <span style={{ fontSize: "13px", fontFamily: "var(--font-mono)", color: "var(--text-primary)", minWidth: "120px" }}>
        {stage}
      </span>
      <Badge variant="accent">{model}</Badge>
      <span style={{ fontSize: "12px", color: "var(--text-muted)", fontFamily: "var(--font-mono)", flex: 1 }}>
        {reason}
      </span>
      <span style={{ fontSize: "12px", color: "var(--text-secondary)", fontFamily: "var(--font-mono)" }}>
        {cost}
      </span>
    </div>
  );
}

function CodeDiff() {
  return (
    <div
      style={{
        padding: "16px 18px",
        borderRadius: "var(--radius-md)",
        background: "var(--bg-base)",
        border: "1px solid var(--border-subtle)",
        fontFamily: "var(--font-mono)",
        fontSize: "12px",
        lineHeight: 1.7,
        overflowX: "auto",
      }}
    >
      <div style={{ color: "var(--text-muted)", marginBottom: "8px" }}>
        a/src/auth/middleware.ts
      </div>
      <div style={{ color: "var(--error)" }}>-  if (req.method === "POST") {"{"}</div>
      <div style={{ color: "var(--error)", paddingLeft: "20px" }}>    return handleSession(req);</div>
      <div style={{ color: "var(--error)" }}>-  {"}"}</div>
      <div style={{ color: "var(--success)" }}>+  if (req.method === "POST") {"{"}</div>
      <div style={{ color: "var(--success)", paddingLeft: "20px" }}>+    const token = csrfVerify(req);</div>
      <div style={{ color: "var(--success)", paddingLeft: "20px" }}>+    if (!token) {"{"}</div>
      <div style={{ color: "var(--success)", paddingLeft: "20px" }}>+      return res.status(403).json({"{"} error: "invalid_csrf" {"}"});</div>
      <div style={{ color: "var(--success)", paddingLeft: "20px" }}>+    {"}"}</div>
      <div style={{ color: "var(--success)", paddingLeft: "20px" }}>+    return handleSession(req);</div>
      <div style={{ color: "var(--success)" }}>+  {"}"}</div>
    </div>
  );
}

function VerifyStat({
  label,
  value,
}: {
  label: string;
  value: string;
  status: "pass" | "fail";
}) {
  return (
    <div
      style={{
        padding: "14px 16px",
        borderRadius: "var(--radius-md)",
        background: "var(--bg-elevated)",
        border: "1px solid var(--border-subtle)",
        display: "flex",
        alignItems: "center",
        gap: "12px",
      }}
    >
      <div
        style={{
          width: "22px",
          height: "22px",
          borderRadius: "var(--radius-sm)",
          background: "var(--success-dim)",
          color: "var(--success)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontSize: "12px",
          fontWeight: 700,
          flexShrink: 0,
          fontFamily: "var(--font-mono)",
        }}
      >
        ✓
      </div>
      <div>
        <div style={{ fontSize: "12px", color: "var(--text-muted)", fontFamily: "var(--font-mono)" }}>{label}</div>
        <div style={{ fontSize: "14px", color: "var(--text-primary)", fontWeight: 500 }}>{value}</div>
      </div>
    </div>
  );
}
