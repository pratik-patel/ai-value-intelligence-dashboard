import { useEffect, useMemo, useState } from "react";
import { ArrowLeft, ArrowRight, Bot, Boxes, FileSearch, History, Sparkles, UserRound } from "lucide-react";
import { Link, useParams } from "wouter";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useDashboardScope } from "@/lib/scope-context";
import { TELEMETRY_DATA, formatConsumption, type InteractionSummary } from "@/lib/telemetry-data";
import { getValueMetrics } from "@/lib/value-data";

type Tab = "overview" | "drivers" | "sessions" | "actions";
type SummaryRow = { name: string; value: number };

export default function DetailWorkspace() {
  const params = useParams<{ entityType: string; entityId: string }>();
  const dashboardScope = useDashboardScope();
  const [tab, setTab] = useState<Tab>("overview");
  const resolved = useMemo(() => resolveEntity(params.entityType, params.entityId), [params.entityId, params.entityType]);
  const metrics = getValueMetrics(resolved.interactions, params.entityId);
  const models = summarize(resolved.interactions, "modelName");
  const plugins = summarize(resolved.interactions, "pluginName").filter((item) => item.name !== "Direct Assistant");
  const agents = summarize(resolved.interactions, "agentPattern").filter((item) => item.name !== "None");
  const useCases = summarize(resolved.interactions, "useCaseLabel");
  const total = metrics.usage || 1;
  const highReasoningUsage = resolved.interactions.filter((item) => item.modelCategory === "High Reasoning").reduce((sum, item) => sum + item.estimatedCredits, 0);
  const highReasoningShare = Math.round((highReasoningUsage / total) * 100);
  const topModelShare = Math.round(((models[0]?.value ?? 0) / total) * 100);
  const scopedActions = TELEMETRY_DATA.recommendations.filter((item) => item.scopeId === params.entityId || item.scopeLabel === resolved.name);
  const actions = (scopedActions.length ? scopedActions : TELEMETRY_DATA.recommendations).slice(0, 3);

  useEffect(() => {
    if (resolved.type === "User" && resolved.scopeId && dashboardScope.userId !== resolved.scopeId) dashboardScope.selectUser(resolved.scopeId);
    if (resolved.type === "Team" && resolved.scopeId && dashboardScope.teamId !== resolved.scopeId) dashboardScope.selectTeam(resolved.scopeId);
    if (resolved.type === "Portfolio" && resolved.scopeId && dashboardScope.portfolioId !== resolved.scopeId) dashboardScope.selectPortfolio(resolved.scopeId);
    if (resolved.type === "Interaction" && resolved.scopeId && dashboardScope.userId !== resolved.scopeId) dashboardScope.selectUser(resolved.scopeId);
  }, [dashboardScope.portfolioId, dashboardScope.teamId, dashboardScope.userId, resolved.scopeId, resolved.type]);

  if (resolved.type === "Interaction" && resolved.interactions[0]) return <InteractionDetail interaction={resolved.interactions[0]} />;

  const tabs: Tab[] = resolved.type === "User" ? ["overview", "drivers", "sessions", "actions"] : ["overview", "drivers", "actions"];

  return (
    <div className="mx-auto max-w-[1320px] space-y-5 px-5 py-6 lg:px-8">
      <header className="flex flex-col gap-4 border-b border-white/[0.07] pb-5 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <Link href="/explorer" className="inline-flex items-center text-xs text-slate-500 hover:text-cyan-300"><ArrowLeft className="mr-1.5 h-3.5 w-3.5" />Organization</Link>
          <div className="mt-4 flex items-center gap-3">
            {resolved.type === "User" ? <div className="flex h-11 w-11 items-center justify-center rounded-full border border-cyan-400/20 bg-cyan-400/10 text-sm font-semibold text-cyan-200">{initials(resolved.name)}</div> : null}
            <div><div className="flex items-center gap-2"><Badge variant="outline" className="border-white/10 text-slate-400">{resolved.type}</Badge></div><h1 className="mt-1.5 text-2xl font-semibold text-white">{resolved.name}</h1><p className="mt-0.5 text-xs text-slate-500">{resolved.subtitle}</p></div>
          </div>
        </div>
        {resolved.type === "User" ? <Button variant="outline" size="sm" onClick={() => setTab("sessions")} className="border-white/10 bg-white/[0.03] text-slate-300 hover:bg-white/[0.07]"><History className="mr-2 h-4 w-4" />Session history</Button> : <Link href="/reports"><Button variant="outline" size="sm" className="border-white/10 bg-white/[0.03] text-slate-300 hover:bg-white/[0.07]"><FileSearch className="mr-2 h-4 w-4" />Evidence</Button></Link>}
      </header>

      <nav className="flex w-fit rounded-lg border border-white/10 bg-[#0b1625]/82 p-1" aria-label="Detail sections">
        {tabs.map((item) => <button key={item} type="button" onClick={() => setTab(item)} className={`rounded-md px-3.5 py-1.5 text-xs font-medium capitalize ${tab === item ? "bg-white/10 text-white" : "text-slate-500 hover:text-slate-300"}`}>{item === "drivers" ? "Usage drivers" : item}</button>)}
      </nav>

      {tab === "overview" ? <>
        <section className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <Metric label="Usage" value={`${formatConsumption(metrics.usage)} units`} note={`${metrics.runs} interactions`} />
          <Metric label="Successful outcomes" value={metrics.successfulOutcomes.toLocaleString()} note={`${metrics.qualityPassRate}% quality pass`} />
          <Metric label="Outcome efficiency" value={metrics.efficiencyIndex.toFixed(1)} note="outcomes / 1K units" />
          <Metric label="Delivery velocity" value={`+${metrics.cycleTimeImprovement}%`} note={`${Math.round(metrics.hoursSaved)} hours modeled`} accent />
        </section>

        <section className="grid gap-5 lg:grid-cols-[1.15fr_.85fr]">
          <div className="rounded-2xl border border-white/10 bg-[#0b1625]/82 p-5 lg:p-6">
            <div className="mb-5"><h2 className="text-sm font-semibold text-white">Usage pattern</h2><p className="mt-1 text-[11px] text-slate-500">The workflows and models responsible for most usage.</p></div>
            <div className="grid gap-6 sm:grid-cols-2">
              <RankedList title="Workflows" rows={useCases.slice(0, 4)} total={total} />
              <RankedList title="Models" rows={models.slice(0, 4)} total={total} tone="violet" />
            </div>
          </div>

          <aside className="rounded-2xl border border-white/10 bg-gradient-to-br from-[#0d1d2c] to-[#0b1625] p-5 lg:p-6">
            <div className="flex items-center gap-2"><Sparkles className="h-4 w-4 text-violet-300" /><h2 className="text-sm font-semibold text-white">What stands out</h2></div>
            <div className="mt-5 space-y-4">
              <Signal label="Primary workflow" value={useCases[0]?.name ?? "No activity"} note={`${Math.round(((useCases[0]?.value ?? 0) / total) * 100)}% of usage`} />
              <Signal label="Model concentration" value={models[0]?.name ?? "No model"} note={`${topModelShare}% of usage`} />
              <Signal label="High-reasoning share" value={`${highReasoningShare}%`} note={highReasoningShare > 35 ? "Review simple tasks for lower-cost routing" : "Within the modeled range"} warn={highReasoningShare > 35} />
            </div>
            <button type="button" onClick={() => setTab("actions")} className="mt-6 inline-flex items-center text-xs font-medium text-cyan-300">Review recommended action <ArrowRight className="ml-1.5 h-3.5 w-3.5" /></button>
          </aside>
        </section>
      </> : null}

      {tab === "drivers" ? <section className="grid gap-4 md:grid-cols-3"><DriverCard icon={Bot} title="Agents" rows={agents} empty="No named agent runs in this scope." /><DriverCard icon={Boxes} title="Plugins & tools" rows={plugins} empty="Direct-assistant usage only." /><DriverCard icon={Sparkles} title="Models" rows={models} empty="No model attribution available." /></section> : null}

      {tab === "sessions" ? <SessionHistory interactions={resolved.interactions} /> : null}

      {tab === "actions" ? <section className="rounded-2xl border border-white/10 bg-[#0b1625]/82 p-5 lg:p-6"><div className="mb-4"><h2 className="text-base font-semibold text-white">Recommended next moves</h2><p className="mt-1 text-[11px] text-slate-500">Validate these patterns with task complexity and quality evidence before changing routing.</p></div><div className="divide-y divide-white/[0.07]">{actions.map((action, index) => <Link key={action.id} href={`/recommendations?rec=${action.id}`} className="group flex items-center gap-4 py-4 first:pt-0 last:pb-0"><span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-white/[0.05] text-[11px] font-medium text-slate-400">{index + 1}</span><div className="min-w-0 flex-1"><p className="truncate text-sm font-medium text-slate-200">{action.title}</p><p className="mt-0.5 text-[11px] text-slate-500">{action.type} · {action.expectedImpact}</p></div><ArrowRight className="h-4 w-4 text-slate-700 group-hover:text-cyan-300" /></Link>)}</div></section> : null}
    </div>
  );
}

function resolveEntity(type: string, id: string): { scopeId: string; name: string; type: string; subtitle: string; interactions: InteractionSummary[] } {
  if (type === "cost-center") { const entity = TELEMETRY_DATA.costCenters.find((item) => item.id === id); return { scopeId: id, name: entity?.name ?? id, type: "Portfolio", subtitle: `${entity?.teamCount ?? 0} teams · ${entity?.activeEngineers ?? 0} active users`, interactions: TELEMETRY_DATA.interactions.filter((item) => item.costCenterId === id) }; }
  if (type === "team") { const entity = TELEMETRY_DATA.teams.find((item) => item.id === id); return { scopeId: id, name: entity?.name ?? id, type: "Team", subtitle: `${entity?.costCenterName ?? "Portfolio"} · ${entity?.activeEngineers ?? 0} active users`, interactions: TELEMETRY_DATA.interactions.filter((item) => item.teamId === id) }; }
  if (type === "engineer" || type === "user") { const entity = TELEMETRY_DATA.engineers.find((item) => item.id === id || item.userId === id); return { scopeId: entity?.userId ?? id, name: entity?.name ?? id, type: "User", subtitle: `${entity?.teamName ?? "Team"} · ${roleName(entity?.engineerFunction)}`, interactions: TELEMETRY_DATA.interactions.filter((item) => item.engineerId === entity?.userId) }; }
  if (type === "interaction") { const entity = TELEMETRY_DATA.interactions.find((item) => item.id === id); return { scopeId: entity?.engineerId ?? "", name: entity?.useCaseLabel ?? id, type: "Interaction", subtitle: `${entity?.engineerName ?? "User"} · ${entity?.modelName ?? "Model"}`, interactions: entity ? [entity] : [] }; }
  return { scopeId: "", name: id, type: "Scope", subtitle: "Usage detail", interactions: TELEMETRY_DATA.interactions };
}

function summarize(rows: InteractionSummary[], key: "modelName" | "pluginName" | "agentPattern" | "useCaseLabel"): SummaryRow[] { const map = new Map<string, number>(); rows.forEach((item) => { const name = item[key] || "Unattributed"; map.set(name, (map.get(name) ?? 0) + item.estimatedCredits); }); return Array.from(map, ([name, value]) => ({ name, value })).sort((a, b) => b.value - a.value); }
function initials(name: string) { return name.split(" ").map((part) => part[0]).join("").slice(0, 2).toUpperCase(); }
function roleName(value?: string) { if (value === "AI") return "AI specialist"; if (value === "FE") return "Frontend"; if (value === "BE") return "Backend"; if (value === "QA") return "Quality"; return "Contributor"; }

function Metric({ label, value, note, accent }: { label: string; value: string; note: string; accent?: boolean }) { return <div className="rounded-xl border border-white/[0.08] bg-[#0b1625]/82 p-4"><p className="text-[10px] font-medium uppercase tracking-[0.13em] text-slate-600">{label}</p><p className={`mt-2 text-lg font-semibold ${accent ? "text-violet-200" : "text-white"}`}>{value}</p><p className="mt-0.5 text-[11px] text-slate-500">{note}</p></div>; }

function RankedList({ title, rows, total, tone = "cyan" }: { title: string; rows: SummaryRow[]; total: number; tone?: "cyan" | "violet" }) { return <div><p className="mb-3 text-[10px] font-medium uppercase tracking-[0.14em] text-slate-600">{title}</p><div className="space-y-3.5">{rows.map((item) => { const share = Math.round((item.value / total) * 100); return <div key={item.name}><div className="flex items-center justify-between gap-3 text-xs"><span className="truncate text-slate-300">{item.name}</span><span className="text-slate-500">{share}%</span></div><div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-white/[0.06]"><div className={`h-full rounded-full ${tone === "cyan" ? "bg-cyan-400/75" : "bg-violet-400/75"}`} style={{ width: `${share}%` }} /></div></div>; })}</div></div>; }

function Signal({ label, value, note, warn }: { label: string; value: string; note: string; warn?: boolean }) { return <div className="border-b border-white/[0.07] pb-4 last:border-0 last:pb-0"><p className="text-[10px] font-medium uppercase tracking-[0.13em] text-slate-600">{label}</p><p className="mt-1.5 truncate text-sm font-medium text-slate-200">{value}</p><p className={`mt-0.5 text-[11px] ${warn ? "text-amber-300" : "text-slate-500"}`}>{note}</p></div>; }

function DriverCard({ icon: Icon, title, rows, empty }: { icon: typeof UserRound; title: string; rows: SummaryRow[]; empty: string }) { const total = rows.reduce((sum, item) => sum + item.value, 0) || 1; return <div className="rounded-2xl border border-white/10 bg-[#0b1625]/82 p-5"><div className="flex items-center gap-2"><Icon className="h-4 w-4 text-cyan-300" /><h2 className="text-sm font-semibold text-slate-100">{title}</h2></div>{rows.length ? <div className="mt-5 space-y-4">{rows.slice(0, 5).map((item) => <div key={item.name} className="flex items-center justify-between gap-3 text-xs"><span className="truncate text-slate-300">{item.name}</span><span className="whitespace-nowrap text-slate-500">{Math.round(item.value / total * 100)}%</span></div>)}</div> : <p className="mt-5 rounded-lg border border-dashed border-white/10 p-4 text-xs text-slate-500">{empty}</p>}</div>; }

function SessionHistory({ interactions }: { interactions: InteractionSummary[] }) {
  const rows = interactions.slice().sort((a, b) => b.timestamp.localeCompare(a.timestamp)).slice(0, 10);
  return <section className="rounded-2xl border border-white/10 bg-[#0b1625]/82 p-4 lg:p-5"><div className="mb-4"><h2 className="text-base font-semibold text-white">Recent sessions</h2><p className="mt-1 text-[11px] text-slate-500">Open a session to inspect its model, agent, tools, context, and event sequence.</p></div><div className="overflow-x-auto"><table className="w-full min-w-[850px] text-left text-xs"><thead className="border-b border-white/[0.08] text-[10px] uppercase tracking-[0.12em] text-slate-600"><tr><th className="px-3 py-3">Time</th><th className="px-3 py-3">Workflow</th><th className="px-3 py-3">Application</th><th className="px-3 py-3">Model</th><th className="px-3 py-3">Agent / tool</th><th className="px-3 py-3 text-right">Usage</th><th className="px-3 py-3"></th></tr></thead><tbody className="divide-y divide-white/[0.06]">{rows.map((item) => <tr key={item.id} className="text-slate-400 hover:bg-white/[0.025]"><td className="whitespace-nowrap px-3 py-3.5">{new Date(item.timestamp).toLocaleString("en-US", { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" })}</td><td className="px-3 py-3.5 font-medium text-slate-200">{item.useCaseLabel}</td><td className="px-3 py-3.5">{item.interactionChannel}</td><td className="px-3 py-3.5">{item.modelName.replaceAll("_", " ")}</td><td className="px-3 py-3.5">{item.agentPattern !== "None" ? item.agentPattern : item.pluginName}</td><td className="px-3 py-3.5 text-right">{formatConsumption(item.estimatedCredits)}</td><td className="px-3 py-3.5 text-right"><Link href={`/detail/interaction/${item.id}`} className="inline-flex items-center text-cyan-300">Trace <ArrowRight className="ml-1 h-3.5 w-3.5" /></Link></td></tr>)}</tbody></table></div><div className="mt-4 flex items-center justify-between border-t border-white/[0.07] pt-4 text-[11px] text-slate-500"><span>Showing 10 of {interactions.length} sessions</span><Link href="/reports" className="text-cyan-300">Open full evidence library <ArrowRight className="ml-1 inline h-3.5 w-3.5" /></Link></div></section>;
}

function InteractionDetail({ interaction }: { interaction: InteractionSummary }) {
  const user = TELEMETRY_DATA.engineers.find((item) => item.userId === interaction.engineerId);
  const metrics = getValueMetrics([interaction], interaction.id);
  const events = [
    { label: "Session started", detail: `${interaction.interactionChannel} · ${interaction.requestSource}`, tone: "cyan" },
    { label: "Context assembled", detail: `${interaction.promptChars.toLocaleString()} prompt characters`, tone: "slate" },
    { label: "Model invoked", detail: `${interaction.modelName.replaceAll("_", " ")} · ${interaction.modelCategory}`, tone: "violet" },
    ...(interaction.agentPattern !== "None" ? [{ label: "Agent orchestrated", detail: interaction.agentPattern, tone: "violet" }] : []),
    ...(interaction.toolInvocationCount ? [{ label: "Tools executed", detail: `${interaction.toolInvocationCount} calls · ${interaction.pluginName}`, tone: "amber" }] : []),
    { label: "Response completed", detail: `${interaction.responseChars.toLocaleString()} response characters`, tone: "green" },
  ];
  return <div className="mx-auto max-w-[1240px] space-y-5 px-5 py-6 lg:px-8"><header className="flex flex-col gap-4 border-b border-white/[0.07] pb-5 sm:flex-row sm:items-end sm:justify-between"><div><Link href={user ? `/detail/engineer/${user.id}` : "/reports"} className="inline-flex items-center text-xs text-slate-500 hover:text-cyan-300"><ArrowLeft className="mr-1.5 h-3.5 w-3.5" />{user?.name ?? "Evidence"}</Link><div className="mt-4 flex items-center gap-2"><Badge variant="outline" className="border-white/10 text-slate-400">Session trace</Badge><Badge variant="outline" className="border-emerald-400/20 text-emerald-300">Observed</Badge></div><h1 className="mt-2 text-2xl font-semibold text-white">{interaction.useCaseLabel}</h1><p className="mt-1 text-xs text-slate-500">{interaction.engineerName} · {new Date(interaction.timestamp).toLocaleString()}</p></div><Link href="/reports" className="text-xs text-cyan-300">All evidence <ArrowRight className="ml-1 inline h-3.5 w-3.5" /></Link></header><section className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4"><Metric label="Usage" value={`${formatConsumption(interaction.estimatedCredits)} units`} note="Estimated from source telemetry" /><Metric label="Model" value={interaction.modelName.replaceAll("_", " ")} note={interaction.modelCategory} /><Metric label="Tool calls" value={String(interaction.toolInvocationCount)} note={interaction.pluginName} /><Metric label="Outcome" value={metrics.successfulOutcomes ? "Completed" : "Review"} note="Quality-gated outcome model" accent /></section><div className="grid gap-5 lg:grid-cols-[1.1fr_.9fr]"><section className="rounded-2xl border border-white/10 bg-[#0b1625]/82 p-5 lg:p-6"><h2 className="text-sm font-semibold text-white">Execution timeline</h2><div className="mt-5 space-y-0">{events.map((event, index) => <div key={`${event.label}-${index}`} className="relative flex gap-4 pb-5 last:pb-0"><div className="relative z-10 mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full border border-white/10 bg-[#0c1929]"><span className={`h-2 w-2 rounded-full ${event.tone === "cyan" ? "bg-cyan-400" : event.tone === "violet" ? "bg-violet-400" : event.tone === "amber" ? "bg-amber-400" : event.tone === "green" ? "bg-emerald-400" : "bg-slate-500"}`} /></div>{index < events.length - 1 ? <span className="absolute left-[13px] top-7 h-full w-px bg-white/[0.08]" /> : null}<div><p className="text-xs font-medium text-slate-200">{event.label}</p><p className="mt-0.5 text-[11px] text-slate-500">{event.detail}</p></div></div>)}</div></section><section className="rounded-2xl border border-white/10 bg-[#0b1625]/82 p-5 lg:p-6"><h2 className="text-sm font-semibold text-white">Session context</h2><dl className="mt-5 divide-y divide-white/[0.07]"><ContextRow label="Application" value={interaction.interactionChannel} /><ContextRow label="Agent pattern" value={interaction.agentPattern} /><ContextRow label="Plugin" value={interaction.pluginName} /><ContextRow label="MCP server" value={interaction.mcpServer} /><ContextRow label="Prompt size" value={`${interaction.promptChars.toLocaleString()} characters`} /><ContextRow label="Response size" value={`${interaction.responseChars.toLocaleString()} characters`} /></dl><p className="mt-5 rounded-lg border border-amber-400/15 bg-amber-400/[0.05] p-3 text-[11px] leading-5 text-slate-500">Prompt and response content are withheld in this summary. Production access should require redaction, role-based permissions, retention controls, and audit logging.</p></section></div></div>;
}

function ContextRow({ label, value }: { label: string; value: string }) { return <div className="flex items-center justify-between gap-4 py-3 first:pt-0"><dt className="text-[11px] text-slate-500">{label}</dt><dd className="max-w-[65%] truncate text-right text-xs font-medium text-slate-300">{value}</dd></div>; }
