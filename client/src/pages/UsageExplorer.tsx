import { useMemo, useState } from "react";
import { ArrowLeft, ArrowRight, Building2, ChevronRight, Users, UserRound } from "lucide-react";
import { Link } from "wouter";
import { Area, AreaChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { TELEMETRY_DATA, formatConsumption } from "@/lib/telemetry-data";

type Level = "enterprise" | "portfolio" | "team" | "user";

const levels: Array<{ id: Level; label: string }> = [
  { id: "enterprise", label: "Enterprise" },
  { id: "portfolio", label: "Portfolio" },
  { id: "team", label: "Team" },
  { id: "user", label: "User" },
];

export default function UsageExplorer() {
  const query = typeof window !== "undefined" ? new URLSearchParams(window.location.search) : new URLSearchParams();
  const queryLevel = query.get("level");
  const initialLevel = levels.some((item) => item.id === queryLevel) ? (queryLevel as Level) : "enterprise";
  const [level, setLevelState] = useState<Level>(initialLevel);
  const [portfolioId, setPortfolioId] = useState(query.get("portfolio") ?? TELEMETRY_DATA.costCenters[0]?.id ?? "");
  const [teamId, setTeamId] = useState(query.get("team") ?? "");
  const [userId, setUserId] = useState(query.get("user") ?? "");

  const portfolio = TELEMETRY_DATA.costCenters.find((item) => item.id === portfolioId) ?? TELEMETRY_DATA.costCenters[0];
  const teams = TELEMETRY_DATA.teams.filter((item) => item.costCenterId === portfolio?.id);
  const team = TELEMETRY_DATA.teams.find((item) => item.id === teamId) ?? teams[0];
  const users = TELEMETRY_DATA.engineers.filter((item) => item.teamId === team?.id);
  const user = TELEMETRY_DATA.engineers.find((item) => item.userId === userId || item.id === userId) ?? users[0];

  const scopedInteractions = useMemo(() => {
    if (level === "user" && user) return TELEMETRY_DATA.interactions.filter((item) => item.engineerId === user.userId);
    if (level === "team" && team) return TELEMETRY_DATA.interactions.filter((item) => item.teamId === team.id);
    if (level === "portfolio" && portfolio) return TELEMETRY_DATA.interactions.filter((item) => item.costCenterId === portfolio.id);
    return TELEMETRY_DATA.interactions;
  }, [level, portfolio, team, user]);

  const trend = useMemo(() => {
    const buckets = new Map<string, number>();
    scopedInteractions.forEach((item) => {
      const day = item.timestamp.slice(5, 10);
      buckets.set(day, (buckets.get(day) ?? 0) + item.estimatedCredits);
    });
    return Array.from(buckets.entries()).sort((a, b) => a[0].localeCompare(b[0])).map(([date, usage]) => ({ date, usage: Number(usage.toFixed(1)) }));
  }, [scopedInteractions]);

  function setLevel(next: Level) {
    setLevelState(next);
    const params = new URLSearchParams({ level: next });
    if (next !== "enterprise" && portfolio?.id) params.set("portfolio", portfolio.id);
    if ((next === "team" || next === "user") && team?.id) params.set("team", team.id);
    if (next === "user" && user?.userId) params.set("user", user.userId);
    window.history.replaceState(null, "", `/explorer?${params.toString()}`);
  }

  function choosePortfolio(id: string) {
    setPortfolioId(id);
    setTeamId("");
    setUserId("");
    setLevelState("portfolio");
    window.history.replaceState(null, "", `/explorer?level=portfolio&portfolio=${id}`);
  }

  function chooseTeam(id: string) {
    setTeamId(id);
    setUserId("");
    setLevelState("team");
    window.history.replaceState(null, "", `/explorer?level=team&portfolio=${portfolio?.id ?? ""}&team=${id}`);
  }

  function chooseUser(id: string) {
    setUserId(id);
    setLevelState("user");
    window.history.replaceState(null, "", `/explorer?level=user&portfolio=${portfolio?.id ?? ""}&team=${team?.id ?? ""}&user=${id}`);
  }

  const scope = getScope(level, portfolio, team, user);

  return (
    <div className="mx-auto max-w-[1380px] px-5 py-7 lg:px-8">
      <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-xs font-medium uppercase tracking-[0.16em] text-cyan-300">Organization</p>
          <h1 className="mt-1 text-2xl font-semibold text-white">Follow usage to the person or pattern.</h1>
        </div>
        <span className="text-xs text-slate-500">Select a row to move one level deeper</span>
      </div>

      <nav className="mb-5 flex items-center gap-1 overflow-x-auto rounded-xl border border-white/10 bg-[#0b1625]/80 p-1.5" aria-label="Organization hierarchy">
        {levels.map((item, index) => {
          const currentIndex = levels.findIndex((entry) => entry.id === level);
          const enabled = index <= currentIndex || (item.id === "portfolio" && Boolean(portfolio)) || (item.id === "team" && Boolean(team)) || (item.id === "user" && Boolean(user));
          return (
            <div key={item.id} className="flex items-center">
              {index > 0 ? <ChevronRight className="h-3.5 w-3.5 shrink-0 text-slate-700" /> : null}
              <button
                type="button"
                disabled={!enabled}
                onClick={() => setLevel(item.id)}
                className={`shrink-0 rounded-lg px-3 py-2 text-xs font-medium transition-colors ${
                  item.id === level ? "bg-cyan-400 text-slate-950" : enabled ? "text-slate-300 hover:bg-white/[0.06]" : "cursor-not-allowed text-slate-700"
                }`}
              >
                <span className="mr-1.5 text-[10px] opacity-70">{index + 1}</span>{item.label}
              </button>
            </div>
          );
        })}
      </nav>

      <div className="grid gap-5 lg:grid-cols-[1.08fr_.92fr]">
        <section className="rounded-2xl border border-white/10 bg-[#0b1625]/82 p-5 lg:p-6">
          <div className="mb-5 flex items-center justify-between gap-3">
            <div>
              <p className="text-[10px] font-medium uppercase tracking-[0.16em] text-slate-500">{level}</p>
              <h2 className="mt-1 text-lg font-semibold text-white">{listTitle(level, portfolio?.name, team?.name)}</h2>
            </div>
            {level !== "enterprise" ? <Button variant="ghost" size="sm" className="text-slate-400 hover:bg-white/[0.06] hover:text-white" onClick={() => setLevel(previousLevel(level))}><ArrowLeft className="mr-1.5 h-3.5 w-3.5" />Back</Button> : null}
          </div>

          <div className="space-y-2">
            {level === "enterprise" && TELEMETRY_DATA.costCenters.map((item) => (
              <HierarchyRow key={item.id} icon={Building2} title={item.name} value={`${formatConsumption(item.totalConsumption)} units`} meta={`${item.teamCount} teams · ${item.activeEngineers} users`} onClick={() => choosePortfolio(item.id)} />
            ))}
            {level === "portfolio" && teams.map((item) => (
              <HierarchyRow key={item.id} icon={Users} title={item.name} value={`${formatConsumption(item.totalConsumption)} units`} meta={`${item.activeEngineers} users · ${item.topUseCase}`} onClick={() => chooseTeam(item.id)} />
            ))}
            {level === "team" && users.map((item) => (
              <HierarchyRow key={item.id} icon={UserRound} title={item.name} value={`${formatConsumption(item.totalConsumption)} units`} meta={`${item.engineerFunction} · ${item.activeDays} active days`} onClick={() => chooseUser(item.userId)} />
            ))}
            {level === "user" && user ? (
              <div className="rounded-xl border border-cyan-400/15 bg-cyan-400/[0.05] p-5">
                <div className="flex items-center gap-3"><div className="flex h-11 w-11 items-center justify-center rounded-full bg-cyan-400/10 font-semibold text-cyan-200">{user.name.split(" ").map((part) => part[0]).join("")}</div><div><h3 className="font-semibold text-white">{user.name}</h3><p className="text-xs text-slate-500">{user.teamName} · {user.engineerFunction}</p></div></div>
                <div className="mt-5 grid grid-cols-2 gap-3">
                  <MiniStat label="Usage" value={`${formatConsumption(user.totalConsumption)} units`} />
                  <MiniStat label="Active days" value={String(user.activeDays)} />
                  <MiniStat label="Top model" value={user.topModel.replaceAll("_", " ")} />
                  <MiniStat label="Top plugin" value={user.topPlugin} />
                </div>
                <Link href={`/detail/engineer/${user.id}`} className="mt-5 inline-flex items-center text-xs font-medium text-cyan-300">Open user detail <ArrowRight className="ml-1.5 h-3.5 w-3.5" /></Link>
              </div>
            ) : null}
          </div>
        </section>

        <section className="space-y-5">
          <div className="rounded-2xl border border-white/10 bg-[#0b1625]/82 p-5 lg:p-6">
            <div className="flex items-start justify-between gap-3"><div><p className="text-[10px] font-medium uppercase tracking-[0.16em] text-slate-500">Selected scope</p><h2 className="mt-1 text-lg font-semibold text-white">{scope.name}</h2></div><Badge variant="outline" className="border-white/10 text-slate-400">{scope.level}</Badge></div>
            <div className="mt-5 grid grid-cols-2 gap-x-5 gap-y-4">
              <MiniStat label="Usage" value={`${formatConsumption(scope.usage)} units`} />
              <MiniStat label="Above plan" value={scope.overrun ? `${formatConsumption(scope.overrun)} units` : "On plan"} />
              <MiniStat label="People" value={String(scope.people)} />
              <MiniStat label="Top use case" value={scope.topUseCase} />
            </div>
          </div>

          <div className="rounded-2xl border border-white/10 bg-[#0b1625]/82 p-5 lg:p-6">
            <div className="flex items-center justify-between"><h2 className="text-sm font-semibold text-slate-100">Usage trend</h2><span className="text-[10px] text-slate-500">{scopedInteractions.length} interactions</span></div>
            <div className="mt-4 h-[190px]">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={trend} margin={{ top: 8, right: 8, left: -25, bottom: 0 }}>
                  <defs><linearGradient id="usageFill" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="#22d3ee" stopOpacity={0.28} /><stop offset="95%" stopColor="#22d3ee" stopOpacity={0} /></linearGradient></defs>
                  <XAxis dataKey="date" tick={{ fill: "#64748b", fontSize: 10 }} axisLine={false} tickLine={false} minTickGap={28} />
                  <YAxis tick={{ fill: "#64748b", fontSize: 10 }} axisLine={false} tickLine={false} />
                  <Tooltip contentStyle={{ background: "#0b1625", border: "1px solid rgba(255,255,255,.12)", borderRadius: 10 }} formatter={(value: number) => [`${formatConsumption(value)} units`, "Usage"]} />
                  <Area type="monotone" dataKey="usage" stroke="#22d3ee" strokeWidth={2} fill="url(#usageFill)" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}

function HierarchyRow({ icon: Icon, title, value, meta, onClick }: { icon: typeof Building2; title: string; value: string; meta: string; onClick: () => void }) {
  return <button type="button" onClick={onClick} className="group flex w-full items-center gap-3 rounded-xl border border-white/[0.07] bg-white/[0.025] p-3.5 text-left hover:border-cyan-400/25 hover:bg-white/[0.05]"><div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-white/[0.05] text-slate-400"><Icon className="h-4 w-4" /></div><div className="min-w-0 flex-1"><div className="flex items-center justify-between gap-3"><span className="truncate text-sm font-medium text-slate-200">{title}</span><span className="whitespace-nowrap text-xs text-slate-400">{value}</span></div><p className="mt-1 truncate text-[11px] text-slate-500">{meta}</p></div><ArrowRight className="h-4 w-4 text-slate-700 transition-transform group-hover:translate-x-0.5 group-hover:text-cyan-300" /></button>;
}

function MiniStat({ label, value }: { label: string; value: string }) {
  return <div className="min-w-0"><p className="text-[10px] font-medium uppercase tracking-[0.12em] text-slate-600">{label}</p><p className="mt-1 truncate text-sm font-medium text-slate-200" title={value}>{value}</p></div>;
}

function previousLevel(level: Level): Level {
  if (level === "user") return "team";
  if (level === "team") return "portfolio";
  return "enterprise";
}

function listTitle(level: Level, portfolio?: string, team?: string) {
  if (level === "enterprise") return "Choose a portfolio";
  if (level === "portfolio") return `${portfolio ?? "Portfolio"} · choose a team`;
  if (level === "team") return `${team ?? "Team"} · choose a user`;
  return "User profile";
}

function getScope(level: Level, portfolio: any, team: any, user: any) {
  if (level === "user" && user) return { level: "User", name: user.name, usage: user.totalConsumption, overrun: user.overrun, people: 1, topUseCase: user.topUseCase };
  if (level === "team" && team) return { level: "Team", name: team.name, usage: team.totalConsumption, overrun: team.overrun, people: team.activeEngineers, topUseCase: team.topUseCase };
  if (level === "portfolio" && portfolio) return { level: "Portfolio", name: portfolio.name, usage: portfolio.totalConsumption, overrun: portfolio.overrun, people: portfolio.activeEngineers, topUseCase: portfolio.topUseCase };
  return { level: "Enterprise", name: "All portfolios", usage: TELEMETRY_DATA.kpis.totalConsumption, overrun: TELEMETRY_DATA.kpis.overrun, people: TELEMETRY_DATA.kpis.activeEngineers, topUseCase: TELEMETRY_DATA.kpis.topUseCase };
}
