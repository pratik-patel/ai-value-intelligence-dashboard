import { useEffect, useMemo, useState } from "react";
import { ArrowRight, BarChart3, CheckCircle2, ExternalLink, Eye, PlayCircle, Sparkles, Target, Zap } from "lucide-react";
import { Link } from "wouter";
import { Bar, BarChart, Cell, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";

import { EvidenceDrawer } from "@/components/EvidenceDrawer";
import { ExperienceHeader } from "@/components/experience/ExperienceHeader";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { TELEMETRY_DATA, formatConsumption, getInteractionById } from "@/lib/telemetry-data";
import type { AdvisorRun, InteractionSummary, Recommendation } from "@/lib/telemetry-data";

const severityStyles = {
  High: "bg-red-500/10 text-red-300 border-red-500/20",
  Medium: "bg-amber-500/10 text-amber-300 border-amber-500/20",
  Low: "bg-blue-500/10 text-blue-300 border-blue-500/20",
} as const;

const severityOrder = {
  High: 0,
  Medium: 1,
  Low: 2,
} as const;

const severityMeta = {
  High: {
    label: "Leadership",
    accent: "border-red-500/20 bg-red-500/10 text-red-200",
    muted: "text-red-200",
  },
  Medium: {
    label: "Program",
    accent: "border-amber-500/20 bg-amber-500/10 text-amber-200",
    muted: "text-amber-200",
  },
  Low: {
    label: "Background",
    accent: "border-blue-500/20 bg-blue-500/10 text-blue-200",
    muted: "text-blue-200",
  },
} as const;

const recommendationClusters: Array<{
  key: string;
  label: string;
  description: string;
  types: Recommendation["type"][];
  accent: string;
}> = [
  {
    key: "policy",
    label: "Policy",
    description: "Model, prompt, and steering adjustments.",
    types: ["Model Routing", "Prompt Discipline", "Steering Scope"],
    accent: "border-blue-500/18 bg-blue-500/10 text-blue-200",
  },
  {
    key: "workflow",
    label: "Workflow",
    description: "Behavior, delivery, and coaching actions.",
    types: ["Use Case Optimization", "Team Coaching"],
    accent: "border-teal-500/18 bg-teal-500/10 text-teal-200",
  },
  {
    key: "controls",
    label: "Controls",
    description: "Plugin and MCP governance decisions.",
    types: ["Plugin Governance", "MCP Governance"],
    accent: "border-violet-500/18 bg-violet-500/10 text-violet-200",
  },
  {
    key: "spend",
    label: "Spend",
    description: "Overrun, concentration, and license actions.",
    types: ["Spend Concentration", "Overrun Risk", "License Hygiene"],
    accent: "border-amber-500/18 bg-amber-500/10 text-amber-200",
  },
] as const;

type RecommendationInsight = {
  recommendation: Recommendation;
  evidence: InteractionSummary[];
  scopeExposure: number;
  overrunExposure: number;
  proofCredits: number;
  confidence: "High" | "Medium" | "Low";
  owner: string;
  horizon: string;
  nextStep: string;
  proofSummary: string;
  scopeSummary: string;
  priorityScore: number;
  relevantRuns: AdvisorRun[];
};

type RecommendationsUrlState = {
  recId: string | null;
  evidenceId: string | null;
};

const RECOMMENDATIONS_ROUTE_EVENT = "recommendations:route-change";

export default function Recommendations() {
  const recommendationInsights = useMemo(
    () =>
      [...TELEMETRY_DATA.recommendations]
        .map((recommendation) => deriveRecommendationInsight(recommendation))
        .sort((left, right) => {
          const severityDelta = severityOrder[left.recommendation.severity] - severityOrder[right.recommendation.severity];
          if (severityDelta !== 0) return severityDelta;
          return right.priorityScore - left.priorityScore;
        }),
    [],
  );
  const insightById = useMemo(
    () => new Map(recommendationInsights.map((insight) => [insight.recommendation.id, insight])),
    [recommendationInsights],
  );

  const [routeState, setRouteState] = useState<RecommendationsUrlState>(() => parseRecommendationsUrlState());
  const selectedRecommendationId = routeState.recId ?? recommendationInsights[0]?.recommendation.id ?? "";
  const evidenceInteractionId = routeState.evidenceId;

  const selectedInsight =
    insightById.get(selectedRecommendationId) ?? recommendationInsights[0];
  const selectedRecommendation = selectedInsight?.recommendation;
  const selectedEvidence =
    selectedInsight?.evidence.find((interaction) => interaction.id === evidenceInteractionId) ?? null;

  useEffect(() => {
    if (typeof window === "undefined") return undefined;

    const syncRouteState = () => {
      setRouteState(parseRecommendationsUrlState());
    };

    window.addEventListener("popstate", syncRouteState);
    window.addEventListener(RECOMMENDATIONS_ROUTE_EVENT, syncRouteState);

    return () => {
      window.removeEventListener("popstate", syncRouteState);
      window.removeEventListener(RECOMMENDATIONS_ROUTE_EVENT, syncRouteState);
    };
  }, []);

  useEffect(() => {
    if (!recommendationInsights[0]) return;
    if (!routeState.recId || !insightById.has(routeState.recId)) {
      navigateRecommendationsState({
        recId: recommendationInsights[0].recommendation.id,
        evidenceId: routeState.evidenceId,
        replace: true,
      });
    }
  }, [insightById, recommendationInsights, routeState.evidenceId, routeState.recId]);

  useEffect(() => {
    if (!routeState.evidenceId || !selectedInsight) return;
    if (!selectedEvidence) {
      navigateRecommendationsState({
        recId: selectedInsight.recommendation.id,
        replace: true,
      });
    }
  }, [routeState.evidenceId, selectedEvidence, selectedInsight]);

  const selectRecommendation = (recommendationId: string) => {
    navigateRecommendationsState({
      recId: recommendationId,
      replace: true,
    });
  };

  const openEvidence = (interactionId: string) => {
    if (!selectedInsight) return;
    navigateRecommendationsState({
      recId: selectedInsight.recommendation.id,
      evidenceId: interactionId,
      replace: false,
    });
  };

  const closeEvidence = () => {
    if (!selectedInsight) return;
    navigateRecommendationsState({
      recId: selectedInsight.recommendation.id,
      replace: true,
    });
  };

  const recommendationLandscape = useMemo(
    () =>
      recommendationClusters.map((cluster) => ({
        ...cluster,
        total: recommendationInsights.filter((insight) => cluster.types.includes(insight.recommendation.type)).length,
        rows: (["High", "Medium", "Low"] as const).map((severity) => ({
          severity,
          items: recommendationInsights.filter(
            (insight) =>
              insight.recommendation.severity === severity && cluster.types.includes(insight.recommendation.type),
          ),
        })),
      })),
    [recommendationInsights],
  );
  const ownerGroups = useMemo(() => {
    const groups = new Map<string, RecommendationInsight[]>();

    for (const insight of recommendationInsights) {
      const bucket = groups.get(insight.owner) ?? [];
      bucket.push(insight);
      groups.set(insight.owner, bucket);
    }

    return Array.from(groups.entries())
      .map(([owner, items]: [string, RecommendationInsight[]]) => ({
        owner,
        items: items.sort((left: RecommendationInsight, right: RecommendationInsight) => right.priorityScore - left.priorityScore),
      }))
      .sort((left, right) => right.items.length - left.items.length || left.owner.localeCompare(right.owner));
  }, [recommendationInsights]);

  const totalEvidenceLinks = useMemo(
    () => recommendationInsights.reduce((sum, insight) => sum + insight.evidence.length, 0),
    [recommendationInsights],
  );
  const maxEvidenceLinks = recommendationInsights.reduce((max, insight) => Math.max(max, insight.evidence.length), 0);
  const primaryEvidence = selectedInsight?.evidence[0] ?? null;
  const highSeverityCount = recommendationInsights.filter((insight) => insight.recommendation.severity === "High").length;
  const priorityChartData = useMemo(
    () =>
      [...recommendationInsights]
        .sort((left, right) => right.priorityScore - left.priorityScore)
        .slice(0, 8)
        .map((insight) => ({
          id: insight.recommendation.id,
          label: insight.recommendation.title,
          shortLabel: truncateLabel(insight.recommendation.title, 28),
          score: insight.priorityScore,
          severity: insight.recommendation.severity,
          scopeLabel: insight.recommendation.scopeLabel,
        })),
    [recommendationInsights],
  );
  const severityMix = useMemo(
    () =>
      (["High", "Medium", "Low"] as const).map((severity) => ({
        name: severityMeta[severity].label,
        value: recommendationInsights.filter((insight) => insight.recommendation.severity === severity).length,
        severity,
      })),
    [recommendationInsights],
  );
  const headerStats = [
    {
      label: "Decision Queue",
      value: `${recommendationInsights.length} actions`,
      note: `${highSeverityCount} items are in leadership focus right now.`,
    },
    {
      label: "Scope Credits",
      value: `${formatConsumption(selectedInsight?.scopeExposure ?? 0)} credits`,
      note: selectedInsight ? `${selectedInsight.owner} owns the next move for the active recommendation.` : "Select a recommendation to inspect scope exposure.",
    },
    {
      label: "Linked Traces",
      value: `${totalEvidenceLinks} direct traces`,
      note: `${maxEvidenceLinks} linked traces back the most heavily evidenced recommendation.`,
    },
    {
      label: "Lead Action",
      value: selectedRecommendation?.type ?? "Select a recommendation",
      note: selectedInsight?.nextStep ?? "Select a recommendation to see the next operator move.",
    },
  ];
  const journey = [
    {
      label: "Prioritize",
      detail: "Open the recommendation board and choose the highest-impact action.",
      state: "active" as const,
      href: "/recommendations",
    },
    {
      label: "Inspect",
      detail: "Jump to the proof traces for the selected recommendation.",
      state: "upcoming" as const,
      href: "/recommendations#proofs",
    },
    {
      label: "Simulate",
      detail: "Test the selected action in Policy Studio before rollout.",
      state: "upcoming" as const,
      href: "/studio",
    },
    {
      label: "Execute",
      detail: "Publish the decision path into reports and operating handoffs.",
      state: "upcoming" as const,
      href: "/reports",
    },
  ];

  return (
    <div className="p-8 max-w-[1760px] mx-auto space-y-6 animate-in fade-in duration-500">
      <EvidenceDrawer
        open={Boolean(selectedEvidence)}
        onOpenChange={(open) => !open && closeEvidence()}
        interactionId={selectedEvidence?.id ?? null}
        contextTitle={selectedRecommendation?.title}
        contextSummary={selectedRecommendation ? `${selectedRecommendation.recommendedAction} ${selectedInsight ? `${selectedInsight.evidence.length} direct traces are linked to this action.` : ""}` : undefined}
        contextSeverity={selectedRecommendation?.severity}
      />

      <ExperienceHeader
        eyebrow="Optimization queue"
        title="Evidence-backed actions"
        lead="Prioritize model, context, workflow, license, and policy changes by expected value, confidence, and supporting evidence."
        stats={headerStats}
        journey={journey}
        actions={
          <>
            <Link href="/explorer">
              <Button variant="outline" className="bg-black/20 border-white/10 hover:bg-white/5 hover:text-white">
                <Target className="w-4 h-4 mr-2 text-slate-300" />
                Open Explorer Reference
              </Button>
            </Link>
            <Link href="/studio">
              <Button className="bg-blue-600 hover:bg-blue-500 text-white border border-blue-500/40 shadow-[0_0_20px_rgba(37,99,235,0.18)]">
                <PlayCircle className="w-4 h-4 mr-2" />
                Run New Scenario
              </Button>
            </Link>
            <Link href="/reports">
              <Button variant="outline" className="bg-black/20 border-white/10 hover:bg-white/5 hover:text-white">
                <Sparkles className="w-4 h-4 mr-2 text-blue-300" />
                Generate Strategic Report
              </Button>
            </Link>
          </>
        }
      />

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-[1.15fr_0.85fr]">
        <Card className="bg-[#111827] border-white/5 shadow-lg overflow-hidden">
          <CardHeader className="bg-black/20 border-b border-white/5">
            <div className="flex items-start justify-between gap-3">
              <div>
                <CardTitle className="dashboard-card-title text-slate-100">Priority Queue</CardTitle>
                <p className="mt-2 text-sm text-slate-400">Higher bars mean higher priority. Select a bar to inspect the recommendation.</p>
              </div>
              <Badge className="bg-white/5 text-slate-300 border-white/10">{recommendationInsights.length}</Badge>
            </div>
          </CardHeader>
          <CardContent className="space-y-5 pt-5">
            <div className="grid gap-4 lg:grid-cols-[1.4fr_0.6fr]">
              <div className="rounded-[28px] border border-white/6 bg-[#0b1120] p-4">
                <div className="mb-3 flex items-center justify-between gap-3">
                  <p className="dashboard-eyebrow">Priority Score</p>
                  <span className="text-xs text-slate-500">Top 8 recommendations</span>
                </div>
                <div className="h-[420px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                      data={priorityChartData}
                      layout="vertical"
                      margin={{ top: 8, right: 18, bottom: 4, left: 8 }}
                    >
                      <XAxis type="number" hide />
                      <YAxis
                        type="category"
                        dataKey="shortLabel"
                        width={220}
                        tickLine={false}
                        axisLine={false}
                        tick={{ fill: "#cbd5e1", fontSize: 12 }}
                      />
                      <Tooltip
                        cursor={{ fill: "rgba(255,255,255,0.04)" }}
                        contentStyle={{
                          background: "#0b1120",
                          border: "1px solid rgba(255,255,255,0.08)",
                          borderRadius: "16px",
                          color: "#e2e8f0",
                          boxShadow: "0 24px 60px rgba(2,6,23,0.34)",
                        }}
                        formatter={(value: number, _name, props) => [
                          `${formatConsumption(value)}`,
                          `${props.payload.scopeLabel} · ${props.payload.severity}`,
                        ]}
                      />
                      <Bar dataKey="score" radius={[0, 14, 14, 0]} onClick={(data: unknown) => {
                        const payload = (data as { id?: string }).id;
                        if (payload) selectRecommendation(payload);
                      }}>
                        {priorityChartData.map((entry) => (
                          <Cell
                            key={entry.id}
                            fill={entry.severity === "High" ? "#ef4444" : entry.severity === "Medium" ? "#f59e0b" : "#3b82f6"}
                            cursor="pointer"
                          />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>

              <div className="space-y-4">
                <div className="rounded-[28px] border border-white/6 bg-[#0b1120] p-4">
                  <div className="mb-3 flex items-center justify-between gap-3">
                    <p className="dashboard-eyebrow">Severity Mix</p>
                    <span className="text-xs text-slate-500">Queue composition</span>
                  </div>
                  <div className="h-[180px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie data={severityMix} dataKey="value" nameKey="name" innerRadius={48} outerRadius={74} paddingAngle={3}>
                          {severityMix.map((entry) => (
                            <Cell
                              key={entry.severity}
                              fill={entry.severity === "High" ? "#ef4444" : entry.severity === "Medium" ? "#f59e0b" : "#3b82f6"}
                            />
                          ))}
                        </Pie>
                        <Tooltip
                          contentStyle={{
                            background: "#0b1120",
                            border: "1px solid rgba(255,255,255,0.08)",
                            borderRadius: "16px",
                            color: "#e2e8f0",
                          }}
                        />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                  <div className="grid gap-2">
                    {severityMix.map((item) => (
                      <div key={item.severity} className="flex items-center justify-between rounded-xl border border-white/6 bg-black/20 px-3 py-2">
                        <span className="text-sm text-slate-200">{item.name}</span>
                        <span className="text-sm text-slate-400">{item.value}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {selectedRecommendation && selectedInsight ? (
          <div className="space-y-6">
            <Card className="bg-[#111827] border-white/5 shadow-lg overflow-hidden">
              <CardHeader className="bg-black/20 border-b border-white/5">
                <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                  <div className="space-y-3">
                    <div className="flex flex-wrap items-center gap-2">
                      <Badge className={severityStyles[selectedRecommendation.severity]}>{selectedRecommendation.severity}</Badge>
                      <Badge className="bg-white/5 text-slate-300 border-white/10">{selectedRecommendation.type}</Badge>
                      <Badge className="bg-white/5 text-slate-300 border-white/10">{selectedRecommendation.scopeType}</Badge>
                    </div>
                    <div>
                      <CardTitle className="text-[1.15rem] leading-tight text-white md:text-[1.3rem]">{selectedRecommendation.title}</CardTitle>
                      <p className="mt-2 text-sm text-slate-400">{selectedRecommendation.scopeLabel}</p>
                    </div>
                  </div>
                  <div className="flex flex-wrap gap-2 lg:justify-end">
                    {primaryEvidence ? (
                      <Button
                        variant="outline"
                        className="bg-black/20 border-white/10 hover:bg-white/5 hover:text-white"
                        onClick={() => openEvidence(primaryEvidence.id)}
                      >
                        <Eye className="w-4 h-4 mr-2" />
                        Open Evidence
                      </Button>
                    ) : null}
                    <Link href="/studio">
                      <Button className="bg-blue-600 hover:bg-blue-500 text-white border border-blue-500/40">
                        <Zap className="w-4 h-4 mr-2" />
                        Simulate Policy
                      </Button>
                    </Link>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-6 pt-6">
                <div className="grid gap-3 sm:grid-cols-3">
                  <HeroMetricCard
                    label="Pressure"
                    value={selectedInsight.overrunExposure > 0 ? `${formatConsumption(selectedInsight.overrunExposure)} credits` : "Within plan"}
                    note="Current overrun signal."
                    tone="blue"
                  />
                  <HeroMetricCard
                    label="Confidence"
                    value={selectedInsight.confidence}
                    note="Based on captured proof items."
                    tone="amber"
                  />
                  <HeroMetricCard
                    label="Owner"
                    value={selectedInsight.owner}
                    note="Responsible for the next move."
                    tone="teal"
                  />
                </div>

                <div className="space-y-4">
                  <CompactNarrativeCard label="Why now" value={selectedRecommendation.whyItMatters} />
                  <CompactNarrativeCard label="Recommended move" value={selectedRecommendation.recommendedAction} tone="blue" />
                </div>

                <EvidenceTraceGrid evidence={selectedInsight.evidence} onOpenEvidence={openEvidence} />

                {primaryEvidence ? (
                  <div className="rounded-[28px] border border-white/6 bg-[#0b1120] p-5">
                    <div className="flex items-center justify-between gap-3">
                      <div>
                        <p className="dashboard-eyebrow">Lead Trace</p>
                        <p className="mt-2 text-sm font-medium text-slate-100">
                          {primaryEvidence.useCaseLabel} · {primaryEvidence.engineerName}
                        </p>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-slate-300 hover:text-white hover:bg-white/5"
                        onClick={() => openEvidence(primaryEvidence.id)}
                      >
                        <ExternalLink className="w-4 h-4 mr-2" />
                        Inspect
                      </Button>
                    </div>
                    <div className="mt-4 grid gap-3 sm:grid-cols-2">
                      <MiniMetric label="Model" value={primaryEvidence.modelName} />
                      <MiniMetric label="Source" value={primaryEvidence.requestSource} />
                      <MiniMetric label="Prompt size" value={`${primaryEvidence.promptChars.toLocaleString()} chars`} />
                      <MiniMetric label="Artifacts" value={`${primaryEvidence.evidence.chatCount + primaryEvidence.evidence.inlineCount}`} />
                    </div>
                  </div>
                ) : null}

                <div className="rounded-[28px] border border-white/6 bg-[#0b1120] p-5">
                  <p className="dashboard-eyebrow">Next Move</p>
                  <div className="mt-4 grid gap-3 sm:grid-cols-3">
                    <MiniMetric label="Owner" value={selectedInsight.owner} />
                    <MiniMetric label="Timing" value={selectedInsight.horizon} />
                    <MiniMetric label="Route" value={selectedInsight.nextStep} />
                  </div>
                  <div className="mt-4 flex flex-col gap-2 sm:flex-row">
                    <Link href="/studio">
                      <Button className="w-full bg-blue-600 hover:bg-blue-500 text-white border border-blue-500/40">
                        <Zap className="w-4 h-4 mr-2" />
                        Open Simulation
                      </Button>
                    </Link>
                    <Link href="/reports">
                      <Button variant="outline" className="w-full bg-black/20 border-white/10 hover:bg-white/5 hover:text-white">
                        <CheckCircle2 className="w-4 h-4 mr-2 text-slate-300" />
                        Send to Reports
                      </Button>
                    </Link>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        ) : null}
      </div>
    </div>
  );
}

function HeroMetricCard({
  label,
  value,
  note,
  tone,
}: {
  label: string;
  value: string;
  note: string;
  tone: "blue" | "amber" | "violet" | "teal";
}) {
  const toneClass =
    tone === "blue"
      ? "border-blue-500/18 bg-blue-500/10"
      : tone === "amber"
        ? "border-amber-500/18 bg-amber-500/10"
        : tone === "violet"
          ? "border-violet-500/18 bg-violet-500/10"
          : "border-teal-500/18 bg-teal-500/10";

  return (
    <div className={`rounded-2xl border p-4 ${toneClass}`}>
      <p className="text-[11px] uppercase tracking-[0.24em] text-slate-400">{label}</p>
      <p className="mt-3 text-lg font-semibold leading-tight text-white">{value}</p>
      <p className="mt-2 text-xs leading-relaxed text-slate-400">{note}</p>
    </div>
  );
}

function CompactNarrativeCard({
  label,
  value,
  tone = "slate",
}: {
  label: string;
  value: string;
  tone?: "slate" | "blue";
}) {
  return (
    <div className={`rounded-2xl border p-4 ${tone === "blue" ? "border-blue-500/18 bg-blue-500/10" : "border-white/8 bg-black/20"}`}>
      <p className="text-[11px] uppercase tracking-[0.24em] text-slate-500">{label}</p>
      <p className="mt-3 text-sm leading-7 text-slate-100">{value}</p>
    </div>
  );
}

function EvidenceTraceGrid({
  evidence,
  onOpenEvidence,
}: {
  evidence: InteractionSummary[];
  onOpenEvidence: (interactionId: string) => void;
}) {
  return (
    <div
      id="proofs"
      className="scroll-mt-28 rounded-[28px] border border-white/6 bg-[#0b1120] p-5 shadow-[0_20px_60px_rgba(2,6,23,0.3)]"
    >
      <div className="mb-5 flex items-start justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <BarChart3 className="h-4 w-4 text-blue-300" />
            <p className="dashboard-section-title text-slate-100">Observed Proof</p>
          </div>
          <p className="mt-2 text-sm leading-relaxed text-slate-400">Open a captured trace without leaving the current recommendation.</p>
        </div>
        <span className="rounded-full border border-white/8 bg-white/[0.03] px-3 py-1 text-xs text-slate-400">
          {evidence.length} linked traces
        </span>
      </div>

      <div className="space-y-3">
        {evidence.map((interaction, index) => (
          <button
            key={interaction.id}
            type="button"
            onClick={() => onOpenEvidence(interaction.id)}
            className="group rounded-[24px] border border-white/6 bg-[radial-gradient(circle_at_top_left,rgba(59,130,246,0.12),transparent_30%),linear-gradient(180deg,rgba(14,22,38,0.95),rgba(9,15,27,0.98))] p-4 text-left transition-all hover:border-blue-500/20"
          >
            <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-3">
                  <div className="rounded-full border border-blue-500/20 bg-blue-500/10 px-3 py-1 text-[11px] font-medium uppercase tracking-[0.24em] text-blue-200">
                    Trace {index + 1}
                  </div>
                  <p className="text-base font-semibold leading-snug text-white">{interaction.useCaseLabel}</p>
                </div>
                <p className="mt-2 text-sm leading-relaxed text-slate-400">
                  {interaction.engineerName} · {interaction.modelName} · {interaction.requestSource}
                </p>
                <div className="mt-4 flex flex-wrap gap-2 text-xs text-slate-400">
                  <span className="rounded-full border border-white/8 bg-black/20 px-3 py-1">
                    {interaction.promptChars.toLocaleString()} prompt chars
                  </span>
                  <span className="rounded-full border border-white/8 bg-black/20 px-3 py-1">
                    {interaction.toolInvocationCount} tool calls
                  </span>
                  <span className="rounded-full border border-white/8 bg-black/20 px-3 py-1">
                    {interaction.evidence.chatCount + interaction.evidence.inlineCount} artifacts
                  </span>
                </div>
              </div>
              <div className="flex items-center gap-2 text-sm font-semibold text-slate-100">
                Open
                <ArrowRight className="h-4 w-4 text-slate-500 transition-transform group-hover:translate-x-0.5 group-hover:text-slate-200" />
              </div>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}

function RecommendationTile({
  insight,
  selected,
  onSelect,
}: {
  insight: RecommendationInsight;
  selected: boolean;
  onSelect: (recommendationId: string) => void;
}) {
  return (
    <button
      type="button"
      onClick={() => onSelect(insight.recommendation.id)}
      className={`group rounded-[22px] border p-4 text-left transition-all ${
        selected
          ? "border-blue-500/40 bg-blue-500/10 shadow-[0_0_0_1px_rgba(59,130,246,0.16)]"
          : "border-white/6 bg-black/20 hover:border-white/12 hover:bg-white/[0.03]"
      }`}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <Badge className={severityStyles[insight.recommendation.severity]}>{insight.recommendation.severity}</Badge>
            <span className="text-[11px] uppercase tracking-[0.22em] text-slate-500">{insight.recommendation.type}</span>
          </div>
          <p className="mt-3 line-clamp-2 text-[14px] font-medium leading-5 text-slate-100">{insight.recommendation.title}</p>
          <p className="mt-2 text-xs leading-relaxed text-slate-500">{insight.recommendation.scopeLabel}</p>
        </div>
        <ArrowRight className={`mt-1 h-4 w-4 shrink-0 ${selected ? "text-blue-300" : "text-slate-500"}`} />
      </div>

      <div className="mt-4 flex flex-wrap items-center gap-2 text-[11px] text-slate-400">
        <span className="rounded-full border border-white/8 bg-white/[0.03] px-2.5 py-1">{formatConsumption(insight.scopeExposure)} credits</span>
        <span className="rounded-full border border-white/8 bg-white/[0.03] px-2.5 py-1">{insight.evidence.length} traces</span>
      </div>
    </button>
  );
}

function PriorityMosaicTile({
  insight,
  selected,
  colSpan,
  rowSpan,
  onSelect,
}: {
  insight: RecommendationInsight;
  selected: boolean;
  colSpan: number;
  rowSpan: number;
  onSelect: (recommendationId: string) => void;
}) {
  const toneClass =
    insight.recommendation.severity === "High"
      ? "border-red-500/20 bg-[radial-gradient(circle_at_top_left,rgba(239,68,68,0.24),transparent_36%),linear-gradient(180deg,rgba(24,10,14,0.98),rgba(11,17,32,0.98))]"
      : insight.recommendation.severity === "Medium"
        ? "border-amber-500/20 bg-[radial-gradient(circle_at_top_left,rgba(245,158,11,0.2),transparent_36%),linear-gradient(180deg,rgba(24,18,8,0.98),rgba(11,17,32,0.98))]"
        : "border-blue-500/20 bg-[radial-gradient(circle_at_top_left,rgba(59,130,246,0.2),transparent_36%),linear-gradient(180deg,rgba(9,18,32,0.98),rgba(11,17,32,0.98))]";

  return (
    <button
      type="button"
      onClick={() => onSelect(insight.recommendation.id)}
      style={{
        gridColumn: `span ${colSpan}`,
        gridRow: `span ${rowSpan}`,
      }}
      className={`rounded-[22px] border p-4 text-left transition-all ${toneClass} ${
        selected
          ? "shadow-[0_0_0_1px_rgba(96,165,250,0.45)] ring-1 ring-blue-400/30"
          : "hover:border-white/12 hover:brightness-[1.02]"
      }`}
    >
      <div className="flex h-full flex-col justify-between gap-4">
        <div className="space-y-3">
          <div className="flex flex-wrap items-center gap-2">
            <Badge className={severityStyles[insight.recommendation.severity]}>{insight.recommendation.severity}</Badge>
            <span className="text-[11px] uppercase tracking-[0.22em] text-slate-400">{insight.recommendation.type}</span>
          </div>
          <p className="text-[14px] font-semibold leading-5 text-white">{insight.recommendation.title}</p>
          <p className="text-xs leading-relaxed text-slate-400">{insight.recommendation.scopeLabel}</p>
        </div>

        <div className="flex flex-wrap gap-2 text-[11px] text-slate-300">
          <span className="rounded-full border border-white/8 bg-black/20 px-2.5 py-1">{formatConsumption(insight.scopeExposure)} credits</span>
          <span className="rounded-full border border-white/8 bg-black/20 px-2.5 py-1">{insight.evidence.length} traces</span>
          <span className="rounded-full border border-white/8 bg-black/20 px-2.5 py-1">{insight.owner}</span>
        </div>
      </div>
    </button>
  );
}

function DomainClusterCard({
  cluster,
  selectedRecommendationId,
  onSelect,
}: {
  cluster: {
    key: string;
    label: string;
    description: string;
    accent: string;
    total: number;
    rows: Array<{ severity: "High" | "Medium" | "Low"; items: RecommendationInsight[] }>;
  };
  selectedRecommendationId: string;
  onSelect: (recommendationId: string) => void;
}) {
  const previewItems = cluster.rows.flatMap((row) => row.items).slice(0, 3);

  return (
    <div className="rounded-[24px] border border-white/6 bg-[#0b1120] p-4">
      <div className="flex items-start justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <p className="text-sm font-semibold text-white">{cluster.label}</p>
            <span className={`rounded-full border px-2 py-0.5 text-[10px] uppercase tracking-[0.22em] ${cluster.accent}`}>{cluster.total}</span>
          </div>
          <p className="mt-2 text-xs leading-relaxed text-slate-500">{cluster.description}</p>
        </div>
      </div>

      <div className="mt-4 space-y-2">
        {previewItems.length ? (
          previewItems.map((insight) => (
            <button
              key={insight.recommendation.id}
              type="button"
              onClick={() => onSelect(insight.recommendation.id)}
              className={`flex w-full items-center justify-between gap-3 rounded-2xl border px-3 py-2 text-left transition-all ${
                selectedRecommendationId === insight.recommendation.id
                  ? "border-blue-500/35 bg-blue-500/10"
                  : "border-white/6 bg-black/20 hover:bg-white/[0.03]"
              }`}
            >
              <span className="min-w-0 flex-1 truncate text-sm text-slate-100">{insight.recommendation.title}</span>
              <span className="shrink-0 text-[11px] uppercase tracking-[0.2em] text-slate-500">{insight.recommendation.severity}</span>
            </button>
          ))
        ) : (
          <div className="rounded-2xl border border-dashed border-white/8 bg-black/10 px-3 py-6 text-center text-xs text-slate-600">
            No actions
          </div>
        )}
      </div>
    </div>
  );
}

function OwnerGroupCard({
  owner,
  items,
  selectedRecommendationId,
  onSelect,
}: {
  owner: string;
  items: RecommendationInsight[];
  selectedRecommendationId: string;
  onSelect: (recommendationId: string) => void;
}) {
  const topItems = items.slice(0, 3);

  return (
    <div className="rounded-[24px] border border-white/6 bg-[#0b1120] p-4">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-sm font-semibold text-white">{owner}</p>
          <p className="mt-2 text-xs text-slate-500">{items.length} recommendation{items.length === 1 ? "" : "s"} routed here</p>
        </div>
        <span className="rounded-full border border-white/8 bg-white/[0.03] px-2.5 py-1 text-[10px] uppercase tracking-[0.22em] text-slate-400">
          Owner
        </span>
      </div>

      <div className="mt-4 space-y-2">
        {topItems.map((insight) => (
          <button
            key={insight.recommendation.id}
            type="button"
            onClick={() => onSelect(insight.recommendation.id)}
            className={`flex w-full items-center justify-between gap-3 rounded-2xl border px-3 py-2 text-left transition-all ${
              selectedRecommendationId === insight.recommendation.id
                ? "border-blue-500/35 bg-blue-500/10"
                : "border-white/6 bg-black/20 hover:bg-white/[0.03]"
            }`}
          >
            <span className="min-w-0 flex-1 truncate text-sm text-slate-100">{insight.recommendation.title}</span>
            <span className="shrink-0 text-[11px] uppercase tracking-[0.2em] text-slate-500">{insight.recommendation.severity}</span>
          </button>
        ))}
      </div>
    </div>
  );
}

function truncateLabel(value: string, maxLength: number) {
  if (value.length <= maxLength) return value;
  return `${value.slice(0, maxLength - 1).trimEnd()}…`;
}

function MiniMetric({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-white/6 bg-[#0b1120] px-3 py-3">
      <p className="dashboard-eyebrow">{label}</p>
      <p className="mt-2 text-sm font-medium text-slate-200">{value}</p>
    </div>
  );
}

function parseRecommendationsUrlState(): RecommendationsUrlState {
  if (typeof window === "undefined") {
    return { recId: null, evidenceId: null };
  }

  const params = new URLSearchParams(window.location.search);

  return {
    recId: params.get("rec"),
    evidenceId: params.get("evidence"),
  };
}

function navigateRecommendationsState({
  recId,
  evidenceId,
  replace,
}: {
  recId: string;
  evidenceId?: string | null;
  replace: boolean;
}) {
  if (typeof window === "undefined") return;

  const params = new URLSearchParams(window.location.search);
  params.set("rec", recId);

  if (evidenceId) {
    params.set("evidence", evidenceId);
  } else {
    params.delete("evidence");
  }

  const query = params.toString();
  const nextUrl = `${window.location.pathname}${query ? `?${query}` : ""}${window.location.hash}`;
  const currentUrl = `${window.location.pathname}${window.location.search}${window.location.hash}`;

  if (nextUrl === currentUrl) return;

  const stateMethod = replace ? "replaceState" : "pushState";
  window.history[stateMethod](window.history.state, "", nextUrl);
  window.dispatchEvent(new Event(RECOMMENDATIONS_ROUTE_EVENT));
}

function deriveRecommendationInsight(recommendation: Recommendation): RecommendationInsight {
  const evidence = recommendation.evidenceInteractionIds
    .map((interactionId) => getInteractionById(interactionId))
    .filter((interaction): interaction is InteractionSummary => Boolean(interaction));
  const scopeMetrics = resolveScopeMetrics(recommendation);
  const proofCredits = evidence.reduce((sum, interaction) => sum + interaction.estimatedCredits, 0);
  const richEvidenceCount = evidence.filter((interaction) => interaction.evidence.chatCount > 0 || interaction.evidence.inlineCount > 0).length;
  const confidenceScore = evidence.length * 2 + Math.min(recommendation.supportingSignals.length, 3) + richEvidenceCount;
  const confidence: RecommendationInsight["confidence"] =
    confidenceScore >= 7 ? "High" : confidenceScore >= 4 ? "Medium" : "Low";
  const owner = resolveRecommendationOwner(recommendation);
  const horizon =
    recommendation.severity === "High"
      ? "Act before next report"
      : recommendation.severity === "Medium"
        ? "Plan this cycle"
        : "Monitor and coach";
  const nextStep = resolveNextStep(recommendation);
  const scopeSummary =
    scopeMetrics.overrun > 0
      ? `${formatConsumption(scopeMetrics.totalConsumption)} credits in scope · ${formatConsumption(scopeMetrics.overrun)} overrun`
      : `${formatConsumption(scopeMetrics.totalConsumption)} credits in scope`;
  const proofSummary = `${evidence.length} direct traces · ${recommendation.supportingSignals.length} signals`;
  const priorityScore =
    (recommendation.severity === "High" ? 300 : recommendation.severity === "Medium" ? 200 : 100) +
    scopeMetrics.totalConsumption +
    scopeMetrics.overrun * 2 +
    evidence.length * 35 +
    richEvidenceCount * 20;
  const relevantRuns = TELEMETRY_DATA.runs.filter((run) => isRunRelevant(run, recommendation)).slice(0, 3);

  return {
    recommendation,
    evidence,
    scopeExposure: scopeMetrics.totalConsumption,
    overrunExposure: scopeMetrics.overrun,
    proofCredits,
    confidence,
    owner,
    horizon,
    nextStep,
    proofSummary,
    scopeSummary,
    priorityScore,
    relevantRuns: relevantRuns.length ? relevantRuns : TELEMETRY_DATA.runs.slice(0, 2),
  };
}

function resolveScopeMetrics(recommendation: Recommendation) {
  if (recommendation.scopeType === "Enterprise") {
    return {
      totalConsumption: TELEMETRY_DATA.kpis.totalConsumption,
      overrun: TELEMETRY_DATA.kpis.overrun,
    };
  }

  if (recommendation.scopeType === "Cost Center") {
    const scope = TELEMETRY_DATA.costCenters.find((item) => item.id === recommendation.scopeId);
    return {
      totalConsumption: scope?.totalConsumption ?? 0,
      overrun: scope?.overrun ?? 0,
    };
  }

  if (recommendation.scopeType === "Team") {
    const scope = TELEMETRY_DATA.teams.find((item) => item.id === recommendation.scopeId);
    return {
      totalConsumption: scope?.totalConsumption ?? 0,
      overrun: scope?.overrun ?? 0,
    };
  }

  if (recommendation.scopeType === "Engineer") {
    const scope = TELEMETRY_DATA.engineers.find((item) => item.userId === recommendation.scopeId);
    return {
      totalConsumption: scope?.totalConsumption ?? 0,
      overrun: scope?.overrun ?? 0,
    };
  }

  if (recommendation.scopeType === "Use Case") {
    const scope = TELEMETRY_DATA.useCases.find((item) => item.key === recommendation.scopeId);
    return {
      totalConsumption: scope?.totalConsumption ?? 0,
      overrun: 0,
    };
  }

  if (recommendation.scopeType === "Interaction") {
    const interaction = getInteractionById(recommendation.scopeId);
    return {
      totalConsumption: interaction?.estimatedCredits ?? 0,
      overrun: 0,
    };
  }

  return { totalConsumption: 0, overrun: 0 };
}

function resolveRecommendationOwner(recommendation: Recommendation) {
  if (recommendation.scopeType === "Cost Center") return "Cost center lead";
  if (recommendation.scopeType === "Team" || recommendation.scopeType === "Engineer") return "Engineering manager";

  switch (recommendation.type) {
    case "Model Routing":
    case "Steering Scope":
    case "Prompt Discipline":
      return "AI platform lead";
    case "Use Case Optimization":
      return "Workflow owner";
    case "Plugin Governance":
    case "MCP Governance":
      return "Platform governance";
    case "License Hygiene":
      return "Operations admin";
    case "Spend Concentration":
    case "Overrun Risk":
      return "Cost center lead";
    default:
      return "Delivery lead";
  }
}

function resolveNextStep(recommendation: Recommendation) {
  switch (recommendation.type) {
    case "Model Routing":
      return "Simulate lighter-model routing on the linked traces.";
    case "Steering Scope":
      return "Break the workflow into smaller delivery packets.";
    case "Use Case Optimization":
      return "Automate the deterministic step before the next sprint.";
    case "Spend Concentration":
      return "Review the top traces with the scope owner and add guardrails.";
    case "Overrun Risk":
      return "Set threshold alerts and route repeatable work to lower-cost defaults.";
    case "Plugin Governance":
    case "MCP Governance":
      return "Review tool access and narrow the expensive path.";
    case "License Hygiene":
      return "Reassign or retire the idle seats before renewal.";
    case "Team Coaching":
      return "Coach the team on default model and workflow choices.";
    default:
      return "Validate the evidence chain, then move the action into policy simulation.";
  }
}

function isRunRelevant(run: AdvisorRun, recommendation: Recommendation) {
  if (run.scopeLabel === recommendation.scopeLabel) return true;
  if (recommendation.scopeType === "Enterprise" && run.scopeLabel === "Enterprise") return true;

  const searchTerms = [
    recommendation.type,
    recommendation.scopeLabel,
    ...recommendation.title.toLowerCase().split(/\s+/).filter((term) => term.length > 5),
  ].map((term) => term.toLowerCase());
  const haystack = `${run.title} ${run.summary}`.toLowerCase();

  return searchTerms.some((term) => haystack.includes(term));
}
