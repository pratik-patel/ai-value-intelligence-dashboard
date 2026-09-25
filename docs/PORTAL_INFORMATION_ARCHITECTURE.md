# AI Value Intelligence — decision architecture

The portal is organized around decisions, not telemetry fields. Every screen should answer one primary question and offer a clear route to supporting evidence.

## Executive view

Primary question: **Is AI adoption creating measurable, governable value?**

Supporting questions:

1. How much usage and effective cost are we carrying, and how fast are they changing?
2. How many eligible people are active, and is adoption broadening or concentrated?
3. Which portfolios produce the most quality-gated outcomes per unit of usage?
4. Is delivery throughput or cycle time improving alongside adoption?
5. Which applications, models, agents, skills, and tools drive cost and value?
6. Where are usage, quality, or concentration outside policy thresholds?
7. What can be optimized without reducing outcome quality?
8. Which decision needs executive sponsorship now?

The executive view should show four KPIs, one trend, one peer comparison, and a short decision queue. Raw sessions and prompt content belong in evidence drilldowns.

## Portfolio and team-owner view

Primary question: **Where should I coach, route, or invest differently?**

Supporting questions:

1. How does my team compare with matched peers on usage, outcomes, quality, and efficiency?
2. Is usage growing because adoption is broadening or because a small cohort is consuming more?
3. Which work types are well suited to AI, and which show retries, abandonment, or weak quality?
4. Are expensive reasoning models being reserved for sufficiently complex work?
5. Which agents, skills, plugins, tools, and MCP servers are effective or wasteful?
6. Are enablement efforts changing adoption depth, acceptance, and delivery outcomes?
7. Which patterns from efficient peers can be safely replicated?

The Organization workspace supplies multi-series peer trends, an efficiency frontier, sortable benchmarks, and attribution breakdowns. User comparisons are coaching signals, not performance ratings.

## Individual view

Primary question: **How can I improve my own AI-assisted work?**

Supporting questions:

1. Which workflows account for most of my usage?
2. Which model, agent, and tool patterns correlate with successful outcomes?
3. How am I trending against my own baseline and comparable work—not an enterprise leaderboard?
4. Where do long context, retries, or excessive agent steps add cost without quality?
5. Which recent sessions explain the pattern?
6. What is the next concrete behavior to test?

The individual workspace therefore uses a compact profile, four measures, ranked usage patterns, one interpretation panel, and a short action list.

## Session and trace view

Primary question: **What happened in this run, and why did it consume what it did?**

A session should display a trace timeline with:

- agent invocation and handoffs;
- model calls, input/output/reasoning/cache tokens, latency, retries, and finish reason;
- skill, plugin, tool, and MCP invocations;
- context growth and compaction events;
- errors, guardrail events, and human intervention;
- quality result and attributed delivery outcome;
- effective cost and attribution confidence.

Prompt and response content must be redacted by default and protected by role-based access, retention, and audit controls.

## Metric contract

Each metric must carry scope, time period, unit, comparison, source state, and confidence. Source states are:

- **Observed** — directly emitted by telemetry.
- **Derived** — calculated from observed data.
- **Estimated** — modeled from documented assumptions.

Raw token or usage volume is a resource-efficiency measure. The mature unit economics are cost or usage per quality-gated outcome, such as cost per accepted assist, completed code review, resolved case, merged change, or successful agent action.

## Visual and interaction rules

- Global portfolio, team, user, period, and application filters apply across workspaces.
- Dark mode is the default for continuous monitoring; a persisted light mode supports executive reviews and projection.
- Multi-series lines answer whether peer trends move together.
- Scatterplots answer who produces more outcomes per unit.
- Sortable tables provide exact rank, share, quality, and drilldown.
- Tooltips stay compact and never cover the comparison.
- Detail is disclosed progressively: enterprise → portfolio → team → user → session → span.
- Organization comparisons use a local **Peers shown** control. Cohorts larger than six open with the six highest-usage peers to keep charts readable; search, checkboxes, and **Reset to all** expose the rest. Hiding a peer changes visible series, shown-peer totals, and attribution; the full eligible cohort remains the fixed basis for median, rank, share, and concentration. At least one peer must remain visible.
