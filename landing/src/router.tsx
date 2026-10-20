import { useEffect, useState, type ReactNode } from "react";
import { Navbar } from "./components/Navbar";
import { Footer } from "./components/Footer";

export type Route = "" | "how-it-works" | "features" | "environments" | "docs" | "routing" | "extension" | "get-started" | "sign-in" | "contact" | "security";

export function normalizeHash(): Route {
  const raw = window.location.hash.replace(/^#\/?/, "");
  const slug = raw.split("?")[0].toLowerCase();
  const known: Route[] = [
    "how-it-works", "features", "environments", "docs", "routing",
    "extension", "get-started", "sign-in", "contact", "security",
  ];
  return known.includes(slug as Route) ? (slug as Route) : "";
}

export function useRoute(): Route {
  const [route, setRoute] = useState<Route>(() => normalizeHash());
  useEffect(() => {
    const onChange = () => {
      setRoute(normalizeHash());
      if (normalizeHash() === "") window.scrollTo({ top: 0 });
    };
    window.addEventListener("hashchange", onChange);
    return () => window.removeEventListener("hashchange", onChange);
  }, []);
  return route;
}

export function navigate(path: string) {
  window.location.hash = `/${path}`;
}

export function PageShell({
  title,
  kicker,
  children,
}: {
  title: string;
  kicker?: string;
  children: ReactNode;
}) {
  useEffect(() => {
    window.scrollTo({ top: 0 });
  }, []);
  return (
    <>
      <Navbar />
      <main
        style={{
          maxWidth: "960px",
          margin: "0 auto",
          padding: "140px 24px 96px",
        }}
      >
        <header style={{ marginBottom: "48px" }}>
          {kicker && (
            <div
              style={{
                fontFamily: "var(--font-mono)",
                fontSize: "12px",
                letterSpacing: "0.14em",
                textTransform: "uppercase",
                color: "var(--accent)",
                marginBottom: "12px",
              }}
            >
              {kicker}
            </div>
          )}
          <h1
            style={{
              fontSize: "38px",
              fontWeight: 700,
              letterSpacing: "-0.03em",
              lineHeight: 1.15,
              color: "var(--text-primary)",
              margin: 0,
            }}
          >
            {title}
          </h1>
        </header>
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            gap: "40px",
            fontSize: "15px",
            lineHeight: 1.7,
            color: "var(--text-secondary)",
          }}
        >
          {children}
        </div>
      </main>
      <Footer />
    </>
  );
}

export function PageSection({
  heading,
  children,
}: {
  heading: string;
  children: ReactNode;
}) {
  return (
    <section>
      <h2
        style={{
          fontSize: "22px",
          fontWeight: 650,
          letterSpacing: "-0.02em",
          color: "var(--text-primary)",
          margin: "0 0 12px",
        }}
      >
        {heading}
      </h2>
      <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>{children}</div>
    </section>
  );
}

export function Note({
  label,
  children,
}: {
  label: string;
  children: ReactNode;
}) {
  return (
    <div
      style={{
        background: "var(--bg-elevated)",
        border: "1px solid var(--border-default)",
        borderRadius: "var(--radius-md)",
        padding: "16px 20px",
        fontSize: "14px",
      }}
    >
      <span style={{ fontFamily: "var(--font-mono)", color: "var(--accent)", fontWeight: 600 }}>
        {label}
      </span>{" "}
      {children}
    </div>
  );
}