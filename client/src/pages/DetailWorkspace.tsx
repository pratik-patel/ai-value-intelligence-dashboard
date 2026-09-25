import { useMemo, useState } from "react";
import { ArrowLeft, ArrowRight, Bot, Boxes, FileSearch, Sparkles } from "lucide-react";
import { Link, useParams } from "wouter";
import { Bar, BarChart, CartesianGrid, Cell, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { TELEMETRY_DATA, formatConsumption, type InteractionSummary } from "@/lib/telemetry-data";
import { getValueMetrics } from "@/lib/value-data";

const colors = ["#22d3ee", "#8b5cf6", "#34d399", "#f59e0b", "#64748b"];
type Tab = "summary" | "drivers" | "actions";

export default function DetailWorkspace() {
  const params = useParams<{ entityType: string; entityId: string }>();
  const [tab, setTab] = useState<Tab>("summary");
  const resolved = useMemo(() => resolveEntity(params.entityType, params.entityId), [params.entityId, params.entityType]);
  const metrics = getValueMetrics(resolved.interactions, params.entityId);
  const models = summarize(resolved.interactions, "modelName");
  const plugins = summarize(resolved.interactions, "pluginName");
  const agents = summarize(resolved.interactions, "agentPattern");
  const useCases = summarize(resolved.interactions, "useCaseLabel");
  const actions = TELEMETRY_DATA.recommendations.slice(0, 4);

  return (
    <div className="mx-auto max-w-[1420px] space-y-5 px-5 py-7 lg:px-8">
      <header className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div><Link href="/explorer" className="inline-flex items-center text-xs text-slate-500 hover:text-cyan-300"><ArrowLeft className="mr-1.5 h-3.5 w-3.5" />Organization</Link><div className="mt-3 flex items-center gap-2"><Badge variant="outline" className="border-white/10 text-slate-400">{resolved.type}</Badge><Badge variant="outline" className="border-violet-400/20 text-violet-200">Illustrative value</Badge></div><h1 className="mt-2 text-2xl font-semibold text-white">{resolved.name}</h1><p className="mt-1 text-xs text-slate-500">{resolved.subtitle}</p></div>
        <Link href="/reports"><Button variant="outline" className="border-white/10 bg-white/[0.03] text-slate-200 hover:bg-white/[0.07]"><FileSearch className="mr-2 h-4 w-4" />View evidence</Button></Link>
      </header>

      <nav className="flex w-fit rounded-xl border border-white/10 bg-[#0b1625]/82 p-1" aria-label="Detail sections">{(["summary", "drivers", "actions"] as Tab[]).map((item) => <button key={item} type="button" onClick={() => setTab(item)} className={`rounded-lg px-4 py-2 text-xs font-medium capitalize ${tab === item ? "bg-cyan-400 text-slate-950" : "text-slate-400 hover:bg-white/[0.05] hover:text-white"}`}>{item === "drivers" ? "Usage drivers" : item}</button>)}</nav>

      {tab === "summary" ? <>
        <section className="grid overflow-hidden rounded-2xl border border-white/10 bg-[#0b1625]/82 sm:grid-cols-2 xl:grid-cols-4"><Metric label="Usage" value={`${formatConsumption(metrics.usage)} units`} note={`${metrics.runs} interactions`} /><Metric label="Successful outcomes" value={metrics.successfulOutcomes.toLocaleString()} note={`${metrics.qualityPassRate}% quality pass`} /><Metric label="Outcome efficiency" value={metrics.efficiencyIndex.toFixed(1)} note="outcomes / 1K units" /><Metric label="Estimated ROI" value={`${metrics.roi.toFixed(1)}×`} note={`+${metrics.cycleTimeImprovement}% velocity`} accent /></section>
        <div className="grid gap-5 xl:grid-cols-[1.2fr_.8fr]">
          <Panel title="Top workflows"><div className="h-[300px]"><ResponsiveContainer width="100%" height="100%"><BarChart data={useCases.slice(0, 7)} layout="vertical" margin={{ left: 28, right: 18 }}><CartesianGrid stroke="rgba(148,163,184,.08)" horizontal={false} /><XAxis type="number" hide /><YAxis type="category" dataKey="name" width={115} tick={{ fill: "#94a3b8", fontSize: 10 }} axisLine={false} tickLine={false} /><Tooltip contentStyle={{ background: "#0b1625", border: "1px solid rgba(255,255,255,.12)", borderRadius: 10 }} formatter={(value: number) => `${formatConsumption(value)} units`} /><Bar dataKey="value" fill="#22d3ee" radius={[0, 5, 5, 0]} /></BarChart></ResponsiveContainer></div></Panel>
          <Panel title="Model mix"><div className="h-[250px]"><ResponsiveContainer width="100%" height="100%"><PieChart><Pie data={models.slice(0, 5)} dataKey="value" nameKey="name" innerRadius={58} outerRadius={88} paddingAngle={3}>{models.slice(0, 5).map((item, index) => <Cell key={item.name} fill={colors[index % colors.length]} />)}</Pie><Tooltip contentStyle={{ background: "#0b1625", border: "1px solid rgba(255,255,255,.12)", borderRadius: 10 }} formatter={(value: number) => `${formatConsumption(value)} units`} /></PieChart></ResponsiveContainer></div><div className="grid grid-cols-2 gap-2">{models.slice(0, 4).map((item, index) => <div key={item.name} className="flex items-center gap-2 text-[11px] text-slate-400"><span className="h-2 w-2 rounded-full" style={{ backgroundColor: colors[index] }} /><span className="truncate">{item.name}</span></div>)}</div></Panel>
        </div>
      </> : null}

      {tab === "drivers" ? <div className="grid gap-5 lg:grid-cols-3"><DriverCard icon={Bot} title="Agents" rows={agents} /><DriverCard icon={Boxes} title="Plugins" rows={plugins} /><DriverCard icon={Sparkles} title="Models" rows={models} /></div> : null}

      {tab === "actions" ? <section className="rounded-2xl border border-white/10 bg-[#0b1625]/82 p-5 lg:p-6"><div className="mb-4"><h2 className="text-base font-semibold text-white">Recommended next actions</h2><p className="mt-1 text-[11px] text-slate-500">Prioritized by likely value and confidence for this scope.</p></div><div className="divide-y divide-white/[0.07]">{actions.map((action) => <Link key={action.id} href={`/recommendations?rec=${action.id}`} className="group flex items-center gap-4 py-4 first:pt-0 last:pb-0"><span className={`rounded-full px-2 py-1 text-[10px] ${action.severity === "High" ? "bg-amber-400/10 text-amber-200" : "bg-sky-400/10 text-sky-200"}`}>{action.severity}</span><div className="min-w-0 flex-1"><p className="truncate text-sm font-medium text-slate-200">{action.title}</p><p className="mt-0.5 text-[11px] text-slate-500">{action.type} · {action.scopeLabel}</p></div><ArrowRight className="h-4 w-4 text-slate-700 group-hover:text-cyan-300" /></Link>)}</div></section> : null}
    </div>
  );
}

function resolveEntity(type: string, id: string): { name: string; type: string; subtitle: string; interactions: InteractionSummary[] } {
  if (type === "cost-center") { const entity = TELEMETRY_DATA.costCenters.find((item) => item.id === id); return { name: entity?.name ?? id, type: "Portfolio", subtitle: `${entity?.teamCount ?? 0} teams · ${entity?.activeEngineers ?? 0} active users`, interactions: TELEMETRY_DATA.interactions.filter((item) => item.costCenterId === id) }; }
  if (type === "team") { const entity = TELEMETRY_DATA.teams.find((item) => item.id === id); return { name: entity?.name ?? id, type: "Team", subtitle: `${entity?.costCenterName ?? "Portfolio"} · ${entity?.activeEngineers ?? 0} active users`, interactions: TELEMETRY_DATA.interactions.filter((item) => item.teamId === id) }; }
  if (type === "engineer" || type === "user") { const entity = TELEMETRY_DATA.engineers.find((item) => item.id === id || item.userId === id); return { name: entity?.name ?? id, type: "User", subtitle: `${entity?.teamName ?? "Team"} · ${entity?.engineerFunction ?? "Contributor"}`, interactions: TELEMETRY_DATA.interactions.filter((item) => item.engineerId === entity?.userId) }; }
  if (type === "interaction") { const entity = TELEMETRY_DATA.interactions.find((item) => item.id === id); return { name: entity?.useCaseLabel ?? id, type: "Interaction", subtitle: `${entity?.engineerName ?? "User"} · ${entity?.modelName ?? "Model"}`, interactions: entity ? [entity] : [] }; }
  return { name: id, type: "Scope", subtitle: "Usage detail", interactions: TELEMETRY_DATA.interactions };
}

function summarize(rows: InteractionSummary[], key: "modelName" | "pluginName" | "agentPattern" | "useCaseLabel") { const map = new Map<string, number>(); rows.forEach((item) => { const name = item[key] || "Unattributed"; map.set(name, (map.get(name) ?? 0) + item.estimatedCredits); }); return Array.from(map, ([name, value]) => ({ name, value })).sort((a, b) => b.value - a.value); }
function Metric({ label, value, note, accent }: { label: string; value: string; note: string; accent?: boolean }) { return <div className="border-b border-white/[0.08] p-5 last:border-b-0 sm:[&:nth-child(odd)]:border-r xl:border-b-0 xl:border-r xl:last:border-r-0"><p className="text-[10px] font-medium uppercase tracking-[0.14em] text-slate-600">{label}</p><p className={`mt-3 text-xl font-semibold ${accent ? "text-violet-200" : "text-white"}`}>{value}</p><p className="mt-1 text-[11px] text-slate-500">{note}</p></div>; }
function Panel({ title, children }: { title: string; children: React.ReactNode }) { return <section className="rounded-2xl border border-white/10 bg-[#0b1625]/82 p-5 lg:p-6"><h2 className="mb-4 text-sm font-semibold text-slate-100">{title}</h2>{children}</section>; }
function DriverCard({ icon: Icon, title, rows }: { icon: typeof Bot; title: string; rows: Array<{ name: string; value: number }> }) { const total = rows.reduce((sum, item) => sum + item.value, 0) || 1; return <section className="rounded-2xl border border-white/10 bg-[#0b1625]/82 p-5"><div className="flex items-center gap-2"><Icon className="h-4 w-4 text-cyan-300" /><h2 className="text-sm font-semibold text-slate-100">{title}</h2></div><div className="mt-5 space-y-4">{rows.slice(0, 6).map((item) => <div key={item.name}><div className="flex justify-between gap-3 text-xs"><span className="truncate text-slate-300">{item.name}</span><span className="text-slate-500">{Math.round(item.value / total * 100)}%</span></div><div className="mt-2 h-1.5 rounded-full bg-white/[0.06]"><div className="h-full rounded-full bg-cyan-400/75" style={{ width: `${item.value / total * 100}%` }} /></div></div>)}</div></section>; }
