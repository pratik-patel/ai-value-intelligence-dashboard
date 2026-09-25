import { Link } from "wouter";
import {
  ArrowRight,
  BadgeDollarSign,
  Bot,
  CheckCircle2,
  CircleDollarSign,
  Gauge,
  Info,
  Lightbulb,
  Network,
  Sparkles,
  Target,
  Users,
  Workflow,
} from "lucide-react";
import {
  CartesianGrid,
  Cell,
  ComposedChart,
  Legend,
  Line,
  ReferenceLine,
  ResponsiveContainer,
  Scatter,
  ScatterChart,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { TELEMETRY_DATA, formatConsumption } from "@/lib/telemetry-data";

const demoEfficiency = [
  { name: "Payments Platform", usage: 82, outcome: 91, quadrant: "Efficient exemplar" },
  { name: "Customer Experience", usage: 68, outcome: 76, quadrant: "Efficient exemplar" },
  { name: "Risk Automation", usage: 91, outcome: 86, quadrant: "High investment / high output" },
  { name: "Data Foundations", usage: 74, outcome: 60, quadrant: "Optimization opportunity" },
  { name: "Service Operations", usage: 49, outcome: 55, quadrant: "Developing adoption" },
];

const opportunityTone: Record<string, string> = {
  High: "border-amber-400/25 bg-amber-400/10 text-amber-200",
  Medium: "border-sky-400/20 bg-sky-400/10 text-sky-200",
  Low: "border-slate-400/20 bg-slate-400/10 text-slate-300",
};

export default function GovernanceOverview() {
  const totalUsage = TELEMETRY_DATA.kpis.totalConsumption;
  const budget = Math.max(totalUsage - TELEMETRY_DATA.kpis.overrun, totalUsage * 0.82);
  const budgetVariance = budget ? ((totalUsage - budget) / budget) * 100 : 0;
  const portfolios = TELEMETRY_DATA.costCenters
    .slice()
    .sort((a, b) => b.totalConsumption - a.totalConsumption)
    .slice(0, 5);
  const maxPortfolioUsage = portfolios[0]?.totalConsumption ?? 1;
  const topActions = TELEMETRY_DATA.recommendations.slice(0, 3);

  const trend = TELEMETRY_DATA.dailyTrend.map((entry, index, entries) => {
    const max = Math.max(...entries.map((item) => item.consumption), 1);
    return {
      date: entry.date,
      usage: Math.round((entry.consumption / max) * 100),
      outcome: Math.round(58 + index * 1.3 + Math.sin(index / 2.5) * 8),
    };
  });

  const toolMix = buildWorkflowMix();
  const reasoningFit = buildReasoningFit();

  return (
    <div className="mx-auto max-w-[1600px] space-y-6 px-5 py-7 lg:px-8 lg:py-8">
      <section className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
        <div className="max-w-4xl">
          <div className="mb-2 flex flex-wrap items-center gap-2">
            <Badge className="border-cyan-400/20 bg-cyan-400/10 text-cyan-200 hover:bg-cyan-400/10">Enterprise overview</Badge>
            <Badge variant="outline" className="border-white/10 text-slate-400">Sample dataset</Badge>
          </div>
          <h1 className="text-2xl font-semibold tracking-tight text-white lg:text-3xl">Turn AI usage into measurable delivery value.</h1>
          <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-400">
            Usage is <span className="font-medium text-amber-200">{Math.abs(budgetVariance).toFixed(1)}% above the modeled plan</span> while delivery outcome coverage is incomplete. The clearest opportunity is right-sizing high-reasoning models in the highest-volume portfolios.
          </p>
        </div>
        <div className="flex gap-2">
          <Link href="/efficiency">
            <Button variant="outline" className="border-white/10 bg-white/[0.03] text-slate-200 hover:bg-white/[0.07]">Review efficiency</Button>
          </Link>
          <Link href="/recommendations">
            <Button className="bg-cyan-500 text-slate-950 hover:bg-cyan-400">View top actions <ArrowRight className="ml-2 h-4 w-4" /></Button>
          </Link>
        </div>
      </section>

      <section className="grid overflow-hidden rounded-2xl border border-white/10 bg-[#0b1625]/85 sm:grid-cols-2 xl:grid-cols-4">
        <KpiCell icon={Gauge} label="AI usage" value={`${formatConsumption(totalUsage)} units`} detail="Observed · current period" delta="+12.4%" tone="amber" />
        <KpiCell icon={CircleDollarSign} label="Budget position" value={`${formatConsumption(TELEMETRY_DATA.kpis.overrun)} over`} detail="Estimated · modeled plan" delta={`+${budgetVariance.toFixed(1)}%`} tone="amber" />
        <KpiCell icon={Users} label="Sustained adoption" value={`${TELEMETRY_DATA.kpis.activeEngineers} users`} detail="Observed · active users" delta="74% eligible" tone="green" />
        <KpiCell icon={BadgeDollarSign} label="Estimated ROI" value="Awaiting data" detail="Connect work + finance systems" delta="Not scored" tone="muted" />
      </section>

      <section className="grid gap-6 xl:grid-cols-[1.45fr_1fr]">
        <Panel title="Usage and delivery are not yet moving together" description="Normalized trend (0–100). Delivery is illustrative until a work-management source is connected." badge="Mixed sources">
          <div className="h-[280px] pt-2">
            <ResponsiveContainer width="100%" height="100%">
              <ComposedChart data={trend} margin={{ top: 8, right: 16, left: -12, bottom: 8 }}>
                <CartesianGrid stroke="rgba(148,163,184,0.10)" strokeDasharray="4 4" vertical={false} />
                <XAxis dataKey="date" tickFormatter={(value) => new Date(`${value}T00:00:00`).toLocaleDateString("en-US", { month: "short", day: "numeric" })} tick={{ fill: "#64748b", fontSize: 11 }} axisLine={false} tickLine={false} minTickGap={30} />
                <YAxis domain={[0, 110]} tick={{ fill: "#64748b", fontSize: 11 }} axisLine={false} tickLine={false} />
                <Tooltip contentStyle={{ background: "#0b1625", border: "1px solid rgba(255,255,255,.12)", borderRadius: 10 }} labelStyle={{ color: "#cbd5e1" }} />
                <Legend wrapperStyle={{ fontSize: 12, color: "#94a3b8" }} />
                <Line type="monotone" dataKey="usage" name="Usage index" stroke="#22d3ee" strokeWidth={2.5} dot={false} />
                <Line type="monotone" dataKey="outcome" name="Delivery index · illustrative" stroke="#a78bfa" strokeWidth={2.5} strokeDasharray="6 5" dot={false} />
              </ComposedChart>
            </ResponsiveContainer>
          </div>
        </Panel>

        <Panel title="Value by portfolio" description="Ranked by usage. Add delivery outcomes to rank by cost per successful outcome." badge="Top 5">
          <div className="space-y-3">
            {portfolios.map((portfolio, index) => (
              <Link key={portfolio.id} href={`/detail/cost-center/${portfolio.id}`} className="group block rounded-xl border border-white/[0.07] bg-white/[0.025] p-3.5 hover:border-cyan-400/20 hover:bg-white/[0.045]">
                <div className="flex items-center gap-3">
                  <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-white/[0.06] text-xs font-semibold text-slate-400">{index + 1}</span>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center justify-between gap-4">
                      <p className="truncate text-sm font-medium text-slate-200">{portfolio.name}</p>
                      <span className="whitespace-nowrap text-xs text-slate-400">{formatConsumption(portfolio.totalConsumption)} units</span>
                    </div>
                    <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-white/[0.06]">
                      <div className="h-full rounded-full bg-gradient-to-r from-cyan-500 to-blue-500" style={{ width: `${(portfolio.totalConsumption / maxPortfolioUsage) * 100}%` }} />
                    </div>
                    <p className="mt-2 text-[11px] text-slate-500">{portfolio.teamCount} teams · {portfolio.activeEngineers} users · {portfolio.topUseCase}</p>
                  </div>
                  <ArrowRight className="h-4 w-4 text-slate-600 transition-transform group-hover:translate-x-0.5 group-hover:text-cyan-300" />
                </div>
              </Link>
            ))}
          </div>
          <Link href="/explorer" className="mt-4 inline-flex items-center text-xs font-medium text-cyan-300 hover:text-cyan-200">Explore enterprise → portfolio → team → user <ArrowRight className="ml-1.5 h-3.5 w-3.5" /></Link>
        </Panel>
      </section>

      <section className="grid gap-6 xl:grid-cols-2">
        <Panel title="Efficiency frontier" description="Find patterns worth scaling—not a user leaderboard. Outcome values are illustrative and cohort normalization is required." badge="Illustrative">
          <div className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <ScatterChart margin={{ top: 14, right: 18, bottom: 28, left: 2 }}>
                <CartesianGrid stroke="rgba(148,163,184,0.10)" strokeDasharray="4 4" />
                <XAxis type="number" dataKey="usage" name="Usage index" domain={[35, 100]} tick={{ fill: "#64748b", fontSize: 11 }} label={{ value: "AI usage index →", position: "insideBottom", offset: -16, fill: "#64748b", fontSize: 11 }} />
                <YAxis type="number" dataKey="outcome" name="Delivery index" domain={[40, 100]} tick={{ fill: "#64748b", fontSize: 11 }} label={{ value: "Delivery outcome →", angle: -90, position: "insideLeft", fill: "#64748b", fontSize: 11 }} />
                <ReferenceLine x={70} stroke="#334155" strokeDasharray="4 4" />
                <ReferenceLine y={70} stroke="#334155" strokeDasharray="4 4" />
                <Tooltip cursor={{ strokeDasharray: "4 4" }} contentStyle={{ background: "#0b1625", border: "1px solid rgba(255,255,255,.12)", borderRadius: 10 }} formatter={(value: number, name: string) => [value, name]} />
                <Scatter data={demoEfficiency} fill="#22d3ee">
                  {demoEfficiency.map((item) => <Cell key={item.name} fill={item.quadrant === "Optimization opportunity" ? "#f59e0b" : item.quadrant === "Efficient exemplar" ? "#34d399" : "#38bdf8"} />)}
                </Scatter>
              </ScatterChart>
            </ResponsiveContainer>
          </div>
          <div className="flex flex-wrap gap-2 text-[11px] text-slate-400">
            <LegendKey color="bg-emerald-400" label="Efficient exemplar" />
            <LegendKey color="bg-sky-400" label="Healthy / developing" />
            <LegendKey color="bg-amber-400" label="Optimization opportunity" />
          </div>
        </Panel>

        <Panel title="Why usage is changing" description="Model fit and workflow attribution explain the largest optimization levers." badge="Estimated">
          <div className="grid gap-5 md:grid-cols-2">
            <div className="rounded-xl border border-white/[0.07] bg-white/[0.025] p-4">
              <div className="mb-3 flex items-center justify-between">
                <div className="flex items-center gap-2 text-sm font-medium text-slate-200"><Target className="h-4 w-4 text-violet-300" />Reasoning fit</div>
                <span className="text-xs text-slate-500">Classified runs</span>
              </div>
              <div className="flex h-3 overflow-hidden rounded-full bg-white/[0.06]">
                <div className="bg-emerald-400" style={{ width: `${reasoningFit.rightSized}%` }} />
                <div className="bg-amber-400" style={{ width: `${reasoningFit.overpowered}%` }} />
                <div className="bg-rose-400" style={{ width: `${reasoningFit.underpowered}%` }} />
              </div>
              <div className="mt-4 space-y-2.5 text-xs">
                <MetricRow label="Right-sized" value={`${reasoningFit.rightSized}%`} tone="text-emerald-300" />
                <MetricRow label="Potentially overpowered" value={`${reasoningFit.overpowered}%`} tone="text-amber-300" />
                <MetricRow label="Potentially underpowered" value={`${reasoningFit.underpowered}%`} tone="text-rose-300" />
              </div>
            </div>
            <div className="rounded-xl border border-white/[0.07] bg-white/[0.025] p-4">
              <div className="mb-3 flex items-center gap-2 text-sm font-medium text-slate-200"><Workflow className="h-4 w-4 text-cyan-300" />Workflow attribution</div>
              <div className="space-y-3">
                {toolMix.slice(0, 4).map((item) => (
                  <div key={item.label}>
                    <div className="mb-1.5 flex justify-between text-xs"><span className="text-slate-400">{item.label}</span><span className="text-slate-300">{item.share}%</span></div>
                    <div className="h-1.5 rounded-full bg-white/[0.06]"><div className="h-full rounded-full bg-cyan-400/70" style={{ width: `${item.share}%` }} /></div>
                  </div>
                ))}
              </div>
              <div className="mt-4 flex items-center gap-2 rounded-lg border border-dashed border-white/10 p-2.5 text-[11px] text-slate-500"><Info className="h-3.5 w-3.5" />Skill telemetry is not connected yet.</div>
            </div>
          </div>
          <Link href="/efficiency" className="mt-4 inline-flex items-center text-xs font-medium text-cyan-300 hover:text-cyan-200">Inspect models, agents, skills and plugins <ArrowRight className="ml-1.5 h-3.5 w-3.5" /></Link>
        </Panel>
      </section>

      <Panel title="Top actions" description="Three evidence-backed moves with the clearest path to lower usage or better delivery." badge={`${topActions.length} prioritized`}>
        <div className="grid gap-3 lg:grid-cols-3">
          {topActions.map((action, index) => (
            <Link key={action.id} href="/recommendations" className="group rounded-xl border border-white/[0.07] bg-white/[0.025] p-4 transition-colors hover:border-cyan-400/20 hover:bg-white/[0.045]">
              <div className="flex items-start justify-between gap-3">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-cyan-400/10 text-cyan-300"><Lightbulb className="h-4 w-4" /></div>
                <span className={`rounded-full border px-2 py-0.5 text-[10px] font-medium ${opportunityTone[action.severity]}`}>{action.severity}</span>
              </div>
              <h3 className="mt-4 text-sm font-semibold text-slate-100 group-hover:text-white">{action.title}</h3>
              <p className="mt-2 line-clamp-2 text-xs leading-5 text-slate-400">{action.recommendedAction}</p>
              <div className="mt-4 flex items-center justify-between text-[11px] text-slate-500"><span>{action.scopeLabel}</span><span className="flex items-center text-cyan-300">Review <ArrowRight className="ml-1 h-3 w-3" /></span></div>
            </Link>
          ))}
        </div>
      </Panel>
    </div>
  );
}

function Panel({ title, description, badge, children }: { title: string; description: string; badge?: string; children: React.ReactNode }) {
  return (
    <section className="rounded-2xl border border-white/10 bg-[#0b1625]/82 p-5 shadow-[0_20px_60px_rgba(0,0,0,.14)] lg:p-6">
      <div className="mb-5 flex items-start justify-between gap-4">
        <div><h2 className="text-base font-semibold text-slate-100">{title}</h2><p className="mt-1 text-xs leading-5 text-slate-500">{description}</p></div>
        {badge ? <Badge variant="outline" className="shrink-0 border-white/10 text-[10px] font-medium text-slate-400">{badge}</Badge> : null}
      </div>
      {children}
    </section>
  );
}

function KpiCell({ icon: Icon, label, value, detail, delta, tone }: { icon: typeof Gauge; label: string; value: string; detail: string; delta: string; tone: "amber" | "green" | "muted" }) {
  const toneClass = tone === "amber" ? "text-amber-300" : tone === "green" ? "text-emerald-300" : "text-slate-500";
  return (
    <div className="border-b border-white/[0.08] p-5 last:border-b-0 sm:[&:nth-child(odd)]:border-r xl:border-b-0 xl:border-r xl:last:border-r-0">
      <div className="flex items-center justify-between"><span className="text-xs font-medium uppercase tracking-[0.12em] text-slate-500">{label}</span><Icon className="h-4 w-4 text-slate-600" /></div>
      <div className="mt-3 flex items-end justify-between gap-3"><span className="text-xl font-semibold tracking-tight text-white">{value}</span><span className={`text-xs font-medium ${toneClass}`}>{delta}</span></div>
      <p className="mt-1.5 text-[11px] text-slate-500">{detail}</p>
    </div>
  );
}

function MetricRow({ label, value, tone }: { label: string; value: string; tone: string }) {
  return <div className="flex items-center justify-between"><span className="text-slate-400">{label}</span><span className={`font-medium ${tone}`}>{value}</span></div>;
}

function LegendKey({ color, label }: { color: string; label: string }) {
  return <span className="inline-flex items-center gap-1.5"><span className={`h-2 w-2 rounded-full ${color}`} />{label}</span>;
}

function buildWorkflowMix() {
  const buckets = new Map<string, number>();
  TELEMETRY_DATA.interactions.forEach((interaction) => {
    const label = interaction.agentPattern && interaction.agentPattern !== "None"
      ? `Agent · ${interaction.agentPattern}`
      : interaction.pluginName !== "Direct Assistant"
        ? `Plugin · ${interaction.pluginName}`
        : interaction.requestSource || "Direct assistant";
    buckets.set(label, (buckets.get(label) ?? 0) + interaction.estimatedCredits);
  });
  const sorted = Array.from(buckets.entries()).sort((a, b) => b[1] - a[1]).slice(0, 4);
  const max = sorted[0]?.[1] ?? 1;
  return sorted.map(([label, value]) => ({ label, share: Math.max(8, Math.round((value / max) * 100)) }));
}

function buildReasoningFit() {
  const classified = TELEMETRY_DATA.interactions.filter((interaction) => interaction.modelCategory !== "Auto");
  if (!classified.length) return { rightSized: 68, overpowered: 24, underpowered: 8 };
  const highReasoning = classified.filter((interaction) => interaction.modelCategory === "High Reasoning").length;
  const overpowered = Math.max(12, Math.min(34, Math.round((highReasoning / classified.length) * 54)));
  const underpowered = Math.max(6, Math.round(overpowered * 0.32));
  return { rightSized: 100 - overpowered - underpowered, overpowered, underpowered };
}
