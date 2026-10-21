import { PageShell, PageSection, Note } from "../router";

export function HowItWorks() {
  return (
    <PageShell
      kicker="Platform"
      title="How Zyntry Code works"
    >
      <p>
        Every task flows through the same six-stage pipeline. Nothing is written to your
        repository until the plan is reviewed, the stages pass their checks, and you
        authorize the changes. Here is exactly what happens between "describe the task"
        and a verified patch.
      </p>

      <PageSection heading="1 · Understand: the repo is read first">
        <p>
          Zyntry ingests your repository as a snapshot (paths, languages, contents) before
          planning anything. The first stage reasons over real file relationships, not a
          guess about what your code looks like. Sensitive paths (.env, credentials,
          keys) are excluded from the snapshot on both the extension and the web app.
        </p>
      </PageSection>

      <PageSection heading="2 · Plan: an execution plan with dependencies">
        <p>
          A planning model decomposes the task into ordered stages (understand, analyze,
          plan, implement, test, review, verify), each with a description, an explicit
          dependency list, and the verification checks it must pass. In Plan mode the
          full plan is presented for review first: you can uncheck stages you do not
          want before anything runs.
        </p>
      </PageSection>

      <PageSection heading="3 · Route: a model per stage, not one model for everything">
        <p>
          Each stage gets the cheapest model that is actually qualified for its kind and
          risk level. Historical success data adjusts the choice over time: a model that
          repeatedly fails a stage kind becomes more expensive to route to, even if its
          sticker price is low. Specialized code models can therefore beat a pricier
          general-purpose model on implementation work when the evidence says so.
        </p>
      </PageSection>

      <PageSection heading="4 · Execute: with a budget guard on the whole retry path">
        <p>
          Stages run in dependency order; independent stages run in parallel. Before any
          attempt, the budget guard projects the entire cost of finishing that stage,
          including retries with growing input context, model output, escalation to a
          stronger model, and verification operations. If the projection cannot fit in
          your budget, the stage is skipped and reported, never silently overspent.
        </p>
      </PageSection>

      <PageSection heading="5 · Verify: deterministically, honestly">
        <p>
          Outputs are checked locally where possible (structure, syntax, code presence).
          Checks that need your real repository (tests, lint, typecheck, build) run in
          the attached runner and post real reports back. Anything that could not be run
          is reported as a limitation, never claimed as passed. If verification fails,
          the check output is fed back to the same model once to repair; only if that
          fails does a stronger model take over.
        </p>
      </PageSection>

      <PageSection heading="6 · Deliver: evidence, diff, and (optionally) CI">
        <p>
          You review the diff, approve per file if you want, and authorize changes before
          they land. Delivery queues commit → push → pull request, approval-gated at each
          dangerous step. After push, CI can report its status back through the webhook,
          and the result lands on the task timeline.
        </p>
      </PageSection>

      <Note label="Rule of the product:">
        an unavailable check is reported as a limitation. Zyntry Code never pretends
        something was verified when it was not.
      </Note>
    </PageShell>
  );
}