import { ArrowRight, Bot, CheckCircle2, CircleDollarSign, DatabaseZap, GitPullRequest, Puzzle, Sparkles, Workflow } from "lucide-react";
import { Link } from "wouter";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { TELEMETRY_DATA, formatConsumption } from "@/lib/telemetry-data";

export default function EfficiencyRoi() {
  const total = TELEMETRY_DATA.kpis.totalConsumption;
  const highReasoning = TELEMETRY_DATA.interactions.filter((item) => item.modelCategory === "High Reasoning");
  const highReasoningUsage = highReasoning.reduce((sum, item) => sum + item.estimatedCredits, 0);
  const potentialAvoidable = highReasoningUsage * 0.18;
  const modelRows = summarize("modelName");
  const agentRows = summarize("agentPattern", "None");
  const pluginRows = summarize("pluginName", "Direct Assistant");

  return (
    <div className="mx-auto max-w-[1500px] space-y-6 px-5 py-8 lg:px-8">
      <header className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <div className="mb-2 flex items-center gap-2"><Badge className="border-violet-400/20 bg-violet-400/10 text-violet-200">Efficiency & ROI</Badge><Badge variant="outline" className="border-white/10 text-slate-400">Decision workspace</Badge></div>
          <h1 className="text-2xl font-semibold tracking-tight text-white">Connect consumption to outcomes before calling it ROI.</h1>
          <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-400">This view separates observed usage from modeled optimization and missing delivery signals. It is designed to prevent false productivity claims while making the next integration and routing decisions obvious.</p>
        </div>
        <Link href="/studio"><Button variant="outline" className="border-white/10 bg-white/[0.03] text-slate-200 hover:bg-white/[0.07]">Open scenario planner <ArrowRight className="ml-2 h-4 w-4" /></Button></Link>
      </header>

      <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <Metric icon={CircleDollarSign} label="Estimated ROI" value="Not available" note="Finance + outcomes required" status="Missing data" />
        <Metric icon={GitPullRequest} label="Cost / successful outcome" value="Not available" note="Delivery link required" status="Missing data" />
        <Metric icon={Sparkles} label="Potential avoidable usage" value={`${formatConsumption(potentialAvoidable)} units`} note="Modeled from reasoning tier" status="Estimated" />
        <Metric icon={CheckCircle2} label="Telemetry coverage" value="86%" note="Usage events with attribution" status="Observed" />
      </section>

      <section className="grid gap-6 xl:grid-cols-[1.15fr_.85fr]">
        <div className="rounded-2xl border border-white/10 bg-[#0b1625]/82 p-6">
          <div className="flex items-start justify-between gap-4">
            <div><h2 className="text-base font-semibold text-slate-100">Value measurement readiness</h2><p className="mt-1 text-xs leading-5 text-slate-500">Observed, estimated and unavailable measures stay visually distinct.</p></div>
            <Badge variant="outline" className="border-amber-400/20 text-amber-200">2 sources needed</Badge>
          </div>
          <div className="mt-6 space-y-3">
            <ReadinessRow icon={DatabaseZap} title="AI telemetry" detail="Usage, model, application, agent and plugin attribution" status="Connected" tone="green" />
            <ReadinessRow icon={Workflow} title="Delivery outcomes" detail="Work items, merged PRs, deployments, cycle time and quality" status="Connect" tone="amber" />
            <ReadinessRow icon={CircleDollarSign} title="Financial model" detail="Provider price book, fixed licenses, labor value and realization factor" status="Connect" tone="amber" />
          </div>
          <div className="mt-5 rounded-xl border border-cyan-400/15 bg-cyan-400/[0.06] p-4 text-xs leading-5 text-slate-300">
            <span className="font-semibold text-cyan-200">Recommended first outcome:</span> use merged PRs that pass quality gates, then add deployment and incident signals. Story points should remain a within-team trend—not an enterprise leaderboard.
          </div>
        </div>

        <div className="rounded-2xl border border-white/10 bg-[#0b1625]/82 p-6">
          <h2 className="text-base font-semibold text-slate-100">ROI contract</h2>
          <p className="mt-1 text-xs leading-5 text-slate-500">A transparent formula leaders can audit.</p>
          <div className="mt-6 rounded-xl border border-white/[0.07] bg-black/20 p-5 text-center">
            <p className="text-[11px] font-medium uppercase tracking-[0.16em] text-slate-500">Estimated ROI</p>
            <p className="mt-3 text-lg font-semibold text-white">(Realized benefit − AI cost) ÷ AI cost</p>
          </div>
          <ul className="mt-5 space-y-3 text-xs leading-5 text-slate-400">
            <li className="flex gap-2"><span className="mt-1 h-1.5 w-1.5 shrink-0 rounded-full bg-cyan-400" /><span><b className="text-slate-200">Benefit</b> = confidence-weighted time saved × burdened rate × realization factor.</span></li>
            <li className="flex gap-2"><span className="mt-1 h-1.5 w-1.5 shrink-0 rounded-full bg-cyan-400" /><span><b className="text-slate-200">AI cost</b> = provider charges + allocated subscription and tool cost.</span></li>
            <li className="flex gap-2"><span className="mt-1 h-1.5 w-1.5 shrink-0 rounded-full bg-cyan-400" /><span><b className="text-slate-200">Quality guardrail</b> = rework, escaped defects and change-failure rate.</span></li>
          </ul>
        </div>
      </section>

      <section className="rounded-2xl border border-white/10 bg-[#0b1625]/82 p-6">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div><h2 className="text-base font-semibold text-slate-100">Reasoning-fit opportunity</h2><p className="mt-1 text-xs leading-5 text-slate-500">High-reasoning does not automatically mean waste. Validate task complexity and outcome quality before routing changes.</p></div>
          <Badge variant="outline" className="w-fit border-white/10 text-slate-400">{formatConsumption(highReasoningUsage)} high-reasoning units</Badge>
        </div>
        <div className="mt-5 overflow-x-auto rounded-xl border border-white/[0.07]">
          <table className="w-full min-w-[700px] text-left text-xs">
            <thead className="bg-black/20 text-[10px] uppercase tracking-[0.12em] text-slate-500"><tr><th className="px-4 py-3">Model</th><th className="px-4 py-3">Usage</th><th className="px-4 py-3">Share</th><th className="px-4 py-3">Routing signal</th><th className="px-4 py-3">Confidence</th></tr></thead>
            <tbody className="divide-y divide-white/[0.06]">
              {modelRows.slice(0, 5).map((row, index) => (
                <tr key={row.label} className="text-slate-300"><td className="px-4 py-3.5 font-medium text-slate-200">{row.label}</td><td className="px-4 py-3.5">{formatConsumption(row.usage)} units</td><td className="px-4 py-3.5">{Math.round((row.usage / total) * 100)}%</td><td className="px-4 py-3.5 text-slate-400">{index < 2 ? "Review simple tasks on high tier" : "Monitor quality and retries"}</td><td className="px-4 py-3.5"><Badge variant="outline" className="border-white/10 text-[10px] text-slate-400">Medium</Badge></td></tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section className="grid gap-6 lg:grid-cols-3">
        <AttributionCard icon={Bot} title="Agents" rows={agentRows} empty="No named agent runs found" />
        <AttributionCard icon={Puzzle} title="Plugins & tools" rows={pluginRows} empty="No named plugins found" />
        <AttributionCard icon={Workflow} title="Skills" rows={[]} empty="Skill telemetry is not connected. Add skill name, version, run ID, success, latency and cost to compare effectiveness." />
      </section>
    </div>
  );
}

type SummaryRow = { label: string; usage: number; runs: number };

function summarize(key: "modelName" | "agentPattern" | "pluginName", excluded?: string): SummaryRow[] {
  const map = new Map<string, SummaryRow>();
  TELEMETRY_DATA.interactions.forEach((interaction) => {
    const label = interaction[key];
    if (!label || label === excluded) return;
    const current = map.get(label) ?? { label, usage: 0, runs: 0 };
    current.usage += interaction.estimatedCredits;
    current.runs += 1;
    map.set(label, current);
  });
  return Array.from(map.values()).sort((a, b) => b.usage - a.usage);
}

function Metric({ icon: Icon, label, value, note, status }: { icon: typeof Sparkles; label: string; value: string; note: string; status: string }) {
  return <div className="rounded-xl border border-white/10 bg-[#0b1625]/82 p-5"><div className="flex items-center justify-between"><span className="text-xs font-medium uppercase tracking-[0.12em] text-slate-500">{label}</span><Icon className="h-4 w-4 text-slate-600" /></div><p className="mt-3 text-xl font-semibold text-white">{value}</p><div className="mt-2 flex items-center justify-between gap-3 text-[11px]"><span className="text-slate-500">{note}</span><span className={status === "Observed" ? "text-emerald-300" : status === "Estimated" ? "text-amber-300" : "text-slate-500"}>{status}</span></div></div>;
}

function ReadinessRow({ icon: Icon, title, detail, status, tone }: { icon: typeof Workflow; title: string; detail: string; status: string; tone: "green" | "amber" }) {
  return <div className="flex items-center gap-3 rounded-xl border border-white/[0.07] bg-white/[0.025] p-3.5"><div className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg ${tone === "green" ? "bg-emerald-400/10 text-emerald-300" : "bg-amber-400/10 text-amber-300"}`}><Icon className="h-4 w-4" /></div><div className="min-w-0 flex-1"><p className="text-sm font-medium text-slate-200">{title}</p><p className="truncate text-[11px] text-slate-500">{detail}</p></div><Badge variant="outline" className={tone === "green" ? "border-emerald-400/20 text-emerald-300" : "border-amber-400/20 text-amber-300"}>{status}</Badge></div>;
}

function AttributionCard({ icon: Icon, title, rows, empty }: { icon: typeof Bot; title: string; rows: SummaryRow[]; empty: string }) {
  return <div className="rounded-2xl border border-white/10 bg-[#0b1625]/82 p-5"><div className="flex items-center gap-2"><Icon className="h-4 w-4 text-cyan-300" /><h2 className="text-sm font-semibold text-slate-100">{title}</h2></div>{rows.length ? <div className="mt-4 space-y-3">{rows.slice(0, 4).map((row) => <div key={row.label} className="flex items-center justify-between gap-3 text-xs"><div className="min-w-0"><p className="truncate font-medium text-slate-300">{row.label}</p><p className="text-[11px] text-slate-500">{row.runs} runs</p></div><span className="whitespace-nowrap text-slate-400">{formatConsumption(row.usage)} units</span></div>)}</div> : <div className="mt-4 rounded-xl border border-dashed border-white/10 p-4 text-xs leading-5 text-slate-500">{empty}</div>}</div>;
}
