import { type CSSProperties, type ReactNode } from "react";

interface SectionProps {
  id?: string;
  children: ReactNode;
  style?: CSSProperties;
  className?: string;
}

export function Section({ id, children, style, className }: SectionProps) {
  return (
    <section
      id={id}
      className={className}
      style={{
        position: "relative",
        padding: "120px 24px",
        ...style,
      }}
    >
      <div
        style={{
          maxWidth: "1200px",
          margin: "0 auto",
        }}
      >
        {children}
      </div>
    </section>
  );
}

interface SectionHeadingProps {
  eyebrow: string;
  title: string;
  description?: string;
  align?: "left" | "center";
}

export function SectionHeading({
  eyebrow,
  title,
  description,
  align = "left",
}: SectionHeadingProps) {
  return (
    <div
      style={{
        textAlign: align,
        maxWidth: align === "center" ? "720px" : "none",
        margin: align === "center" ? "0 auto 64px" : "0 0 64px",
      }}
    >
      <div
        style={{
          fontFamily: "var(--font-mono)",
          fontSize: "12px",
          fontWeight: 600,
          letterSpacing: "0.12em",
          textTransform: "uppercase",
          color: "var(--accent)",
          marginBottom: "16px",
        }}
      >
        {eyebrow}
      </div>
      <h2
        style={{
          fontSize: "clamp(28px, 4vw, 42px)",
          fontWeight: 600,
          lineHeight: 1.15,
          letterSpacing: "-0.02em",
          color: "var(--text-primary)",
          marginBottom: description ? "20px" : 0,
        }}
      >
        {title}
      </h2>
      {description && (
        <p
          style={{
            fontSize: "18px",
            lineHeight: 1.6,
            color: "var(--text-secondary)",
            maxWidth: "640px",
            margin: align === "center" ? "0 auto" : undefined,
          }}
        >
          {description}
        </p>
      )}
    </div>
  );
}
