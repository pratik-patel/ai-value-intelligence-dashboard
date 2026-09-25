import { useState } from "react";
import { Activity, ArrowRight, CircleDollarSign, GitPullRequest, Layers3, Sparkles, Target, TrendingUp } from "lucide-react";
import { Link } from "wouter";
import { Bar, BarChart, CartesianGrid, Cell, Legend, Pie, PieChart, ResponsiveContainer, Scatter, ScatterChart, Tooltip, XAxis, YAxis, ZAxis } from "recharts";

import { Button } from "@/components/ui/button";
import { getScopedInteractions, useDashboardScope } from "@/lib/scope-context";
import { TELEMETRY_DATA, formatConsumption, type InteractionSummary } from "@/lib/telemetry-data";
import { getPatternsWorthScaling, getSkillValue, getValueMetrics, getWorkflowValue, type ScalablePattern } from "@/lib/value-data";

const colors = ["#22d3ee", "#8b5cf6", "#34d399", "#f59e0b", "#64748b"];
const routingTiers = [
  { key: "Auto", label: "Auto", color: "#14b8a6" },
  { key: "Coder", label: "Coder", color: "#38bdf8" },
  { key: "Balanced", label: "Balanced", color: "#8b5cf6" },
  { key: "High Reasoning", label: "High reasoning", color: "#f59e0b" },
] as const;
type EfficiencyView = "value" | "routing";

export default function EfficiencyRoi() {
  const initialView = typeof window !== "undefined" && new URLSearchParams(window.location.search).get("view") === "routing" ? "routing" : "value";
  const [view, setView] = useState<EfficiencyView>(initialView);
  const scope = useDashboardScope();
  const interactions = getScopedInteractions(scope);
  const metrics = getValueMetrics(interactions, scope.userId || scope.teamId || scope.portfolioId || "enterprise");
  const workflows = getWorkflowValue(interactions).slice(0, 5);
  const skills = getSkillValue(interactions);
  const scalablePatterns = getPatternsWorthScaling(interactions);
  const scatter = workflows.map((item) => ({ name: item.name, usage: Math.round(item.usage), outcomes: item.successfulOutcomes, quality: item.qualityPassRate }));

  function changeView(next: EfficiencyView) {
    setView(next);
    window.history.replaceState(null, "", next === "routing" ? "/efficiency?view=routing" : "/efficiency");
  }

  return (
    <div className="mx-auto max-w-[1500px] space-y-5 px-5 py-7 lg:px-8">
      <header className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div><p className="text-xs font-medium uppercase tracking-[0.16em] text-cyan-300">{view === "routing" ? "Model routing" : "Efficiency & ROI"}</p><h1 className="mt-1 text-2xl font-semibold text-white">{view === "routing" ? "Use the right model for the work." : "Turn consumption into evidence of value."}</h1><p className="mt-1 text-xs text-slate-500">{view === "routing" ? "Compare requests and provider usage across model tiers, workflows, and channels." : "Compare output, model fit and workflow efficiency in the current scope."}</p></div>
        <div className="flex flex-wrap items-center gap-2"><div className="flex rounded-lg border border-white/10 bg-[#0b1625] p-1" aria-label="Efficiency analysis view"><button type="button" onClick={() => changeView("value")} className={`rounded-md px-3 py-1.5 text-xs font-medium ${view === "value" ? "bg-white/10 text-white" : "text-slate-500 hover:text-slate-300"}`}>Value & outcomes</button><button type="button" onClick={() => changeView("routing")} className={`rounded-md px-3 py-1.5 text-xs font-medium ${view === "routing" ? "bg-cyan-400 text-slate-950" : "text-slate-500 hover:text-slate-300"}`}>Model routing</button></div>{view === "value" ? <Link href="/studio"><Button variant="outline" className="border-white/10 bg-white/[0.03] text-slate-200 hover:bg-white/[0.07]">Model a change <ArrowRight className="ml-2 h-4 w-4" /></Button></Link> : <Link href="/reports" className="inline-flex h-9 items-center rounded-lg border border-white/10 bg-white/[0.03] px-3 text-xs font-medium text-slate-300 hover:bg-white/[0.07]">Open evidence <ArrowRight className="ml-2 h-3.5 w-3.5" /></Link>}</div>
      </header>

      {view === "value" ? <>
      <section className="grid overflow-hidden rounded-2xl border border-white/10 bg-[#0b1625]/82 sm:grid-cols-2 xl:grid-cols-4">
        <Metric icon={CircleDollarSign} label="Estimated ROI" value={`${metrics.roi.toFixed(1)}×`} note={`$${Math.round(metrics.estimatedBenefit).toLocaleString()} benefit`} />
        <Metric icon={GitPullRequest} label="Successful outcomes" value={metrics.successfulOutcomes.toLocaleString()} note={`${metrics.qualityPassRate}% quality pass`} />
        <Metric icon={Target} label="Outcome efficiency" value={metrics.efficiencyIndex.toFixed(1)} note="outcomes / 1K units" />
        <Metric icon={Sparkles} label="Cycle-time change" value={`+${metrics.cycleTimeImprovement}%`} note={`${Math.round(metrics.hoursSaved)} hours modeled`} />
      </section>

      <section className="grid gap-5 xl:grid-cols-[1.15fr_.85fr]">
        <Panel title="Usage vs. successful outcomes" subtitle="Upper-left patterns produce more with less.">
          <div className="h-[300px]"><ResponsiveContainer width="100%" height="100%"><ScatterChart margin={{ top: 15, right: 20, bottom: 15, left: 0 }}><CartesianGrid stroke="rgba(148,163,184,.09)" strokeDasharray="4 4" /><XAxis type="number" dataKey="usage" name="Usage" tick={{ fill: "#64748b", fontSize: 10 }} axisLine={false} tickLine={false} /><YAxis type="number" dataKey="outcomes" name="Outcomes" tick={{ fill: "#64748b", fontSize: 10 }} axisLine={false} tickLine={false} /><ZAxis dataKey="quality" range={[80, 220]} /><Tooltip cursor={{ strokeDasharray: "3 3" }} contentStyle={{ background: "#0b1625", border: "1px solid rgba(255,255,255,.12)", borderRadius: 10 }} /><Scatter data={scatter} fill="#22d3ee" /></ScatterChart></ResponsiveContainer></div>
        </Panel>
        <Panel title="Workflow share" subtitle="Where the current scope spends its capacity.">
          <div className="h-[250px]"><ResponsiveContainer width="100%" height="100%"><PieChart><Pie data={workflows} dataKey="value" nameKey="name" innerRadius={58} outerRadius={88} paddingAngle={3}>{workflows.map((item, index) => <Cell key={item.name} fill={colors[index % colors.length]} />)}</Pie><Tooltip contentStyle={{ background: "#0b1625", border: "1px solid rgba(255,255,255,.12)", borderRadius: 10 }} formatter={(value: number) => `${formatConsumption(value)} units`} /><Legend iconType="circle" wrapperStyle={{ fontSize: 11, color: "#94a3b8" }} /></PieChart></ResponsiveContainer></div>
        </Panel>
      </section>

      <section className="rounded-2xl border border-white/10 bg-[#0b1625]/82 p-5 lg:p-6">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between"><div><div className="flex items-center gap-2"><TrendingUp className="h-4 w-4 text-emerald-300" /><h2 className="text-sm font-semibold text-slate-100">Patterns worth scaling</h2></div><p className="mt-1 text-[11px] text-slate-500">Balanced outcome, efficiency, and quality signals with at least 50 interactions and 40 successful outcomes.</p></div><Link href="/explorer" className="text-xs font-medium text-cyan-300">Compare all peers <ArrowRight className="ml-1 inline h-3.5 w-3.5" /></Link></div>
        {scalablePatterns.length ? <div className="mt-5 grid gap-3 lg:grid-cols-3">{scalablePatterns.map((pattern) => <PatternCard key={pattern.userId} pattern={pattern} />)}</div> : <div className="mt-5 rounded-xl border border-dashed border-white/10 px-4 py-7 text-center text-xs text-slate-500">No pattern in the current scope meets the evidence threshold yet.</div>}
      </section>

      <section className="grid gap-5 xl:grid-cols-[1.15fr_.85fr]">
        <Panel title="Observed model-tier usage" subtitle="Provider-reported usage grouped by the configured model tier.">
          <TierUsageSummary interactions={interactions} />
        </Panel>
        <Panel title="Skill effectiveness" subtitle="Modeled until explicit skill-run telemetry is connected.">
          <div className="space-y-3">{skills.map((skill, index) => <div key={skill.name} className="rounded-xl border border-white/[0.07] bg-white/[0.025] p-3.5"><div className="flex items-center justify-between gap-3"><div><p className="text-sm font-medium text-slate-200">{skill.name}</p><p className="mt-0.5 text-[11px] text-slate-500">{skill.outcomes} outcomes · {formatConsumption(skill.usage)} units</p></div><span className="text-sm font-semibold" style={{ color: colors[index % colors.length] }}>{skill.efficiency.toFixed(1)}</span></div><div className="mt-3 h-1.5 rounded-full bg-white/[0.06]"><div className="h-full rounded-full" style={{ width: `${Math.min(100, skill.efficiency * 7)}%`, backgroundColor: colors[index % colors.length] }} /></div></div>)}</div>
        </Panel>
      </section>

      </> : <RoutingView interactions={interactions} />}

    </div>
  );
}

function RoutingView({ interactions }: { interactions: InteractionSummary[] }) {
  const totalUsage = interactions.reduce((sum, item) => sum + item.estimatedCredits, 0);
  const highReasoningUsage = interactions.filter((item) => item.modelCategory === "High Reasoning").reduce((sum, item) => sum + item.estimatedCredits, 0);
  const efficientTierUsage = interactions.filter((item) => item.modelCategory === "Coder" || item.modelCategory === "Auto").reduce((sum, item) => sum + item.estimatedCredits, 0);
  const frontierShare = totalUsage ? Math.round(highReasoningUsage / totalUsage * 100) : 0;
  const efficientShare = totalUsage ? Math.round(efficientTierUsage / totalUsage * 100) : 0;
  const averageUsage = interactions.length ? totalUsage / interactions.length : 0;
  const modelCount = new Set(interactions.map((item) => item.modelName)).size;
  const trend = buildRoutingTrend(interactions);
  const models = buildModelRows(interactions, totalUsage);
  const tierSummary = routingTiers.map((tier) => {
    const rows = interactions.filter((item) => item.modelCategory === tier.key);
    const usage = rows.reduce((sum, item) => sum + item.estimatedCredits, 0);
    return { ...tier, calls: rows.length, usage, share: totalUsage ? Math.round(usage / totalUsage * 100) : 0 };
  }).filter((item) => item.calls > 0);

  return <>
    <section className="grid overflow-hidden rounded-2xl border border-white/10 bg-[#0b1625]/82 sm:grid-cols-2 xl:grid-cols-4">
      <Metric icon={Activity} label="Model requests" value={interactions.length.toLocaleString()} note={`${modelCount} models observed`} />
      <Metric icon={Target} label="Usage / request" value={formatConsumption(averageUsage)} note="provider usage units" />
      <Metric icon={Sparkles} label="High-reasoning share" value={`${frontierShare}%`} note="share of provider usage" />
      <Metric icon={Layers3} label="Coder + auto share" value={`${efficientShare}%`} note="share of provider usage" />
    </section>

    <section className="grid gap-5 xl:grid-cols-[1.25fr_.75fr]">
      <Panel title="Routing mix over time" subtitle="Provider usage units by model tier; no GPU or infrastructure estimates.">
        <div className="h-[310px]"><ResponsiveContainer width="100%" height="100%"><BarChart data={trend} margin={{ top: 12, right: 12, left: -10, bottom: 0 }}><CartesianGrid stroke="rgba(148,163,184,.08)" vertical={false} /><XAxis dataKey="date" tick={{ fill: "#64748b", fontSize: 10 }} axisLine={false} tickLine={false} /><YAxis tick={{ fill: "#64748b", fontSize: 10 }} axisLine={false} tickLine={false} /><Tooltip formatter={(value: number) => `${formatConsumption(value)} units`} />{routingTiers.map((tier, index) => <Bar key={tier.key} dataKey={tier.key} name={tier.label} stackId="routing" fill={tier.color} radius={index === routingTiers.length - 1 ? [3, 3, 0, 0] : undefined} />)}<Legend iconType="circle" wrapperStyle={{ fontSize: 11, color: "#94a3b8" }} /></BarChart></ResponsiveContainer></div>
      </Panel>
      <Panel title="Tier distribution" subtitle="Requests and usage are shown separately to expose expensive request shapes.">
        <div className="space-y-3">{tierSummary.map((tier) => <div key={tier.key} className="rounded-xl border border-white/[0.07] bg-white/[0.025] p-3.5"><div className="flex items-center justify-between gap-3"><div className="flex items-center gap-2"><span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: tier.color }} /><span className="text-xs font-medium text-slate-200">{tier.label}</span></div><span className="text-xs font-semibold text-slate-200">{tier.share}%</span></div><div className="mt-2 flex items-center justify-between text-[10px] text-slate-500"><span>{tier.calls.toLocaleString()} requests</span><span>{formatConsumption(tier.usage)} units</span></div><div className="mt-2.5 h-1.5 overflow-hidden rounded-full bg-white/[0.06]"><div className="h-full rounded-full" style={{ width: `${tier.share}%`, backgroundColor: tier.color }} /></div></div>)}</div>
      </Panel>
    </section>

    <section className="rounded-2xl border border-white/10 bg-[#0b1625]/82 p-5 lg:p-6">
      <div className="mb-4"><h2 className="text-sm font-semibold text-slate-100">Model routing detail</h2><p className="mt-1 text-[11px] text-slate-500">Exact provider-visible model, request, usage, channel, and workflow attribution.</p></div>
      <div className="overflow-x-auto"><table className="w-full min-w-[860px] text-left text-xs"><thead className="border-b border-white/[0.08] text-[10px] uppercase tracking-[0.12em] text-slate-600"><tr><th className="px-3 py-3 font-medium">Model</th><th className="px-3 py-3 font-medium">Tier</th><th className="px-3 py-3 text-right font-medium">Requests</th><th className="px-3 py-3 text-right font-medium">Usage</th><th className="px-3 py-3 text-right font-medium">Share</th><th className="px-3 py-3 text-right font-medium">Units / request</th><th className="px-3 py-3 font-medium">Top workflow</th><th className="px-3 py-3 font-medium">Primary channel</th></tr></thead><tbody className="divide-y divide-white/[0.06]">{models.map((model) => <tr key={model.name} className="text-slate-400 hover:bg-white/[0.025]"><td className="px-3 py-3.5 font-medium text-slate-200">{model.name}</td><td className="px-3 py-3.5"><span className="rounded-full px-2 py-1 text-[10px]" style={{ backgroundColor: `${model.color}18`, color: model.color }}>{model.tier}</span></td><td className="px-3 py-3.5 text-right">{model.calls}</td><td className="px-3 py-3.5 text-right">{formatConsumption(model.usage)}</td><td className="px-3 py-3.5 text-right">{model.share}%</td><td className="px-3 py-3.5 text-right">{formatConsumption(model.averageUsage)}</td><td className="px-3 py-3.5">{model.topWorkflow}</td><td className="px-3 py-3.5">{model.topChannel}</td></tr>)}</tbody></table></div>
      <p className="mt-4 border-t border-white/[0.07] pt-3 text-[10px] leading-5 text-slate-500">This view uses only fields commonly available from developer-tool telemetry or instrumented sessions. Token and billing-unit fields can be connected per provider; GPU-seconds, unreported cache behavior, and inferred infrastructure cost are intentionally excluded.</p>
    </section>
  </>;
}

function Panel({ title, subtitle, children }: { title: string; subtitle: string; children: React.ReactNode }) { return <section className="rounded-2xl border border-white/10 bg-[#0b1625]/82 p-5 lg:p-6"><div className="mb-4"><h2 className="text-sm font-semibold text-slate-100">{title}</h2><p className="mt-1 text-[11px] text-slate-500">{subtitle}</p></div>{children}</section>; }
function Metric({ icon: Icon, label, value, note }: { icon: typeof Sparkles; label: string; value: string; note: string }) { return <div className="border-b border-white/[0.08] p-5 last:border-b-0 sm:[&:nth-child(odd)]:border-r xl:border-b-0 xl:border-r xl:last:border-r-0"><div className="flex items-center justify-between"><span className="text-[10px] font-medium uppercase tracking-[0.14em] text-slate-600">{label}</span><Icon className="h-4 w-4 text-violet-300" /></div><p className="mt-3 text-xl font-semibold text-white">{value}</p><p className="mt-1 text-[11px] text-slate-500">{note}</p></div>; }
function PatternCard({ pattern }: { pattern: ScalablePattern }) { const detailId = TELEMETRY_DATA.engineers.find((item) => item.userId === pattern.userId)?.id ?? pattern.userId; return <article className="flex min-h-[210px] flex-col rounded-xl border border-white/[0.08] bg-white/[0.025] p-4"><div><span className="inline-flex rounded-full bg-emerald-400/10 px-2 py-1 text-[10px] font-medium text-emerald-300">{pattern.useCase}</span><h3 className="mt-3 text-sm font-semibold text-slate-100">{pattern.userName}</h3><p className="mt-0.5 truncate text-[10px] text-slate-400">{pattern.teamName}</p></div><dl className="mt-4 grid grid-cols-3 gap-2"><PatternMetric label="Outcomes" value={String(pattern.outcomes)} /><PatternMetric label="Per 1K" value={pattern.efficiency.toFixed(1)} /><PatternMetric label="Quality" value={`${pattern.quality}%`} /></dl><p className="mt-4 text-[11px] leading-5 text-slate-400">{pattern.action}</p><div className="mt-auto flex items-center justify-between gap-3 pt-4"><span className="truncate text-[10px] text-slate-500">{pattern.dominantModel} · {pattern.modelShare}%</span><Link href={`/detail/engineer/${detailId}`} className="shrink-0 text-[11px] font-medium text-cyan-300">View pattern <ArrowRight className="ml-1 inline h-3 w-3" /></Link></div></article>; }
function PatternMetric({ label, value }: { label: string; value: string }) { return <div><dt className="text-[9px] uppercase tracking-[0.12em] text-slate-500">{label}</dt><dd className="mt-1 text-xs font-semibold text-slate-200">{value}</dd></div>; }

function TierUsageSummary({ interactions }: { interactions: InteractionSummary[] }) {
  const totalUsage = interactions.reduce((sum, item) => sum + item.estimatedCredits, 0);
  const summary = routingTiers.map((tier) => {
    const rows = interactions.filter((item) => item.modelCategory === tier.key);
    const usage = rows.reduce((sum, item) => sum + item.estimatedCredits, 0);
    return { ...tier, requests: rows.length, usage, share: totalUsage ? Math.round(usage / totalUsage * 100) : 0 };
  }).filter((tier) => tier.requests > 0);

  return <div className="space-y-3">{summary.map((tier) => <div key={tier.key} className="rounded-xl border border-white/[0.07] bg-white/[0.025] p-3.5"><div className="flex items-center justify-between gap-3"><div className="flex items-center gap-2"><span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: tier.color }} /><span className="text-xs font-medium text-slate-200">{tier.label}</span></div><span className="text-xs font-semibold text-slate-200">{tier.share}%</span></div><div className="mt-2 flex items-center justify-between text-[10px] text-slate-500"><span>{tier.requests.toLocaleString()} requests</span><span>{formatConsumption(tier.usage)} units</span></div><div className="mt-2.5 h-1.5 overflow-hidden rounded-full bg-white/[0.06]"><div className="h-full rounded-full" style={{ width: `${tier.share}%`, backgroundColor: tier.color }} /></div></div>)}</div>;
}

function buildRoutingTrend(interactions: InteractionSummary[]) {
  const byDate = new Map<string, Record<string, string | number>>();
  interactions.forEach((item) => {
    const date = item.timestamp.slice(5, 10);
    const row = byDate.get(date) ?? { date, Auto: 0, Coder: 0, Balanced: 0, "High Reasoning": 0 };
    row[item.modelCategory] = Number(row[item.modelCategory] ?? 0) + item.estimatedCredits;
    byDate.set(date, row);
  });
  return Array.from(byDate.values())
    .sort((a, b) => String(a.date).localeCompare(String(b.date)))
    .map((row) => ({
      ...row,
      Auto: Number(Number(row.Auto).toFixed(1)),
      Coder: Number(Number(row.Coder).toFixed(1)),
      Balanced: Number(Number(row.Balanced).toFixed(1)),
      "High Reasoning": Number(Number(row["High Reasoning"]).toFixed(1)),
    }));
}

function buildModelRows(interactions: InteractionSummary[], totalUsage: number) {
  const grouped = new Map<string, InteractionSummary[]>();
  interactions.forEach((item) => grouped.set(item.modelName, [...(grouped.get(item.modelName) ?? []), item]));
  return Array.from(grouped, ([name, rows]) => {
    const usage = rows.reduce((sum, item) => sum + item.estimatedCredits, 0);
    const tier = rows[0]?.modelCategory ?? "Auto";
    const tierConfig = routingTiers.find((item) => item.key === tier) ?? routingTiers[0];
    return {
      name,
      tier: tierConfig.label,
      color: tierConfig.color,
      calls: rows.length,
      usage,
      share: totalUsage ? Math.round(usage / totalUsage * 100) : 0,
      averageUsage: rows.length ? usage / rows.length : 0,
      topWorkflow: topAttribute(rows, "useCaseLabel"),
      topChannel: topAttribute(rows, "interactionChannel"),
    };
  }).sort((a, b) => b.usage - a.usage);
}

function topAttribute(rows: InteractionSummary[], key: "useCaseLabel" | "interactionChannel") {
  const usageByValue = new Map<string, number>();
  rows.forEach((item) => {
    const value = item[key] || "Unattributed";
    usageByValue.set(value, (usageByValue.get(value) ?? 0) + item.estimatedCredits);
  });
  return Array.from(usageByValue.entries()).sort((a, b) => b[1] - a[1])[0]?.[0] ?? "Unattributed";
}
