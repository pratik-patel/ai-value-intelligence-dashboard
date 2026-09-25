import { useMemo, useState } from "react";
import { ArrowRight, CheckCircle2, ChevronRight, FlaskConical, Lightbulb } from "lucide-react";
import { Link } from "wouter";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { TELEMETRY_DATA } from "@/lib/telemetry-data";

type SeverityFilter = "All" | "High" | "Medium" | "Low";

export default function Recommendations() {
  const queryId = typeof window !== "undefined" ? new URLSearchParams(window.location.search).get("rec") : null;
  const [filter, setFilter] = useState<SeverityFilter>("All");
  const [selectedId, setSelectedId] = useState(queryId ?? TELEMETRY_DATA.recommendations[0]?.id ?? "");
  const rows = useMemo(() => TELEMETRY_DATA.recommendations.filter((item) => filter === "All" || item.severity === filter), [filter]);
  const selected = TELEMETRY_DATA.recommendations.find((item) => item.id === selectedId) ?? rows[0];

  function select(id: string) {
    setSelectedId(id);
    window.history.replaceState(null, "", `/recommendations?rec=${id}`);
  }

  return (
    <div className="mx-auto max-w-[1440px] space-y-5 px-5 py-7 lg:px-8">
      <header className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div><p className="text-xs font-medium uppercase tracking-[0.16em] text-cyan-300">Optimize</p><h1 className="mt-1 text-2xl font-semibold text-white">Action queue</h1></div>
        <div className="flex gap-1 rounded-lg border border-white/10 bg-[#0b1625] p-1">
          {(["All", "High", "Medium", "Low"] as SeverityFilter[]).map((item) => <button key={item} onClick={() => setFilter(item)} className={`rounded-md px-3 py-1.5 text-xs ${filter === item ? "bg-white/10 text-white" : "text-slate-500 hover:text-slate-300"}`}>{item}</button>)}
        </div>
      </header>

      <div className="grid gap-5 lg:grid-cols-[.9fr_1.1fr]">
        <section className="rounded-2xl border border-white/10 bg-[#0b1625]/82 p-3">
          <div className="flex items-center justify-between px-2 py-2"><span className="text-[10px] font-medium uppercase tracking-[0.14em] text-slate-600">{rows.length} actions</span><span className="text-[10px] text-slate-600">Select to inspect</span></div>
          <div className="space-y-1.5">
            {rows.map((item) => (
              <button key={item.id} type="button" onClick={() => select(item.id)} className={`flex w-full items-center gap-3 rounded-xl border p-3.5 text-left transition-colors ${selected?.id === item.id ? "border-cyan-400/25 bg-cyan-400/[0.07]" : "border-transparent bg-white/[0.02] hover:bg-white/[0.05]"}`}>
                <span className={`h-2 w-2 shrink-0 rounded-full ${item.severity === "High" ? "bg-amber-400" : item.severity === "Medium" ? "bg-sky-400" : "bg-slate-500"}`} />
                <div className="min-w-0 flex-1"><p className="truncate text-sm font-medium text-slate-200">{item.title}</p><p className="mt-1 truncate text-[11px] text-slate-500">{item.scopeLabel} · {item.type}</p></div>
                <ChevronRight className="h-4 w-4 text-slate-700" />
              </button>
            ))}
          </div>
        </section>

        {selected ? (
          <section className="rounded-2xl border border-white/10 bg-[#0b1625]/82 p-5 lg:p-6">
            <div className="flex items-start justify-between gap-4"><div><div className="flex items-center gap-2"><Badge className={selected.severity === "High" ? "border-amber-400/20 bg-amber-400/10 text-amber-200" : "border-sky-400/20 bg-sky-400/10 text-sky-200"}>{selected.severity}</Badge><Badge variant="outline" className="border-white/10 text-slate-500">{selected.type}</Badge></div><h2 className="mt-4 text-xl font-semibold text-white">{selected.title}</h2><p className="mt-1 text-xs text-slate-500">{selected.scopeType} · {selected.scopeLabel}</p></div><div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-cyan-400/10 text-cyan-300"><Lightbulb className="h-5 w-5" /></div></div>

            <div className="mt-6 grid gap-3 sm:grid-cols-3">
              <Fact label="Evidence" value={`${selected.evidenceInteractionIds.length} traces`} />
              <Fact label="Owner" value={ownerFor(selected.scopeType)} />
              <Fact label="Confidence" value={selected.evidenceInteractionIds.length > 1 ? "High" : "Medium"} />
            </div>

            <div className="mt-5 space-y-3">
              <DecisionBlock label="Why" value={selected.whyItMatters} />
              <DecisionBlock label="Action" value={selected.recommendedAction} emphasize />
              <DecisionBlock label="Expected result" value={selected.expectedImpact} />
            </div>

            <div className="mt-6 flex flex-wrap gap-2">
              <Link href="/studio"><Button className="bg-cyan-500 text-slate-950 hover:bg-cyan-400"><FlaskConical className="mr-2 h-4 w-4" />Test scenario</Button></Link>
              <Link href="/reports"><Button variant="outline" className="border-white/10 bg-white/[0.03] text-slate-300 hover:bg-white/[0.07]">Open evidence <ArrowRight className="ml-2 h-4 w-4" /></Button></Link>
            </div>
          </section>
        ) : null}
      </div>
    </div>
  );
}

function Fact({ label, value }: { label: string; value: string }) {
  return <div className="rounded-xl border border-white/[0.07] bg-white/[0.025] p-3.5"><p className="text-[10px] font-medium uppercase tracking-[0.12em] text-slate-600">{label}</p><p className="mt-1.5 text-sm font-medium text-slate-200">{value}</p></div>;
}

function DecisionBlock({ label, value, emphasize }: { label: string; value: string; emphasize?: boolean }) {
  return <div className={`rounded-xl border p-4 ${emphasize ? "border-cyan-400/15 bg-cyan-400/[0.05]" : "border-white/[0.07] bg-black/10"}`}><p className="text-[10px] font-medium uppercase tracking-[0.12em] text-slate-600">{label}</p><p className="mt-2 text-sm leading-6 text-slate-300">{value}</p></div>;
}

function ownerFor(scope: string) {
  if (scope === "Engineer") return "Team lead";
  if (scope === "Team") return "Engineering manager";
  if (scope === "Cost Center") return "Portfolio lead";
  return "AI platform lead";
}
