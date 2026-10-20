import { useEffect, useState } from "react";
import { Button } from "./Button";

const navLinks = [
  { label: "How it works", href: "#walkthrough" },
  { label: "Features", href: "#features" },
  { label: "Environments", href: "#environments" },
];

export function Navbar() {
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    if (!mobileOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setMobileOpen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [mobileOpen]);

  return (
    <header className={`site-header${scrolled ? " scrolled" : ""}`}>
      <nav className="site-nav">
        {/* Left: brand */}
        <a href="#" className="brand">
          <Logo />
          <span className="brand-name">
            Zyntry<span style={{ color: "var(--accent)" }}> Code</span>
          </span>
        </a>

        {/* Center: links */}
        <div className="nav-links">
          {navLinks.map((link) => (
            <a key={link.href} href={link.href} className="nav-link">
              {link.label}
            </a>
          ))}
        </div>

        {/* Right: CTA + mobile toggle */}
        <div className="nav-right">
          <div className="nav-actions" style={{ display: "flex" }}>
            <Button variant="white" pill size="md" href="#cta">
              Get started
            </Button>
          </div>
          <button
            className="mobile-toggle"
            onClick={() => setMobileOpen(!mobileOpen)}
            aria-expanded={mobileOpen}
            aria-label={mobileOpen ? "Close menu" : "Open menu"}
          >
            {mobileOpen ? (
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                <path d="M6 6 L18 18" />
                <path d="M18 6 L6 18" />
              </svg>
            ) : (
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                <path d="M4 7 L20 7" />
                <path d="M4 12 L20 12" />
                <path d="M4 17 L20 17" />
              </svg>
            )}
          </button>
        </div>
      </nav>

      {mobileOpen && (
        <div className="mobile-menu">
          {navLinks.map((link) => (
            <a
              key={link.href}
              href={link.href}
              className="mobile-link"
              onClick={() => setMobileOpen(false)}
            >
              {link.label}
            </a>
          ))}
          <div style={{ marginTop: "10px" }}>
            <Button variant="white" pill size="md" href="#cta">
              Get started
            </Button>
          </div>
        </div>
      )}
    </header>
  );
}

function Logo() {
  return (
    <svg className="brand-mark" width="28" height="28" viewBox="0 0 32 32" fill="none">
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
