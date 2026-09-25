import { useMemo, useState } from "react";
import { ArrowLeft, CheckCircle2, RotateCcw, SlidersHorizontal, Sparkles } from "lucide-react";
import { Link } from "wouter";
import { Bar, BarChart, CartesianGrid, Legend, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { getScopedInteractions, useDashboardScope } from "@/lib/scope-context";
import { formatConsumption } from "@/lib/telemetry-data";
import { getValueMetrics } from "@/lib/value-data";

const defaultPolicy = { highReasoning: 62, contextLimit: 70, maxSteps: 10 };

export default function PolicySimulationStudio() {
  const scope = useDashboardScope();
  const interactions = getScopedInteractions(scope);
  const baseline = getValueMetrics(interactions, scope.userId || scope.teamId || scope.portfolioId || "enterprise");
  const [highReasoning, setHighReasoning] = useState(defaultPolicy.highReasoning);
  const [contextLimit, setContextLimit] = useState(defaultPolicy.contextLimit);
  const [maxSteps, setMaxSteps] = useState(defaultPolicy.maxSteps);
  const [previewed, setPreviewed] = useState(false);
  const scopeName = scope.user?.name ?? scope.team?.name ?? scope.portfolio?.name ?? "Enterprise";

  const projection = useMemo(() => {
    const savingRate = Math.max(0.04, Math.min(0.34, (100 - highReasoning) * 0.0026 + (100 - contextLimit) * 0.0012 + (16 - maxSteps) * 0.006));
    const usage = baseline.usage * (1 - savingRate);
    const outcomes = baseline.successfulOutcomes;
    const cost = baseline.estimatedCost * (1 - savingRate);
    return { savingRate, usage, outcomes, cost, annualSavings: (baseline.estimatedCost - cost) * 12 };
  }, [baseline, contextLimit, highReasoning, maxSteps]);
  const chart = [
    { metric: "Usage (K)", Current: Number((baseline.usage / 1000).toFixed(1)), Projected: Number((projection.usage / 1000).toFixed(1)) },
    { metric: "Outcomes", Current: baseline.successfulOutcomes, Projected: projection.outcomes },
    { metric: "Cost ($)", Current: Math.round(baseline.estimatedCost), Projected: Math.round(projection.cost) },
  ];

  function resetPolicy() { setHighReasoning(defaultPolicy.highReasoning); setContextLimit(defaultPolicy.contextLimit); setMaxSteps(defaultPolicy.maxSteps); setPreviewed(false); }

  return (
    <div className="mx-auto max-w-[1420px] space-y-5 px-5 py-7 lg:px-8">
      <header className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between"><div><Link href="/efficiency" className="inline-flex items-center text-xs text-slate-500 hover:text-cyan-300"><ArrowLeft className="mr-1.5 h-3.5 w-3.5" />Efficiency & ROI</Link><p className="mt-3 text-xs font-medium uppercase tracking-[0.16em] text-cyan-300">Scenario planner</p><h1 className="mt-1 text-2xl font-semibold text-white">Test an intent-based routing policy.</h1><p className="mt-1 text-xs text-slate-500">Route by task intent, ambiguity, risk, and verification. Nothing here changes production settings.</p></div><Badge variant="outline" className="w-fit border-violet-400/20 text-violet-200">Projected scenario</Badge></header>

      <ol className="grid overflow-hidden rounded-xl border border-white/10 bg-[#0b1625]/82 sm:grid-cols-3"><Step number="1" label="Scope" value={scopeName} done /><Step number="2" label="Policy" value="Quality-gated optimization" done /><Step number="3" label="Impact" value={previewed ? "Preview ready" : "Live estimate"} done={previewed} /></ol>

      <div className="grid gap-5 xl:grid-cols-[.8fr_1.2fr]">
        <section className="rounded-2xl border border-white/10 bg-[#0b1625]/82 p-5 lg:p-6"><div className="flex items-center gap-2"><SlidersHorizontal className="h-4 w-4 text-cyan-300" /><h2 className="text-sm font-semibold text-white">Policy levers</h2></div><div className="mt-5 rounded-xl border border-emerald-400/20 bg-emerald-400/[0.06] p-4"><div className="flex items-center gap-2"><CheckCircle2 className="h-4 w-4 text-emerald-300" /><p className="text-xs font-semibold text-emerald-200">Quality guardrail enforced</p></div><p className="mt-1.5 text-[11px] leading-5 text-slate-400">High reasoning handles specification, design, ambiguity, and risk. Routine fixes use lower reasoning; compilation and test execution use tools. Failed verification escalates. Every eligible route must meet the current {baseline.qualityPassRate}% quality-pass baseline.</p></div><div className="mt-7 space-y-7"><Lever label="High-reasoning eligibility" value={`${highReasoning}%`} help="Intent classified by ambiguity, blast radius, and validation risk."><Slider value={[highReasoning]} min={45} max={95} step={1} onValueChange={([value]) => { setHighReasoning(value); setPreviewed(false); }} /></Lever><Lever label="Context retention floor" value={`${contextLimit}%`} help="Minimum context retained before a route can compact safely."><Slider value={[contextLimit]} min={55} max={95} step={1} onValueChange={([value]) => { setContextLimit(value); setPreviewed(false); }} /></Lever><Lever label="Maximum agent steps" value={String(maxSteps)} help="Execution cap applied after validation and retry requirements."><Slider value={[maxSteps]} min={7} max={20} step={1} onValueChange={([value]) => { setMaxSteps(value); setPreviewed(false); }} /></Lever></div><div className="mt-7 flex gap-2"><Button className="flex-1 bg-cyan-400 text-slate-950 hover:bg-cyan-300" onClick={() => setPreviewed(true)}><Sparkles className="mr-2 h-4 w-4" />Preview impact</Button><Button variant="outline" size="icon" className="border-white/10 bg-transparent text-slate-400 hover:bg-white/[0.05]" onClick={resetPolicy} aria-label="Reset"><RotateCcw className="h-4 w-4" /></Button></div></section>

        <section className="rounded-2xl border border-white/10 bg-[#0b1625]/82 p-5 lg:p-6"><div className="flex items-start justify-between gap-3"><div><h2 className="text-sm font-semibold text-white">Current vs. projected</h2><p className="mt-1 text-[11px] text-slate-500">Directional estimate using the selected scope and quality-gated policy.</p></div><span className="rounded-full bg-emerald-400/10 px-2.5 py-1 text-xs font-medium text-emerald-300">−{Math.round(projection.savingRate * 100)}% usage</span></div><div className="mt-4 h-[310px]"><ResponsiveContainer width="100%" height="100%"><BarChart data={chart} margin={{ top: 16, right: 8, left: -15, bottom: 0 }}><CartesianGrid stroke="rgba(148,163,184,.08)" vertical={false} /><XAxis dataKey="metric" tick={{ fill: "#94a3b8", fontSize: 10 }} axisLine={false} tickLine={false} /><YAxis tick={{ fill: "#64748b", fontSize: 10 }} axisLine={false} tickLine={false} /><Tooltip contentStyle={{ background: "#0b1625", border: "1px solid rgba(255,255,255,.12)", borderRadius: 10 }} /><Legend iconType="circle" wrapperStyle={{ fontSize: 11 }} /><Bar dataKey="Current" fill="#475569" radius={[4, 4, 0, 0]} /><Bar dataKey="Projected" fill="#22d3ee" radius={[4, 4, 0, 0]} /></BarChart></ResponsiveContainer></div><div className="grid gap-3 border-t border-white/[0.07] pt-5 sm:grid-cols-3"><Impact label="Usage saved" value={`${formatConsumption(baseline.usage - projection.usage)} units`} /><Impact label="Annual savings" value={`$${Math.round(projection.annualSavings).toLocaleString()}`} /><Impact label="Quality gate" value={`≥ ${baseline.qualityPassRate}%`} /></div><div className="mt-5 rounded-xl border border-white/[0.07] bg-black/20 p-4 text-xs leading-5 text-slate-400"><b className="text-slate-200">Assumptions:</b> unit cost is held constant; task mix is unchanged; successful outcomes are quality-gated; any scenario that predicts quality regression is ineligible.</div></section>
      </div>
    </div>
  );
}

function Step({ number, label, value, done }: { number: string; label: string; value: string; done?: boolean }) { return <li className="flex items-center gap-3 border-b border-white/[0.08] p-4 last:border-b-0 sm:border-b-0 sm:border-r sm:last:border-r-0"><span className={`flex h-7 w-7 items-center justify-center rounded-full text-xs font-semibold ${done ? "bg-cyan-400 text-slate-950" : "bg-white/[0.06] text-slate-500"}`}>{done ? <CheckCircle2 className="h-4 w-4" /> : number}</span><div><p className="text-[10px] uppercase tracking-[0.14em] text-slate-600">{number}. {label}</p><p className="mt-0.5 text-xs font-medium text-slate-300">{value}</p></div></li>; }
function Lever({ label, value, help, children }: { label: string; value: string; help: string; children: React.ReactNode }) { return <div><div className="mb-3 flex items-center justify-between"><div><p className="text-xs font-medium text-slate-200">{label}</p><p className="mt-0.5 text-[10px] text-slate-600">{help}</p></div><span className="rounded-md bg-white/[0.05] px-2 py-1 text-xs text-cyan-200">{value}</span></div>{children}</div>; }
function Impact({ label, value }: { label: string; value: string }) { return <div><p className="text-[10px] font-medium uppercase tracking-[0.12em] text-slate-600">{label}</p><p className="mt-1 text-base font-semibold text-white">{value}</p></div>; }
