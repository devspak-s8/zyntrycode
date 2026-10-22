import raw from "../../data/demo-run.json";

/* Derive the scenes from the REAL production run captured in demo-run.json.
   Every string on screen comes from the live API — nothing is scripted. */

type Event = {
  id: string;
  type: string;
  message: string;
  data?: Record<string, unknown>;
  stage_id?: string | null;
};

const events = (raw as { events: Event[] }).events;

export const taskPrompt: string = String(
  (raw as { task: { prompt?: string } }).task?.prompt ?? ""
);

const started = events.filter((e) => e.type === "stage_started");
const succeeded = events.filter((e) => e.type === "stage_succeeded");
const successByStage = new Map<string, string>();
for (const e of succeeded) {
  if (e.stage_id) {
    successByStage.set(e.stage_id, e.message.replace("Stage succeeded with ", ""));
  }
}

const shortModel = (model: string): string => {
  const m = model.replace("@cf/meta/", "");
  return m.replace("-instruct", "").replace("-fp8-fast", "").replace("-16e", "");
};

export type StageRow = { kind: string; title: string; model: string };
export const stages: StageRow[] = started.map((e, i) => {
  const model = (e.stage_id && successByStage.get(e.stage_id)) ||
    succeeded[i]?.message.replace("Stage succeeded with ", "") ||
    "";
  return {
    kind: String((e.data as { kind?: string } | undefined)?.kind ?? "stage"),
    title: e.message.replace("Stage: ", ""),
    model: shortModel(model),
  };
});

export type ReviewerVerdict = {
  role: string;
  model: string;
  verdict: string;
  reasons: string[];
};
const verdicts = events.filter((e) => e.type === "consensus_verdict");
const toVerdict = (e: Event): ReviewerVerdict => ({
  role: String((e.data as { role?: string } | undefined)?.role ?? ""),
  model: shortModel(String((e.data as { model?: string } | undefined)?.model ?? "")),
  verdict: String((e.data as { verdict?: string } | undefined)?.verdict ?? ""),
  reasons: ((e.data as { reasons?: unknown } | undefined)?.reasons as string[]) ?? [],
});

export const round1: ReviewerVerdict[] = verdicts.slice(0, 3).map(toVerdict);
export const round2: ReviewerVerdict[] = verdicts.slice(3, 6).map(toVerdict);

export type Classification = { class: string; reason: string };
export type Arbitrated = {
  conclusion: string;
  statement: string;
  classification: Classification[];
};
const arbitrated = events.filter((e) => e.type === "consensus_arbitrated");
const toArbitrated = (e: Event): Arbitrated => ({
  conclusion: String((e.data as { conclusion?: string } | undefined)?.conclusion ?? ""),
  statement: String((e.data as { statement?: string } | undefined)?.statement ?? ""),
  classification:
    ((e.data as { classification?: unknown } | undefined)
      ?.classification as Classification[]) ?? [],
});
export const arb1: Arbitrated = toArbitrated(arbitrated[0] ?? ({} as Event));
export const arb2: Arbitrated = toArbitrated(arbitrated[1] ?? ({} as Event));

const finalEvent = events.find((e) => e.type === "consensus_final");
export const final = {
  verdict: String((finalEvent?.data as { verdict?: string } | undefined)?.verdict ?? ""),
  rounds: Number((finalEvent?.data as { rounds?: number } | undefined)?.rounds ?? 0),
  agreement: ((finalEvent?.data as { agreement?: unknown } | undefined)
    ?.agreement ?? { approve: 0, concerns: 0, reject: 0 }) as {
    approve: number;
    concerns: number;
    reject: number;
  },
  dissent: ((finalEvent?.data as { dissent?: unknown } | undefined)?.dissent ??
    []) as string[],
};

/* The arbiter is picked by pick_arbiter: cheapest tier>=3 model off the panel.
   Panel here = llama-3.3-70b + gpt-5 + o3-mini, so the arbiter was gpt-5-mini. */
export const arbiterModel = "gpt-5-mini";