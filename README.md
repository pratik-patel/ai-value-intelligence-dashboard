# AI Value Intelligence

Vendor-neutral token, cost, productivity, and ROI analytics for enterprise AI delivery teams.

AI Value Intelligence helps leaders answer four questions:

1. How much AI usage do we have, and are we within plan?
2. Which portfolios, teams, users, applications, models, agents, skills, and tools drive it?
3. Are delivery outcomes and quality improving with that investment?
4. Which evidence-backed changes should we make next?

The product is intentionally application-neutral. IDE assistants, command-line tools, coding agents, plugins, MCP servers, and other AI applications are telemetry dimensions—not the product identity.

## Experience model

The interface uses progressive disclosure instead of putting every metric on one screen:

- **Overview** — scoped usage, modeled delivery value, trend, peer comparison, and top actions.
- **Organization** — explicit portfolio, team, and user comparison with peer trend lines, an efficiency frontier, sortable benchmarks, and attribution drivers.
- **Efficiency & ROI** — outcome efficiency, reasoning fit, workflow share, and skill-effectiveness patterns.
- **Optimize** — ranked evidence-backed actions and scenario planning.
- **Evidence** — trace inspection, confidence, reports, and audit detail.

## Metric integrity

The included dataset reports provider-style usage credits, so the UI calls them **usage units**. It does not relabel them as tokens or currency.

The dashboard distinguishes three metric states:

- **Observed** — directly present in telemetry.
- **Derived** — calculated from observed fields.
- **Estimated** — modeled with stated assumptions.
The development dataset includes deterministic modeled outcomes and ROI so the complete experience can be evaluated. Production ROI should be connected to finance and delivery systems. The intended contract is:

```text
Estimated ROI = (realized benefit - total AI cost) / total AI cost
```

Recommended outcome sources include work items, merged PRs, deployments, incidents, defects, cycle time, and accepted suggestions. Story points should be compared within a team, not used as an enterprise or individual leaderboard.

## Run locally

```bash
npm ci
npm run dev
```

Open `http://127.0.0.1:5000`.

Verification:

```bash
npm run check
npm run build
```

## Current architecture

- React 19, TypeScript, Vite, Tailwind CSS, Radix UI, Recharts
- Express production shell
- Static sample CSV telemetry parsed in the browser
- No production authentication, data warehouse, or delivery-system integration

The sample implementation is a product prototype. Before production use, move prompt/evidence data and aggregation behind authenticated APIs with RBAC, redaction, retention controls, audit logs, and minimum-cohort privacy rules.

The interface defaults to dark mode for continuous monitoring and includes a persisted light mode for executive reviews and projection. The detailed persona questions and session model are documented in [`docs/PORTAL_INFORMATION_ARCHITECTURE.md`](docs/PORTAL_INFORMATION_ARCHITECTURE.md).

## Recommended vendor-neutral event model

Production telemetry should capture:

- application, provider, model/version, input/output/reasoning/cache tokens, cost, latency, success, errors, retries;
- enterprise, portfolio, team, user, work type, and complexity;
- agent/version, skill/version, plugin/tool/MCP, parent-child trace, handoff, and outcome;
- work item, PR, deployment, incident, defect, cycle time, quality, and attribution confidence;
- effective-dated model pricing, budget, subscription cost, currency, and allocation policy.

Cross-vendor token counts are not always directly comparable because tokenizers differ. Cost, quality, and outcome-normalized measures are safer for executive comparisons.
