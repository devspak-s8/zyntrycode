import React from "react";
import { AbsoluteFill, useCurrentFrame } from "remotion";
import {
  arb1,
  arb2,
  arbiterModel,
  final,
  round1,
  round2,
  stages,
  taskPrompt,
  type Arbitrated,
  type ReviewerVerdict,
} from "./data";

/* ------------------------------------------------------------------ */
/* Palette + helpers                                                   */
/* ------------------------------------------------------------------ */

const C = {
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
};

const easeOut = (t: number) => 1 - Math.pow(1 - t, 3);
const prog = (frame: number, start: number, dur: number) =>
  easeOut(Math.min(1, Math.max(0, (frame - start) / dur)));

const truncate = (s: string, n: number) =>
  s.length > n ? s.slice(0, n - 1) + "…" : s;

const verdictColor = (v: string) =>
  v === "approve" ? C.green : v === "reject" ? C.red : v === "concerns" ? C.amber : C.faint;

const roleColor = (role: string) =>
  role === "security" ? C.red : role === "integration" ? C.blue : C.dim;

const mono = {
  fontFamily: "'Consolas', 'Courier New', monospace",
} as const;

const Scene: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <AbsoluteFill
    style={{
      background: C.bg,
      color: C.text,
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

const Header: React.FC<{ kicker: string; title: string; p: number }> = ({
  kicker,
  title,
  p,
}) => (
  <FadeIn p={p}>
    <div style={{ fontSize: 22, letterSpacing: 4, color: C.dim, textTransform: "uppercase", fontWeight: 600 }}>
      {kicker}
    </div>
    <div style={{ fontSize: 46, fontWeight: 700, marginTop: 6 }}>{title}</div>
    <div style={{ height: 2, width: 240, background: C.green, marginTop: 14, borderRadius: 2 }} />
  </FadeIn>
);

/* ------------------------------------------------------------------ */
/* Scenes                                                              */
/* ------------------------------------------------------------------ */

const Intro: React.FC<{ frame: number }> = ({ frame }) => {
  const p = frame;
  return (
    <Scene>
      <AbsoluteFill style={{ alignItems: "center", justifyContent: "center" }}>
        <FadeIn p={p} delay={6} y={40}>
          <div style={{ textAlign: "center" }}>
            <div style={{ ...mono, fontSize: 26, letterSpacing: 10, color: C.green }}>
              ZYNTRY&nbsp;CODE
            </div>
            <div style={{ fontSize: 72, fontWeight: 800, marginTop: 18, lineHeight: 1.1 }}>
              Cross-Model Consensus Review
            </div>
            <div style={{ fontSize: 30, color: C.dim, marginTop: 16 }}>
              A real production run, replayed frame by frame
            </div>
          </div>
        </FadeIn>
        <div
          style={{
            position: "absolute",
            bottom: 70,
            fontSize: 20,
            color: C.faint,
            opacity: prog(p, 70, 25),
          }}
        >
          every event below is real API output from code-api.zyntry.space — nothing scripted
        </div>
      </AbsoluteFill>
    </Scene>
  );
};

const PromptScene: React.FC<{ frame: number }> = ({ frame }) => {
  const start = 150;
  const p = frame - start;
  const chars = Math.floor(prog(p, 10, 120) * taskPrompt.length);
  return (
    <Scene>
      <Header kicker="The task" title="One prompt in" p={p} />
      <FadeIn p={p} delay={40}>
        <div
          style={{
            marginTop: 46,
            background: C.panel,
            border: `1px solid ${C.border}`,
            borderRadius: 16,
            padding: "34px 40px",
            fontSize: 34,
            lineHeight: 1.45,
            maxWidth: 1500,
          }}
        >
          <span style={{ ...mono, color: C.green, marginRight: 16 }}>❯</span>
          {taskPrompt.slice(0, chars)}
          {chars < taskPrompt.length && <span style={{ color: C.green }}>▌</span>}
        </div>
      </FadeIn>
      <div style={{ display: "flex", gap: 14, marginTop: 34 }}>
        {["mode: agent", "routing: balanced", "consensus: true"].map((chip, i) => (
          <div
            key={chip}
            style={{
              opacity: prog(p, 90 + i * 12, 20),
              transform: `translateY(${(1 - prog(p, 90 + i * 12, 20)) * 14}px)`,
              ...mono,
              fontSize: 22,
              color: C.blue,
              background: C.blueBg,
              border: `1px solid ${C.blue}44`,
              borderRadius: 999,
              padding: "10px 22px",
            }}
          >
            {chip}
          </div>
        ))}
      </div>
    </Scene>
  );
};

const StagesScene: React.FC<{ frame: number }> = ({ frame }) => {
  const start = 330;
  const p = frame - start;
  return (
    <Scene>
      <Header kicker="The pipeline" title="8 stages, routed per capability" p={p} />
      <div style={{ marginTop: 40, display: "flex", flexDirection: "column", gap: 12 }}>
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
                background: done > 0.99 ? `${C.greenBg}88` : C.panel,
                border: `1px solid ${done > 0.99 ? `${C.green}55` : C.border}`,
                borderRadius: 12,
                padding: "14px 26px",
                maxWidth: 1560,
              }}
            >
              <div style={{ ...mono, width: 120, fontSize: 18, color: C.faint, textTransform: "uppercase" }}>
                {s.kind}
              </div>
              <div style={{ fontSize: 27, flex: 1, fontWeight: 600 }}>{s.title}</div>
              <div style={{ ...mono, fontSize: 20, color: C.dim }}>{s.model}</div>
              <div
                style={{
                  width: 30,
                  height: 30,
                  borderRadius: 999,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  background: done > 0.99 ? C.green : "transparent",
                  color: "#06120C",
                  fontSize: 18,
                  fontWeight: 800,
                }}
              >
                {done > 0.99 ? "✓" : ""}
              </div>
            </div>
          );
        })}
      </div>
    </Scene>
  );
};

const ReviewerCard: React.FC<{
  r: ReviewerVerdict;
  appear: number;
  index: number;
  compact?: boolean;
}> = ({ r, appear, index, compact }) => {
  const reason = truncate(r.reasons[0] ?? "", compact ? 100 : 150);
  return (
    <div
      style={{
        opacity: appear,
        transform: `translateY(${(1 - appear) * 30}px)`,
        flex: 1,
        background: C.panel,
        border: `1px solid ${verdictColor(r.verdict)}44`,
        borderRadius: 14,
        padding: "26px 28px",
        minHeight: compact ? 150 : 250,
      }}
    >
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <span
          style={{
            fontSize: 17,
            textTransform: "uppercase",
            letterSpacing: 3,
            color: roleColor(r.role),
            fontWeight: 700,
          }}
        >
          {r.role}
        </span>
        <span style={{ ...mono, fontSize: 17, color: C.faint }}>{r.model}</span>
      </div>
      <div
        style={{
          fontSize: compact ? 30 : 42,
          fontWeight: 800,
          marginTop: 14,
          color: verdictColor(r.verdict),
          textDecoration: r.verdict === "unavailable" ? "line-through" : "none",
          textDecorationColor: C.faint,
        }}
      >
        {r.verdict}
      </div>
      {r.verdict !== "unavailable" && (
        <div style={{ fontSize: compact ? 19 : 22, color: C.dim, marginTop: 12, lineHeight: 1.35 }}>
          “{reason}”
        </div>
      )}
      {r.verdict === "unavailable" && (
        <div style={{ fontSize: compact ? 18 : 21, color: C.faint, marginTop: 12, lineHeight: 1.35 }}>
          returned a verdict in a format the panel could not read — recorded honestly, never guessed
        </div>
      )}
    </div>
  );
};

const Round1Scene: React.FC<{ frame: number }> = ({ frame }) => {
  const start = 840;
  const p = frame - start;
  return (
    <Scene>
      <Header kicker="Consensus review · round 1" title="Three reviewers, three priorities" p={p} />
      <div style={{ display: "flex", gap: 26, marginTop: 46 }}>
        {round1.map((r, i) => (
          <ReviewerCard key={i} r={r} appear={prog(p, 15 + i * 14, 24)} index={i} />
        ))}
      </div>
      <FadeIn p={p} delay={80}>
        <div style={{ marginTop: 34, fontSize: 22, color: C.faint, ...mono }}>
          verdicts are hidden from each other until submission · every reason must cite the diff
        </div>
      </FadeIn>
    </Scene>
  );
};

const ArbiterScene: React.FC<{ frame: number; start: number; arb: Arbitrated; title: string }> = ({
  frame,
  start,
  arb,
  title,
}) => {
  const p = frame - start;
  const items = arb.classification.slice(0, 5);
  return (
    <Scene>
      <Header kicker={`Arbiter · ${arbiterModel}`} title={title} p={p} />
      <FadeIn p={p} delay={10}>
        <div
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: 14,
            marginTop: 34,
            background: C.redBg,
            border: `1px solid ${C.red}55`,
            borderRadius: 999,
            padding: "10px 26px",
            fontSize: 26,
            fontWeight: 700,
            color: C.red,
            ...mono,
          }}
        >
          conclusion: {arb.conclusion}
        </div>
      </FadeIn>
      <div style={{ display: "flex", flexDirection: "column", gap: 14, marginTop: 30 }}>
        {items.map((c, i) => (
          <div
            key={i}
            style={{
              opacity: prog(p, 30 + i * 12, 18),
              transform: `translateX(${(1 - prog(p, 30 + i * 12, 18)) * -40}px)`,
              display: "flex",
              alignItems: "flex-start",
              gap: 18,
              fontSize: 25,
              lineHeight: 1.35,
              maxWidth: 1500,
            }}
          >
            <span style={{ color: C.red, fontWeight: 800, marginTop: 2 }}>●</span>
            <span>
              <span style={{ ...mono, fontSize: 20, color: C.red, marginRight: 12 }}>
                {c.class}
              </span>
              <span style={{ color: C.text }}>{truncate(c.reason, 150)}</span>
            </span>
          </div>
        ))}
        {arb.classification.length > items.length && (
          <div style={{ fontSize: 22, color: C.faint, marginLeft: 38 }}>
            +{arb.classification.length - items.length} more finding{arb.classification.length - items.length === 1 ? "" : "s"}
          </div>
        )}
      </div>
      {arb.statement && (
        <FadeIn p={p} delay={90}>
          <div style={{ marginTop: 30, fontSize: 24, color: C.dim, fontStyle: "italic" }}>
            “{truncate(arb.statement, 180)}”
          </div>
        </FadeIn>
      )}
    </Scene>
  );
};

const RepairScene: React.FC<{ frame: number }> = ({ frame }) => {
  const start = 1350;
  const p = frame - start;
  return (
    <Scene>
      <Header kicker="The loop closes" title="One repair round, then re-review" p={p} />
      <FadeIn p={p} delay={8}>
        <div
          style={{
            marginTop: 40,
            display: "flex",
            alignItems: "center",
            gap: 30,
            fontSize: 28,
            fontWeight: 700,
          }}
        >
          <span style={{ color: C.red }}>blocking findings</span>
          <span style={{ color: C.green, fontSize: 36 }}>→</span>
          <span style={{ color: C.green }}>specialist repairs the diff</span>
          <span style={{ color: C.green, fontSize: 36 }}>→</span>
          <span style={{ color: C.blue }}>round 2</span>
        </div>
      </FadeIn>
      <div style={{ display: "flex", gap: 26, marginTop: 40 }}>
        {round2.map((r, i) => (
          <ReviewerCard key={i} r={r} appear={prog(p, 40 + i * 14, 22)} index={i} compact />
        ))}
      </div>
    </Scene>
  );
};

const FinalScene: React.FC<{ frame: number }> = ({ frame }) => {
  const start = 1600;
  const p = frame - start;
  const a = final.agreement;
  return (
    <Scene>
      <Header kicker={`Arbiter · ${arbiterModel} — round 2`} title="Still blocking after repair" p={p} />
      <div style={{ display: "flex", flexDirection: "column", gap: 10, marginTop: 26 }}>
        {arb2.classification.slice(0, 3).map((c, i) => (
          <div
            key={i}
            style={{
              opacity: prog(p, 8 + i * 10, 16),
              display: "flex",
              alignItems: "center",
              gap: 14,
              fontSize: 23,
              maxWidth: 1520,
            }}
          >
            <span style={{ color: C.red, fontWeight: 800 }}>●</span>
            <span style={{ ...mono, fontSize: 19, color: C.red, width: 220 }}>{c.class}</span>
            <span style={{ color: C.text }}>{truncate(c.reason, 140)}</span>
          </div>
        ))}
      </div>
      <FadeIn p={p} delay={40} y={0}>
        <div
          style={{
            marginTop: 30,
            display: "inline-flex",
            alignItems: "center",
            gap: 22,
            background: C.redBg,
            border: `1px solid ${C.red}66`,
            borderRadius: 18,
            padding: "24px 40px",
          }}
        >
          <span style={{ fontSize: 52, fontWeight: 900, color: C.red, ...mono }}>
            {final.verdict}
          </span>
        </div>
      </FadeIn>
      <div style={{ display: "flex", gap: 22, marginTop: 28 }}>
        {[
          { label: "approve", value: a.approve, color: C.green },
          { label: "concerns", value: a.concerns, color: C.amber },
          { label: "reject", value: a.reject, color: C.red },
          { label: "unavailable", value: 1, color: C.faint },
        ].map((s, i) => (
          <div
            key={s.label}
            style={{
              opacity: prog(p, 70 + i * 10, 16),
              background: C.panel,
              border: `1px solid ${C.border}`,
              borderRadius: 12,
              padding: "12px 30px",
              textAlign: "center",
            }}
          >
            <div style={{ fontSize: 40, fontWeight: 800, color: s.color }}>{s.value}</div>
            <div style={{ ...mono, fontSize: 18, color: C.dim }}>{s.label}</div>
          </div>
        ))}
      </div>
      <FadeIn p={p} delay={110}>
        <div style={{ marginTop: 26, fontSize: 23, color: C.dim }}>
          {final.rounds} review rounds ·{" "}
          <span style={{ color: C.amber }}>
            {final.dissent.length} dissent notes recorded — never averaged away
          </span>
        </div>
      </FadeIn>
    </Scene>
  );
};

const EndScene: React.FC<{ frame: number }> = ({ frame }) => {
  const p = frame - 1800;
  return (
    <Scene>
      <AbsoluteFill style={{ alignItems: "center", justifyContent: "center" }}>
        <div style={{ textAlign: "center" }}>
          <FadeIn p={p} delay={4}>
            <div style={{ fontSize: 64, fontWeight: 800 }}>Consensus is evidence, not proof.</div>
          </FadeIn>
          <FadeIn p={p} delay={40}>
            <div style={{ fontSize: 30, color: C.dim, marginTop: 20 }}>
              Three models can agree and still be wrong.
            </div>
          </FadeIn>
          <FadeIn p={p} delay={70}>
            <div style={{ fontSize: 30, color: C.dim, marginTop: 8 }}>
              Dissent is recorded. Checks that could not run stay visible.
            </div>
          </FadeIn>
          <FadeIn p={p} delay={95}>
            <div style={{ marginTop: 44, ...mono, fontSize: 26, letterSpacing: 8, color: C.green }}>
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

export const ZyntryDemo: React.FC = () => {
  const frame = useCurrentFrame();
  if (frame < 150) return <Intro frame={frame} />;
  if (frame < 330) return <PromptScene frame={frame} />;
  if (frame < 840) return <StagesScene frame={frame} />;
  if (frame < 1140) return <Round1Scene frame={frame} />;
  if (frame < 1350)
    return (
      <ArbiterScene
        frame={frame}
        start={1140}
        arb={arb1}
        title="5 confirmed blocking findings"
      />
    );
  if (frame < 1600) return <RepairScene frame={frame} />;
  if (frame < 1800) return <FinalScene frame={frame} />;
  return <EndScene frame={frame} />;
};