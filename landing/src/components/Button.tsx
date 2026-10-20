import { type ButtonHTMLAttributes, type ReactNode } from "react";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "ghost";
  size?: "md" | "lg";
  icon?: ReactNode;
  href?: string;
}

export function Button({
  variant = "primary",
  size = "md",
  icon,
  children,
  href,
  ...props
}: ButtonProps) {
  const base: React.CSSProperties = {
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    gap: "8px",
    fontFamily: "var(--font-sans)",
    fontWeight: 500,
    borderRadius: "var(--radius-md)",
    transition: "all var(--transition)",
    whiteSpace: "nowrap",
    cursor: "pointer",
    border: "none",
    textDecoration: "none",
    fontSize: size === "lg" ? "16px" : "14px",
    padding: size === "lg" ? "14px 28px" : "11px 22px",
    letterSpacing: "-0.01em",
  };

  const variants: Record<string, React.CSSProperties> = {
    primary: {
      background: "var(--accent)",
      color: "#0A0E12",
      boxShadow: "0 0 0 1px rgba(103,232,249,0.3), 0 8px 24px -8px rgba(103,232,249,0.4)",
    },
    secondary: {
      background: "var(--bg-elevated)",
      color: "var(--text-primary)",
      border: "1px solid var(--border-default)",
    },
    ghost: {
      background: "transparent",
      color: "var(--text-secondary)",
    },
  };

  const hoverStyles: Record<string, React.CSSProperties> = {
    primary: {
      background: "#7DEEFB",
      boxShadow: "0 0 0 1px rgba(103,232,249,0.5), 0 12px 32px -8px rgba(103,232,249,0.55)",
    },
    secondary: {
      background: "var(--bg-elevated-hover)",
      border: "1px solid var(--border-strong)",
    },
    ghost: {
      color: "var(--text-primary)",
    },
  };

  const content = (
    <>
      {children}
      {icon}
    </>
  );

  if (href) {
    return (
      <a
        href={href}
        style={{ ...base, ...variants[variant] }}
        onMouseEnter={(e) => Object.assign(e.currentTarget.style, hoverStyles[variant])}
        onMouseLeave={(e) => Object.assign(e.currentTarget.style, { ...variants[variant] })}
      >
        {content}
      </a>
    );
  }

  return (
    <button
      style={{ ...base, ...variants[variant] }}
      onMouseEnter={(e) => Object.assign(e.currentTarget.style, hoverStyles[variant])}
      onMouseLeave={(e) => Object.assign(e.currentTarget.style, { ...variants[variant] })}
      {...props}
    >
      {content}
    </button>
  );
}
