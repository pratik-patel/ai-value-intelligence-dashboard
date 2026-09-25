import { useMemo, useState } from "react";
import type { ReactNode } from "react";
import {
  Download,
  Eye,
  FileText,
  Loader2,
  Share2,
  X,
} from "lucide-react";
import { Cell, Pie, PieChart, ResponsiveContainer } from "recharts";

import { EvidenceDrawer } from "@/components/EvidenceDrawer";
import { ExperienceHeader } from "@/components/experience/ExperienceHeader";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  TELEMETRY_DATA,
  formatConsumption,
  getInteractionsForScope,
  getRecommendationsForScope,
  getUseCaseSummariesForScope,
  type Recommendation,
  type ReportSummary,
} from "@/lib/telemetry-data";

type Audience = "Executive Sponsor" | "Delivery Manager" | "Architect";
type ScopeType = Recommendation["scopeType"];

interface ReportEntry extends ReportSummary {
  scopeType: ScopeType;
  scopeId: string;
}

export default function ReportEvidenceConsole() {
  const [showGenerateModal, setShowGenerateModal] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [selectedReportId, setSelectedReportId] = useState(TELEMETRY_DATA.reports[0]?.id ?? "");
  const [evidenceInteractionId, setEvidenceInteractionId] = useState<string | null>(null);
  const [draftScopeId, setDraftScopeId] = useState("enterprise");
  const [draftAudience, setDraftAudience] = useState<Audience>("Executive Sponsor");
  const [draftPeriod, setDraftPeriod] = useState("Last 30 Days");
  const [generatedReports, setGeneratedReports] = useState<ReportEntry[]>(() =>
    TELEMETRY_DATA.reports.map((report) => ({
      ...report,
      ...resolveScopeReference(report.scopeLabel),
    })),
  );

  const scopeOptions = useMemo(() => {
    const options = [{ id: "enterprise", label: "Enterprise", scopeType: "Enterprise" as const }];
    return [
      ...options,
      ...TELEMETRY_DATA.costCenters.map((costCenter) => ({
        id: `cost-center:${costCenter.id}`,
        label: `${costCenter.name} · Cost Center`,
        scopeType: "Cost Center" as const,
      })),
      ...TELEMETRY_DATA.teams.slice(0, 8).map((team) => ({
        id: `team:${team.id}`,
        label: `${team.name} · Team`,
        scopeType: "Team" as const,
      })),
      ...TELEMETRY_DATA.engineers.slice(0, 8).map((engineer) => ({
        id: `engineer:${engineer.userId}`,
        label: `${engineer.name} · Engineer`,
        scopeType: "Engineer" as const,
      })),
    ];
  }, []);

  const selectedReport = generatedReports.find((report) => report.id === selectedReportId) ?? generatedReports[0];
  const reportScope = useMemo(
    () => resolveScopedDataset(selectedReport?.scopeType ?? "Enterprise", selectedReport?.scopeId ?? "enterprise"),
    [selectedReport],
  );
  const topUseCaseMax = reportScope.useCases[0]?.totalConsumption ?? 0;
  const leadRecommendation = reportScope.recommendations[0] ?? null;

  const evidencePacks = useMemo(
    () =>
      reportScope.recommendations
        .filter((recommendation) => recommendation.evidenceInteractionIds.length > 0)
        .slice(0, 5)
        .map((recommendation) => ({
          id: recommendation.id,
          title: recommendation.title,
          scopeLabel: recommendation.scopeLabel,
          interactionId: recommendation.evidenceInteractionIds[0],
          itemCount: recommendation.evidenceInteractionIds.length,
        })),
    [reportScope],
  );
  const maxEvidencePackItems = evidencePacks.reduce((max, pack) => Math.max(max, pack.itemCount), 0);

  const promptInspections = useMemo(
    () =>
      [...reportScope.interactions]
        .filter((interaction) => interaction.evidence.chatCount > 0)
        .sort((left, right) => right.estimatedCredits - left.estimatedCredits)
        .slice(0, 6),
    [reportScope],
  );
  const maxPromptInspectionCredits = promptInspections[0]?.estimatedCredits ?? 0;
  const reportConfidence = deriveReportConfidence(reportScope.recommendations.length, evidencePacks.length, promptInspections.length);
  const reportOwner = resolveReportOwner(selectedReport?.audience ?? "Executive Sponsor");
  const reportReadiness =
    selectedReport?.status === "Completed"
      ? "Ready to share"
      : selectedReport?.status === "Processing"
        ? "Refresh in progress"
        : "Needs regeneration";
  const headerStats = [
    {
      label: "Report Queue",
      value: `${generatedReports.length} outputs`,
      note: `${generatedReports.filter((report) => report.status === "Processing").length} are currently refreshing.`,
    },
    {
      label: "Evidence Packs",
      value: `${evidencePacks.length} curated`,
      note: `${maxEvidencePackItems} linked items in the richest evidence pack for this report.`,
    },
    {
      label: "Prompt Inspections",
      value: `${promptInspections.length} traces`,
      note: maxPromptInspectionCredits
        ? `${formatConsumption(maxPromptInspectionCredits)} credits is the heaviest inspection in view.`
        : "No prompt inspections are currently attached.",
    },
    {
      label: "Scope Consumption",
      value: `${formatConsumption(reportScope.totalConsumption)} credits`,
      note: `${reportScope.recommendations.length} scoped recommendations support the active report narrative.`,
      },
    ];
  const reportJourney = [
    {
      label: "Queue",
      detail: "Pick a report slice to open.",
      state: "complete" as const,
    },
    {
      label: "Summarize",
      detail: "Read the headline and operating metrics.",
      state: "active" as const,
    },
    {
      label: "Evidence",
      detail: "Open the traces behind the claim.",
      state: "upcoming" as const,
    },
    {
      label: "Export",
      detail: "Package the decision for stakeholders.",
      state: "upcoming" as const,
    },
  ];
  const reportStatusMix = useMemo(
    () =>
      [
        { name: "Completed", value: generatedReports.filter((report) => report.status === "Completed").length, color: "#14b8a6" },
        { name: "Processing", value: generatedReports.filter((report) => report.status === "Processing").length, color: "#3b82f6" },
        { name: "Stale", value: generatedReports.filter((report) => report.status === "Stale").length, color: "#f59e0b" },
      ].filter((item) => item.value > 0),
    [generatedReports],
  );
  const reportStatusOverview = useMemo(
    () =>
      reportStatusMix.map((item) => ({
        ...item,
        name: item.name,
      })),
    [reportStatusMix],
  );

  const handleGenerate = () => {
    const option = scopeOptions.find((item) => item.id === draftScopeId);
    if (!option) return;

    setIsGenerating(true);
    window.setTimeout(() => {
      const scopeType = option.scopeType;
      const scopeId = scopeType === "Enterprise" ? "enterprise" : option.id.split(":")[1] ?? "enterprise";
      const dataset = resolveScopedDataset(scopeType, scopeId);
      const nextReport: ReportEntry = {
        id: `rep-${Date.now()}`,
        title: buildReportTitle(scopeType, dataset.label),
        scopeLabel: dataset.label,
        audience: draftAudience,
        status: "Processing",
        generatedAt: `${TELEMETRY_DATA.meta.lastUpdated} · ${draftPeriod}`,
        executiveSummary: buildExecutiveSummary(dataset, draftAudience),
        scopeType,
        scopeId,
      };

      setGeneratedReports((current) => [nextReport, ...current]);
      setSelectedReportId(nextReport.id);
      setIsGenerating(false);
      setShowGenerateModal(false);
    }, 900);
  };

  return (
    <div className="p-8 max-w-[1640px] mx-auto space-y-8 animate-in fade-in duration-500 relative">
      <EvidenceDrawer
        open={Boolean(evidenceInteractionId)}
        onOpenChange={(open) => !open && setEvidenceInteractionId(null)}
        interactionId={evidenceInteractionId}
      />

      {showGenerateModal ? (
        <div className="fixed inset-0 z-50 bg-[#0B1120]/80 backdrop-blur-sm flex items-center justify-center px-4">
          <Card className="w-full max-w-xl bg-[#121A2B] border-white/10 shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between px-5 py-4 border-b border-white/5 bg-black/20">
              <div>
                <h3 className="font-semibold text-white">Generate Strategic Report</h3>
                <p className="text-xs text-slate-400 mt-1">Build a focused report from the current telemetry snapshot.</p>
              </div>
              <Button variant="ghost" size="icon" className="text-slate-400 hover:text-white" onClick={() => setShowGenerateModal(false)}>
                <X className="w-4 h-4" />
              </Button>
            </div>
            <div className="p-6 space-y-5">
              <ModalField label="Scope">
                <select
                  value={draftScopeId}
                  onChange={(event) => setDraftScopeId(event.target.value)}
                  className="w-full bg-black/40 border border-white/10 rounded-xl px-3 py-2.5 text-sm text-slate-100 focus:outline-none focus:ring-1 focus:ring-blue-500"
                >
                  {scopeOptions.map((option) => (
                    <option key={option.id} value={option.id}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </ModalField>

              <ModalField label="Audience">
                <select
                  value={draftAudience}
                  onChange={(event) => setDraftAudience(event.target.value as Audience)}
                  className="w-full bg-black/40 border border-white/10 rounded-xl px-3 py-2.5 text-sm text-slate-100 focus:outline-none focus:ring-1 focus:ring-blue-500"
                >
                  <option value="Executive Sponsor">Executive Sponsor</option>
                  <option value="Delivery Manager">Delivery Manager</option>
                  <option value="Architect">Architect</option>
                </select>
              </ModalField>

              <ModalField label="Reporting Period">
                <select
                  value={draftPeriod}
                  onChange={(event) => setDraftPeriod(event.target.value)}
                  className="w-full bg-black/40 border border-white/10 rounded-xl px-3 py-2.5 text-sm text-slate-100 focus:outline-none focus:ring-1 focus:ring-blue-500"
                >
                  <option value="Last 30 Days">Last 30 Days</option>
                  <option value="Quarter to Date">Quarter to Date</option>
                  <option value="Year to Date">Year to Date</option>
                </select>
              </ModalField>
            </div>
            <div className="flex justify-end gap-3 px-5 py-4 border-t border-white/5 bg-black/20">
              <Button
                variant="outline"
                className="bg-transparent border-white/10 text-slate-300 hover:bg-white/5 hover:text-white"
                onClick={() => setShowGenerateModal(false)}
              >
                Cancel
              </Button>
              <Button
                className="bg-blue-600 hover:bg-blue-500 text-white min-w-36"
                onClick={handleGenerate}
                disabled={isGenerating}
              >
                {isGenerating ? <Loader2 className="w-4 h-4 animate-spin" /> : "Generate Report"}
              </Button>
            </div>
          </Card>
        </div>
      ) : null}

      <ExperienceHeader
        eyebrow="Evidence & reporting"
        title="Trace decisions to source data"
        lead="Inspect telemetry, confidence, and report conclusions without losing the decision narrative."
        stats={headerStats}
        journey={reportJourney}
        actions={
          <>
            <Button variant="outline" className="bg-black/20 border-white/10 hover:bg-white/5 hover:text-white">
              <Share2 className="w-4 h-4 mr-2" />
              Share Hub
            </Button>
            <Button
              className="bg-blue-600 hover:bg-blue-500 text-white border border-blue-500/40 shadow-[0_0_20px_rgba(37,99,235,0.2)]"
              onClick={() => setShowGenerateModal(true)}
            >
              <FileText className="w-4 h-4 mr-2" />
              Generate Strategic Report
            </Button>
          </>
        }
      />

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-[0.82fr_1.18fr]">
        <Card className="bg-[#111827] border-white/5 shadow-lg overflow-hidden">
          <CardHeader className="bg-black/20 border-b border-white/5">
            <p className="dashboard-eyebrow">1. Select Report</p>
            <CardTitle className="dashboard-card-title text-slate-200">Report Queue</CardTitle>
            <div className="mt-4 grid gap-2 md:grid-cols-3">
              {reportStatusMix.map((item) => (
                <SummaryRail key={item.name} label={item.name} value={item.value} max={generatedReports.length} color={item.color} />
              ))}
            </div>
          </CardHeader>
          <CardContent className="p-0">
            <div className="divide-y divide-white/5">
              {generatedReports.map((report) => {
                const isActive = report.id === selectedReportId;
                const statusClass =
                  report.status === "Completed"
                    ? "bg-teal-500/10 text-teal-300 border-teal-500/20"
                    : report.status === "Processing"
                      ? "bg-blue-500/10 text-blue-300 border-blue-500/20"
                      : "bg-amber-500/10 text-amber-300 border-amber-500/20";

                return (
                  <button
                    key={report.id}
                    type="button"
                    onClick={() => setSelectedReportId(report.id)}
                    className={`w-full text-left p-4 transition-colors ${isActive ? "bg-white/[0.04]" : "hover:bg-white/[0.02]"}`}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="font-medium text-slate-100">{report.title}</p>
                        <p className="text-sm text-slate-400 mt-1">{report.scopeLabel}</p>
                        <div className="flex flex-wrap items-center gap-2 mt-2">
                          <Badge className="bg-white/5 text-slate-300 border-white/10">{report.audience}</Badge>
                          <Badge className={statusClass}>{report.status}</Badge>
                        </div>
                      </div>
                      <span className="max-w-28 text-right text-xs leading-5 text-slate-500">{report.generatedAt}</span>
                    </div>
                  </button>
                );
              })}
            </div>
          </CardContent>
        </Card>

        <Card className="bg-[#111827] border-white/5 shadow-lg overflow-hidden">
          <CardHeader className="bg-black/20 border-b border-white/5">
            <p className="dashboard-eyebrow">2. Read Summary</p>
            <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-4">
              <div>
                <CardTitle className="dashboard-card-title text-slate-200">
                  {selectedReport?.title ?? "Report Preview"}
                </CardTitle>
                <CardDescription className="text-slate-400">{selectedReport?.scopeLabel ?? "Enterprise"} · {selectedReport?.audience ?? "Executive Sponsor"}</CardDescription>
              </div>
              <div className="flex flex-wrap gap-2">
                <Button size="sm" className="bg-blue-600 hover:bg-blue-500 text-white">
                  <Download className="w-4 h-4 mr-2" />
                  Export PDF
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-6 pt-6">
            <Tabs defaultValue="overview" className="w-full">
              <TabsList className="grid h-auto w-full grid-cols-3 gap-1 rounded-[18px] border border-white/8 bg-black/20 p-1.5">
                <TabsTrigger value="overview" className="rounded-[14px] py-2.5 text-xs uppercase tracking-[0.22em] text-slate-400 data-[state=active]:bg-blue-500/15 data-[state=active]:text-white">
                  Overview
                </TabsTrigger>
                <TabsTrigger value="evidence" className="rounded-[14px] py-2.5 text-xs uppercase tracking-[0.22em] text-slate-400 data-[state=active]:bg-blue-500/15 data-[state=active]:text-white">
                  Evidence
                </TabsTrigger>
                <TabsTrigger value="export" className="rounded-[14px] py-2.5 text-xs uppercase tracking-[0.22em] text-slate-400 data-[state=active]:bg-blue-500/15 data-[state=active]:text-white">
                  Export
                </TabsTrigger>
              </TabsList>

              <TabsContent value="overview" className="mt-5 space-y-5">
                <div className="grid gap-4 xl:grid-cols-[1.05fr_0.95fr]">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <MetricCard label="Report Status" value={reportReadiness} />
                    <MetricCard label="Evidence Confidence" value={reportConfidence} />
                    <MetricCard label="Decision Owner" value={reportOwner} />
                    <MetricCard label="Telemetry Freshness" value={TELEMETRY_DATA.meta.freshness.replace("Last updated: ", "")} />
                  </div>

                  <div className="rounded-2xl border border-white/5 bg-[#0b1120] p-4">
                    <div className="flex items-center justify-between gap-3">
                      <div>
                        <p className="dashboard-eyebrow">Status Mix</p>
                        <p className="mt-1 text-xs text-slate-500">Queue composition at a glance</p>
                      </div>
                      <Badge className="bg-white/5 text-slate-300 border-white/10">{generatedReports.length}</Badge>
                    </div>
                    <div className="mt-4 grid gap-4 lg:grid-cols-[0.95fr_1.05fr] lg:items-center">
                      <div className="h-[190px]">
                        <ResponsiveContainer width="100%" height="100%">
                          <PieChart>
                            <Pie data={reportStatusOverview} dataKey="value" nameKey="name" innerRadius={52} outerRadius={78} paddingAngle={4}>
                              {reportStatusOverview.map((item) => (
                                <Cell key={item.name} fill={item.color} />
                              ))}
                            </Pie>
                          </PieChart>
                        </ResponsiveContainer>
                      </div>
                      <div className="space-y-2">
                        {reportStatusOverview.map((item) => (
                          <div key={item.name} className="rounded-xl border border-white/5 bg-black/20 px-3 py-2">
                            <div className="flex items-center justify-between gap-3">
                              <span className="text-sm text-slate-200">{item.name}</span>
                              <span className="text-sm text-slate-400">{item.value}</span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>

                <section className="rounded-2xl border border-white/5 bg-[#0b1120] p-4">
                  <p className="dashboard-eyebrow mb-3">Primary Claim</p>
                  <p className="text-sm leading-relaxed text-slate-300">
                    {selectedReport ? selectedReport.executiveSummary : "Select a report to preview the strategic summary."}
                  </p>
                </section>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <MetricCard label="Scope AI Consumption" value={`${formatConsumption(reportScope.totalConsumption)} credits`} />
                  <MetricCard label="Scope Overrun" value={`${formatConsumption(reportScope.overrun)} credits`} />
                  <MetricCard label="Top Cost Driver" value={reportScope.topUseCase} />
                </div>
              </TabsContent>

              <TabsContent value="evidence" className="mt-5 space-y-5">
                <div className="grid gap-4 xl:grid-cols-[0.96fr_1.04fr]">
                  <section className="rounded-2xl border border-white/5 bg-[#0b1120] p-4">
                    <div className="mb-3 flex items-center justify-between gap-3">
                      <div>
                        <p className="dashboard-eyebrow">Evidence Packs</p>
                        <p className="mt-1 text-xs text-slate-500">{evidencePacks.length} selected traces</p>
                      </div>
                    </div>
                    <div className="space-y-3">
                      {evidencePacks.map((pack) => (
                        <button
                          key={pack.id}
                          type="button"
                          onClick={() => setEvidenceInteractionId(pack.interactionId)}
                          className="w-full rounded-xl border border-white/5 bg-[#111827] p-3 text-left transition-colors hover:bg-white/[0.03]"
                        >
                          <div className="flex items-center justify-between gap-3">
                            <div className="min-w-0">
                              <p className="text-sm font-medium text-slate-100 line-clamp-1">{pack.title}</p>
                              <p className="mt-1 text-xs text-slate-500">{pack.scopeLabel}</p>
                            </div>
                            <Badge className="bg-white/5 text-slate-300 border-white/10 shrink-0">{pack.itemCount}</Badge>
                          </div>
                          <div className="mt-3 h-2.5 rounded-full bg-white/6 overflow-hidden">
                            <div
                              className="h-full rounded-full bg-[linear-gradient(90deg,#3b82f6,#8b5cf6)]"
                              style={{
                                width: `${maxEvidencePackItems ? Math.max(18, (pack.itemCount / maxEvidencePackItems) * 100) : 18}%`,
                              }}
                            />
                          </div>
                        </button>
                      ))}
                    </div>
                  </section>

                  <section className="rounded-2xl border border-white/5 bg-[#0b1120] p-4">
                    <div className="mb-3 flex items-center justify-between gap-3">
                      <div>
                        <p className="dashboard-eyebrow">Prompt Inspections</p>
                        <p className="mt-1 text-xs text-slate-500">Highest captured prompt loads</p>
                      </div>
                      <span className="text-xs text-slate-500">
                        Peak {maxPromptInspectionCredits ? formatConsumption(maxPromptInspectionCredits) : "None"}
                      </span>
                    </div>
                    <div className="space-y-3">
                      {promptInspections.map((interaction) => {
                        const width = maxPromptInspectionCredits
                          ? Math.max(18, (interaction.estimatedCredits / maxPromptInspectionCredits) * 100)
                          : 18;

                        return (
                          <button
                            key={interaction.id}
                            type="button"
                            onClick={() => setEvidenceInteractionId(interaction.id)}
                            className="w-full rounded-xl border border-white/5 bg-[#111827] p-3 text-left transition-colors hover:bg-white/[0.03]"
                          >
                            <div className="flex items-center justify-between gap-3">
                              <p className="min-w-0 flex-1 text-sm font-medium text-slate-100 line-clamp-1">{interaction.useCaseLabel}</p>
                              <Badge className="bg-white/5 text-slate-300 border-white/10 shrink-0">
                                {formatConsumption(interaction.estimatedCredits)}
                              </Badge>
                            </div>
                            <div className="mt-3 flex items-center gap-3">
                              <div className="h-2.5 flex-1 rounded-full bg-white/6 overflow-hidden">
                                <div
                                  className="h-full rounded-full bg-[linear-gradient(90deg,#3b82f6,#8b5cf6)]"
                                  style={{ width: `${width}%` }}
                                />
                              </div>
                              <span className="text-xs font-medium text-slate-400 whitespace-nowrap">
                                {interaction.promptChars.toLocaleString()} chars
                              </span>
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  </section>
                </div>
              </TabsContent>

              <TabsContent value="export" className="mt-5 space-y-5">
                <div className="grid gap-4 xl:grid-cols-[1fr_0.95fr]">
                  <section className="rounded-2xl border border-white/5 bg-black/20 p-4">
                    <p className="dashboard-eyebrow mb-3">Decision Handoff</p>
                    <div className="space-y-3">
                      {reportScope.recommendations.slice(0, 2).map((recommendation) => (
                        <div key={recommendation.id} className="rounded-xl border border-white/5 bg-[#0b1120] p-3">
                          <div className="flex items-center justify-between gap-3">
                            <p className="min-w-0 flex-1 text-sm font-medium text-slate-100 line-clamp-1">{recommendation.title}</p>
                            <Badge className="bg-white/5 text-slate-300 border-white/10">{recommendation.type}</Badge>
                          </div>
                          <p className="mt-2 text-xs text-slate-500 line-clamp-2">{recommendation.recommendedAction}</p>
                        </div>
                      ))}
                    </div>
                  </section>

                  <section className="rounded-2xl border border-white/5 bg-black/20 p-4">
                    <p className="dashboard-eyebrow mb-3">Current Cost Drivers</p>
                    <div className="space-y-3">
                      {reportScope.useCases.slice(0, 3).map((useCase) => (
                        <div key={useCase.key} className="rounded-xl border border-white/5 bg-[#0b1120] p-3">
                          <div className="flex items-center justify-between gap-4">
                            <p className="min-w-0 flex-1 text-sm font-medium text-slate-100 line-clamp-1">{useCase.label}</p>
                            <span className="text-sm text-slate-200 whitespace-nowrap">
                              {formatConsumption(useCase.totalConsumption)}
                            </span>
                          </div>
                          <div className="mt-3 h-2.5 rounded-full bg-white/6 overflow-hidden">
                            <div
                              className="h-full rounded-full bg-[linear-gradient(90deg,#3b82f6,#14b8a6)]"
                              style={{
                                width: `${topUseCaseMax ? Math.max(20, (useCase.totalConsumption / topUseCaseMax) * 100) : 20}%`,
                              }}
                            />
                          </div>
                        </div>
                      ))}
                    </div>
                  </section>
                </div>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function SummaryRail({
  label,
  value,
  max,
  color,
}: {
  label: string;
  value: number;
  max: number;
  color: string;
}) {
  return (
    <div className="rounded-xl border border-white/6 bg-black/20 px-3 py-3">
      <div className="flex items-center justify-between gap-3">
        <p className="text-sm font-medium text-slate-200">{label}</p>
        <span className="text-xs text-slate-400">{value}</span>
      </div>
      <div className="mt-2 h-2 rounded-full bg-white/6 overflow-hidden">
        <div className="h-full rounded-full" style={{ width: `${max ? Math.max(12, (value / max) * 100) : 12}%`, backgroundColor: color }} />
      </div>
    </div>
  );
}

function resolveScopeReference(scopeLabel: string): { scopeType: ScopeType; scopeId: string } {
  if (scopeLabel === "Enterprise") {
    return { scopeType: "Enterprise", scopeId: "enterprise" };
  }

  const costCenter = TELEMETRY_DATA.costCenters.find((item) => item.name === scopeLabel);
  if (costCenter) {
    return { scopeType: "Cost Center", scopeId: costCenter.id };
  }

  const team = TELEMETRY_DATA.teams.find((item) => item.name === scopeLabel);
  if (team) {
    return { scopeType: "Team", scopeId: team.id };
  }

  const engineer = TELEMETRY_DATA.engineers.find((item) => item.name === scopeLabel);
  if (engineer) {
    return { scopeType: "Engineer", scopeId: engineer.userId };
  }

  return { scopeType: "Enterprise", scopeId: "enterprise" };
}

function resolveScopedDataset(scopeType: ScopeType, scopeId: string) {
  if (scopeType === "Enterprise") {
    return {
      label: "Enterprise",
      totalConsumption: TELEMETRY_DATA.kpis.totalConsumption,
      overrun: TELEMETRY_DATA.kpis.overrun,
      topUseCase: TELEMETRY_DATA.kpis.topUseCase,
      topModel: TELEMETRY_DATA.costCenters[0]?.topModel ?? "N/A",
      useCases: TELEMETRY_DATA.useCases,
      recommendations: TELEMETRY_DATA.recommendations,
      interactions: TELEMETRY_DATA.interactions,
    };
  }

  if (scopeType === "Cost Center") {
    const costCenter = TELEMETRY_DATA.costCenters.find((item) => item.id === scopeId) ?? TELEMETRY_DATA.costCenters[0];
    return {
      label: costCenter?.name ?? "Cost Center",
      totalConsumption: costCenter?.totalConsumption ?? 0,
      overrun: costCenter?.overrun ?? 0,
      topUseCase: costCenter?.topUseCase ?? "N/A",
      topModel: costCenter?.topModel ?? "N/A",
      useCases: getUseCaseSummariesForScope({ costCenterId: costCenter?.id }),
      recommendations: getRecommendationsForScope("Cost Center", costCenter?.id ?? ""),
      interactions: getInteractionsForScope({ costCenterId: costCenter?.id }),
    };
  }

  if (scopeType === "Team") {
    const team = TELEMETRY_DATA.teams.find((item) => item.id === scopeId) ?? TELEMETRY_DATA.teams[0];
    return {
      label: team?.name ?? "Team",
      totalConsumption: team?.totalConsumption ?? 0,
      overrun: team?.overrun ?? 0,
      topUseCase: team?.topUseCase ?? "N/A",
      topModel: team?.topModel ?? "N/A",
      useCases: getUseCaseSummariesForScope({ teamId: team?.id }),
      recommendations: getRecommendationsForScope("Team", team?.id ?? ""),
      interactions: getInteractionsForScope({ teamId: team?.id }),
    };
  }

  const engineer = TELEMETRY_DATA.engineers.find((item) => item.userId === scopeId) ?? TELEMETRY_DATA.engineers[0];
  return {
    label: engineer?.name ?? "Engineer",
    totalConsumption: engineer?.totalConsumption ?? 0,
    overrun: engineer?.overrun ?? 0,
    topUseCase: engineer?.topUseCase ?? "N/A",
    topModel: engineer?.topModel ?? "N/A",
    useCases: getUseCaseSummariesForScope({ engineerId: engineer?.userId }),
    recommendations: [
      ...getRecommendationsForScope("Engineer", engineer?.userId ?? ""),
      ...getRecommendationsForScope("Team", engineer?.teamId ?? ""),
    ].filter((recommendation, index, all) => all.findIndex((item) => item.id === recommendation.id) === index),
    interactions: getInteractionsForScope({ engineerId: engineer?.userId }),
  };
}

function buildReportTitle(scopeType: ScopeType, label: string) {
  if (scopeType === "Enterprise") return "Enterprise AI Governance Review";
  if (scopeType === "Cost Center") return `${label} Strategic Governance Review`;
  if (scopeType === "Team") return `${label} Team Optimization Report`;
  return `${label} Engineer Activity Review`;
}

function buildExecutiveSummary(
  dataset: ReturnType<typeof resolveScopedDataset>,
  audience: Audience,
) {
  const action = dataset.recommendations[0];
  const audienceLead =
    audience === "Executive Sponsor"
      ? "Leadership should focus first on concentration, overrun posture, and route-to-value controls."
      : audience === "Delivery Manager"
        ? "Delivery leadership should focus on workflow ownership, prompt discipline, and team-level model choices."
        : "Architecture review should focus on use-case fit, model routing, and tool-driven context expansion.";

  return `${audienceLead} ${dataset.label} currently drives ${formatConsumption(dataset.totalConsumption)} credits with ${formatConsumption(dataset.overrun)} overrun credits. ${
    action ? `Top recommended action: ${action.title}.` : "No single recommendation dominates this slice."
  }`;
}

function ModalField({
  label,
  children,
}: {
  label: string;
  children: ReactNode;
}) {
  return (
    <div className="space-y-2">
      <label className="dashboard-body">{label}</label>
      {children}
    </div>
  );
}

function MetricCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-white/5 bg-[#0b1120] p-4">
      <p className="dashboard-metric-label">{label}</p>
      <p className="dashboard-metric-value mt-3">{value}</p>
    </div>
  );
}

function deriveReportConfidence(recommendationCount: number, evidencePackCount: number, inspectionCount: number) {
  const confidenceScore = recommendationCount * 2 + evidencePackCount + Math.min(inspectionCount, 3);
  if (confidenceScore >= 8) return "High confidence";
  if (confidenceScore >= 5) return "Medium confidence";
  return "Needs stronger evidence";
}

function resolveReportOwner(audience: Audience) {
  if (audience === "Executive Sponsor") return "Governance lead";
  if (audience === "Delivery Manager") return "Delivery manager";
  return "Architecture lead";
}
