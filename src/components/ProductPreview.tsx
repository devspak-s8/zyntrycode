import { Badge } from "./Badge";

export function ProductPreview() {
  return (
    <div
      style={{
        position: "relative",
        borderRadius: "var(--radius-xl)",
        background: "var(--bg-surface)",
        border: "1px solid var(--border-default)",
        overflow: "hidden",
        boxShadow:
          "0 0 0 1px rgba(255,255,255,0.02), 0 40px 80px -20px rgba(0,0,0,0.6), 0 0 120px -40px rgba(103,232,249,0.15)",
      }}
    >
      {/* Window chrome */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: "12px",
          padding: "14px 18px",
          borderBottom: "1px solid var(--border-subtle)",
          background: "var(--bg-base)",
        }}
      >
        <div style={{ display: "flex", gap: "7px" }}>
          {["#FF7D7D", "#F4C76A", "#55E6A5"].map((c) => (
            <div key={c} style={{ width: "11px", height: "11px", borderRadius: "50%", background: c, opacity: 0.7 }} />
          ))}
        </div>
        <div
          style={{
            fontSize: "12px",
            fontFamily: "var(--font-mono)",
            color: "var(--text-muted)",
            marginLeft: "8px",
          }}
        >
          zyntry · orchestration run #4821 · refactor-auth-session
        </div>
        <div style={{ marginLeft: "auto", display: "flex", gap: "8px" }}>
          <Badge variant="success" dot>3 passing</Badge>
          <Badge variant="warning" dot>1 retry</Badge>
        </div>
      </div>

      {/* Dashboard body */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "240px 1fr 300px",
          minHeight: "480px",
        }}
        className="preview-grid"
      >
        {/* Left: task graph */}
        <div
          style={{
            borderRight: "1px solid var(--border-subtle)",
            padding: "20px 16px",
            background: "var(--bg-base)",
          }}
        >
          <SidebarLabel>Task Graph</SidebarLabel>
          <TaskNode label="Assess" status="done" depth={0} />
          <TaskNode label="Plan" status="done" depth={0} />
          <TaskNode label="Route models" status="done" depth={0} />
          <TaskNode label="Execute: auth-module" status="done" depth={1} />
          <TaskNode label="Execute: session-store" status="done" depth={1} />
          <TaskNode label="Execute: middleware" status="active" depth={1} />
          <TaskNode label="Verify: test suite" status="pending" depth={1} />
          <TaskNode label="Verify: type check" status="pending" depth={1} />
          <TaskNode label="Deliver: PR" status="pending" depth={0} />
        </div>

        {/* Center: execution trace */}
        <div
          style={{
            padding: "20px",
            overflow: "hidden",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "20px" }}>
            <SidebarLabel>Execution Trace</SidebarLabel>
            <div style={{ display: "flex", gap: "8px" }}>
              <Badge variant="default">budget $0.42 / $1.00</Badge>
              <Badge variant="info">4m 12s</Badge>
            </div>
          </div>

          <TraceEntry
            stage="auth-module"
            model="claude-sonnet"
            status="passed"
            attempts={1}
            latency="1.2s"
            cost="$0.08"
          />
          <TraceEntry
            stage="session-store"
            model="gpt-4o"
            status="passed"
            attempts={1}
            latency="2.1s"
            cost="$0.12"
          />
          <TraceEntry
            stage="middleware"
            model="claude-haiku"
            status="retry"
            attempts={2}
            latency="0.8s"
            cost="$0.03"
            note="Verification failed: missing CSRF token check → escalated to sonnet"
          />
          <TraceEntry
            stage="middleware"
            model="claude-sonnet"
            status="running"
            attempts={1}
            latency="—"
            cost="$0.06"
            note="Escalated from haiku — retry attempt 2"
          />
        </div>

        {/* Right: verification panel */}
        <div
          style={{
            borderLeft: "1px solid var(--border-subtle)",
            padding: "20px 16px",
            background: "var(--bg-base)",
          }}
        >
          <SidebarLabel>Verification</SidebarLabel>

          <VerifyCard
            label="Unit tests"
            status="pass"
            detail="24/24 passed"
          />
          <VerifyCard
            label="Type check"
            status="pass"
            detail="0 errors"
          />
          <VerifyCard
            label="CSRF check"
            status="fail"
            detail="Missing on /api/auth"
          />
          <VerifyCard
            label="Integration"
            status="pending"
            detail="Awaiting retry"
          />

          <div
            style={{
              marginTop: "20px",
              padding: "14px",
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
                marginBottom: "8px",
                textTransform: "uppercase",
                letterSpacing: "0.08em",
              }}
            >
              Cost breakdown
            </div>
            {[
              { label: "claude-sonnet", val: "$0.14", pct: 33 },
              { label: "gpt-4o", val: "$0.12", pct: 29 },
              { label: "claude-haiku", val: "$0.03", pct: 7 },
              { label: "verification", val: "$0.13", pct: 31 },
            ].map((row) => (
              <div key={row.label} style={{ marginBottom: "10px" }}>
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    fontSize: "12px",
                    fontFamily: "var(--font-mono)",
                    marginBottom: "4px",
                  }}
                >
                  <span style={{ color: "var(--text-secondary)" }}>{row.label}</span>
                  <span style={{ color: "var(--text-primary)" }}>{row.val}</span>
                </div>
                <div
                  style={{
                    height: "3px",
                    background: "var(--bg-elevated-hover)",
                    borderRadius: "2px",
                    overflow: "hidden",
                  }}
                >
                  <div
                    style={{
                      width: `${row.pct}%`,
                      height: "100%",
                      background: "var(--accent)",
                      borderRadius: "2px",
                      opacity: 0.7,
                    }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

function SidebarLabel({ children }: { children: React.ReactNode }) {
  return (
    <div
      style={{
        fontSize: "11px",
        fontFamily: "var(--font-mono)",
        fontWeight: 600,
        color: "var(--text-muted)",
        textTransform: "uppercase",
        letterSpacing: "0.1em",
        marginBottom: "16px",
      }}
    >
      {children}
    </div>
  );
}

type NodeStatus = "done" | "active" | "pending";

function TaskNode({ label, status, depth }: { label: string; status: NodeStatus; depth: number }) {
  const colors: Record<NodeStatus, { dot: string; text: string; bg: string }> = {
    done: { dot: "var(--success)", text: "var(--text-secondary)", bg: "transparent" },
    active: { dot: "var(--accent)", text: "var(--text-primary)", bg: "var(--accent-glow)" },
    pending: { dot: "var(--text-faint)", text: "var(--text-muted)", bg: "transparent" },
  };
  const c = colors[status];
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: "10px",
        padding: "7px 10px",
        marginLeft: depth * 16,
        borderRadius: "var(--radius-sm)",
        background: c.bg,
        marginBottom: "2px",
        fontSize: "13px",
        fontFamily: "var(--font-mono)",
        color: c.text,
        transition: "background var(--transition)",
      }}
    >
      <span
        style={{
          width: "7px",
          height: "7px",
          borderRadius: "50%",
          background: c.dot,
          flexShrink: 0,
          boxShadow: status === "active" ? `0 0 8px ${c.dot}` : "none",
        }}
      />
      {label}
      {status === "active" && (
        <span style={{ marginLeft: "auto", fontSize: "10px", color: "var(--accent)" }}>running</span>
      )}
    </div>
  );
}

type TraceStatus = "passed" | "retry" | "running";

function TraceEntry({
  stage,
  model,
  status,
  attempts,
  latency,
  cost,
  note,
}: {
  stage: string;
  model: string;
  status: TraceStatus;
  attempts: number;
  latency: string;
  cost: string;
  note?: string;
}) {
  const statusConfig: Record<TraceStatus, { label: string; variant: "success" | "warning" | "info" }> = {
    passed: { label: "PASSED", variant: "success" },
    retry: { label: "RETRY", variant: "warning" },
    running: { label: "RUNNING", variant: "info" },
  };
  const sc = statusConfig[status];
  return (
    <div
      style={{
        padding: "14px 16px",
        borderRadius: "var(--radius-md)",
        background: "var(--bg-elevated)",
        border: "1px solid var(--border-subtle)",
        marginBottom: "10px",
        transition: "border-color var(--transition)",
      }}
    >
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "8px" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
          <span
            style={{
              fontSize: "13px",
              fontFamily: "var(--font-mono)",
              color: "var(--text-primary)",
              fontWeight: 500,
            }}
          >
            {stage}
          </span>
          <Badge variant="default">{model}</Badge>
        </div>
        <Badge variant={sc.variant} dot={status === "running"}>
          {sc.label}
        </Badge>
      </div>
      <div
        style={{
          display: "flex",
          gap: "20px",
          fontSize: "12px",
          fontFamily: "var(--font-mono)",
          color: "var(--text-muted)",
        }}
      >
        <span>attempts: <span style={{ color: "var(--text-secondary)" }}>{attempts}</span></span>
        <span>latency: <span style={{ color: "var(--text-secondary)" }}>{latency}</span></span>
        <span>cost: <span style={{ color: "var(--text-secondary)" }}>{cost}</span></span>
      </div>
      {note && (
        <div
          style={{
            marginTop: "10px",
            padding: "10px 12px",
            borderRadius: "var(--radius-sm)",
            background: status === "retry" ? "var(--warning-dim)" : "var(--info-dim)",
            fontSize: "12px",
            fontFamily: "var(--font-mono)",
            color: status === "retry" ? "var(--warning)" : "var(--info)",
            lineHeight: 1.5,
          }}
        >
          {note}
        </div>
      )}
    </div>
  );
}

function VerifyCard({
  label,
  status,
  detail,
}: {
  label: string;
  status: "pass" | "fail" | "pending";
  detail: string;
}) {
  const config = {
    pass: { color: "var(--success)", bg: "var(--success-dim)", icon: "✓" },
    fail: { color: "var(--error)", bg: "var(--error-dim)", icon: "✕" },
    pending: { color: "var(--text-muted)", bg: "var(--bg-elevated)", icon: "○" },
  };
  const c = config[status];
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: "12px",
        padding: "12px 14px",
        borderRadius: "var(--radius-md)",
        background: "var(--bg-elevated)",
        border: "1px solid var(--border-subtle)",
        marginBottom: "8px",
      }}
    >
      <div
        style={{
          width: "24px",
          height: "24px",
          borderRadius: "var(--radius-sm)",
          background: c.bg,
          color: c.color,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontSize: "13px",
          fontWeight: 700,
          flexShrink: 0,
          fontFamily: "var(--font-mono)",
        }}
      >
        {c.icon}
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div
          style={{
            fontSize: "13px",
            fontWeight: 500,
            color: "var(--text-primary)",
            marginBottom: "2px",
          }}
        >
          {label}
        </div>
        <div
          style={{
            fontSize: "11px",
            fontFamily: "var(--font-mono)",
            color: "var(--text-muted)",
          }}
        >
          {detail}
        </div>
      </div>
    </div>
  );
}
