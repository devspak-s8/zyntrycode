import { type ButtonHTMLAttributes, type ReactNode } from "react";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "ghost" | "white";
  size?: "md" | "lg";
  icon?: ReactNode;
  href?: string;
  target?: string;
  rel?: string;
  pill?: boolean;
}

export function Button({
  variant = "primary",
  size = "md",
  icon,
  children,
  href,
  pill = false,
  ...props
}: ButtonProps) {
  const base: React.CSSProperties = {
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    gap: "8px",
    fontFamily: "var(--font-sans)",
    fontWeight: 500,
    borderRadius: pill ? "999px" : "var(--radius-md)",
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
      color: "#0D1217",
      boxShadow: "0 0 0 1px rgba(147,197,253,0.3), 0 8px 24px -8px rgba(147,197,253,0.4)",
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
    white: {
      background: "#FFFFFF",
      color: "#0D1217",
      border: "1px solid rgba(255,255,255,0.3)",
      boxShadow: "0 4px 14px -2px rgba(0,0,0,0.45)",
    },
  };

  const hoverStyles: Record<string, React.CSSProperties> = {
    primary: {
      background: "#A9D2FD",
      boxShadow: "0 0 0 1px rgba(147,197,253,0.5), 0 12px 32px -8px rgba(147,197,253,0.55)",
    },
    secondary: {
      background: "var(--bg-elevated-hover)",
      border: "1px solid var(--border-strong)",
    },
    ghost: {
      color: "var(--text-primary)",
    },
    white: {
      background: "#E4E4E7",
      border: "1px solid rgba(255,255,255,0.4)",
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
        {...(props as React.AnchorHTMLAttributes<HTMLAnchorElement>)}
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
