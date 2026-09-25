import { ReactNode } from "react";
import { Link, useLocation } from "wouter";
import {
  Activity,
  BarChart3,
  Building2,
  CalendarDays,
  ChevronDown,
  FileSearch,
  Gauge,
  Search,
  Sparkles,
} from "lucide-react";

import { CommandPalette } from "@/components/CommandPalette";
import { Button } from "@/components/ui/button";
import { TELEMETRY_DATA } from "@/lib/telemetry-data";

interface LayoutProps {
  children: ReactNode;
}

const navItems = [
  { href: "/", label: "Overview", icon: Gauge },
  { href: "/explorer", label: "Organization", icon: Building2 },
  { href: "/efficiency", label: "Efficiency & ROI", icon: BarChart3 },
  { href: "/recommendations", label: "Optimize", icon: Sparkles },
  { href: "/reports", label: "Evidence", icon: FileSearch },
];

export default function Layout({ children }: LayoutProps) {
  const [location] = useLocation();

  return (
    <div className="min-h-screen bg-[#07101c] text-slate-200 font-sans">
      <header className="sticky top-0 z-50 border-b border-white/10 bg-[#08111f]/95 backdrop-blur-xl">
        <div className="mx-auto flex h-16 max-w-[1600px] items-center gap-8 px-5 lg:px-8">
          <Link href="/" className="flex items-center gap-3 transition-opacity hover:opacity-85">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl border border-cyan-400/30 bg-gradient-to-br from-cyan-400/20 to-blue-600/25 text-cyan-300 shadow-[0_0_24px_rgba(34,211,238,0.12)]">
              <Activity className="h-4 w-4" />
            </div>
            <div className="hidden sm:block">
              <div className="text-[15px] font-semibold tracking-tight text-white">AI Value Intelligence</div>
              <div className="text-[10px] font-medium uppercase tracking-[0.16em] text-slate-500">Token, cost & delivery analytics</div>
            </div>
          </Link>

          <nav className="hidden items-center gap-1 md:flex" aria-label="Primary navigation">
            {navItems.map((item) => {
              const Icon = item.icon;
              const active = item.href === "/" ? location === "/" : location.startsWith(item.href);
              return (
                <Link key={item.href} href={item.href}>
                  <Button
                    variant="ghost"
                    size="sm"
                    className={`h-9 rounded-lg px-3 text-sm ${
                      active
                        ? "bg-white/10 text-white"
                        : "text-slate-400 hover:bg-white/5 hover:text-slate-100"
                    }`}
                  >
                    <Icon className={`mr-2 h-4 w-4 ${active ? "text-cyan-300" : ""}`} />
                    {item.label}
                  </Button>
                </Link>
              );
            })}
          </nav>

          <div className="ml-auto flex items-center gap-2">
            <Button
              variant="outline"
              className="hidden h-9 w-48 justify-start border-white/10 bg-black/20 text-slate-400 hover:bg-white/5 hover:text-slate-200 xl:flex"
              onClick={() => document.dispatchEvent(new KeyboardEvent("keydown", { key: "k", metaKey: true }))}
            >
              <Search className="mr-2 h-4 w-4" />
              Search
              <kbd className="ml-auto rounded border border-white/10 px-1.5 py-0.5 font-mono text-[10px]">⌘K</kbd>
            </Button>
            <span className="hidden rounded-full border border-emerald-400/20 bg-emerald-400/10 px-3 py-1.5 text-xs font-medium text-emerald-200 lg:inline-flex">
              Sample data · {TELEMETRY_DATA.meta.freshness.replace("Last updated: ", "")}
            </span>
            <Search className="h-4 w-4 text-slate-500 md:hidden" />
          </div>
        </div>

        <nav className="flex gap-1 overflow-x-auto border-t border-white/[0.06] px-4 py-2 md:hidden" aria-label="Mobile navigation">
          {navItems.map((item) => {
            const Icon = item.icon;
            const active = item.href === "/" ? location === "/" : location.startsWith(item.href);
            return (
              <Link key={item.href} href={item.href} className={`flex shrink-0 items-center gap-1.5 rounded-md px-2.5 py-1.5 text-xs ${active ? "bg-white/10 text-white" : "text-slate-400"}`}>
                <Icon className={`h-3.5 w-3.5 ${active ? "text-cyan-300" : ""}`} />{item.label}
              </Link>
            );
          })}
        </nav>

        <div className="border-t border-white/[0.06] bg-[#0a1524]/80">
          <div className="mx-auto flex h-11 max-w-[1600px] items-center gap-2 overflow-x-auto px-5 text-xs lg:px-8">
            <span className="mr-1 whitespace-nowrap text-slate-500">Viewing</span>
            <ContextPill icon={Building2} label="Enterprise" />
            <ContextPill icon={CalendarDays} label="Last 30 days" />
            <ContextPill icon={Activity} label="All applications" />
            <span className="ml-auto hidden whitespace-nowrap text-slate-500 lg:inline">Coverage 86% · Estimated usage units</span>
          </div>
        </div>
      </header>

      <main className="min-h-[calc(100vh-109px)] bg-[radial-gradient(circle_at_top_right,rgba(14,116,144,0.08),transparent_34%),linear-gradient(180deg,#07101c_0%,#050a12_100%)]">
        {children}
      </main>
      <CommandPalette />
    </div>
  );
}

function ContextPill({ icon: Icon, label }: { icon: typeof Activity; label: string }) {
  return (
    <button className="inline-flex h-7 items-center gap-1.5 whitespace-nowrap rounded-md border border-white/10 bg-white/[0.04] px-2.5 text-slate-300 transition-colors hover:bg-white/[0.07]">
      <Icon className="h-3.5 w-3.5 text-slate-500" />
      {label}
      <ChevronDown className="h-3 w-3 text-slate-600" />
    </button>
  );
}
