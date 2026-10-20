import { Button } from "./Button";

const proofPoints = [
  "VS Code extension",
  "Remote container workers",
  "Approval-gated PRs",
];

export function Hero() {
  return (
    <section
      style={{
        position: "relative",
        paddingTop: "150px",
        paddingBottom: "104px",
        overflow: "hidden",
      }}
    >
      {/* Ambient glow */}
      <div
        style={{
          position: "absolute",
          top: "-200px",
          left: "50%",
          transform: "translateX(-50%)",
          width: "800px",
          height: "600px",
          background: "radial-gradient(ellipse at center, rgba(147,197,253,0.08) 0%, transparent 60%)",
          pointerEvents: "none",
          zIndex: 0,
        }}
      />
      {/* Grid pattern */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          backgroundImage:
            "linear-gradient(rgba(255,255,255,0.015) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.015) 1px, transparent 1px)",
          backgroundSize: "40px 40px",
          maskImage: "linear-gradient(to bottom, black 0%, transparent 80%)",
          WebkitMaskImage: "linear-gradient(to bottom, black 0%, transparent 80%)",
          pointerEvents: "none",
          zIndex: 0,
        }}
      />

      <div
        style={{
          maxWidth: "840px",
          margin: "0 auto",
          padding: "0 24px",
          position: "relative",
          zIndex: 1,
          textAlign: "center",
        }}
      >
        <h1
          style={{
            fontSize: "clamp(36px, 5.4vw, 60px)",
            fontWeight: 600,
            lineHeight: 1.07,
            letterSpacing: "-0.03em",
            color: "var(--text-primary)",
            margin: "0 auto 24px",
            maxWidth: "760px",
          }}
        >
          AI that doesn't stop at <span style={{ color: "var(--accent)" }}>writing code.</span>
        </h1>

        <p
          style={{
            fontSize: "clamp(16px, 1.9vw, 19px)",
            lineHeight: 1.62,
            color: "var(--text-secondary)",
            margin: "0 auto 36px",
            letterSpacing: "-0.01em",
            maxWidth: "620px",
          }}
        >
          Coordinate models, execute engineering workflows, and verify software changes
          with evidence — model intelligence, execution control, and cost-aware
          verification in one workflow.
        </p>

        <div
          style={{
            display: "flex",
            gap: "13px",
            justifyContent: "center",
            flexWrap: "wrap",
            marginBottom: "30px",
          }}
        >
          <Button variant="primary" size="lg" href="#cta">
            Start orchestrating
          </Button>
          <Button variant="secondary" size="lg" href="#walkthrough">
            See how it works
          </Button>
        </div>

        <div
          style={{
            display: "flex",
            gap: "10px",
            flexWrap: "wrap",
            alignItems: "center",
            justifyContent: "center",
            fontFamily: "var(--font-mono)",
            fontSize: "12px",
            color: "var(--text-muted)",
          }}
        >
          {proofPoints.map((p, i) => (
            <span
              key={p}
              style={{ display: "inline-flex", alignItems: "center", gap: "10px" }}
            >
              {i > 0 && <span style={{ color: "var(--text-faint)" }}>·</span>}
              <span style={{ color: "var(--success)", marginRight: "6px" }}>✓</span>
              {p}
            </span>
          ))}
        </div>
      </div>
    </section>
  );
}
