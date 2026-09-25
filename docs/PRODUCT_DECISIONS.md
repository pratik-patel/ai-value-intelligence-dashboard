# Product review committee decisions

The redesign was reviewed through three lenses: experience architecture, enterprise AI FinOps/productivity, and product/technical architecture.

## Decisions

- Brand the product **AI Value Intelligence** with the descriptor **Usage, Efficiency & Delivery Value**.
- Do not use “Tokenizer Dashboard”; a tokenizer normally means the algorithm that turns text into tokens.
- Treat applications and providers as filterable telemetry dimensions.
- Organize the product around executive questions, not internal workflow stages.
- Limit the first screen to seven decision-oriented blocks and move evidence detail into drilldowns.
- Add a dedicated Efficiency & ROI workspace. In the prototype, deterministic illustrative value data is acceptable only when visibly labeled; production ROI requires connected delivery and finance data.
- Preserve the source unit as “usage units”; do not rename provider credits as tokens or dollars.
- Avoid public individual productivity rankings. Compare patterns within matched cohorts and enforce minimum cohort sizes.
- Remove client-side demo credentials. Production authentication and evidence handling belong behind secure server APIs.

## Dashboard interaction model

The interface borrows proven observability patterns from Datadog and Grafana without copying their visual identity:

- persistent scope and time controls;
- query-value KPI tiles, time-series panels, top lists, and exception tables;
- cascading Enterprise → Portfolio → Team → User selection;
- clicking a ranked row narrows the scope, while level tabs and cascading selectors allow lateral or upward movement;
- detailed traces appear only in the Evidence workflow;
- page-level prose is kept to labels, status, and the next action.

## First-screen acceptance test

A first-time executive should be able to answer these questions in less than ten seconds:

1. Are we within plan?
2. Are delivery outcomes keeping pace with usage?
3. Which portfolio is driving the largest change?
4. Where is the largest optimization opportunity?
5. What action should we take next?

## Metric guardrails

- Every metric needs a scope, period, unit, comparison, source state, and confidence level.
- Model right-sizing must consider task complexity and quality—not model price alone.
- Tokens per story point is suitable only as a within-team trend because story-point scales differ.
- Efficient exemplars must meet quality thresholds and have sufficient sample size.
- “Associated with” is the appropriate language for observational pattern findings; causal claims require controlled evidence.
- Raw prompts and code are sensitive evidence and require redaction, RBAC, retention, and audit controls.

## Phased data roadmap

1. Normalize usage telemetry across applications, models, agents, skills, plugins, and tools.
2. Add actual token classes, model price books, fixed subscription allocation, and data-quality coverage.
3. Connect work-management, source-control, CI/CD, quality, and incident outcomes.
4. Release outcome-normalized efficiency, estimated ROI, and cohort pattern insights only after coverage thresholds are met.
