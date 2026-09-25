import { useMemo, useState } from "react";
import { ArrowRight, Building2, Info, Layers3, Users, UserRound } from "lucide-react";
import { Link } from "wouter";
import {
  CartesianGrid,
  Cell,
  Legend,
  Line,
  LineChart,
  ResponsiveContainer,
  Scatter,
  ScatterChart,
  Tooltip,
  XAxis,
  YAxis,
  ZAxis,
} from "recharts";

import { Badge } from "@/components/ui/badge";
import { getScopedInteractions, useDashboardScope } from "@/lib/scope-context";
import { TELEMETRY_DATA, formatConsumption, type InteractionSummary } from "@/lib/telemetry-data";
import { getSkillValue, getValueMetrics } from "@/lib/value-data";

type Level = "portfolio" | "team" | "user";
type SortKey = "usage" | "efficiency" | "outcomes";
type Breakdown = "models" | "agents" | "skills" | "applications";
type Peer = {
  id: string;
  detailId?: string;
  name: string;
  kind: "Portfolio" | "Team" | "User";
  meta: string;
  interactions: InteractionSummary[];
};

const colors = ["#22d3ee", "#8b5cf6", "#34d399", "#f59e0b", "#f472b6", "#60a5fa"];

export default function UsageExplorer() {
  const scope = useDashboardScope();
  const [level, setLevel] = useState<Level>(scope.userId ? "user" : scope.teamId ? "user" : scope.portfolioId ? "team" : "portfolio");
  const [sortBy, setSortBy] = useState<SortKey>("usage");
  const [breakdown, setBreakdown] = useState<Breakdown>("models");

  const periodRows = getScopedInteractions({ portfolioId: "", teamId: "", userId: "", period: scope.period, application: scope.application });
  const peers = useMemo<Peer[]>(() => {
    if (level === "portfolio") return TELEMETRY_DATA.costCenters.map((item) => ({ id: item.id, name: item.name, kind: "Portfolio", meta: `${item.teamCount} teams · ${item.activeEngineers} active users`, interactions: periodRows.filter((row) => row.costCenterId === item.id) }));
    if (level === "team") return TELEMETRY_DATA.teams.filter((item) => !scope.portfolioId || item.costCenterId === scope.portfolioId).map((item) => ({ id: item.id, name: item.name, kind: "Team", meta: `${item.activeEngineers} active users · ${item.costCenterName}`, interactions: periodRows.filter((row) => row.teamId === item.id) }));
    return TELEMETRY_DATA.engineers.filter((item) => scope.teamId ? item.teamId === scope.teamId : scope.portfolioId ? item.costCenterId === scope.portfolioId : true).map((item) => ({ id: item.userId, detailId: item.id, name: item.name, kind: "User", meta: `${item.teamName} · ${roleName(item.engineerFunction)}`, interactions: periodRows.filter((row) => row.engineerId === item.userId) }));
  }, [level, periodRows, scope.portfolioId, scope.teamId]);

  const peerMetrics = peers.map((peer) => ({ ...peer, metrics: getValueMetrics(peer.interactions, peer.id) }));
  const ranked = peerMetrics.slice().sort((a, b) => sortBy === "efficiency" ? b.metrics.efficiencyIndex - a.metrics.efficiencyIndex : sortBy === "outcomes" ? b.metrics.successfulOutcomes - a.metrics.successfulOutcomes : b.metrics.usage - a.metrics.usage);
  const totalUsage = peerMetrics.reduce((sum, peer) => sum + peer.metrics.usage, 0);
  const totalOutcomes = peerMetrics.reduce((sum, peer) => sum + peer.metrics.successfulOutcomes, 0);
  const activeUsers = new Set(peerMetrics.flatMap((peer) => peer.interactions.map((item) => item.engineerId))).size;
  const sortedEfficiency = peerMetrics.map((peer) => peer.metrics.efficiencyIndex).sort((a, b) => a - b);
  const medianEfficiency = sortedEfficiency.length ? sortedEfficiency[Math.floor(sortedEfficiency.length / 2)] : 0;
  const concentration = totalUsage ? Math.round(((peerMetrics.slice().sort((a, b) => b.metrics.usage - a.metrics.usage)[0]?.metrics.usage ?? 0) / totalUsage) * 100) : 0;
  const comparisonCohort = level === "portfolio" ? "All portfolios" : level === "team" ? scope.portfolio?.name ?? "All teams" : scope.team?.name ?? scope.portfolio?.name ?? "All users";
  const trend = buildTrend(peerMetrics);
  const scatter = peerMetrics.map((peer) => ({ name: peer.name, usage: Math.round(peer.metrics.usage), efficiency: Number(peer.metrics.efficiencyIndex.toFixed(1)), outcomes: peer.metrics.successfulOutcomes }));
  const breakdownRows = buildBreakdown(periodRows.filter((row) => level === "portfolio" ? true : level === "team" ? !scope.portfolioId || row.costCenterId === scope.portfolioId : scope.teamId ? row.teamId === scope.teamId : scope.portfolioId ? row.costCenterId === scope.portfolioId : true), breakdown);

  function changeLevel(next: Level) {
    if (next === "portfolio") scope.clearScope();
    if (next === "team" && scope.userId) scope.selectTeam(scope.teamId);
    setLevel(next);
  }

  function drill(peer: Peer) {
    if (peer.kind === "Portfolio") { scope.selectPortfolio(peer.id); setLevel("team"); }
    if (peer.kind === "Team") { scope.selectTeam(peer.id); setLevel("user"); }
    if (peer.kind === "User") scope.selectUser(peer.id);
  }

  return (
    <div className="mx-auto max-w-[1540px] space-y-5 px-5 py-7 lg:px-8">
      <header className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div><p className="text-xs font-medium uppercase tracking-[0.16em] text-cyan-300">Organization performance</p><h1 className="mt-1 text-2xl font-semibold text-white">Where is AI usage creating the most value?</h1><p className="mt-1 text-xs text-slate-500">Compare every peer on the same period, application, and outcome scale.</p></div>
        <div className="flex w-fit rounded-lg border border-white/10 bg-[#0b1625] p-1" aria-label="Compare by organization level">{(["portfolio", "team", "user"] as Level[]).map((item) => <button key={item} type="button" onClick={() => changeLevel(item)} className={`rounded-md px-3.5 py-1.5 text-xs font-medium capitalize ${level === item ? "bg-cyan-400 text-slate-950" : "text-slate-500 hover:text-slate-200"}`}>{item === "user" ? "Users" : `${item}s`}</button>)}</div>
      </header>

      <div className="flex flex-wrap items-center gap-2 text-xs"><span className="text-slate-600">Comparison cohort</span><Badge variant="outline" className="border-white/10 text-slate-300">{comparisonCohort}</Badge><span className="text-slate-600">·</span><span className="text-slate-500">{peerMetrics.length} peers</span>{level === "user" ? <span className="ml-auto inline-flex items-center gap-1.5 text-[11px] text-amber-300"><Info className="h-3.5 w-3.5" />Use individual views for coaching, not performance ratings.</span> : null}</div>

      <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <Metric label="Cohort usage" value={`${formatConsumption(totalUsage)} units`} note={`${activeUsers} active users`} />
        <Metric label="Modeled outcomes" value={totalOutcomes.toLocaleString()} note="Quality-gated, illustrative" />
        <Metric label="Median efficiency" value={medianEfficiency.toFixed(1)} note="outcomes / 1K units" accent />
        <Metric label="Top-peer concentration" value={`${concentration}%`} note={`Share held by #1 ${level}`} warn={concentration > 45} />
      </section>

      <section className="grid gap-5 xl:grid-cols-[1.18fr_.82fr]">
        <Panel title={`${labelFor(level)} usage over time`} subtitle="Each line is one peer—totals are not combined.">
          <div className="h-[300px]"><ResponsiveContainer width="100%" height="100%"><LineChart data={trend.data} margin={{ top: 15, right: 18, left: -12, bottom: 5 }}><CartesianGrid stroke="rgba(148,163,184,.08)" strokeDasharray="4 4" vertical={false} /><XAxis dataKey="date" tick={{ fill: "#64748b", fontSize: 10 }} axisLine={false} tickLine={false} minTickGap={24} /><YAxis tick={{ fill: "#64748b", fontSize: 10 }} axisLine={false} tickLine={false} /><Tooltip content={<TrendTooltip />} /><Legend iconType="plainline" wrapperStyle={{ fontSize: 10, color: "#94a3b8", paddingTop: 8 }} />{trend.series.map((series, index) => <Line key={series.key} type="monotone" dataKey={series.key} name={series.name} stroke={colors[index % colors.length]} strokeWidth={2} dot={false} activeDot={{ r: 3 }} />)}</LineChart></ResponsiveContainer></div>
        </Panel>

        <Panel title="Usage vs. outcome efficiency" subtitle="Upper-left peers deliver more modeled outcomes with less usage.">
          <div className="h-[300px]"><ResponsiveContainer width="100%" height="100%"><ScatterChart margin={{ top: 15, right: 15, left: -10, bottom: 10 }}><CartesianGrid stroke="rgba(148,163,184,.08)" strokeDasharray="4 4" /><XAxis type="number" dataKey="usage" name="Usage" tick={{ fill: "#64748b", fontSize: 10 }} axisLine={false} tickLine={false} /><YAxis type="number" dataKey="efficiency" name="Efficiency" tick={{ fill: "#64748b", fontSize: 10 }} axisLine={false} tickLine={false} /><ZAxis dataKey="outcomes" range={[80, 230]} /><Tooltip content={<PeerTooltip />} cursor={{ stroke: "rgba(148,163,184,.25)", strokeDasharray: "3 3" }} /><Scatter data={scatter}>{scatter.map((item, index) => <Cell key={item.name} fill={colors[index % colors.length]} />)}</Scatter></ScatterChart></ResponsiveContainer></div>
        </Panel>
      </section>

      <section className="rounded-2xl border border-white/10 bg-[#0b1625]/82 p-4 lg:p-5">
        <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between"><div><h2 className="text-sm font-semibold text-white">Peer benchmark</h2><p className="mt-1 text-[11px] text-slate-500">Rank by the measure that matters to your decision.</p></div><div className="flex w-fit rounded-lg border border-white/[0.08] bg-black/15 p-1">{(["usage", "outcomes", "efficiency"] as SortKey[]).map((item) => <button key={item} type="button" onClick={() => setSortBy(item)} className={`rounded-md px-2.5 py-1 text-[11px] capitalize ${sortBy === item ? "bg-white/10 text-white" : "text-slate-500"}`}>{item}</button>)}</div></div>
        <div className="overflow-x-auto"><table className="w-full min-w-[820px] text-left text-xs"><thead className="border-b border-white/[0.08] text-[10px] uppercase tracking-[0.12em] text-slate-600"><tr><th className="px-3 py-3 font-medium">Rank</th><th className="px-3 py-3 font-medium">{labelFor(level).slice(0, -1)}</th><th className="px-3 py-3 text-right font-medium">Usage</th><th className="px-3 py-3 text-right font-medium">Share</th><th className="px-3 py-3 text-right font-medium">Outcomes</th><th className="px-3 py-3 text-right font-medium">Outcomes / 1K</th><th className="px-3 py-3 text-right font-medium">Quality</th><th className="px-3 py-3 font-medium">Signal</th><th className="px-3 py-3"></th></tr></thead><tbody className="divide-y divide-white/[0.06]">{ranked.map((peer, index) => { const share = totalUsage ? Math.round(peer.metrics.usage / totalUsage * 100) : 0; const status = getStatus(peer.metrics.efficiencyIndex, medianEfficiency, peer.metrics.qualityPassRate); return <tr key={peer.id} className="group text-slate-400 hover:bg-white/[0.025]"><td className="px-3 py-3.5 text-slate-600">#{index + 1}</td><td className="px-3 py-3.5"><p className="font-medium text-slate-200">{peer.name}</p><p className="mt-0.5 text-[10px] text-slate-600">{peer.meta}</p></td><td className="px-3 py-3.5 text-right">{formatConsumption(peer.metrics.usage)}</td><td className="px-3 py-3.5 text-right">{share}%</td><td className="px-3 py-3.5 text-right">{peer.metrics.successfulOutcomes}</td><td className="px-3 py-3.5 text-right font-medium text-slate-300">{peer.metrics.efficiencyIndex.toFixed(1)}</td><td className="px-3 py-3.5 text-right">{peer.metrics.qualityPassRate}%</td><td className="px-3 py-3.5"><Status status={status} /></td><td className="px-3 py-3.5 text-right">{peer.kind === "User" ? <Link href={`/detail/engineer/${peer.detailId}`} onClick={() => drill(peer)} className="inline-flex items-center text-cyan-300">Profile <ArrowRight className="ml-1 h-3.5 w-3.5" /></Link> : <button type="button" onClick={() => drill(peer)} className="inline-flex items-center text-cyan-300">Drill in <ArrowRight className="ml-1 h-3.5 w-3.5" /></button>}</td></tr>; })}</tbody></table></div>
      </section>

      <section className="rounded-2xl border border-white/10 bg-[#0b1625]/82 p-5">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between"><div className="flex items-center gap-2"><Layers3 className="h-4 w-4 text-cyan-300" /><div><h2 className="text-sm font-semibold text-white">What drives this cohort?</h2><p className="text-[11px] text-slate-500">Usage attribution across models, agents, skills, and applications.</p></div></div><div className="flex w-fit gap-1 rounded-lg border border-white/[0.08] bg-black/15 p-1">{(["models", "agents", "skills", "applications"] as Breakdown[]).map((item) => <button key={item} type="button" onClick={() => setBreakdown(item)} className={`rounded-md px-2.5 py-1 text-[11px] capitalize ${breakdown === item ? "bg-white/10 text-white" : "text-slate-500"}`}>{item}</button>)}</div></div>
        <div className="mt-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">{breakdownRows.slice(0, 4).map((item, index) => <div key={item.name} className="rounded-xl border border-white/[0.07] bg-white/[0.025] p-3.5"><div className="flex items-center justify-between gap-3"><span className="truncate text-xs font-medium text-slate-300">{item.name}</span><span className="text-[11px]" style={{ color: colors[index] }}>{item.share}%</span></div><div className="mt-3 h-1.5 overflow-hidden rounded-full bg-white/[0.06]"><div className="h-full rounded-full" style={{ width: `${item.share}%`, backgroundColor: colors[index] }} /></div><p className="mt-2 text-[10px] text-slate-600">{formatConsumption(item.value)} usage units</p></div>)}</div>
      </section>
    </div>
  );
}

function buildTrend(peers: Array<Peer & { metrics: ReturnType<typeof getValueMetrics> }>) {
  const visible = peers.slice().sort((a, b) => b.metrics.usage - a.metrics.usage).slice(0, 6);
  const dates = Array.from(new Set(visible.flatMap((peer) => peer.interactions.map((item) => item.timestamp.slice(5, 10))))).sort();
  const series = visible.map((peer, index) => ({ key: `peer${index}`, name: peer.name }));
  const data = dates.map((date) => { const row: Record<string, string | number> = { date }; visible.forEach((peer, index) => { row[`peer${index}`] = Number(peer.interactions.filter((item) => item.timestamp.slice(5, 10) === date).reduce((sum, item) => sum + item.estimatedCredits, 0).toFixed(1)); }); return row; });
  return { data, series };
}

function buildBreakdown(rows: InteractionSummary[], type: Breakdown) {
  if (type === "skills") { const values = getSkillValue(rows).map((item) => ({ name: item.name, value: item.usage })); return withShare(values); }
  const key = type === "models" ? "modelName" : type === "agents" ? "agentPattern" : "interactionChannel";
  const map = new Map<string, number>();
  rows.forEach((item) => { const name = String(item[key] || "Unattributed"); if (name === "None") return; map.set(name, (map.get(name) ?? 0) + item.estimatedCredits); });
  return withShare(Array.from(map, ([name, value]) => ({ name, value })).sort((a, b) => b.value - a.value));
}

function withShare(rows: Array<{ name: string; value: number }>) { const total = rows.reduce((sum, item) => sum + item.value, 0) || 1; return rows.map((item) => ({ ...item, share: Math.round(item.value / total * 100) })); }
function roleName(value: string) { return value === "AI" ? "AI specialist" : value === "FE" ? "Frontend" : value === "BE" ? "Backend" : value === "QA" ? "Quality" : "Contributor"; }
function labelFor(level: Level) { return level === "portfolio" ? "Portfolios" : level === "team" ? "Teams" : "Users"; }
function getStatus(efficiency: number, median: number, quality: number): "Leading" | "Typical" | "Review" { if (quality < 85) return "Review"; if (efficiency >= median * 1.15) return "Leading"; return "Typical"; }

function Panel({ title, subtitle, children }: { title: string; subtitle: string; children: React.ReactNode }) { return <section className="rounded-2xl border border-white/10 bg-[#0b1625]/82 p-5 lg:p-6"><div className="mb-4"><h2 className="text-sm font-semibold text-white">{title}</h2><p className="mt-1 text-[11px] text-slate-500">{subtitle}</p></div>{children}</section>; }
function Metric({ label, value, note, accent, warn }: { label: string; value: string; note: string; accent?: boolean; warn?: boolean }) { return <div className="rounded-xl border border-white/[0.08] bg-[#0b1625]/82 p-4"><p className="text-[10px] font-medium uppercase tracking-[0.13em] text-slate-600">{label}</p><p className={`mt-2 text-lg font-semibold ${warn ? "text-amber-300" : accent ? "text-violet-200" : "text-white"}`}>{value}</p><p className="mt-0.5 text-[11px] text-slate-500">{note}</p></div>; }
function Status({ status }: { status: "Leading" | "Typical" | "Review" }) { return <span className={`rounded-full px-2 py-1 text-[10px] ${status === "Leading" ? "bg-emerald-400/10 text-emerald-300" : status === "Review" ? "bg-amber-400/10 text-amber-300" : "bg-slate-400/10 text-slate-400"}`}>{status}</span>; }

function TrendTooltip({ active, payload, label }: any) { if (!active || !payload?.length) return null; return <div className="chart-tooltip max-w-[230px] rounded-lg border border-white/10 bg-[#07101c]/95 p-3 shadow-xl"><p className="mb-2 text-[10px] font-medium text-slate-500">{label}</p><div className="space-y-1.5">{payload.filter((item: any) => item.value > 0).slice(0, 6).map((item: any) => <div key={item.name} className="flex items-center justify-between gap-4 text-[11px]"><span className="truncate" style={{ color: item.color }}>{item.name}</span><span className="text-slate-300">{formatConsumption(item.value)}</span></div>)}</div></div>; }
function PeerTooltip({ active, payload }: any) { if (!active || !payload?.length) return null; const item = payload[0]?.payload; return <div className="chart-tooltip w-[190px] rounded-lg border border-white/10 bg-[#07101c]/95 p-3 shadow-xl"><p className="truncate text-xs font-semibold text-white">{item.name}</p><div className="mt-2 space-y-1 text-[11px] text-slate-400"><p>Usage <b className="float-right text-cyan-300">{formatConsumption(item.usage)}</b></p><p>Outcomes / 1K <b className="float-right text-violet-300">{item.efficiency}</b></p><p>Outcomes <b className="float-right text-slate-200">{item.outcomes}</b></p></div></div>; }
