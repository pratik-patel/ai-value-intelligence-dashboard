import { ArrowRight, CircleDollarSign, Gauge, Target, Users } from "lucide-react";
import { Link } from "wouter";
import { Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";

import { Badge } from "@/components/ui/badge";
import { TELEMETRY_DATA, formatConsumption } from "@/lib/telemetry-data";

export default function GovernanceOverview() {
  const total = TELEMETRY_DATA.kpis.totalConsumption;
  const overrun = TELEMETRY_DATA.kpis.overrun;
  const budget = Math.max(total - overrun, total * 0.82);
  const variance = budget ? ((total - budget) / budget) * 100 : 0;
  const portfolios = TELEMETRY_DATA.costCenters.slice().sort((a, b) => b.totalConsumption - a.totalConsumption);
  const maxUsage = portfolios[0]?.totalConsumption ?? 1;
  const actions = TELEMETRY_DATA.recommendations.slice(0, 3);

  return (
    <div className="mx-auto max-w-[1480px] space-y-5 px-5 py-7 lg:px-8">
      <header className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-xs font-medium uppercase tracking-[0.16em] text-cyan-300">Enterprise</p>
          <h1 className="mt-1 text-2xl font-semibold text-white">AI value overview</h1>
        </div>
        <Badge className="w-fit border-amber-400/20 bg-amber-400/10 px-3 py-1.5 text-amber-200 hover:bg-amber-400/10">Usage {variance.toFixed(1)}% above plan</Badge>
      </header>

      <section className="grid overflow-hidden rounded-2xl border border-white/10 bg-[#0b1625]/82 sm:grid-cols-2 xl:grid-cols-4">
        <Kpi icon={Gauge} label="Usage" value={`${formatConsumption(total)} units`} delta="+12.4%" />
        <Kpi icon={CircleDollarSign} label="Above plan" value={`${formatConsumption(overrun)} units`} delta={`+${variance.toFixed(1)}%`} alert />
        <Kpi icon={Users} label="Active users" value={String(TELEMETRY_DATA.kpis.activeEngineers)} delta="74% eligible" />
        <Kpi icon={Target} label="ROI coverage" value="Not connected" delta="Needs delivery data" muted />
      </section>

      <section className="grid gap-5 xl:grid-cols-[1.35fr_.85fr]">
        <Panel title="Usage over time" action={<Link href="/efficiency" className="text-xs text-cyan-300">Analyze <ArrowRight className="ml-1 inline h-3.5 w-3.5" /></Link>}>
          <div className="h-[280px]">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={TELEMETRY_DATA.dailyTrend} margin={{ top: 15, right: 12, left: -12, bottom: 0 }}>
                <defs>
                  <linearGradient id="overviewUsage" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="#22d3ee" stopOpacity={0.3} /><stop offset="95%" stopColor="#22d3ee" stopOpacity={0} /></linearGradient>
                  <linearGradient id="overviewOverrun" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="#f59e0b" stopOpacity={0.24} /><stop offset="95%" stopColor="#f59e0b" stopOpacity={0} /></linearGradient>
                </defs>
                <CartesianGrid stroke="rgba(148,163,184,.09)" strokeDasharray="4 4" vertical={false} />
                <XAxis dataKey="date" tickFormatter={(value) => value.slice(5)} tick={{ fill: "#64748b", fontSize: 10 }} axisLine={false} tickLine={false} minTickGap={28} />
                <YAxis tick={{ fill: "#64748b", fontSize: 10 }} axisLine={false} tickLine={false} />
                <Tooltip contentStyle={{ background: "#0b1625", border: "1px solid rgba(255,255,255,.12)", borderRadius: 10 }} formatter={(value: number, name: string) => [`${formatConsumption(value)} units`, name === "consumption" ? "Usage" : "Above plan"]} />
                <Area type="monotone" dataKey="consumption" stroke="#22d3ee" strokeWidth={2} fill="url(#overviewUsage)" />
                <Area type="monotone" dataKey="overrun" stroke="#f59e0b" strokeWidth={1.5} fill="url(#overviewOverrun)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </Panel>

        <Panel title="Portfolio contribution" action={<Link href="/explorer" className="text-xs text-cyan-300">Browse all <ArrowRight className="ml-1 inline h-3.5 w-3.5" /></Link>}>
          <div className="space-y-2.5">
            {portfolios.map((item, index) => (
              <Link key={item.id} href={`/explorer?level=portfolio&portfolio=${item.id}`} className="group block rounded-xl border border-white/[0.07] bg-white/[0.025] px-3.5 py-3 hover:border-cyan-400/20 hover:bg-white/[0.05]">
                <div className="flex items-center gap-3">
                  <span className="w-4 text-center text-[10px] text-slate-600">{index + 1}</span>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center justify-between gap-3"><span className="truncate text-xs font-medium text-slate-300">{item.name}</span><span className="whitespace-nowrap text-[11px] text-slate-400">{formatConsumption(item.totalConsumption)}</span></div>
                    <div className="mt-2 h-1 overflow-hidden rounded-full bg-white/[0.06]"><div className="h-full rounded-full bg-cyan-400/75" style={{ width: `${(item.totalConsumption / maxUsage) * 100}%` }} /></div>
                  </div>
                  <ArrowRight className="h-3.5 w-3.5 text-slate-700 group-hover:text-cyan-300" />
                </div>
              </Link>
            ))}
          </div>
        </Panel>
      </section>

      <Panel title="Next actions" action={<Link href="/recommendations" className="text-xs text-cyan-300">Open queue <ArrowRight className="ml-1 inline h-3.5 w-3.5" /></Link>}>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[660px] text-left text-xs">
            <thead className="text-[10px] uppercase tracking-[0.12em] text-slate-600"><tr><th className="pb-3 font-medium">Priority</th><th className="pb-3 font-medium">Action</th><th className="pb-3 font-medium">Scope</th><th className="pb-3 font-medium">Type</th><th className="pb-3 font-medium"></th></tr></thead>
            <tbody className="divide-y divide-white/[0.06]">
              {actions.map((action) => (
                <tr key={action.id}><td className="py-3"><span className={`rounded-full px-2 py-1 text-[10px] ${action.severity === "High" ? "bg-amber-400/10 text-amber-200" : "bg-sky-400/10 text-sky-200"}`}>{action.severity}</span></td><td className="py-3 font-medium text-slate-200">{action.title}</td><td className="py-3 text-slate-500">{action.scopeLabel}</td><td className="py-3 text-slate-500">{action.type}</td><td className="py-3 text-right"><Link href={`/recommendations?rec=${action.id}`} className="text-cyan-300">Review</Link></td></tr>
              ))}
            </tbody>
          </table>
        </div>
      </Panel>
    </div>
  );
}

function Panel({ title, action, children }: { title: string; action?: React.ReactNode; children: React.ReactNode }) {
  return <section className="rounded-2xl border border-white/10 bg-[#0b1625]/82 p-5 lg:p-6"><div className="mb-4 flex items-center justify-between gap-3"><h2 className="text-sm font-semibold text-slate-100">{title}</h2>{action}</div>{children}</section>;
}

function Kpi({ icon: Icon, label, value, delta, alert, muted }: { icon: typeof Gauge; label: string; value: string; delta: string; alert?: boolean; muted?: boolean }) {
  return <div className="border-b border-white/[0.08] p-5 last:border-b-0 sm:[&:nth-child(odd)]:border-r xl:border-b-0 xl:border-r xl:last:border-r-0"><div className="flex items-center justify-between"><span className="text-[10px] font-medium uppercase tracking-[0.14em] text-slate-600">{label}</span><Icon className="h-4 w-4 text-slate-700" /></div><p className={`mt-3 text-xl font-semibold ${muted ? "text-slate-400" : "text-white"}`}>{value}</p><p className={`mt-1 text-[11px] ${alert ? "text-amber-300" : "text-slate-500"}`}>{delta}</p></div>;
}
