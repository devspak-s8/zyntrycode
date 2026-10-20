import { Button } from "./Button";
import { Badge } from "./Badge";
import { ProductPreview } from "./ProductPreview";

export function Hero() {
  return (
    <section
      style={{
        position: "relative",
        paddingTop: "140px",
        paddingBottom: "80px",
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
          background: "radial-gradient(ellipse at center, rgba(103,232,249,0.08) 0%, transparent 60%)",
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
          maskImage: "radial-gradient(ellipse 80% 50% at 50% 30%, black 40%, transparent 100%)",
          WebkitMaskImage: "radial-gradient(ellipse 80% 50% at 50% 30%, black 40%, transparent 100%)",
          pointerEvents: "none",
          zIndex: 0,
        }}
      />

      <div
        style={{
          maxWidth: "1200px",
          margin: "0 auto",
          padding: "0 24px",
          position: "relative",
          zIndex: 1,
        }}
      >
        {/* Announcement badge */}
        <div style={{ textAlign: "center", marginBottom: "32px" }}>
          <a href="#walkthrough">
            <div
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "10px",
                padding: "6px 16px 6px 8px",
                background: "var(--bg-elevated)",
                border: "1px solid var(--border-default)",
                borderRadius: "100px",
                fontSize: "13px",
                color: "var(--text-secondary)",
                transition: "all var(--transition)",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.borderColor = "var(--border-strong)";
                e.currentTarget.style.background = "var(--bg-elevated-hover)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.borderColor = "var(--border-default)";
                e.currentTarget.style.background = "var(--bg-elevated)";
              }}
            >
              <Badge variant="accent" dot>New</Badge>
              <span>Orchestration engine v2 — dependency-aware routing</span>
              <span style={{ color: "var(--text-muted)", fontSize: "14px" }}>→</span>
            </div>
          </a>
        </div>

        <h1
          style={{
            fontSize: "clamp(36px, 6vw, 64px)",
            fontWeight: 600,
            lineHeight: 1.08,
            letterSpacing: "-0.03em",
            textAlign: "center",
            maxWidth: "900px",
            margin: "0 auto 28px",
            color: "var(--text-primary)",
          }}
        >
          AI that doesn't stop at{" "}
          <span style={{ color: "var(--accent)" }}>writing code.</span>
        </h1>

        <p
          style={{
            fontSize: "clamp(17px, 2vw, 20px)",
            lineHeight: 1.6,
            color: "var(--text-secondary)",
            textAlign: "center",
            maxWidth: "680px",
            margin: "0 auto 40px",
            letterSpacing: "-0.01em",
          }}
        >
          Coordinate AI models, execute engineering workflows, and verify software changes
          with evidence. Zyntry Code brings model intelligence, execution control, and
          cost-aware verification into one engineering workflow.
        </p>

        <div
          style={{
            display: "flex",
            gap: "14px",
            justifyContent: "center",
            marginBottom: "72px",
            flexWrap: "wrap",
          }}
        >
          <Button variant="primary" size="lg" href="#cta">
            Start orchestrating
          </Button>
          <Button variant="secondary" size="lg" href="#demo">
            See it in action
          </Button>
        </div>

        <ProductPreview />
      </div>
    </section>
  );
}
