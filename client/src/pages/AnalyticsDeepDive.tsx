import { Download, AlertTriangle, Eye, Settings2, User, GitCommit, Play, Plus, BookOpen, Clock, Activity, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, BarChart, Bar, Legend, Treemap, ScatterChart, Scatter } from "recharts";
import { MOCK_DATA } from "@/lib/mock-data";

// Custom Treemap Content to ensure text visibility
const CustomizedTreemapContent = (props: any) => {
  const { depth, x, y, width, height, name, fill, payload } = props;

  const nodeFill = fill || payload?.fill || "rgba(255,255,255,0.05)";
  const displayName = name || payload?.name;

  return (
    <g>
      <rect
        x={x}
        y={y}
        width={width}
        height={height}
        style={{
          fill: depth === 1 ? nodeFill : "transparent",
          stroke: '#0c1220',
          strokeWidth: 3,
        }}
      />
      {
        depth === 1 && width > 50 && height > 30 && displayName && displayName !== "root" && (
          <text x={x + width / 2} y={y + height / 2} textAnchor="middle" fill="#0f172a" fontSize={13} fontWeight="600">
            {displayName}
          </text>
        )
      }
    </g>
  );
};

export default function AnalyticsDeepDive() {
  const scatterData = MOCK_DATA.engineers.map(e => ({
    name: e.name,
    consumption: parseFloat(e.consumption.replace('K', '')),
    days: e.activeDays
  }));

  // Mock data for the prompt/response size vs consumption charts
  const generateSizeData = (count: number, correlation: number) => {
    return Array.from({ length: count }).map(() => {
      const size = Math.floor(Math.random() * 8000) + 1000;
      const baseConsumption = (size / 1000) * correlation;
      const variance = Math.random() * 20 - 10;
      const consumption = Math.max(1, baseConsumption + variance);
      return { size, consumption };
    });
  };

  const promptSizeData = generateSizeData(100, 4);
  const responseSizeData = generateSizeData(100, 3.5);

  const monthlyTrendData = [
    { month: '2026-04', payments: 2800, ai: 2450, platform: 2800, retail: 1100 },
    { month: '2026-05', payments: 2750, ai: 2500, platform: 2850, retail: 1550 },
  ];

  return (
    <div className="flex flex-col h-full animate-in fade-in duration-500 bg-[#0a0f18] overflow-y-auto">
      {/* Top Filter Bar - Added to match the screenshot */}
      <div className="flex items-center gap-4 px-8 py-3 border-b border-white/5 bg-[#0c1220]">
        <div className="flex items-center gap-2">
          <span className="text-slate-400 text-sm">Focus:</span>
          <div className="flex items-center gap-2 bg-white/5 px-3 py-1.5 rounded text-sm text-slate-200">
            <span className="text-slate-400">Cost Center:</span>
            <span className="font-medium">Servicing &amp; Collateral Operations</span>
            <button className="text-slate-500 hover:text-slate-300 ml-1">
              <X className="w-3 h-3" />
            </button>
          </div>
        </div>
        <Button variant="ghost" className="text-slate-400 hover:text-slate-200 h-8 px-3">
          Clear All
        </Button>
        
        <div className="ml-auto flex items-center gap-3">
          <Button variant="outline" className="bg-transparent border-white/10 text-slate-300 hover:bg-white/5 h-9">
            <Activity className="w-4 h-4 mr-2" />
            AI Advisor
          </Button>
          <Button className="bg-blue-600 hover:bg-blue-500 text-white h-9">
            <BookOpen className="w-4 h-4 mr-2" />
            Strategic Report
          </Button>
        </div>
      </div>

      <div className="p-8">
        <div className="max-w-[1600px] mx-auto space-y-12">
          
          {/* TOP SECTION: Team Contribution & Daily Consumption */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-12">
            <div className="border border-white/10 rounded-lg bg-[#0e1526] p-4 flex flex-col shadow-sm h-[320px]">
              <div className="mb-4">
                <h3 className="text-sm font-medium text-slate-200">Team Contribution</h3>
                <p className="text-slate-400 text-xs mt-1">Click a bar to scope to a team.</p>
              </div>
              <div className="flex-1 min-h-0">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={[{name: 'Seller / Servicer Experience Squad', val: 2850}]} layout="vertical" margin={{ left: 100, top: 20, bottom: 16 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" horizontal={true} vertical={false} />
                    <XAxis type="number" stroke="#cbd5e1" fontSize={10} tickLine={false} axisLine={true} tickFormatter={(v) => v === 0 ? '0' : v} domain={[0, 3000]} tickCount={5} label={{ value: "Credits", position: "insideBottom", offset: -6, fill: "#cbd5e1", fontSize: 11 }} />
                    <YAxis type="category" dataKey="name" stroke="#cbd5e1" fontSize={10} tickLine={true} axisLine={true} tickFormatter={() => 'Seller / Servicer...'} label={{ value: "Team", angle: -90, position: "insideLeft", dx: -18, fill: "#cbd5e1", fontSize: 11 }} />
                    <RechartsTooltip cursor={{fill: 'rgba(255,255,255,0.05)'}} contentStyle={{ backgroundColor: '#0f172a', borderColor: 'rgba(255,255,255,0.1)', borderRadius: '8px' }} />
                    <Bar dataKey="val" fill="#60a5fa" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            <div className="border border-white/10 rounded-lg bg-[#0e1526] p-4 flex flex-col shadow-sm h-[320px]">
              <div className="mb-4">
                <h3 className="text-sm font-medium text-slate-200">Daily AI Consumption</h3>
                <p className="text-slate-400 text-xs mt-1">Trend across the selected period for this cost center.</p>
              </div>
              <div className="flex-1 min-h-0">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={Array.from({length: 26}).map((_, i) => ({
                    date: `${(i+1).toString().padStart(2, '0')}`,
                    val: Math.floor(Math.random() * 250) + 20 + (Math.sin(i/2) * 20)
                  }))} margin={{ top: 20, bottom: 16 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} horizontal={true} />
                    <XAxis dataKey="date" stroke="#cbd5e1" fontSize={10} tickLine={true} axisLine={true} label={{ value: "Date", position: "insideBottom", offset: -6, fill: "#cbd5e1", fontSize: 11 }} />
                    <YAxis stroke="#cbd5e1" fontSize={10} tickLine={true} axisLine={true} tickCount={5} domain={[0, 280]} label={{ value: "Credits", angle: -90, position: "insideLeft", fill: "#cbd5e1", fontSize: 11 }} />
                    <RechartsTooltip contentStyle={{ backgroundColor: '#0f172a', borderColor: 'rgba(255,255,255,0.1)', borderRadius: '8px' }} />
                    <Area type="monotone" dataKey="val" stroke="#60a5fa" strokeWidth={2} fill="none" />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>

          {/* SECTION 1: Ownership & Chargeback */}
          <section>
            <div className="border-b border-white/10 pb-2 mb-6">
              <h2 className="dashboard-section-title">Who is consuming, and where is the risk?</h2>
              <p className="text-sm text-slate-400">Engineer-level distribution, outlier detection, and license hygiene watchlist for the selected scope.</p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
              {/* Active Days vs Consumption */}
              <div className="border border-white/10 rounded-lg bg-[#0e1526] p-4 flex flex-col shadow-sm h-[320px]">
                <div className="mb-4">
                  <h3 className="text-sm font-medium text-slate-200">Active Days vs AI Consumption</h3>
                  <p className="text-slate-400 text-xs mt-1">Outliers consume disproportionately for their activity level. Click a point to scope.</p>
                </div>
                <div className="flex-1 min-h-0">
                  <ResponsiveContainer width="100%" height="100%">
                    <ScatterChart margin={{ top: 10, right: 10, bottom: 16, left: 10 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
                      <XAxis type="number" dataKey="days" name="Active days" stroke="#cbd5e1" fontSize={10} tickLine={true} axisLine={true} tickCount={5} domain={[0, 20]} label={{ value: "Active days", position: "insideBottom", offset: -6, fill: "#cbd5e1", fontSize: 11 }} />
                      <YAxis type="number" dataKey="consumption" name="Credits" stroke="#cbd5e1" fontSize={10} tickLine={true} axisLine={true} tickCount={5} domain={[0, 1400]} label={{ value: "Credits", angle: -90, position: "insideLeft", fill: "#cbd5e1", fontSize: 11 }} />
                      <RechartsTooltip cursor={{ strokeDasharray: '3 3', stroke: '#cbd5e1' }} contentStyle={{ backgroundColor: '#0f172a', borderColor: 'rgba(255,255,255,0.1)', borderRadius: '8px' }} />
                      <Scatter name="Engineers" data={[
                        { days: 5, consumption: 50 },
                        { days: 12, consumption: 720 },
                        { days: 17, consumption: 900 },
                        { days: 18, consumption: 1200 }
                      ]} fill="#60a5fa" />
                    </ScatterChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* License Hygiene Watchlist */}
              <div className="border border-white/10 rounded-lg bg-[#0e1526] p-4 flex flex-col shadow-sm h-[320px]">
                <div className="mb-4">
                  <h3 className="text-sm font-medium text-slate-200">License Hygiene Watchlist</h3>
                  <p className="text-slate-400 text-xs mt-1">1 signal in scope</p>
                </div>
                <div className="flex-1 min-h-0 pt-2">
                  <div className="flex items-center justify-between border-b border-white/5 pb-4 mb-4">
                     <div className="flex items-center gap-2">
                        <span className="bg-red-500/10 text-red-400 border border-red-500/20 px-2 py-0.5 rounded text-[10px] uppercase font-medium flex items-center">
                          <AlertTriangle className="w-3 h-3 mr-1" />
                          Canceled with usage
                        </span>
                     </div>
                     <span className="text-xs text-slate-400">1 seat</span>
                  </div>
                  <div className="text-sm text-slate-300">
                    <span className="font-medium text-white">Lucy Chen</span> · Seat canceled but 26 credits used in selected period.
                  </div>
                </div>
              </div>
            </div>
            
            {/* Chargeback Detail Table */}
            <Card className="bg-[#111827] border-white/5 shadow-lg overflow-hidden">
                <CardHeader className="pb-4">
                  <CardTitle className="dashboard-card-title text-slate-200">Chargeback Detail</CardTitle>
                  <CardDescription className="text-slate-400 text-xs">Per-engineer rollup for budget allocation and review.</CardDescription>
                </CardHeader>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm text-left">
                    <thead className="text-[10px] uppercase tracking-wider text-slate-500 bg-[#0c1220]/80">
                      <tr>
                        <th className="px-6 py-3 font-medium">Engineer</th>
                        <th className="px-6 py-3 font-medium">Cost Center</th>
                        <th className="px-6 py-3 font-medium">Team</th>
                        <th className="px-6 py-3 font-medium">Tier</th>
                        <th className="px-6 py-3 font-medium">Status</th>
                        <th className="px-6 py-3 font-medium text-right">Active Days</th>
                        <th className="px-6 py-3 font-medium text-right">Messages</th>
                        <th className="px-6 py-3 font-medium text-right">Credits</th>
                        <th className="px-6 py-3 font-medium text-right">Overrun</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-white/5 text-slate-300">
                      <tr className="hover:bg-white/[0.02] transition-colors">
                        <td className="px-6 py-4 font-medium text-white">Elena Garcia</td>
                        <td className="px-6 py-4">Servicing &amp; Collateral Operations</td>
                        <td className="px-6 py-4">QA &amp; Automation Team</td>
                        <td className="px-6 py-4">Power</td>
                        <td className="px-6 py-4"><span className="text-blue-400 text-xs font-medium bg-blue-500/10 px-2 py-0.5 rounded">ACTIVE</span></td>
                        <td className="px-6 py-4 text-right">18</td>
                        <td className="px-6 py-4 text-right">2,828</td>
                        <td className="px-6 py-4 text-right">1,200</td>
                        <td className="px-6 py-4 text-right">0</td>
                      </tr>
                      <tr className="hover:bg-white/[0.02] transition-colors">
                        <td className="px-6 py-4 font-medium text-white">Victor Chen</td>
                        <td className="px-6 py-4">Servicing &amp; Collateral Operations</td>
                        <td className="px-6 py-4">QA &amp; Automation Team</td>
                        <td className="px-6 py-4">ProPlus</td>
                        <td className="px-6 py-4"><span className="text-blue-400 text-xs font-medium bg-blue-500/10 px-2 py-0.5 rounded">ACTIVE</span></td>
                        <td className="px-6 py-4 text-right">17</td>
                        <td className="px-6 py-4 text-right">2,257</td>
                        <td className="px-6 py-4 text-right">900</td>
                        <td className="px-6 py-4 text-right">0</td>
                      </tr>
                      <tr className="hover:bg-white/[0.02] transition-colors">
                        <td className="px-6 py-4 font-medium text-white">Sam Walker</td>
                        <td className="px-6 py-4">Servicing &amp; Collateral Operations</td>
                        <td className="px-6 py-4">QA &amp; Automation Team</td>
                        <td className="px-6 py-4">Pro</td>
                        <td className="px-6 py-4"><span className="text-blue-400 text-xs font-medium bg-blue-500/10 px-2 py-0.5 rounded">ACTIVE</span></td>
                        <td className="px-6 py-4 text-right">12</td>
                        <td className="px-6 py-4 text-right">1,974</td>
                        <td className="px-6 py-4 text-right">720</td>
                        <td className="px-6 py-4 text-right">0</td>
                      </tr>
                      <tr className="hover:bg-white/[0.02] transition-colors border-l-2 border-l-red-500">
                        <td className="px-6 py-4 font-medium text-white">Lucy Chen</td>
                        <td className="px-6 py-4">Servicing &amp; Collateral Operations</td>
                        <td className="px-6 py-4">QA &amp; Automation Team</td>
                        <td className="px-6 py-4">ProPlus</td>
                        <td className="px-6 py-4"><span className="text-red-400 text-xs font-medium bg-red-500/10 px-2 py-0.5 rounded">CANCELED</span></td>
                        <td className="px-6 py-4 text-right">5</td>
                        <td className="px-6 py-4 text-right">67</td>
                        <td className="px-6 py-4 text-right">26</td>
                        <td className="px-6 py-4 text-right">0</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
            </Card>
          </section>

            {/* SECTION 2: Governance & Optimization */}
          <section>
            <div className="border-b border-white/10 pb-2 mb-6">
              <h2 className="dashboard-section-title">Where credits go, and why</h2>
              <p className="text-sm text-slate-400">Model routing, use-case x model hotspots, request-source mix, plugin and MCP impact, and prompt-size outliers.</p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
              {/* Model Mix */}
              <div className="border border-white/10 rounded-lg bg-[#0e1526] p-4 flex flex-col shadow-sm h-[320px]">
                <div className="mb-4">
                  <h3 className="text-sm font-medium text-slate-200">Model Mix by Cost Center</h3>
                  <p className="text-slate-400 text-xs mt-1">Premium vs efficient routing balance per cost center.</p>
                </div>
                <div className="flex-1 min-h-0">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={MOCK_DATA.clientMix} maxBarSize={60} margin={{ bottom: 20 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
                      <XAxis dataKey="name" stroke="#cbd5e1" fontSize={10} tickLine={false} axisLine={false} tickFormatter={(val) => val.split(' ')[0]} label={{ value: "Cost center", position: "insideBottom", offset: -6, fill: "#cbd5e1", fontSize: 11 }} />
                      <YAxis stroke="#cbd5e1" fontSize={10} tickLine={false} axisLine={false} label={{ value: "Model volume", angle: -90, position: "insideLeft", fill: "#cbd5e1", fontSize: 11 }} />
                      <RechartsTooltip contentStyle={{ backgroundColor: '#0f172a', borderColor: 'rgba(255,255,255,0.1)', borderRadius: '8px' }} />
                      <Legend iconType="square" wrapperStyle={{ fontSize: '10px', bottom: -10 }} />
                      <Bar dataKey="ide" stackId="a" fill="#eab308" name="Auto" />
                      <Bar dataKey="cli" stackId="a" fill="#60a5fa" name="Claude Opus 4.6" />
                      <Bar dataKey="plugin" stackId="a" fill="#a855f7" name="Claude Sonnet 4.6" />
                      <Bar dataKey="ide" stackId="a" fill="#34d399" name="DeepSeek V3.2" />
                      <Bar dataKey="cli" stackId="a" fill="#4ade80" name="Qwen 2 Coder Next" />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* Source Mix */}
              <div className="border border-white/10 rounded-lg bg-[#0e1526] p-4 flex flex-col shadow-sm h-[320px]">
                <div className="mb-4">
                  <h3 className="text-sm font-medium text-slate-200">AI Consumption by Interaction Source</h3>
                  <p className="text-slate-400 text-xs mt-1">Where requests originate — chat, spec, plugin action, hook, etc.</p>
                </div>
                <div className="flex-1 min-h-0">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={[
                      { name: 'chat', val: 780 },
                      { name: 'ui-chat', val: 560 },
                      { name: 'mcp-tool', val: 420 },
                      { name: 'inline', val: 390 }
                    ]} layout="vertical" barSize={24} margin={{ left: 20, bottom: 16 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" horizontal={false} vertical={true} />
                      <XAxis type="number" stroke="#cbd5e1" fontSize={10} tickLine={false} axisLine={false} label={{ value: "Credits", position: "insideBottom", offset: -6, fill: "#cbd5e1", fontSize: 11 }} />
                      <YAxis type="category" dataKey="name" stroke="#cbd5e1" fontSize={10} tickLine={false} axisLine={false} label={{ value: "Source", angle: -90, position: "insideLeft", fill: "#cbd5e1", fontSize: 11 }} />
                      <RechartsTooltip contentStyle={{ backgroundColor: '#0f172a', borderColor: 'rgba(255,255,255,0.1)', borderRadius: '8px' }} cursor={{fill: 'rgba(255,255,255,0.05)'}} />
                      <Bar dataKey="val" fill="#60a5fa" radius={[0, 4, 4, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>

            {/* Heatmap */}
            <div className="border border-white/10 rounded-lg bg-[#0e1526] p-4 flex flex-col shadow-sm mb-6">
                <div className="mb-4">
                  <h3 className="text-sm font-medium text-slate-200">Use Case × Model Heatmap</h3>
                  <p className="text-slate-400 text-xs mt-1">Most expensive workflow/model combinations. Darker = higher credits.</p>
                </div>
                <div className="flex-1 min-h-0 overflow-x-auto">
                   <table className="w-full text-sm text-left border-collapse">
                      <thead className="text-[10px] uppercase tracking-wider text-slate-500 border-b border-white/10">
                        <tr>
                          <th className="py-3 font-medium w-1/4">Use Case / Model →</th>
                          <th className="py-3 font-medium text-center">Auto</th>
                          <th className="py-3 font-medium text-center">Opus 4.6</th>
                          <th className="py-3 font-medium text-center">Sonnet 4.6</th>
                          <th className="py-3 font-medium text-center">DS V3.2</th>
                          <th className="py-3 font-medium text-center">Qwen Coder Next</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-white/5 text-slate-300">
                        <tr>
                          <td className="py-3 font-medium text-xs">platform-hardening</td>
                          <td className="py-2 px-1 text-center"><div className="bg-blue-600/90 text-white text-xs py-1.5 rounded">747.9</div></td>
                          <td className="py-2 px-1 text-center"><div className="bg-blue-600/30 text-white text-xs py-1.5 rounded">125.1</div></td>
                          <td className="py-2 px-1 text-center"><div className="bg-blue-600/70 text-white text-xs py-1.5 rounded">590.2</div></td>
                          <td className="py-2 px-1 text-center"><div className="bg-blue-600/30 text-white text-xs py-1.5 rounded">117.5</div></td>
                          <td className="py-2 px-1 text-center"><div className="bg-blue-600/30 text-white text-xs py-1.5 rounded">119.8</div></td>
                        </tr>
                      </tbody>
                   </table>
                   <div className="flex items-center gap-2 mt-4 text-[10px] text-slate-500 uppercase">
                     <span>Low</span>
                     <div className="w-32 h-1.5 bg-gradient-to-r from-blue-600/20 to-blue-600/90 rounded-full"></div>
                     <span>High (Credits)</span>
                   </div>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
              {/* Plugin Impact */}
              <div className="border border-white/10 rounded-lg bg-[#0e1526] p-4 flex flex-col shadow-sm">
                <div className="mb-4">
                  <h3 className="text-sm font-medium text-slate-200">Plugin Usage Impact</h3>
                  <p className="text-slate-400 text-xs mt-1">Ranked named plugins. "Direct Assistant" shown as metadata only.</p>
                </div>
                <div className="flex-1 min-h-0 space-y-4">
                  <div>
                    <div className="flex justify-between text-xs mb-1">
                      <span className="text-slate-200 font-medium">Knowledge Search</span>
                      <span className="text-slate-400">446.8 cr · 25%</span>
                    </div>
                    <div className="w-full bg-slate-800 h-1.5 rounded-full overflow-hidden">
                      <div className="bg-blue-500 h-full w-[25%] rounded-full"></div>
                    </div>
                  </div>
                  <div>
                    <div className="flex justify-between text-xs mb-1">
                      <span className="text-slate-200 font-medium">GitHub</span>
                      <span className="text-slate-400">378.6 cr · 22%</span>
                    </div>
                    <div className="w-full bg-slate-800 h-1.5 rounded-full overflow-hidden">
                      <div className="bg-blue-500 h-full w-[22%] rounded-full"></div>
                    </div>
                  </div>
                  <div className="pt-4 border-t border-white/5 mt-4">
                     <div className="text-[10px] uppercase text-slate-500 font-medium mb-2">Metadata - Not Ranked</div>
                     <div className="text-xs text-slate-400">Direct Assistant <span className="text-slate-500">(912.5 cr)</span></div>
                  </div>
                </div>
              </div>

              {/* MCP Impact */}
              <div className="border border-white/10 rounded-lg bg-[#0e1526] p-4 flex flex-col shadow-sm">
                <div className="mb-4">
                  <h3 className="text-sm font-medium text-slate-200">MCP Usage Impact</h3>
                  <p className="text-slate-400 text-xs mt-1">Ranked named MCP servers. "No MCP Invoked" shown as metadata only.</p>
                </div>
                <div className="flex-1 min-h-0 space-y-4">
                  <div>
                    <div className="flex justify-between text-xs mb-1">
                      <span className="text-slate-200 font-medium">knowledge-search</span>
                      <span className="text-slate-400">459.5 cr · 26%</span>
                    </div>
                    <div className="w-full bg-slate-800 h-1.5 rounded-full overflow-hidden">
                      <div className="bg-blue-500 h-full w-[26%] rounded-full"></div>
                    </div>
                  </div>
                  <div>
                    <div className="flex justify-between text-xs mb-1">
                      <span className="text-slate-200 font-medium">github</span>
                      <span className="text-slate-400">423 cr · 24%</span>
                    </div>
                    <div className="w-full bg-slate-800 h-1.5 rounded-full overflow-hidden">
                      <div className="bg-blue-500 h-full w-[24%] rounded-full"></div>
                    </div>
                  </div>
                  <div className="pt-4 border-t border-white/5 mt-4">
                     <div className="text-[10px] uppercase text-slate-500 font-medium mb-2">Metadata - Not Ranked</div>
                     <div className="text-xs text-slate-400">No MCP Invoked <span className="text-slate-500">(889.4 cr)</span></div>
                  </div>
                </div>
              </div>
            </div>

             <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
              {/* Prompt chars vs Consumption */}
              <div className="border border-white/10 rounded-lg bg-[#0e1526] p-4 flex flex-col shadow-sm h-[320px]">
                <div className="mb-4">
                  <h3 className="text-sm font-medium text-slate-200">Prompt Chars vs AI Consumption</h3>
                  <p className="text-slate-400 text-xs mt-1">Outliers in the upper-right are prompt-size driven expensive calls.</p>
                </div>
                <div className="flex-1 min-h-0">
                  <ResponsiveContainer width="100%" height="100%">
                    <ScatterChart margin={{ top: 10, right: 10, bottom: 16, left: 10 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                      <XAxis type="number" dataKey="size" name="Prompt chars" stroke="#cbd5e1" fontSize={10} tickLine={false} axisLine={true} label={{ value: "Prompt chars", position: "insideBottom", offset: -6, fill: "#cbd5e1", fontSize: 11 }} />
                      <YAxis type="number" dataKey="consumption" name="Credits" stroke="#cbd5e1" fontSize={10} tickLine={false} axisLine={true} label={{ value: "Credits", angle: -90, position: "insideLeft", fill: "#cbd5e1", fontSize: 11 }} />
                      <RechartsTooltip cursor={{ strokeDasharray: '3 3', stroke: '#cbd5e1' }} contentStyle={{ backgroundColor: '#0f172a', borderColor: 'rgba(255,255,255,0.1)', borderRadius: '8px' }} />
                      <Scatter data={promptSizeData} fill="#34d399" opacity={0.6} />
                    </ScatterChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* Response chars vs Consumption */}
              <div className="border border-white/10 rounded-lg bg-[#0e1526] p-4 flex flex-col shadow-sm h-[320px]">
                <div className="mb-4">
                  <h3 className="text-sm font-medium text-slate-200">Response Chars vs AI Consumption</h3>
                  <p className="text-slate-400 text-xs mt-1">Outliers in the upper-right indicate verbose or interupted workflows.</p>
                </div>
                <div className="flex-1 min-h-0">
                  <ResponsiveContainer width="100%" height="100%">
                    <ScatterChart margin={{ top: 10, right: 10, bottom: 16, left: 10 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                      <XAxis type="number" dataKey="size" name="Response chars" stroke="#cbd5e1" fontSize={10} tickLine={false} axisLine={true} label={{ value: "Response chars", position: "insideBottom", offset: -6, fill: "#cbd5e1", fontSize: 11 }} />
                      <YAxis type="number" dataKey="consumption" name="Credits" stroke="#cbd5e1" fontSize={10} tickLine={false} axisLine={true} label={{ value: "Credits", angle: -90, position: "insideLeft", fill: "#cbd5e1", fontSize: 11 }} />
                      <RechartsTooltip cursor={{ strokeDasharray: '3 3', stroke: '#cbd5e1' }} contentStyle={{ backgroundColor: '#0f172a', borderColor: 'rgba(255,255,255,0.1)', borderRadius: '8px' }} />
                      <Scatter data={responseSizeData} fill="#34d399" opacity={0.6} />
                    </ScatterChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>

            {/* High Cost Interactions Table */}
            <div className="border border-white/10 rounded-lg bg-[#0e1526] shadow-sm overflow-hidden mb-6">
                <div className="p-4 border-b border-white/10">
                  <h3 className="text-sm font-medium text-slate-200">High-Cost Interactions</h3>
                  <p className="text-slate-400 text-xs mt-1">Click any row to inspect prompt evidence. Surfaced rows always reveal evidence.</p>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm text-left">
                    <thead className="text-[10px] uppercase tracking-wider text-slate-500 bg-[#0c1220]/80 border-b border-white/10">
                      <tr>
                        <th className="px-6 py-3 font-medium">Request</th>
                        <th className="px-6 py-3 font-medium">Engineer</th>
                        <th className="px-6 py-3 font-medium">Use Case</th>
                        <th className="px-6 py-3 font-medium">Model</th>
                        <th className="px-6 py-3 font-medium">Plugin</th>
                        <th className="px-6 py-3 font-medium">MCP</th>
                        <th className="px-6 py-3 font-medium text-center">Evidence</th>
                        <th className="px-6 py-3 font-medium text-right">Credits</th>
                        <th className="px-6 py-3 font-medium"></th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-white/5 text-slate-300">
                      <tr className="hover:bg-white/[0.02] transition-colors cursor-pointer group">
                        <td className="px-6 py-4">
                          <div className="font-medium text-white font-mono text-xs">req-02cfc857f13f</div>
                          <div className="text-[10px] text-slate-500 font-mono mt-1">conv-996f54b983</div>
                        </td>
                        <td className="px-6 py-4">Sam Walker</td>
                        <td className="px-6 py-4 text-slate-400">platform-hardening</td>
                        <td className="px-6 py-4 text-slate-400">DeepSeek V3.2</td>
                        <td className="px-6 py-4 text-slate-400">GitHub</td>
                        <td className="px-6 py-4 text-slate-400">github</td>
                        <td className="px-6 py-4">
                           <div className="flex items-center justify-center gap-2 text-slate-400 bg-white/5 rounded px-2 py-1 w-fit mx-auto border border-white/5">
                             <div className="flex items-center gap-1"><BookOpen className="w-3 h-3 text-slate-500" /> <span className="text-xs">2</span></div>
                             <div className="flex items-center gap-1"><Settings2 className="w-3 h-3 text-slate-500" /> <span className="text-xs">1</span></div>
                           </div>
                        </td>
                        <td className="px-6 py-4 text-right font-medium text-white">39.3</td>
                        <td className="px-6 py-4 text-right">
                           <span className="text-blue-400 text-xs font-medium opacity-0 group-hover:opacity-100 transition-opacity">Inspect</span>
                        </td>
                      </tr>
                      <tr className="hover:bg-white/[0.02] transition-colors cursor-pointer group">
                        <td className="px-6 py-4">
                          <div className="font-medium text-white font-mono text-xs">req-4b92f2b245f7</div>
                          <div className="text-[10px] text-slate-500 font-mono mt-1">conv-35e4b4e418</div>
                        </td>
                        <td className="px-6 py-4">Sam Walker</td>
                        <td className="px-6 py-4 text-slate-400">platform-hardening</td>
                        <td className="px-6 py-4 text-slate-400">Claude Sonnet 4.6</td>
                        <td className="px-6 py-4 text-slate-400">Direct Assistant</td>
                        <td className="px-6 py-4 text-slate-400">No MCP</td>
                        <td className="px-6 py-4">
                           <div className="flex items-center justify-center gap-2 text-slate-400 bg-white/5 rounded px-2 py-1 w-fit mx-auto border border-white/5">
                             <div className="flex items-center gap-1"><BookOpen className="w-3 h-3 text-slate-500" /> <span className="text-xs">1</span></div>
                             <div className="flex items-center gap-1"><Settings2 className="w-3 h-3 text-slate-500" /> <span className="text-xs">1</span></div>
                           </div>
                        </td>
                        <td className="px-6 py-4 text-right font-medium text-white">30.9</td>
                        <td className="px-6 py-4 text-right">
                           <span className="text-blue-400 text-xs font-medium opacity-0 group-hover:opacity-100 transition-opacity">Inspect</span>
                        </td>
                      </tr>
                      <tr className="hover:bg-white/[0.02] transition-colors cursor-pointer group">
                        <td className="px-6 py-4">
                          <div className="font-medium text-white font-mono text-xs">req-46a249637fbf</div>
                          <div className="text-[10px] text-slate-500 font-mono mt-1">conv-996f54b983</div>
                        </td>
                        <td className="px-6 py-4">Sam Walker</td>
                        <td className="px-6 py-4 text-slate-400">platform-hardening</td>
                        <td className="px-6 py-4 text-slate-400">Auto</td>
                        <td className="px-6 py-4 text-slate-400">Direct Assistant</td>
                        <td className="px-6 py-4 text-slate-400">knowledge-search</td>
                        <td className="px-6 py-4">
                           <div className="flex items-center justify-center gap-2 text-slate-400 bg-white/5 rounded px-2 py-1 w-fit mx-auto border border-white/5">
                             <div className="flex items-center gap-1"><BookOpen className="w-3 h-3 text-slate-500" /> <span className="text-xs">2</span></div>
                             <div className="flex items-center gap-1"><Settings2 className="w-3 h-3 text-slate-500" /> <span className="text-xs">1</span></div>
                           </div>
                        </td>
                        <td className="px-6 py-4 text-right font-medium text-white">29.8</td>
                        <td className="px-6 py-4 text-right">
                           <span className="text-blue-400 text-xs font-medium opacity-0 group-hover:opacity-100 transition-opacity">Inspect</span>
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>
            </div>
          </section>

        </div>
      </div>
    </div>
  );
}
