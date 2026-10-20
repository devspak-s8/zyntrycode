const footerLinks = [
  {
    title: "Platform",
    links: [
      { label: "How it works", href: "#/how-it-works" },
      { label: "Features", href: "#/features" },
      { label: "Environments", href: "#/environments" },
    ],
  },
  {
    title: "Resources",
    links: [
      { label: "Documentation", href: "#/docs" },
      { label: "Model routing guide", href: "#/routing" },
      { label: "VS Code extension", href: "#/extension" },
    ],
  },
  {
    title: "Company",
    links: [
      { label: "Get started", href: "#/get-started" },
      { label: "Security", href: "#/security" },
    ],
  },
];

export function Footer() {
  return (
    <footer
      style={{
        borderTop: "1px solid var(--border-subtle)",
        background: "var(--bg-surface)",
        padding: "64px 24px 32px",
      }}
    >
      <div
        style={{
          maxWidth: "1200px",
          margin: "0 auto",
        }}
      >
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "2fr 1fr 1fr 1fr",
            gap: "48px",
            marginBottom: "48px",
          }}
          className="footer-grid"
        >
          {/* Brand */}
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "16px" }}>
              <svg width="24" height="24" viewBox="0 0 32 32" fill="none">
                <rect width="32" height="32" rx="7" fill="var(--bg-elevated)" stroke="var(--border-default)" />
                <path d="M11 9 L6 16 L11 23" stroke="var(--accent)" strokeWidth="2.5" fill="none" strokeLinecap="round" strokeLinejoin="round" />
                <path d="M21 9 L26 16 L21 23" stroke="var(--accent)" strokeWidth="2.5" fill="none" strokeLinecap="round" strokeLinejoin="round" />
                <path d="M18 7 L14 25" stroke="var(--accent)" strokeWidth="2" fill="none" strokeLinecap="round" opacity="0.4" />
              </svg>
              <span style={{ fontSize: "16px", fontWeight: 600, color: "var(--text-primary)" }}>
                Zyntry<span style={{ color: "var(--accent)" }}> Code</span>
              </span>
            </div>
            <p
              style={{
                fontSize: "14px",
                lineHeight: 1.6,
                color: "var(--text-muted)",
                maxWidth: "280px",
              }}
            >
              AI engineering orchestration — coordinate models, execute workflows, and verify
              changes with evidence.
            </p>
          </div>

          {/* Link columns */}
          {footerLinks.map((col) => (
            <div key={col.title}>
              <div
                style={{
                  fontSize: "12px",
                  fontFamily: "var(--font-mono)",
                  fontWeight: 600,
                  color: "var(--text-muted)",
                  textTransform: "uppercase",
                  letterSpacing: "0.1em",
                  marginBottom: "16px",
                }}
              >
                {col.title}
              </div>
              <ul style={{ listStyle: "none", padding: 0, margin: 0, display: "flex", flexDirection: "column", gap: "10px" }}>
                {col.links.map((link) => {
                  const external = link.href.startsWith("http");
                  return (
                    <li key={link.label}>
                      <a
                        href={link.href}
                        target={external ? "_blank" : undefined}
                        rel={external ? "noreferrer noopener" : undefined}
                        style={{
                          fontSize: "14px",
                          color: "var(--text-secondary)",
                          transition: "color var(--transition)",
                        }}
                        onMouseEnter={(e) => (e.currentTarget.style.color = "var(--text-primary)")}
                        onMouseLeave={(e) => (e.currentTarget.style.color = "var(--text-secondary)")}
                      >
                        {link.label}
                      </a>
                    </li>
                  );
                })}
              </ul>
            </div>
          ))}
        </div>

        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            paddingTop: "32px",
            borderTop: "1px solid var(--border-subtle)",
            flexWrap: "wrap",
            gap: "12px",
          }}
        >
          <div
            style={{
              fontSize: "13px",
              color: "var(--text-muted)",
              fontFamily: "var(--font-mono)",
            }}
          >
            © 2026 Zyntry Code. All rights reserved.
          </div>
          <div
            style={{
              display: "flex",
              gap: "20px",
              fontSize: "13px",
              color: "var(--text-muted)",
              fontFamily: "var(--font-mono)",
            }}
          >
            <a href="#" style={{ color: "var(--text-muted)", transition: "color var(--transition)" }}
              onMouseEnter={(e) => (e.currentTarget.style.color = "var(--text-primary)")}
              onMouseLeave={(e) => (e.currentTarget.style.color = "var(--text-muted)")}
            >
              Privacy
            </a>
            <a href="#" style={{ color: "var(--text-muted)", transition: "color var(--transition)" }}
              onMouseEnter={(e) => (e.currentTarget.style.color = "var(--text-primary)")}
              onMouseLeave={(e) => (e.currentTarget.style.color = "var(--text-muted)")}
            >
              Terms
            </a>
            <a href="#/security" style={{ color: "var(--text-muted)", transition: "color var(--transition)" }}
              onMouseEnter={(e) => (e.currentTarget.style.color = "var(--text-primary)")}
              onMouseLeave={(e) => (e.currentTarget.style.color = "var(--text-muted)")}
            >
              Security
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
}
