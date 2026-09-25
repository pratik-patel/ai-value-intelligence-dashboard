import { useEffect, useState, type ReactNode } from "react";
import { Link, useLocation } from "wouter";
import { Activity, BarChart3, Building2, FileSearch, Gauge, Moon, Search, Sparkles, Sun, X } from "lucide-react";

import { CommandPalette } from "@/components/CommandPalette";
import { Button } from "@/components/ui/button";
import { useDashboardScope } from "@/lib/scope-context";
import { TELEMETRY_DATA } from "@/lib/telemetry-data";

interface LayoutProps { children: ReactNode }

const navItems = [
  { href: "/", label: "Overview", icon: Gauge },
  { href: "/explorer", label: "Organization", icon: Building2 },
  { href: "/efficiency", label: "Efficiency & ROI", icon: BarChart3 },
  { href: "/recommendations", label: "Optimize", icon: Sparkles },
  { href: "/reports", label: "Evidence", icon: FileSearch },
];

const selectClass = "app-select h-8 min-w-0 rounded-lg border border-white/10 bg-[#0c1929] px-2 text-xs text-slate-300 outline-none transition-colors hover:border-white/20 focus:border-cyan-400/40";

export default function Layout({ children }: LayoutProps) {
  const [location] = useLocation();
  const scope = useDashboardScope();
  const [theme, setTheme] = useState<"dark" | "light">(() => typeof window !== "undefined" && window.localStorage.getItem("dashboard-theme") === "light" ? "light" : "dark");
  const hasScope = Boolean(scope.portfolioId || scope.teamId || scope.userId);

  useEffect(() => {
    document.documentElement.dataset.theme = theme;
    window.localStorage.setItem("dashboard-theme", theme);
  }, [theme]);

  return (
    <div className="app-shell min-h-screen bg-[#07101c] font-sans text-slate-200">
      <header className="app-header sticky top-0 z-50 border-b border-white/10 bg-[#08111f]/95 backdrop-blur-xl">
        <div className="mx-auto flex h-16 max-w-[1600px] items-center gap-8 px-5 lg:px-8">
          <Link href="/" className="flex items-center gap-3 transition-opacity hover:opacity-85">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl border border-cyan-400/30 bg-gradient-to-br from-cyan-400/20 to-blue-600/25 text-cyan-300 shadow-[0_0_24px_rgba(34,211,238,0.12)]"><Activity className="h-4 w-4" /></div>
            <div className="hidden xl:block"><div className="text-[15px] font-semibold tracking-tight text-white">AI Value Intelligence</div><div className="text-[10px] font-medium uppercase tracking-[0.16em] text-slate-500">Usage, efficiency & delivery value</div></div>
          </Link>

          <nav className="hidden items-center gap-1 lg:flex" aria-label="Primary navigation">
            {navItems.map((item) => { const Icon = item.icon; const active = item.href === "/" ? location === "/" : location.startsWith(item.href); return (
              <Link key={item.href} href={item.href}><Button variant="ghost" size="sm" className={`h-9 rounded-lg px-3 text-sm ${active ? "bg-white/10 text-white" : "text-slate-400 hover:bg-white/5 hover:text-slate-100"}`}><Icon className={`mr-2 h-4 w-4 ${active ? "text-cyan-300" : ""}`} />{item.label}</Button></Link>
            ); })}
          </nav>

          <div className="ml-auto flex items-center gap-2">
            <Button variant="outline" className="hidden h-9 w-44 justify-start border-white/10 bg-black/20 text-slate-400 hover:bg-white/5 hover:text-slate-200 xl:flex" onClick={() => document.dispatchEvent(new KeyboardEvent("keydown", { key: "k", metaKey: true }))}><Search className="mr-2 h-4 w-4" />Search<kbd className="ml-auto rounded border border-white/10 px-1.5 py-0.5 font-mono text-[10px]">⌘K</kbd></Button>
            <span className="hidden rounded-full border border-violet-400/20 bg-violet-400/10 px-3 py-1.5 text-xs font-medium text-violet-200 lg:inline-flex">Illustrative data</span>
            <button type="button" onClick={() => setTheme((value) => value === "dark" ? "light" : "dark")} className="theme-toggle flex h-9 w-9 items-center justify-center rounded-lg border border-white/10 bg-white/[0.03] text-slate-400 hover:bg-white/[0.07] hover:text-slate-100" aria-label={`Use ${theme === "dark" ? "light" : "dark"} theme`} title={`Use ${theme === "dark" ? "light" : "dark"} theme`}>{theme === "dark" ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}</button>
          </div>
        </div>

        <nav className="flex gap-1 overflow-x-auto border-t border-white/[0.06] px-4 py-2 lg:hidden" aria-label="Mobile navigation">
          {navItems.map((item) => { const Icon = item.icon; const active = item.href === "/" ? location === "/" : location.startsWith(item.href); return <Link key={item.href} href={item.href} className={`flex shrink-0 items-center gap-1.5 rounded-md px-2.5 py-1.5 text-xs ${active ? "bg-white/10 text-white" : "text-slate-400"}`}><Icon className={`h-3.5 w-3.5 ${active ? "text-cyan-300" : ""}`} />{item.label}</Link>; })}
        </nav>

        <div className="app-scopebar border-t border-white/[0.06] bg-[#0a1524]/90">
          <div className="mx-auto flex max-w-[1600px] flex-wrap items-center gap-2 px-5 py-2 lg:px-8">
            <span className="mr-1 text-[10px] font-medium uppercase tracking-[0.14em] text-slate-600">View</span>
            <select aria-label="Portfolio" className={`${selectClass} max-w-[185px]`} value={scope.portfolioId} onChange={(event) => scope.selectPortfolio(event.target.value)}><option value="">All portfolios</option>{TELEMETRY_DATA.costCenters.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}</select>
            <select aria-label="Team" className={`${selectClass} max-w-[175px]`} value={scope.teamId} onChange={(event) => scope.selectTeam(event.target.value)}><option value="">All teams</option>{scope.teams.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}</select>
            <select aria-label="User" className={`${selectClass} max-w-[170px]`} value={scope.userId} onChange={(event) => scope.selectUser(event.target.value)}><option value="">All users</option>{scope.users.map((item) => <option key={item.id} value={item.userId}>{item.name}</option>)}</select>
            {hasScope ? <button type="button" onClick={scope.clearScope} className="inline-flex h-8 items-center gap-1 rounded-lg px-2 text-xs text-slate-500 hover:bg-white/[0.05] hover:text-slate-300"><X className="h-3.5 w-3.5" />Clear</button> : null}
            <div className="ml-auto flex items-center gap-2">
              <select aria-label="Time period" className={selectClass} value={scope.period} onChange={(event) => scope.setPeriod(event.target.value as "30d" | "60d" | "90d")}><option value="30d">Last 30 days</option><option value="60d">Last 60 days</option><option value="90d">Last 90 days</option></select>
              <select aria-label="Application" className={`${selectClass} max-w-[165px]`} value={scope.application} onChange={(event) => scope.setApplication(event.target.value)}><option value="all">All applications</option>{scope.applications.map((item) => <option key={item} value={item}>{item}</option>)}</select>
            </div>
          </div>
        </div>
      </header>

      <main className="app-main min-h-[calc(100vh-109px)] bg-[radial-gradient(circle_at_top_right,rgba(14,116,144,0.08),transparent_34%),linear-gradient(180deg,#07101c_0%,#050a12_100%)]">{children}</main>
      <CommandPalette />
    </div>
  );
}
