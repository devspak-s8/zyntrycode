import React from "react";
import { AbsoluteFill, useCurrentFrame } from "remotion";
import {
  arb1,
  arb2,
  arbiterModel,
  final,
  finalUnverified,
  repair1,
  repair2,
  round1,
  round2,
  stages,
  taskMeta,
  taskPrompt,
  type Arbitrated,
  type ReviewerVerdict,
} from "./data";

/* ------------------------------------------------------------------ */
/* Theme + helpers                                                      */
/* ------------------------------------------------------------------ */

export type Theme = "dark" | "light";

type Palette = {
  bg: string;
  panel: string;
  border: string;
  text: string;
  dim: string;
  faint: string;
  green: string;
  red: string;
  redBg: string;
  amber: string;
  blue: string;
  blueBg: string;
  greenBg: string;
  grayBg: string;
};

const palettes: Record<Theme, Palette> = {
  dark: {
    bg: "#0A0F0D",
    panel: "#121917",
    border: "#1E2A25",
    text: "#F2F6F4",
    dim: "#A3AEAA",
    faint: "#6F7B77",
    green: "#55E6A5",
    red: "#FF7D7D",
    redBg: "#2A161A",
    amber: "#F4C76A",
    blue: "#82B9FF",
    blueBg: "#16233A",
    greenBg: "#0E2A1C",
    grayBg: "#1A211E",
  },
  light: {
    bg: "#F5F7F6",
    panel: "#FFFFFF",
    border: "#D8E0DC",
    text: "#101513",
    dim: "#52605B",
    faint: "#7C8A85",
    green: "#0F7A4B",
    red: "#C2352E",
    redBg: "#FBEAE8",
    amber: "#8A5A00",
    blue: "#1C5DBE",
    blueBg: "#E7EFFA",
    greenBg: "#E5F5EC",
    grayBg: "#EDF1EF",
  },
};

const easeOut = (t: number) => 1 - Math.pow(1 - t, 3);
const prog = (frame: number, start: number, dur: number) =>
  easeOut(Math.min(1, Math.max(0, (frame - start) / dur)));

const truncate = (s: string, n: number) =>
  s.length > n ? s.slice(0, n - 1) + "…" : s;

const verdictColor = (c: Palette, v: string) =>
  v === "approve" ? c.green : v === "reject" ? c.red : v === "concerns" ? c.amber : c.faint;

const roleColor = (c: Palette, role: string) =>
  role === "security" ? c.red : role === "integration" ? c.blue : c.dim;

const mono = {
  fontFamily: "'Consolas', 'Courier New', monospace",
} as const;

const Scene: React.FC<{ c: Palette; children: React.ReactNode }> = ({ c, children }) => (
  <AbsoluteFill
    style={{
      background: c.bg,
      color: c.text,
      fontFamily: "'Segoe UI', system-ui, sans-serif",
      padding: 80,
    }}
  >
    {children}
  </AbsoluteFill>
);

const FadeIn: React.FC<{
  p: number;
  delay?: number;
  y?: number;
  children: React.ReactNode;
}> = ({ p, delay = 0, y = 24, children }) => (
  <div
    style={{
      opacity: prog(p, delay, 22),
      transform: `translateY(${(1 - prog(p, delay, 22)) * y}px)`,
    }}
  >
    {children}
  </div>
);

const Header: React.FC<{ c: Palette; kicker: string; title: string; p: number }> = ({
  c,
  kicker,
  title,
  p,
}) => (
  <FadeIn p={p}>
    <div style={{ fontSize: 22, letterSpacing: 4, color: c.dim, textTransform: "uppercase", fontWeight: 600 }}>
      {kicker}
    </div>
    <div style={{ fontSize: 46, fontWeight: 700, marginTop: 6 }}>{title}</div>
    <div style={{ height: 2, width: 240, background: c.green, marginTop: 14, borderRadius: 2 }} />
  </FadeIn>
);

const Chip: React.FC<{
  c: Palette;
  p: number;
  start: number;
  children: React.ReactNode;
  color?: string;
  bg?: string;
}> = ({ c, p, start, children, color, bg }) => (
  <div
    style={{
      opacity: prog(p, start, 18),
      transform: `translateY(${(1 - prog(p, start, 18)) * 14}px)`,
      ...mono,
      fontSize: 20,
      color: color ?? c.blue,
      background: bg ?? c.blueBg,
      border: `1px solid ${(color ?? c.blue)}55`,
      borderRadius: 999,
      padding: "9px 20px",
    }}
  >
    {children}
  </div>
);

/* ------------------------------------------------------------------ */
/* Scenes                                                              */
/* ------------------------------------------------------------------ */

const Intro: React.FC<{ frame: number; c: Palette }> = ({ frame, c }) => {
  const p = frame;
  return (
    <Scene c={c}>
      <AbsoluteFill style={{ alignItems: "center", justifyContent: "center" }}>
        <FadeIn p={p} delay={6} y={40}>
          <div style={{ textAlign: "center" }}>
            <div style={{ ...mono, fontSize: 26, letterSpacing: 10, color: c.green }}>
              ZYNTRY&nbsp;CODE
            </div>
            <div style={{ fontSize: 72, fontWeight: 800, marginTop: 18, lineHeight: 1.1 }}>
              Cross-Model Consensus Review
            </div>
            <div style={{ fontSize: 30, color: c.dim, marginTop: 16 }}>
              A real production run, replayed frame by frame
            </div>
          </div>
        </FadeIn>
        <div style={{ display: "flex", gap: 18, marginTop: 46 }}>
          {[
            "3 reviewers · 3 priorities",
            "an arbiter classifies every objection",
            "dissent preserved, never averaged",
          ].map((chip, i) => (
            <Chip key={chip} c={c} p={p} start={55 + i * 12} color={c.green} bg={c.greenBg}>
              {chip}
            </Chip>
          ))}
        </div>
        <div
          style={{
            position: "absolute",
            bottom: 70,
            fontSize: 20,
            color: c.faint,
            opacity: prog(p, 90, 25),
          }}
        >
          every event below is real API output from code-api.zyntry.space — nothing scripted
        </div>
      </AbsoluteFill>
    </Scene>
  );
};

const PromptScene: React.FC<{ frame: number; c: Palette }> = ({ frame, c }) => {
  const start = 150;
  const p = frame - start;
  const chars = Math.floor(prog(p, 10, 120) * taskPrompt.length);
  const cons = taskMeta.constraints;
  return (
    <Scene c={c}>
      <Header c={c} kicker="The task" title="One prompt in" p={p} />
      <FadeIn p={p} delay={40}>
        <div
          style={{
            marginTop: 42,
            background: c.panel,
            border: `1px solid ${c.border}`,
            borderRadius: 16,
            padding: "30px 40px",
            fontSize: 32,
            lineHeight: 1.45,
            maxWidth: 1560,
          }}
        >
          <span style={{ ...mono, color: c.green, marginRight: 16 }}>❯</span>
          {taskPrompt.slice(0, chars)}
          {chars < taskPrompt.length && <span style={{ color: c.green }}>▌</span>}
        </div>
      </FadeIn>
      <div style={{ display: "flex", gap: 14, marginTop: 30 }}>
        {[
          `mode: ${cons.mode ?? "agent"}`,
          `routing: ${cons.routing_mode ?? "balanced"}`,
          `consensus: ${String(cons.consensus ?? true)}`,
          `budget: $${cons.budget_usd ?? "—"}`,
        ].map((chip, i) => (
          <Chip key={chip} c={c} p={p} start={90 + i * 12}>
            {chip}
          </Chip>
        ))}
      </div>
      <FadeIn p={p} delay={130}>
        <div style={{ marginTop: 28, display: "flex", gap: 22, fontSize: 24 }}>
          <span style={{ color: c.dim }}>
            risk assessment:{" "}
            <span style={{ fontWeight: 700, color: c.text }}>{taskMeta.risk}</span>
          </span>
          <span style={{ color: c.dim }}>
            final status:{" "}
            <span style={{ fontWeight: 700, color: c.text }}>{taskMeta.status}</span>
          </span>
          <span style={{ color: c.faint }}>
            the plan is decomposed into a stage DAG before anything runs
          </span>
        </div>
      </FadeIn>
    </Scene>
  );
};

const StagesScene: React.FC<{ frame: number; c: Palette }> = ({ frame, c }) => {
  const start = 330;
  const p = frame - start;
  const unverifiedCount = stages.filter((s) => s.checks).length;
  return (
    <Scene c={c}>
      <Header c={c} kicker="The pipeline" title="8 stages, routed per capability" p={p} />
      <div style={{ marginTop: 32, display: "flex", flexDirection: "column", gap: 10 }}>
        {stages.map((s, i) => {
          const appear = prog(p, 10 + i * 48, 22);
          const done = prog(p, 40 + i * 48, 18);
          return (
            <div
              key={i}
              style={{
                opacity: appear,
                transform: `translateX(${(1 - appear) * -60}px)`,
                display: "flex",
                alignItems: "center",
                gap: 22,
                background: done > 0.99 ? c.greenBg : c.panel,
                border: `1px solid ${done > 0.99 ? `${c.green}66` : c.border}`,
                borderRadius: 12,
                padding: "10px 24px",
                maxWidth: 1600,
              }}
            >
              <div style={{ ...mono, width: 110, fontSize: 17, color: c.faint, textTransform: "uppercase" }}>
                {s.kind}
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 25, fontWeight: 600 }}>{s.title}</div>
                {s.checks && (
                  <div style={{ fontSize: 16, color: c.amber, ...mono, marginTop: 1 }}>
                    checks unavailable (no sandbox): {s.checks}
                  </div>
                )}
              </div>
              <div style={{ ...mono, fontSize: 18, color: c.dim }}>{s.model}</div>
              <div
                style={{
                  width: 28,
                  height: 28,
                  borderRadius: 999,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  background: done > 0.99 ? c.green : "transparent",
                  color: c.bg,
                  fontSize: 17,
                  fontWeight: 800,
                }}
              >
                {done > 0.99 ? "✓" : ""}
              </div>
            </div>
          );
        })}
      </div>
      <FadeIn p={p} delay={390}>
        <div style={{ marginTop: 22, fontSize: 22, color: c.amber }}>
          {unverifiedCount} checks could not run (no repo sandbox attached) — they stay visible, never claimed verified
        </div>
      </FadeIn>
    </Scene>
  );
};

const ReviewerCard: React.FC<{
  c: Palette;
  r: ReviewerVerdict;
  appear: number;
  compact?: boolean;
}> = ({ c, r, appear, compact }) => {
  const reasons = r.verdict === "unavailable" ? [] : r.reasons.slice(0, compact ? 2 : 2);
  const evidence = r.evidence.slice(0, 1);
  return (
    <div
      style={{
        opacity: appear,
        transform: `translateY(${(1 - appear) * 30}px)`,
        flex: 1,
        background: c.panel,
        border: `1px solid ${verdictColor(c, r.verdict)}55`,
        borderRadius: 14,
        padding: "24px 28px",
        minHeight: compact ? 190 : 280,
      }}
    >
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <span
          style={{
            fontSize: 17,
            textTransform: "uppercase",
            letterSpacing: 3,
            color: roleColor(c, r.role),
            fontWeight: 700,
          }}
        >
          {r.role}
        </span>
        <span style={{ ...mono, fontSize: 16, color: c.faint }}>{r.model}</span>
      </div>
      <div
        style={{
          fontSize: compact ? 30 : 42,
          fontWeight: 800,
          marginTop: 12,
          color: verdictColor(c, r.verdict),
          textDecoration: r.verdict === "unavailable" ? "line-through" : "none",
          textDecorationColor: c.faint,
        }}
      >
        {r.verdict}
      </div>
      {reasons.map((reason, i) => (
        <div key={i} style={{ fontSize: compact ? 18 : 21, color: c.dim, marginTop: 8, lineHeight: 1.35 }}>
          {i === 0 ? "“" : "• "}
          {truncate(reason, compact ? 90 : 140)}
          {i === 0 ? "”" : ""}
        </div>
      ))}
      {r.verdict === "unavailable" && (
        <div style={{ fontSize: compact ? 17 : 20, color: c.faint, marginTop: 8, lineHeight: 1.35 }}>
          returned a verdict in a format the panel could not read — recorded honestly, never guessed
        </div>
      )}
      {evidence.length > 0 && (
        <div style={{ ...mono, fontSize: compact ? 15 : 17, color: c.faint, marginTop: 12 }}>
          evidence: {truncate(evidence.join(" · "), compact ? 60 : 80)}
        </div>
      )}
    </div>
  );
};

const Round1Scene: React.FC<{ frame: number; c: Palette }> = ({ frame, c }) => {
  const start = 840;
  const p = frame - start;
  return (
    <Scene c={c}>
      <Header c={c} kicker="Consensus review · round 1" title="Three reviewers, three priorities" p={p} />
      <div style={{ display: "flex", gap: 24, marginTop: 42 }}>
        {round1.map((r, i) => (
          <ReviewerCard key={i} c={c} r={r} appear={prog(p, 15 + i * 14, 24)} />
        ))}
      </div>
      <FadeIn p={p} delay={80}>
        <div style={{ marginTop: 30, fontSize: 22, color: c.faint, ...mono }}>
          verdicts are hidden from each other until submission · every reason must cite the diff ·
          each reviewer sees the same immutable diff + evidence
        </div>
      </FadeIn>
    </Scene>
  );
};

const ArbiterScene: React.FC<{
  frame: number;
  start: number;
  arb: Arbitrated;
  title: string;
  c: Palette;
  footnote?: string;
}> = ({ frame, start, arb, title, c, footnote }) => {
  const p = frame - start;
  const items = arb.classification.slice(0, 5);
  return (
    <Scene c={c}>
      <Header c={c} kicker={`Arbiter · ${arbiterModel}`} title={title} p={p} />
      <FadeIn p={p} delay={10}>
        <div
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: 14,
            marginTop: 30,
            background: c.redBg,
            border: `1px solid ${c.red}66`,
            borderRadius: 999,
            padding: "9px 24px",
            fontSize: 25,
            fontWeight: 700,
            color: c.red,
            ...mono,
          }}
        >
          conclusion: {arb.conclusion}
        </div>
      </FadeIn>
      <div style={{ display: "flex", flexDirection: "column", gap: 12, marginTop: 24 }}>
        {items.map((item, i) => (
          <div
            key={i}
            style={{
              opacity: prog(p, 28 + i * 12, 18),
              transform: `translateX(${(1 - prog(p, 28 + i * 12, 18)) * -40}px)`,
              display: "flex",
              alignItems: "flex-start",
              gap: 18,
              fontSize: 24,
              lineHeight: 1.3,
              maxWidth: 1540,
            }}
          >
            <span style={{ color: c.red, fontWeight: 800, marginTop: 2 }}>●</span>
            <span>
              <span style={{ ...mono, fontSize: 19, color: c.red, marginRight: 12 }}>
                {item.class}
              </span>
              <span style={{ color: c.text }}>{truncate(item.reason, 150)}</span>
            </span>
          </div>
        ))}
        {arb.classification.length > items.length && (
          <div style={{ fontSize: 21, color: c.faint, marginLeft: 38 }}>
            +{arb.classification.length - items.length} more finding
            {arb.classification.length - items.length === 1 ? "" : "s"}
          </div>
        )}
      </div>
      {arb.statement && (
        <FadeIn p={p} delay={85}>
          <div style={{ marginTop: 22, fontSize: 23, color: c.dim, fontStyle: "italic" }}>
            “{truncate(arb.statement, 180)}”
          </div>
        </FadeIn>
      )}
      {footnote && (
        <FadeIn p={p} delay={100}>
          <div style={{ marginTop: 18, fontSize: 19, color: c.faint }}>
            {footnote}
          </div>
        </FadeIn>
      )}
    </Scene>
  );
};

const RepairScene: React.FC<{ frame: number; c: Palette }> = ({ frame, c }) => {
  const start = 1350;
  const p = frame - start;
  return (
    <Scene c={c}>
      <Header c={c} kicker="The loop closes" title="One repair round, then re-review" p={p} />
      <FadeIn p={p} delay={8}>
        <div
          style={{
            marginTop: 36,
            display: "flex",
            alignItems: "center",
            gap: 26,
            fontSize: 27,
            fontWeight: 700,
          }}
        >
          <span style={{ color: c.red }}>{repair1.reasons.length} blocking findings</span>
          <span style={{ color: c.green, fontSize: 34 }}>→</span>
          <span style={{ color: c.green }}>specialist repairs the diff</span>
          <span style={{ color: c.green, fontSize: 34 }}>→</span>
          <span style={{ color: c.blue }}>round 2</span>
        </div>
      </FadeIn>
      <div style={{ marginTop: 22, display: "flex", gap: 14 }}>
        <Chip c={c} p={p} start={30} color={c.green} bg={c.greenBg}>
          repair applied: {String(repair1.applied)}
        </Chip>
        <Chip c={c} p={p} start={42} color={c.green} bg={c.greenBg}>
          repair applied: {String(repair2.applied)}
        </Chip>
      </div>
      <div style={{ display: "flex", gap: 24, marginTop: 30 }}>
        {round2.map((r, i) => (
          <ReviewerCard key={i} c={c} r={r} appear={prog(p, 55 + i * 14, 22)} compact />
        ))}
      </div>
    </Scene>
  );
};

const FinalScene: React.FC<{ frame: number; c: Palette }> = ({ frame, c }) => {
  const start = 1600;
  const p = frame - start;
  const a = final.agreement;
  const showUnverified = finalUnverified.slice(0, 3);
  return (
    <Scene c={c}>
      <Header c={c} kicker={`Arbiter · ${arbiterModel} — round 2`} title="Still blocking after repair" p={p} />
      <div style={{ display: "flex", flexDirection: "column", gap: 8, marginTop: 22 }}>
        {arb2.classification.slice(0, 3).map((item, i) => (
          <div
            key={i}
            style={{
              opacity: prog(p, 6 + i * 10, 16),
              display: "flex",
              alignItems: "center",
              gap: 14,
              fontSize: 22,
              maxWidth: 1560,
            }}
          >
            <span style={{ color: c.red, fontWeight: 800 }}>●</span>
            <span style={{ ...mono, fontSize: 18, color: c.red, width: 210 }}>{item.class}</span>
            <span style={{ color: c.text }}>{truncate(item.reason, 130)}</span>
          </div>
        ))}
      </div>
      <FadeIn p={p} delay={36} y={0}>
        <div
          style={{
            marginTop: 22,
            display: "inline-flex",
            alignItems: "center",
            gap: 22,
            background: c.redBg,
            border: `1px solid ${c.red}77`,
            borderRadius: 16,
            padding: "18px 36px",
          }}
        >
          <span style={{ fontSize: 48, fontWeight: 900, color: c.red, ...mono }}>
            {final.verdict}
          </span>
        </div>
      </FadeIn>
      <div style={{ display: "flex", gap: 18, marginTop: 20 }}>
        {[
          { label: "approve", value: a.approve, color: c.green },
          { label: "concerns", value: a.concerns, color: c.amber },
          { label: "reject", value: a.reject, color: c.red },
          { label: "unavailable", value: 1, color: c.faint },
        ].map((s, i) => (
          <div
            key={s.label}
            style={{
              opacity: prog(p, 60 + i * 10, 16),
              background: c.panel,
              border: `1px solid ${c.border}`,
              borderRadius: 12,
              padding: "10px 28px",
              textAlign: "center",
            }}
          >
            <div style={{ fontSize: 36, fontWeight: 800, color: s.color }}>{s.value}</div>
            <div style={{ ...mono, fontSize: 17, color: c.dim }}>{s.label}</div>
          </div>
        ))}
      </div>
      <FadeIn p={p} delay={95}>
        <div
          style={{
            marginTop: 18,
            fontSize: 20,
            color: c.amber,
            background: c.panel,
            border: `1px solid ${c.amber}44`,
            borderRadius: 12,
            padding: "12px 22px",
            maxWidth: 1560,
          }}
        >
          <span style={{ fontWeight: 700 }}>Verification status (shown separately): </span>
          <span style={{ ...mono }}>{truncate(showUnverified.join(" · "), 160)}</span>
          {finalUnverified.length > showUnverified.length && (
            <span style={{ color: c.dim }}> · +{finalUnverified.length - showUnverified.length} more</span>
          )}
        </div>
      </FadeIn>
      <FadeIn p={p} delay={110}>
        <div style={{ marginTop: 16, fontSize: 21, color: c.dim }}>
          {final.rounds} review rounds ·{" "}
          <span style={{ color: c.amber }}>
            {final.dissent.length} dissent notes recorded — never averaged away
          </span>
          {final.dismissed.length > 0 && (
            <span style={{ color: c.faint }}>
              {" "}· dismissed: {truncate(final.dismissed[0].reason, 80)}
            </span>
          )}
        </div>
      </FadeIn>
    </Scene>
  );
};

const EndScene: React.FC<{ frame: number; c: Palette }> = ({ frame, c }) => {
  const p = frame - 1800;
  return (
    <Scene c={c}>
      <AbsoluteFill style={{ alignItems: "center", justifyContent: "center" }}>
        <div style={{ textAlign: "center" }}>
          <FadeIn p={p} delay={4}>
            <div style={{ fontSize: 64, fontWeight: 800 }}>Consensus is evidence, not proof.</div>
          </FadeIn>
          <FadeIn p={p} delay={40}>
            <div style={{ fontSize: 30, color: c.dim, marginTop: 20 }}>
              Three models can agree and still be wrong.
            </div>
          </FadeIn>
          <div style={{ display: "flex", justifyContent: "center", gap: 18, marginTop: 36 }}>
            {[
              "every reason cites the diff",
              "dissent is recorded, never averaged away",
              "checks that could not run stay visible",
            ].map((chip, i) => (
              <Chip key={chip} c={c} p={p} start={65 + i * 12} color={c.green} bg={c.greenBg}>
                {chip}
              </Chip>
            ))}
          </div>
          <FadeIn p={p} delay={100}>
            <div style={{ marginTop: 40, ...mono, fontSize: 26, letterSpacing: 8, color: c.green }}>
              code.zyntry.space
            </div>
          </FadeIn>
        </div>
      </AbsoluteFill>
    </Scene>
  );
};

/* ------------------------------------------------------------------ */
/* Root                                                                */
/* ------------------------------------------------------------------ */

export const ZyntryDemo: React.FC<{ theme?: Theme }> = ({ theme = "dark" }) => {
  const frame = useCurrentFrame();
  const c = palettes[theme];
  if (frame < 150) return <Intro frame={frame} c={c} />;
  if (frame < 330) return <PromptScene frame={frame} c={c} />;
  if (frame < 840) return <StagesScene frame={frame} c={c} />;
  if (frame < 1140) return <Round1Scene frame={frame} c={c} />;
  if (frame < 1350)
    return (
      <ArbiterScene
        frame={frame}
        start={1140}
        arb={arb1}
        title="5 confirmed blocking findings"
        c={c}
        footnote="a security-role rejection is blocking unless refuted with diff references · majority cannot dismiss a serious finding"
      />
    );
  if (frame < 1600) return <RepairScene frame={frame} c={c} />;
  if (frame < 1800) return <FinalScene frame={frame} c={c} />;
  return <EndScene frame={frame} c={c} />;
};