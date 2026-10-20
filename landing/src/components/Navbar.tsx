import { useEffect, useState } from "react";
import { Button } from "./Button";

const navLinks = [
  { label: "Platform", href: "#walkthrough" },
  { label: "Features", href: "#features" },
  { label: "Demo", href: "#demo" },
  { label: "Benefits", href: "#benefits" },
];

export function Navbar() {
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <header
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        right: 0,
        zIndex: 100,
        transition: "all var(--transition)",
        background: scrolled ? "rgba(10,14,18,0.85)" : "transparent",
        backdropFilter: scrolled ? "blur(20px)" : "none",
        borderBottom: scrolled ? "1px solid var(--border-subtle)" : "1px solid transparent",
      }}
    >
      <nav
        style={{
          maxWidth: "1200px",
          margin: "0 auto",
          padding: "16px 24px",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
        }}
      >
        <a href="#" style={{ display: "flex", alignItems: "center", gap: "10px" }}>
          <Logo />
          <span
            style={{
              fontSize: "17px",
              fontWeight: 600,
              letterSpacing: "-0.02em",
              color: "var(--text-primary)",
            }}
          >
            Zyntry<span style={{ color: "var(--accent)" }}> Code</span>
          </span>
        </a>

        <div style={{ display: "flex", alignItems: "center", gap: "32px" }}>
          <div className="nav-links" style={{ display: "flex", gap: "28px" }}>
            {navLinks.map((link) => (
              <a
                key={link.href}
                href={link.href}
                style={{
                  fontSize: "14px",
                  fontWeight: 500,
                  color: "var(--text-secondary)",
                  transition: "color var(--transition)",
                }}
                onMouseEnter={(e) => (e.currentTarget.style.color = "var(--text-primary)")}
                onMouseLeave={(e) => (e.currentTarget.style.color = "var(--text-secondary)")}
              >
                {link.label}
              </a>
            ))}
          </div>
          <div style={{ display: "flex", gap: "12px", alignItems: "center" }}>
            <Button variant="ghost" size="md" href="#cta">
              Sign in
            </Button>
            <Button variant="primary" size="md" href="#cta">
              Get started
            </Button>
          </div>
        </div>

        <button
          className="mobile-toggle"
          onClick={() => setMobileOpen(!mobileOpen)}
          style={{
            display: "none",
            background: "var(--bg-elevated)",
            border: "1px solid var(--border-default)",
            borderRadius: "var(--radius-sm)",
            padding: "8px 12px",
            color: "var(--text-primary)",
          }}
          aria-label="Toggle menu"
        >
          {mobileOpen ? "Close" : "Menu"}
        </button>
      </nav>

      {mobileOpen && (
        <div
          className="mobile-menu"
          style={{
            background: "var(--bg-surface)",
            borderBottom: "1px solid var(--border-default)",
            padding: "20px 24px",
            display: "flex",
            flexDirection: "column",
            gap: "16px",
          }}
        >
          {navLinks.map((link) => (
            <a
              key={link.href}
              href={link.href}
              onClick={() => setMobileOpen(false)}
              style={{
                fontSize: "15px",
                color: "var(--text-secondary)",
                padding: "8px 0",
              }}
            >
              {link.label}
            </a>
          ))}
          <div style={{ display: "flex", gap: "12px", marginTop: "8px" }}>
            <Button variant="secondary" size="md" href="#cta">Sign in</Button>
            <Button variant="primary" size="md" href="#cta">Get started</Button>
          </div>
        </div>
      )}
    </header>
  );
}

function Logo() {
  return (
    <svg width="28" height="28" viewBox="0 0 32 32" fill="none">
      <rect width="32" height="32" rx="7" fill="var(--bg-elevated)" stroke="var(--border-default)" />
      <path
        d="M11 9 L6 16 L11 23"
        stroke="var(--accent)"
        strokeWidth="2.5"
        fill="none"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M21 9 L26 16 L21 23"
        stroke="var(--accent)"
        strokeWidth="2.5"
        fill="none"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path d="M18 7 L14 25" stroke="var(--accent)" strokeWidth="2" fill="none" strokeLinecap="round" opacity="0.4" />
    </svg>
  );
}
