import { useMemo, useState } from "react";
import { ArrowRight, BarChart3, Building2, Check, Users, UserRound } from "lucide-react";
import { Link } from "wouter";
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";

import { Badge } from "@/components/ui/badge";
import { getScopedInteractions, useDashboardScope } from "@/lib/scope-context";
import { TELEMETRY_DATA, formatConsumption } from "@/lib/telemetry-data";
import { getValueMetrics } from "@/lib/value-data";

type Level = "portfolio" | "team" | "user";
const levels: Array<{ id: Level; label: string }> = [{ id: "portfolio", label: "Portfolios" }, { id: "team", label: "Teams" }, { id: "user", label: "Users" }];

export default function UsageExplorer() {
  const scope = useDashboardScope();
  const [level, setLevel] = useState<Level>(scope.userId ? "user" : scope.teamId ? "user" : scope.portfolioId ? "team" : "portfolio");
  const [compare, setCompare] = useState(true);

  const items = useMemo(() => {
    if (level === "portfolio") return TELEMETRY_DATA.costCenters.map((item) => ({ id: item.id, name: item.name, icon: Building2, meta: `${item.teamCount} teams · ${item.activeEngineers} users`, interactions: TELEMETRY_DATA.interactions.filter((row) => row.costCenterId === item.id) }));
    if (level === "team") return scope.teams.map((item) => ({ id: item.id, name: item.name, icon: Users, meta: `${item.activeEngineers} users · ${item.topUseCase}`, interactions: TELEMETRY_DATA.interactions.filter((row) => row.teamId === item.id) }));
    return scope.users.map((item) => ({ id: item.userId, detailId: item.id, name: item.name, icon: UserRound, meta: `${item.engineerFunction} · ${item.activeDays} active days`, interactions: TELEMETRY_DATA.interactions.filter((row) => row.engineerId === item.userId) }));
  }, [level, scope.teams, scope.users]);

  const comparisons = items.map((item) => {
    const metrics = getValueMetrics(item.interactions, item.id);
    return { name: item.name.split(" ").slice(0, 2).join(" "), usage: Math.round(metrics.usage), efficiency: Number(metrics.efficiencyIndex.toFixed(1)), outcomes: metrics.successfulOutcomes };
  });
  const selectedRows = getScopedInteractions(scope);
  const selected = getValueMetrics(selectedRows, scope.userId || scope.teamId || scope.portfolioId || "enterprise");
  const scopeName = scope.user?.name ?? scope.team?.name ?? scope.portfolio?.name ?? "Enterprise";

  function choose(id: string) {
    if (level === "portfolio") { scope.selectPortfolio(id); setLevel("team"); }
    else if (level === "team") { scope.selectTeam(id); setLevel("user"); }
    else scope.selectUser(id);
  }

  return (
    <div className="mx-auto max-w-[1450px] space-y-5 px-5 py-7 lg:px-8">
      <header className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div><p className="text-xs font-medium uppercase tracking-[0.16em] text-cyan-300">Organization</p><h1 className="mt-1 text-2xl font-semibold text-white">Navigate from enterprise to individual.</h1><p className="mt-1 text-xs text-slate-500">Select any level, compare peers, then open the evidence behind a result.</p></div>
        <button type="button" onClick={() => setCompare((value) => !value)} className={`inline-flex h-9 w-fit items-center gap-2 rounded-lg border px-3 text-xs ${compare ? "border-cyan-400/25 bg-cyan-400/10 text-cyan-200" : "border-white/10 bg-white/[0.03] text-slate-400"}`}><BarChart3 className="h-4 w-4" />Compare peers {compare ? <Check className="h-3.5 w-3.5" /> : null}</button>
      </header>

      <section className="flex flex-wrap items-center gap-2 rounded-xl border border-white/10 bg-[#0b1625]/80 p-2" aria-label="Hierarchy level">
        <button type="button" onClick={() => { scope.clearScope(); setLevel("portfolio"); }} className="rounded-lg px-3 py-2 text-xs font-medium text-slate-400 hover:bg-white/[0.05] hover:text-white">Enterprise</button>
        <span className="text-slate-700">/</span>
        {levels.map((item) => <button key={item.id} type="button" onClick={() => setLevel(item.id)} className={`rounded-lg px-3 py-2 text-xs font-medium ${level === item.id ? "bg-cyan-400 text-slate-950" : "text-slate-400 hover:bg-white/[0.05] hover:text-white"}`}>{item.label}</button>)}
        <div className="ml-auto flex items-center gap-1 text-xs text-slate-500"><span className="hidden sm:inline">Current:</span><span className="font-medium text-slate-300">{scopeName}</span></div>
      </section>

      <div className={`grid gap-5 ${compare ? "xl:grid-cols-[.9fr_1.1fr]" : ""}`}>
        <section className="rounded-2xl border border-white/10 bg-[#0b1625]/82 p-5">
          <div className="mb-4 flex items-center justify-between"><div><p className="text-[10px] font-medium uppercase tracking-[0.16em] text-slate-600">{level}</p><h2 className="mt-1 text-base font-semibold text-white">{level === "portfolio" ? "All portfolios" : level === "team" ? `Teams in ${scope.portfolio?.name ?? "all portfolios"}` : `Users in ${scope.team?.name ?? scope.portfolio?.name ?? "all teams"}`}</h2></div><Badge variant="outline" className="border-white/10 text-slate-500">{items.length} peers</Badge></div>
          <div className="space-y-2">{items.map((item) => { const Icon = item.icon; const metrics = getValueMetrics(item.interactions, item.id); const active = item.id === scope.portfolioId || item.id === scope.teamId || item.id === scope.userId; return <button key={item.id} type="button" onClick={() => choose(item.id)} className={`group flex w-full items-center gap-3 rounded-xl border p-3 text-left ${active ? "border-cyan-400/30 bg-cyan-400/[0.07]" : "border-white/[0.07] bg-white/[0.025] hover:border-cyan-400/20 hover:bg-white/[0.045]"}`}><div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-white/[0.05] text-slate-400"><Icon className="h-4 w-4" /></div><div className="min-w-0 flex-1"><div className="flex items-center justify-between gap-3"><span className="truncate text-sm font-medium text-slate-200">{item.name}</span><span className="whitespace-nowrap text-xs text-slate-400">{formatConsumption(metrics.usage)}</span></div><p className="mt-1 truncate text-[11px] text-slate-500">{item.meta} · {metrics.efficiencyIndex.toFixed(1)} outcomes/1K</p></div><ArrowRight className="h-4 w-4 text-slate-700 group-hover:text-cyan-300" /></button>; })}</div>
        </section>

        {compare ? <section className="rounded-2xl border border-white/10 bg-[#0b1625]/82 p-5 lg:p-6"><div className="flex items-start justify-between gap-3"><div><h2 className="text-base font-semibold text-white">Peer comparison</h2><p className="mt-1 text-[11px] text-slate-500">Usage and modeled outcome efficiency. Click a peer on the left to drill in.</p></div><Badge variant="outline" className="border-violet-400/20 text-violet-200">Illustrative value</Badge></div><div className="mt-4 h-[340px]"><ResponsiveContainer width="100%" height="100%"><BarChart data={comparisons} margin={{ top: 12, right: 8, left: -15, bottom: 45 }}><CartesianGrid stroke="rgba(148,163,184,.08)" vertical={false} /><XAxis dataKey="name" angle={-28} textAnchor="end" interval={0} tick={{ fill: "#64748b", fontSize: 9 }} axisLine={false} tickLine={false} /><YAxis yAxisId="usage" tick={{ fill: "#64748b", fontSize: 10 }} axisLine={false} tickLine={false} /><YAxis yAxisId="efficiency" orientation="right" hide /><Tooltip contentStyle={{ background: "#0b1625", border: "1px solid rgba(255,255,255,.12)", borderRadius: 10 }} /><Bar yAxisId="usage" dataKey="usage" name="Usage units" fill="#22d3ee" radius={[4, 4, 0, 0]} /><Bar yAxisId="efficiency" dataKey="efficiency" name="Outcomes / 1K" fill="#8b5cf6" radius={[4, 4, 0, 0]} /></BarChart></ResponsiveContainer></div><div className="grid grid-cols-3 gap-3 border-t border-white/[0.07] pt-4"><MiniStat label="Selected usage" value={`${formatConsumption(selected.usage)} units`} /><MiniStat label="Outcomes" value={selected.successfulOutcomes.toLocaleString()} /><MiniStat label="Efficiency" value={`${selected.efficiencyIndex.toFixed(1)} / 1K`} /></div></section> : null}
      </div>

      {scope.user ? <div className="flex items-center justify-between rounded-xl border border-cyan-400/15 bg-cyan-400/[0.05] px-4 py-3"><div><p className="text-sm font-medium text-slate-200">Ready to investigate {scope.user.name}</p><p className="text-[11px] text-slate-500">Open usage drivers, model mix and recommended actions.</p></div><Link href={`/detail/engineer/${scope.user.id}`} className="inline-flex items-center text-xs font-medium text-cyan-300">Open detail <ArrowRight className="ml-1.5 h-3.5 w-3.5" /></Link></div> : null}
    </div>
  );
}

function MiniStat({ label, value }: { label: string; value: string }) { return <div><p className="text-[10px] font-medium uppercase tracking-[0.12em] text-slate-600">{label}</p><p className="mt-1 text-sm font-medium text-slate-200">{value}</p></div>; }
