import { type ReactNode } from "react";

interface BadgeProps {
  children: ReactNode;
  variant?: "default" | "accent" | "success" | "warning" | "error" | "info";
  dot?: boolean;
}

export function Badge({ children, variant = "default", dot = false }: BadgeProps) {
  const styles: Record<string, React.CSSProperties> = {
    default: {
      background: "var(--bg-elevated)",
      color: "var(--text-secondary)",
      border: "1px solid var(--border-default)",
    },
    accent: {
      background: "var(--accent-glow)",
      color: "var(--accent)",
      border: "1px solid rgba(103,232,249,0.25)",
    },
    success: {
      background: "var(--success-dim)",
      color: "var(--success)",
      border: "1px solid rgba(74,222,128,0.2)",
    },
    warning: {
      background: "var(--warning-dim)",
      color: "var(--warning)",
      border: "1px solid rgba(251,191,36,0.2)",
    },
    error: {
      background: "var(--error-dim)",
      color: "var(--error)",
      border: "1px solid rgba(248,113,113,0.2)",
    },
    info: {
      background: "var(--info-dim)",
      color: "var(--info)",
      border: "1px solid rgba(96,165,250,0.2)",
    },
  };

  const dotColors: Record<string, string> = {
    default: "var(--text-muted)",
    accent: "var(--accent)",
    success: "var(--success)",
    warning: "var(--warning)",
    error: "var(--error)",
    info: "var(--info)",
  };

  return (
    <span
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: "6px",
        padding: "4px 10px",
        fontSize: "12px",
        fontWeight: 500,
        fontFamily: "var(--font-mono)",
        borderRadius: "var(--radius-sm)",
        letterSpacing: "0.02em",
        ...styles[variant],
      }}
    >
      {dot && (
        <span
          style={{
            width: "6px",
            height: "6px",
            borderRadius: "50%",
            background: dotColors[variant],
            boxShadow: `0 0 8px ${dotColors[variant]}`,
          }}
        />
      )}
      {children}
    </span>
  );
}
