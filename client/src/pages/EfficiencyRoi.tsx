import { ArrowRight, CircleDollarSign, GitPullRequest, Sparkles, Target, TrendingUp } from "lucide-react";
import { Link } from "wouter";
import { Bar, BarChart, CartesianGrid, Cell, Legend, Pie, PieChart, ResponsiveContainer, Scatter, ScatterChart, Tooltip, XAxis, YAxis, ZAxis } from "recharts";

import { Button } from "@/components/ui/button";
import { getScopedInteractions, useDashboardScope } from "@/lib/scope-context";
import { TELEMETRY_DATA, formatConsumption } from "@/lib/telemetry-data";
import { getPatternsWorthScaling, getReasoningFit, getSkillValue, getValueMetrics, getWorkflowValue, type ScalablePattern } from "@/lib/value-data";

const colors = ["#22d3ee", "#8b5cf6", "#34d399", "#f59e0b", "#64748b"];

export default function EfficiencyRoi() {
  const scope = useDashboardScope();
  const interactions = getScopedInteractions(scope);
  const metrics = getValueMetrics(interactions, scope.userId || scope.teamId || scope.portfolioId || "enterprise");
  const reasoning = getReasoningFit(interactions);
  const workflows = getWorkflowValue(interactions).slice(0, 5);
  const skills = getSkillValue(interactions);
  const scalablePatterns = getPatternsWorthScaling(interactions);
  const scatter = workflows.map((item) => ({ name: item.name, usage: Math.round(item.usage), outcomes: item.successfulOutcomes, quality: item.qualityPassRate }));

  return (
    <div className="mx-auto max-w-[1500px] space-y-5 px-5 py-7 lg:px-8">
      <header className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div><p className="text-xs font-medium uppercase tracking-[0.16em] text-cyan-300">Efficiency & ROI</p><h1 className="mt-1 text-2xl font-semibold text-white">Turn consumption into evidence of value.</h1><p className="mt-1 text-xs text-slate-500">Compare output, model fit and workflow efficiency in the current scope.</p></div>
        <Link href="/studio"><Button variant="outline" className="border-white/10 bg-white/[0.03] text-slate-200 hover:bg-white/[0.07]">Model a change <ArrowRight className="ml-2 h-4 w-4" /></Button></Link>
      </header>

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
        <Panel title="Reasoning-tier fit" subtitle="Amber usage is a candidate for task-level review, not automatic downgrade.">
          <div className="h-[270px]"><ResponsiveContainer width="100%" height="100%"><BarChart data={reasoning} layout="vertical" margin={{ left: 18, right: 20 }}><CartesianGrid stroke="rgba(148,163,184,.08)" horizontal={false} /><XAxis type="number" hide /><YAxis type="category" dataKey="tier" width={72} tick={{ fill: "#94a3b8", fontSize: 11 }} axisLine={false} tickLine={false} /><Tooltip contentStyle={{ background: "#0b1625", border: "1px solid rgba(255,255,255,.12)", borderRadius: 10 }} formatter={(value: number) => `${formatConsumption(value)} units`} /><Legend iconType="circle" wrapperStyle={{ fontSize: 11 }} /><Bar dataKey="appropriate" name="Likely fit" stackId="fit" fill="#34d399" radius={[4, 0, 0, 4]} /><Bar dataKey="review" name="Review" stackId="fit" fill="#f59e0b" radius={[0, 4, 4, 0]} /></BarChart></ResponsiveContainer></div>
        </Panel>
        <Panel title="Skill effectiveness" subtitle="Modeled until explicit skill-run telemetry is connected.">
          <div className="space-y-3">{skills.map((skill, index) => <div key={skill.name} className="rounded-xl border border-white/[0.07] bg-white/[0.025] p-3.5"><div className="flex items-center justify-between gap-3"><div><p className="text-sm font-medium text-slate-200">{skill.name}</p><p className="mt-0.5 text-[11px] text-slate-500">{skill.outcomes} outcomes · {formatConsumption(skill.usage)} units</p></div><span className="text-sm font-semibold" style={{ color: colors[index % colors.length] }}>{skill.efficiency.toFixed(1)}</span></div><div className="mt-3 h-1.5 rounded-full bg-white/[0.06]"><div className="h-full rounded-full" style={{ width: `${Math.min(100, skill.efficiency * 7)}%`, backgroundColor: colors[index % colors.length] }} /></div></div>)}</div>
        </Panel>
      </section>

    </div>
  );
}

function Panel({ title, subtitle, children }: { title: string; subtitle: string; children: React.ReactNode }) { return <section className="rounded-2xl border border-white/10 bg-[#0b1625]/82 p-5 lg:p-6"><div className="mb-4"><h2 className="text-sm font-semibold text-slate-100">{title}</h2><p className="mt-1 text-[11px] text-slate-500">{subtitle}</p></div>{children}</section>; }
function Metric({ icon: Icon, label, value, note }: { icon: typeof Sparkles; label: string; value: string; note: string }) { return <div className="border-b border-white/[0.08] p-5 last:border-b-0 sm:[&:nth-child(odd)]:border-r xl:border-b-0 xl:border-r xl:last:border-r-0"><div className="flex items-center justify-between"><span className="text-[10px] font-medium uppercase tracking-[0.14em] text-slate-600">{label}</span><Icon className="h-4 w-4 text-violet-300" /></div><p className="mt-3 text-xl font-semibold text-white">{value}</p><p className="mt-1 text-[11px] text-slate-500">{note}</p></div>; }
function PatternCard({ pattern }: { pattern: ScalablePattern }) { const detailId = TELEMETRY_DATA.engineers.find((item) => item.userId === pattern.userId)?.id ?? pattern.userId; return <article className="flex min-h-[210px] flex-col rounded-xl border border-white/[0.08] bg-white/[0.025] p-4"><div><span className="inline-flex rounded-full bg-emerald-400/10 px-2 py-1 text-[10px] font-medium text-emerald-300">{pattern.useCase}</span><h3 className="mt-3 text-sm font-semibold text-slate-100">{pattern.userName}</h3><p className="mt-0.5 truncate text-[10px] text-slate-400">{pattern.teamName}</p></div><dl className="mt-4 grid grid-cols-3 gap-2"><PatternMetric label="Outcomes" value={String(pattern.outcomes)} /><PatternMetric label="Per 1K" value={pattern.efficiency.toFixed(1)} /><PatternMetric label="Quality" value={`${pattern.quality}%`} /></dl><p className="mt-4 text-[11px] leading-5 text-slate-400">{pattern.action}</p><div className="mt-auto flex items-center justify-between gap-3 pt-4"><span className="truncate text-[10px] text-slate-500">{pattern.dominantModel} · {pattern.modelShare}%</span><Link href={`/detail/engineer/${detailId}`} className="shrink-0 text-[11px] font-medium text-cyan-300">View pattern <ArrowRight className="ml-1 inline h-3 w-3" /></Link></div></article>; }
function PatternMetric({ label, value }: { label: string; value: string }) { return <div><dt className="text-[9px] uppercase tracking-[0.12em] text-slate-500">{label}</dt><dd className="mt-1 text-xs font-semibold text-slate-200">{value}</dd></div>; }
