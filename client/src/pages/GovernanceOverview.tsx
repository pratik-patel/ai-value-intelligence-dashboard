import { useMemo } from "react";
import { ArrowRight, CircleDollarSign, Gauge, Target, Users } from "lucide-react";
import { Link } from "wouter";
import { Area, AreaChart, Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";

import { getScopedInteractions, useDashboardScope } from "@/lib/scope-context";
import { TELEMETRY_DATA, formatConsumption } from "@/lib/telemetry-data";
import { getValueMetrics } from "@/lib/value-data";

export default function GovernanceOverview() {
  const scope = useDashboardScope();
  const interactions = getScopedInteractions(scope);
  const scopeName = scope.user?.name ?? scope.team?.name ?? scope.portfolio?.name ?? "Enterprise";
  const metrics = getValueMetrics(interactions, scope.userId || scope.teamId || scope.portfolioId || "enterprise");
  const trend = useMemo(() => {
    const buckets = new Map<string, { date: string; usage: number; outcomes: number }>();
    interactions.forEach((item) => {
      const date = item.timestamp.slice(5, 10);
      const current = buckets.get(date) ?? { date, usage: 0, outcomes: 0 };
      current.usage += item.estimatedCredits;
      current.outcomes += 0.76;
      buckets.set(date, current);
    });
    return Array.from(buckets.values()).sort((a, b) => a.date.localeCompare(b.date)).map((item) => ({ ...item, usage: Number(item.usage.toFixed(1)), outcomes: Math.round(item.outcomes) }));
  }, [interactions]);
  const comparisonItems = scope.teamId
    ? TELEMETRY_DATA.engineers.filter((item) => item.teamId === scope.teamId).map((item) => ({ id: item.userId, name: item.name, field: "engineerId" as const }))
    : scope.portfolioId
      ? TELEMETRY_DATA.teams.filter((item) => item.costCenterId === scope.portfolioId).map((item) => ({ id: item.id, name: item.name, field: "teamId" as const }))
      : TELEMETRY_DATA.costCenters.map((item) => ({ id: item.id, name: item.name, field: "costCenterId" as const }));
  const comparison = comparisonItems.map((item) => {
    const rows = interactions.filter((interaction) => interaction[item.field] === item.id);
    const value = getValueMetrics(rows, item.id);
    return { name: item.name.split(" ")[0], usage: value.usage, efficiency: Number(value.efficiencyIndex.toFixed(1)) };
  }).filter((item) => item.usage > 0);
  const actions = TELEMETRY_DATA.recommendations.slice(0, 3);

  return (
    <div className="mx-auto max-w-[1480px] space-y-5 px-5 py-7 lg:px-8">
      <header className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div><p className="text-xs font-medium uppercase tracking-[0.16em] text-cyan-300">{scopeName}</p><h1 className="mt-1 text-2xl font-semibold text-white">AI value at a glance</h1><p className="mt-1 text-xs text-slate-500">One view of adoption, delivery output and optimization opportunity.</p></div>
      </header>

      <section className="grid overflow-hidden rounded-2xl border border-white/10 bg-[#0b1625]/82 sm:grid-cols-2 xl:grid-cols-4">
        <Kpi icon={Gauge} label="Usage" value={`${formatConsumption(metrics.usage)} units`} delta={`${metrics.runs.toLocaleString()} interactions`} />
        <Kpi icon={Target} label="Successful outcomes" value={metrics.successfulOutcomes.toLocaleString()} delta={`${metrics.qualityPassRate}% quality pass`} />
        <Kpi icon={CircleDollarSign} label="Estimated ROI" value={`${metrics.roi.toFixed(1)}×`} delta={`$${Math.round(metrics.estimatedBenefit).toLocaleString()} modeled benefit`} accent />
        <Kpi icon={Users} label="Delivery velocity" value={`+${metrics.cycleTimeImprovement}%`} delta={`${metrics.efficiencyIndex.toFixed(1)} outcomes / 1K units`} />
      </section>

      <section className="grid gap-5 xl:grid-cols-[1.35fr_.85fr]">
        <Panel title="Usage and delivery trend" action={<Link href="/efficiency" className="text-xs text-cyan-300">Analyze value <ArrowRight className="ml-1 inline h-3.5 w-3.5" /></Link>}>
          <div className="h-[270px]"><ResponsiveContainer width="100%" height="100%"><AreaChart data={trend} margin={{ top: 15, right: 12, left: -12, bottom: 0 }}><defs><linearGradient id="overviewUsage" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="#22d3ee" stopOpacity={0.3} /><stop offset="95%" stopColor="#22d3ee" stopOpacity={0} /></linearGradient></defs><CartesianGrid stroke="rgba(148,163,184,.09)" strokeDasharray="4 4" vertical={false} /><XAxis dataKey="date" tick={{ fill: "#64748b", fontSize: 10 }} axisLine={false} tickLine={false} minTickGap={28} /><YAxis tick={{ fill: "#64748b", fontSize: 10 }} axisLine={false} tickLine={false} /><Tooltip contentStyle={{ background: "#0b1625", border: "1px solid rgba(255,255,255,.12)", borderRadius: 10 }} /><Area type="monotone" dataKey="usage" name="Usage units" stroke="#22d3ee" strokeWidth={2} fill="url(#overviewUsage)" /></AreaChart></ResponsiveContainer></div>
          <div className="mt-2 flex gap-5 text-[11px] text-slate-500"><span><i className="mr-1.5 inline-block h-2 w-2 rounded-full bg-cyan-400" />Observed usage</span><span>Delivery outcomes are modeled separately</span></div>
        </Panel>

        <Panel title={scope.teamId ? "User comparison" : scope.portfolioId ? "Team comparison" : "Portfolio comparison"} action={<Link href="/explorer" className="text-xs text-cyan-300">Explore <ArrowRight className="ml-1 inline h-3.5 w-3.5" /></Link>}>
          <div className="h-[250px]"><ResponsiveContainer width="100%" height="100%"><BarChart data={comparison} layout="vertical" margin={{ left: 8, right: 16 }}><CartesianGrid stroke="rgba(148,163,184,.08)" horizontal={false} /><XAxis type="number" hide /><YAxis dataKey="name" type="category" width={72} tick={{ fill: "#94a3b8", fontSize: 10 }} axisLine={false} tickLine={false} /><Tooltip contentStyle={{ background: "#0b1625", border: "1px solid rgba(255,255,255,.12)", borderRadius: 10 }} formatter={(value: number) => [`${formatConsumption(value)} units`, "Usage"]} /><Bar dataKey="usage" fill="#38bdf8" radius={[0, 5, 5, 0]} barSize={15} /></BarChart></ResponsiveContainer></div>
        </Panel>
      </section>

      <Panel title="Decisions that need attention" action={<Link href="/recommendations" className="text-xs text-cyan-300">Open queue <ArrowRight className="ml-1 inline h-3.5 w-3.5" /></Link>}>
        <div className="grid gap-2 lg:grid-cols-3">{actions.map((action) => <Link key={action.id} href={`/recommendations?rec=${action.id}`} className="group rounded-xl border border-white/[0.07] bg-white/[0.025] p-4 hover:border-cyan-400/25 hover:bg-white/[0.045]"><div className="flex items-center justify-between"><span className={`rounded-full px-2 py-1 text-[10px] ${action.severity === "High" ? "bg-amber-400/10 text-amber-200" : "bg-sky-400/10 text-sky-200"}`}>{action.severity}</span><ArrowRight className="h-4 w-4 text-slate-700 group-hover:text-cyan-300" /></div><p className="mt-3 text-sm font-medium text-slate-200">{action.title}</p><p className="mt-1 text-[11px] text-slate-500">{action.scopeLabel} · {action.type}</p></Link>)}</div>
      </Panel>
    </div>
  );
}

function Panel({ title, action, children }: { title: string; action?: React.ReactNode; children: React.ReactNode }) { return <section className="rounded-2xl border border-white/10 bg-[#0b1625]/82 p-5 lg:p-6"><div className="mb-4 flex items-center justify-between gap-3"><h2 className="text-sm font-semibold text-slate-100">{title}</h2>{action}</div>{children}</section>; }
function Kpi({ icon: Icon, label, value, delta, accent }: { icon: typeof Gauge; label: string; value: string; delta: string; accent?: boolean }) { return <div className="border-b border-white/[0.08] p-5 last:border-b-0 sm:[&:nth-child(odd)]:border-r xl:border-b-0 xl:border-r xl:last:border-r-0"><div className="flex items-center justify-between"><span className="text-[10px] font-medium uppercase tracking-[0.14em] text-slate-600">{label}</span><Icon className={`h-4 w-4 ${accent ? "text-violet-300" : "text-slate-700"}`} /></div><p className="mt-3 text-xl font-semibold text-white">{value}</p><p className="mt-1 text-[11px] text-slate-500">{delta}</p></div>; }
