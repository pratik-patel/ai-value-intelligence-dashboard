import { useMemo, useState } from "react";
import { ExternalLink, FileText, Search } from "lucide-react";
import { Link } from "wouter";

import { Badge } from "@/components/ui/badge";
import { getScopedInteractions, useDashboardScope } from "@/lib/scope-context";
import { TELEMETRY_DATA, formatConsumption } from "@/lib/telemetry-data";

type View = "traces" | "reports";

export default function ReportEvidenceConsole() {
  const scope = useDashboardScope();
  const [view, setView] = useState<View>("traces");
  const [query, setQuery] = useState("");
  const scopedInteractions = getScopedInteractions(scope);
  const traces = useMemo(() => {
    const term = query.trim().toLowerCase();
    return scopedInteractions
      .filter((item) => !term || [item.id, item.engineerName, item.useCaseLabel, item.modelName, item.pluginName].some((value) => value.toLowerCase().includes(term)))
      .sort((a, b) => b.estimatedCredits - a.estimatedCredits)
      .slice(0, 25);
  }, [query, scopedInteractions]);

  return (
    <div className="mx-auto max-w-[1440px] space-y-5 px-5 py-7 lg:px-8">
      <header className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div><p className="text-xs font-medium uppercase tracking-[0.16em] text-cyan-300">Evidence</p><h1 className="mt-1 text-2xl font-semibold text-white">Trace and report library</h1><p className="mt-1 text-xs text-slate-500">Filtered by the global organization, period and application controls.</p></div>
        <div className="flex w-fit gap-1 rounded-lg border border-white/10 bg-[#0b1625] p-1">
          <button onClick={() => setView("traces")} className={`rounded-md px-3 py-1.5 text-xs ${view === "traces" ? "bg-white/10 text-white" : "text-slate-500"}`}>Traces</button>
          <button onClick={() => setView("reports")} className={`rounded-md px-3 py-1.5 text-xs ${view === "reports" ? "bg-white/10 text-white" : "text-slate-500"}`}>Reports</button>
        </div>
      </header>

      {view === "traces" ? (
        <section className="rounded-2xl border border-white/10 bg-[#0b1625]/82 p-4 lg:p-5">
          <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="relative max-w-md flex-1"><Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-600" /><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search user, model, use case, plugin…" className="h-9 w-full rounded-lg border border-white/10 bg-black/20 pl-9 pr-3 text-xs text-slate-200 outline-none placeholder:text-slate-600 focus:border-cyan-400/30" /></div>
            <div className="flex items-center gap-2 text-[11px] text-slate-500"><Badge variant="outline" className="border-emerald-400/20 text-emerald-300">Observed</Badge>{traces.length} shown</div>
          </div>
          <div className="overflow-x-auto rounded-xl border border-white/[0.07]">
            <table className="w-full min-w-[850px] text-left text-xs">
              <thead className="bg-black/20 text-[10px] uppercase tracking-[0.12em] text-slate-600"><tr><th className="px-4 py-3">Time</th><th className="px-4 py-3">User</th><th className="px-4 py-3">Use case</th><th className="px-4 py-3">Model</th><th className="px-4 py-3">Workflow</th><th className="px-4 py-3 text-right">Usage</th><th className="px-4 py-3"></th></tr></thead>
              <tbody className="divide-y divide-white/[0.06]">
                {traces.map((item) => (
                  <tr key={item.id} className="text-slate-400 hover:bg-white/[0.025]"><td className="px-4 py-3.5 whitespace-nowrap">{new Date(item.timestamp).toLocaleDateString("en-US", { month: "short", day: "numeric" })}</td><td className="px-4 py-3.5 font-medium text-slate-200">{item.engineerName}</td><td className="px-4 py-3.5">{item.useCaseLabel}</td><td className="px-4 py-3.5">{item.modelName.replaceAll("_", " ")}</td><td className="px-4 py-3.5">{item.agentPattern !== "None" ? item.agentPattern : item.pluginName}</td><td className="px-4 py-3.5 text-right">{formatConsumption(item.estimatedCredits)}</td><td className="px-4 py-3.5 text-right"><Link href={`/detail/interaction/${item.id}`} className="text-cyan-300"><ExternalLink className="h-3.5 w-3.5" /></Link></td></tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      ) : (
        <section className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
          {TELEMETRY_DATA.reports.map((report) => (
            <article key={report.id} className="rounded-2xl border border-white/10 bg-[#0b1625]/82 p-5"><div className="flex items-start justify-between gap-3"><div className="flex h-9 w-9 items-center justify-center rounded-lg bg-cyan-400/10 text-cyan-300"><FileText className="h-4 w-4" /></div><Badge variant="outline" className="border-white/10 text-slate-500">{report.status}</Badge></div><h2 className="mt-4 text-sm font-semibold text-slate-100">{report.title}</h2><p className="mt-1 text-[11px] text-slate-500">{report.scopeLabel} · {report.audience}</p><p className="mt-4 line-clamp-3 text-xs leading-5 text-slate-400">{report.executiveSummary}</p><p className="mt-4 text-[10px] text-slate-600">{report.generatedAt}</p></article>
          ))}
        </section>
      )}
    </div>
  );
}
