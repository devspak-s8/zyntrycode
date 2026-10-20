import { Button } from "./Button";

export function CTA() {
  return (
    <section
      id="cta"
      style={{
        padding: "120px 24px",
        position: "relative",
        overflow: "hidden",
      }}
    >
      {/* Ambient glow */}
      <div
        style={{
          position: "absolute",
          top: "50%",
          left: "50%",
          transform: "translate(-50%, -50%)",
          width: "600px",
          height: "400px",
          background: "radial-gradient(ellipse at center, rgba(103,232,249,0.08) 0%, transparent 60%)",
          pointerEvents: "none",
        }}
      />

      <div
        style={{
          maxWidth: "720px",
          margin: "0 auto",
          textAlign: "center",
          position: "relative",
          zIndex: 1,
        }}
      >
        <h2
          style={{
            fontSize: "clamp(30px, 5vw, 48px)",
            fontWeight: 600,
            lineHeight: 1.15,
            letterSpacing: "-0.02em",
            color: "var(--text-primary)",
            marginBottom: "20px",
          }}
        >
          Stop generating code.{" "}
          <span style={{ color: "var(--accent)" }}>Start orchestrating engineering.</span>
        </h2>
        <p
          style={{
            fontSize: "18px",
            lineHeight: 1.6,
            color: "var(--text-secondary)",
            marginBottom: "40px",
            maxWidth: "560px",
            margin: "0 auto 40px",
          }}
        >
          Bring model intelligence, execution control, and cost-aware verification into
          one structured workflow. Every change ships with evidence.
        </p>
        <div
          style={{
            display: "flex",
            gap: "14px",
            justifyContent: "center",
            flexWrap: "wrap",
          }}
        >
          <Button variant="primary" size="lg">
            Start orchestrating
          </Button>
          <Button variant="secondary" size="lg" href="#demo">
            View the demo
          </Button>
        </div>

        <div
          style={{
            marginTop: "32px",
            display: "flex",
            gap: "24px",
            justifyContent: "center",
            fontFamily: "var(--font-mono)",
            fontSize: "13px",
            color: "var(--text-muted)",
            flexWrap: "wrap",
          }}
        >
          <span>VS Code extension</span>
          <span style={{ color: "var(--text-faint)" }}>·</span>
          <span>Remote container workers</span>
          <span style={{ color: "var(--text-faint)" }}>·</span>
          <span>Approval-gated delivery</span>
        </div>
      </div>
    </section>
  );
}
