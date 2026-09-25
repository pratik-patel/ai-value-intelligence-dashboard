import { useEffect, useMemo, useState } from "react";
import { format, parseISO, startOfWeek } from "date-fns";
import {
  ArrowRight,
  Compass,
  Eye,
  Layers3,
  Search,
  Sparkles,
  Zap,
} from "lucide-react";
import { Link } from "wouter";
import {
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

import { EvidenceDrawer } from "@/components/EvidenceDrawer";
import { ExperienceHeader } from "@/components/experience/ExperienceHeader";
import { LollipopRanking } from "@/components/experience/LollipopRanking";
import { SignalRing } from "@/components/experience/SignalRing";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  type EngineerFunction,
  TELEMETRY_DATA,
  formatConsumption,
  getEngineersForTeam,
  getInteractionsForScope,
  getRecommendationsForScope,
  getTeamsForCostCenter,
  getUseCaseSummariesForScope,
} from "@/lib/telemetry-data";

const CHART_BLUE = "#4B8BFF";
const CHART_GRID = "rgba(148, 163, 184, 0.12)";

type ScopeType = "Cost Center" | "Team" | "Engineer";

type ScopeSummary = {
  label: string;
  type: ScopeType;
  id: string;
  detailHref: string;
  subtitle: string;
};

const ENGINEER_FUNCTION_STYLES: Record<EngineerFunction, string> = {
  FE: "bg-sky-500/12 text-sky-300 border-sky-500/20",
  BE: "bg-indigo-500/12 text-indigo-300 border-indigo-500/20",
  QA: "bg-emerald-500/12 text-emerald-300 border-emerald-500/20",
  AI: "bg-fuchsia-500/12 text-fuchsia-300 border-fuchsia-500/20",
};

function formatChartDate(value: string) {
  return new Intl.DateTimeFormat("en-US", { month: "short", day: "numeric" }).format(new Date(`${value}T00:00:00`));
}

function groupInteractionsByDay(interactions: ReturnType<typeof getInteractionsForScope>) {
  const map = new Map<string, number>();
  interactions.forEach((interaction) => {
    const day = interaction.timestamp.slice(0, 10);
    map.set(day, (map.get(day) ?? 0) + interaction.estimatedCredits);
  });

  return Array.from(map.entries())
    .map(([date, consumption]) => ({
      date,
      consumption: Number(consumption.toFixed(1)),
    }))
    .sort((a, b) => a.date.localeCompare(b.date));
}

function formatWindowLabel(startDate?: string, endDate?: string) {
  if (!startDate || !endDate) return "Selected activity window";
  return `${formatChartDate(startDate)} - ${formatChartDate(endDate)}`;
}

function engineerDetailHref(engineerId: string) {
  return `/detail/engineer/${engineerId}`;
}

export default function UsageExplorer() {
  const [search, setSearch] = useState("");
  const [selectedCostCenterId, setSelectedCostCenterId] = useState(TELEMETRY_DATA.costCenters[0]?.id ?? "");
  const [selectedTeamId, setSelectedTeamId] = useState("");
  const [selectedEngineerId, setSelectedEngineerId] = useState("");
  const [evidenceInteractionId, setEvidenceInteractionId] = useState<string | null>(null);

  const filteredCostCenters = useMemo(() => {
    const query = search.trim().toLowerCase();
    if (!query) return TELEMETRY_DATA.costCenters;
    return TELEMETRY_DATA.costCenters.filter((costCenter) => costCenter.name.toLowerCase().includes(query));
  }, [search]);

  const selectedCostCenter =
    TELEMETRY_DATA.costCenters.find((costCenter) => costCenter.id === selectedCostCenterId) ?? TELEMETRY_DATA.costCenters[0] ?? null;
  const teamsForCostCenter = selectedCostCenter ? getTeamsForCostCenter(selectedCostCenter.id) : [];

  useEffect(() => {
    if (selectedTeamId && !teamsForCostCenter.some((team) => team.id === selectedTeamId)) setSelectedTeamId("");
  }, [selectedTeamId, teamsForCostCenter]);

  const selectedTeam = teamsForCostCenter.find((team) => team.id === selectedTeamId) ?? null;
  const engineersForScope = useMemo(() => {
    if (selectedTeam) {
      return getEngineersForTeam(selectedTeam.id).sort((left, right) => right.totalConsumption - left.totalConsumption);
    }
    if (selectedCostCenter) {
      return TELEMETRY_DATA.engineers
        .filter((engineer) => engineer.costCenterId === selectedCostCenter.id)
        .sort((left, right) => right.totalConsumption - left.totalConsumption);
    }
    return [];
  }, [selectedCostCenter, selectedTeam]);

  useEffect(() => {
    if (!selectedEngineerId) return;
    if (!engineersForScope.some((engineer) => engineer.userId === selectedEngineerId || engineer.id === selectedEngineerId)) {
      setSelectedEngineerId("");
    }
  }, [engineersForScope, selectedEngineerId]);

  const selectedEngineer =
    engineersForScope.find((engineer) => engineer.userId === selectedEngineerId || engineer.id === selectedEngineerId) ?? null;

  const currentScope = useMemo<ScopeSummary | null>(() => {
    if (selectedEngineer) {
      return {
        label: selectedEngineer.name,
        type: "Engineer",
        id: selectedEngineer.userId,
        detailHref: `/detail/engineer/${selectedEngineer.id}`,
        subtitle: `${selectedEngineer.teamName} · ${selectedEngineer.engineerFunction} · ${selectedEngineer.subscriptionTier} · ${selectedEngineer.activeDays} active days`,
      };
    }
    if (selectedTeam) {
      return {
        label: selectedTeam.name,
        type: "Team",
        id: selectedTeam.id,
        detailHref: `/detail/team/${selectedTeam.id}`,
        subtitle: `${selectedTeam.engineeringManager} · ${selectedTeam.activeEngineers} engineers in scope`,
      };
    }
    if (selectedCostCenter) {
      return {
        label: selectedCostCenter.name,
        type: "Cost Center",
        id: selectedCostCenter.id,
        detailHref: `/detail/cost-center/${selectedCostCenter.id}`,
        subtitle: `${selectedCostCenter.teamCount} teams · ${selectedCostCenter.activeEngineers} active engineers`,
      };
    }
    return null;
  }, [selectedCostCenter, selectedEngineer, selectedTeam]);

  const scopedInteractions = useMemo(() => {
    if (selectedEngineer) return getInteractionsForScope({ engineerId: selectedEngineer.userId });
    if (selectedTeam) return getInteractionsForScope({ teamId: selectedTeam.id });
    if (selectedCostCenter) return getInteractionsForScope({ costCenterId: selectedCostCenter.id });
    return [];
  }, [selectedCostCenter, selectedEngineer, selectedTeam]);

  const scopedUseCases = useMemo(() => {
    if (selectedEngineer) return getUseCaseSummariesForScope({ engineerId: selectedEngineer.userId });
    if (selectedTeam) return getUseCaseSummariesForScope({ teamId: selectedTeam.id });
    if (selectedCostCenter) return getUseCaseSummariesForScope({ costCenterId: selectedCostCenter.id });
    return [];
  }, [selectedCostCenter, selectedEngineer, selectedTeam]);

  const scopedRecommendations = useMemo(() => {
    if (selectedEngineer) return getRecommendationsForScope("Engineer", selectedEngineer.userId);
    if (selectedTeam) return getRecommendationsForScope("Team", selectedTeam.id);
    if (selectedCostCenter) return getRecommendationsForScope("Cost Center", selectedCostCenter.id);
    return [];
  }, [selectedCostCenter, selectedEngineer, selectedTeam]);

  const teamContributionData = useMemo(() => {
    if (selectedTeam) {
      return getEngineersForTeam(selectedTeam.id)
        .map((engineer) => ({
          name: engineer.name,
          engineerFunction: engineer.engineerFunction,
          engineerUserId: engineer.userId,
          credits: Number(engineer.totalConsumption.toFixed(1)),
          overrun: engineer.overrun,
        }))
        .sort((a, b) => b.credits - a.credits);
    }

    return teamsForCostCenter
      .map((team) => ({
        name: team.name,
        teamId: team.id,
        credits: Number(team.totalConsumption.toFixed(1)),
        overrun: team.overrun,
      }))
      .sort((a, b) => b.credits - a.credits);
  }, [selectedTeam, teamsForCostCenter]);

  const contributionChartData = useMemo(
    () => teamContributionData.slice(0, selectedTeam ? 10 : 8),
    [selectedTeam, teamContributionData],
  );

  const dailyTrendData = useMemo(() => groupInteractionsByDay(scopedInteractions), [scopedInteractions]);

  const weeklyEngineerMatrix = useMemo(() => {
    const weekOrder: string[] = [];
    const weekLabels = new Map<string, string>();
    const engineerWeekCredits = new Map<string, Map<string, number>>();

    scopedInteractions.forEach((interaction) => {
      const weekStart = format(
        startOfWeek(parseISO(interaction.timestamp), { weekStartsOn: 1 }),
        "yyyy-MM-dd",
      );
      if (!weekLabels.has(weekStart)) {
        weekLabels.set(weekStart, format(parseISO(weekStart), "MMM d"));
        weekOrder.push(weekStart);
      }
      if (!engineerWeekCredits.has(interaction.engineerId)) {
        engineerWeekCredits.set(interaction.engineerId, new Map());
      }
      const engineerWeeks = engineerWeekCredits.get(interaction.engineerId)!;
      engineerWeeks.set(weekStart, (engineerWeeks.get(weekStart) || 0) + interaction.estimatedCredits);
    });

    const orderedWeeks = weekOrder.sort((left, right) => left.localeCompare(right)).slice(-6);
    return engineersForScope
      .map((engineer) => {
        const engineerWeeks = engineerWeekCredits.get(engineer.userId) ?? new Map<string, number>();
        return {
          engineer,
          weeks: orderedWeeks.map((week) => ({
            key: week,
            label: weekLabels.get(week) ?? week,
            credits: Number((engineerWeeks.get(week) || 0).toFixed(1)),
          })),
        };
      })
      .sort((left, right) => right.engineer.totalConsumption - left.engineer.totalConsumption)
      .slice(0, 6);
  }, [engineersForScope, scopedInteractions]);
  const weeklyEngineerMax = weeklyEngineerMatrix.reduce(
    (max, row) => Math.max(max, ...row.weeks.map((week) => week.credits)),
    0,
  );
  const hasWeeklyOverrunHighlights = weeklyEngineerMatrix.some(
    (row) => row.engineer.overrun > 0 && row.weeks.some((week) => week.credits > 0),
  );

  const watchlistEngineers = useMemo(() => {
    return engineersForScope
      .map((engineer) => {
        const reasons: string[] = [];
        if (engineer.activeDays <= 3 && engineer.totalConsumption > 0) reasons.push("Low seat utilization");
        if (engineer.overrun > 0) reasons.push("Overrun detected");
        if (engineer.subscriptionStatus === "Pending") reasons.push("Pending activation");
        if (engineer.subscriptionStatus === "Canceled") reasons.push("Canceled subscription");

        return {
          ...engineer,
          reasons,
        };
      })
      .filter((engineer) => engineer.reasons.length > 0)
      .sort((a, b) => b.totalConsumption - a.totalConsumption)
      .slice(0, 5);
  }, [engineersForScope]);

  const highCostInteractions = useMemo(
    () => [...scopedInteractions].sort((a, b) => b.estimatedCredits - a.estimatedCredits).slice(0, 6),
    [scopedInteractions],
  );
  const topEngineerFocusRows = engineersForScope.slice(0, 5);
  const topEngineerCreditsMax = topEngineerFocusRows[0]?.totalConsumption ?? 0;

  const chargebackRows = useMemo(
    () => [...engineersForScope].sort((a, b) => b.totalConsumption - a.totalConsumption),
    [engineersForScope],
  );

  const evidenceRichCount = scopedInteractions.filter(
    (interaction) => interaction.evidence.chatCount > 0 || interaction.evidence.inlineCount > 0,
  ).length;

  const peakDay = dailyTrendData.reduce(
    (peak, entry) => (entry.consumption > peak.consumption ? entry : peak),
    dailyTrendData[0] ?? { date: "", consumption: 0 },
  );

  const topUseCase = scopedUseCases[0];
  const selectedWindow = dailyTrendData.length
    ? formatWindowLabel(dailyTrendData[0].date, dailyTrendData[dailyTrendData.length - 1].date)
    : "Selected activity window";
  const isContributionTruncated = contributionChartData.length < teamContributionData.length;
  const scopedConsumption = scopedInteractions.reduce((sum, interaction) => sum + interaction.estimatedCredits, 0);
  const contributionRankingItems = contributionChartData.map((entry) => ({
    label: entry.name,
    value: entry.credits,
    displayValue: `${formatConsumption(entry.credits)} credits`,
    note: entry.overrun > 0 ? `${formatConsumption(entry.overrun)} credits overrun` : "Within current plan",
    accent: entry.overrun > 0 ? ("alert" as const) : ("default" as const),
    onClick: () => handleContributionClick(entry),
  }));
  const requestSourceMix = Array.from(
    scopedInteractions.reduce((acc, interaction) => {
      acc.set(interaction.requestSource, (acc.get(interaction.requestSource) || 0) + interaction.estimatedCredits);
      return acc;
    }, new Map<string, number>()),
  )
    .sort((left, right) => right[1] - left[1])
    .slice(0, 4)
    .map(([label, value], index) => ({
      label,
      value: Number(value.toFixed(1)),
      color: ["#38bdf8", "#818cf8", "#14b8a6", "#f59e0b"][index % 4],
      note: `${formatConsumption(value)} credits`,
    }));
  const explorerHeaderStats = [
    {
      label: "Current Focus",
      value: currentScope?.label ?? "Enterprise drilldown",
      note: currentScope?.subtitle ?? "Choose a cost center, team, or engineer to begin the drill path.",
    },
    {
      label: "Scoped Consumption",
      value: `${formatConsumption(scopedConsumption)} credits`,
      note: `${scopedInteractions.length} interactions across ${selectedWindow.toLowerCase()}.`,
    },
    {
      label: "Highest Pressure Day",
      value: peakDay.date ? formatChartDate(peakDay.date) : "No peak yet",
      note: peakDay.consumption ? `${formatConsumption(peakDay.consumption)} credits` : "Awaiting scoped interactions.",
    },
    {
      label: "Evidence Coverage",
      value: `${evidenceRichCount} traces`,
      note: `${scopedRecommendations.length} recommendations are already linked to this scope.`,
    },
  ];
  const explorerJourney = [
    {
      label: "Focus",
      detail: "Lock onto the cost center or team that needs explanation first.",
      state: "complete" as const,
    },
    {
      label: "Compare",
      detail: "Balance contribution, trend, and engineer activity without leaving the same page.",
      state: "active" as const,
    },
    {
      label: "Trace",
      detail: "Open evidence-rich interactions and follow the scope into detailed workspaces.",
      state: "upcoming" as const,
    },
    {
      label: "Chargeback",
      detail: "Hand finance-grade allocation details back to the operating teams.",
      state: "upcoming" as const,
    },
  ];

  function handleContributionClick(payload: { teamId?: string; engineerUserId?: string } | undefined) {
    if (!payload) return;
    if (payload.engineerUserId) {
      setSelectedEngineerId(payload.engineerUserId);
      return;
    }
    if (payload.teamId) {
      setSelectedTeamId(payload.teamId);
      setSelectedEngineerId("");
    }
  }

  return (
    <div className="p-8 max-w-[1680px] mx-auto space-y-6 animate-in fade-in duration-500">
      <EvidenceDrawer
        open={Boolean(evidenceInteractionId)}
        onOpenChange={(open) => !open && setEvidenceInteractionId(null)}
        interactionId={evidenceInteractionId}
      />

      <ExperienceHeader
        eyebrow="Organization"
        title="Enterprise → Portfolio → Team → User"
        lead="Start with portfolio contribution, drill into teams and users, and compare usage patterns without losing organizational context."
        stats={explorerHeaderStats}
        journey={explorerJourney}
        actions={
          <>
            <Link href="/recommendations">
              <Button variant="outline" className="bg-black/20 border-white/10 hover:bg-white/5 hover:text-white">
                <Sparkles className="w-4 h-4 mr-2 text-blue-300" />
                View Recommendations
              </Button>
            </Link>
            {currentScope ? (
              <Link href={currentScope.detailHref}>
                <Button variant="outline" className="bg-black/20 border-white/10 hover:bg-white/5 hover:text-white">
                  <Layers3 className="w-4 h-4 mr-2 text-slate-300" />
                  Open Detailed Workspace
                </Button>
              </Link>
            ) : null}
            <Link href="/studio">
              <Button className="bg-blue-600 hover:bg-blue-500 text-white border border-blue-500/40 shadow-[0_0_20px_rgba(37,99,235,0.18)]">
                <Zap className="w-4 h-4 mr-2" />
                Simulate Policy
              </Button>
            </Link>
          </>
        }
      />

      <Card className="bg-[#111827] border-white/5 shadow-lg overflow-hidden">
        <CardHeader className="bg-black/20 border-b border-white/5">
          <CardTitle className="dashboard-card-title text-slate-100">Explorer Scope</CardTitle>
        </CardHeader>
        <CardContent className="space-y-5 pt-5">
          <div className="relative max-w-xl">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
            <Input
              placeholder="Filter cost centers by name..."
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              className="pl-9 bg-[#0B1120] border-white/10 text-slate-200 placeholder:text-slate-500 focus-visible:ring-blue-500"
            />
          </div>

          <div className="space-y-3">
            <p className="dashboard-eyebrow">Cost Centers</p>
            <div className="flex flex-wrap gap-2">
              {filteredCostCenters.map((costCenter) => (
                <Button
                  key={costCenter.id}
                  type="button"
                  variant={selectedCostCenter?.id === costCenter.id ? "default" : "outline"}
                  className={
                    selectedCostCenter?.id === costCenter.id
                      ? "bg-blue-600 text-white border border-blue-500/50"
                      : "bg-[#0B1120] border-white/10 text-slate-300 hover:bg-white/5 hover:text-white"
                  }
                  onClick={() => {
                    setSelectedCostCenterId(costCenter.id);
                    setSelectedTeamId("");
                    setSelectedEngineerId("");
                  }}
                >
                  {costCenter.name}
                </Button>
              ))}
            </div>
          </div>

          {teamsForCostCenter.length ? (
            <div className="space-y-3">
              <p className="dashboard-eyebrow">Teams</p>
              <div className="flex flex-wrap gap-2">
                {teamsForCostCenter.map((team) => (
                  <Button
                    key={team.id}
                    type="button"
                    variant={selectedTeam?.id === team.id ? "default" : "outline"}
                    className={
                      selectedTeam?.id === team.id
                        ? "bg-slate-700 text-white border border-slate-500/50"
                        : "bg-[#0B1120] border-white/10 text-slate-300 hover:bg-white/5 hover:text-white"
                    }
                    onClick={() => {
                      setSelectedTeamId(team.id);
                      setSelectedEngineerId("");
                    }}
                  >
                    {team.name}
                  </Button>
                ))}
              </div>
            </div>
          ) : null}

          {engineersForScope.length ? (
            <div className="space-y-3">
              <div className="flex items-center justify-between gap-3">
                <p className="dashboard-eyebrow">Top Engineers</p>
                {selectedEngineer ? (
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="text-slate-400 hover:text-white hover:bg-white/5"
                    onClick={() => setSelectedEngineerId("")}
                  >
                    Clear engineer focus
                  </Button>
                ) : null}
              </div>
              <div className="rounded-2xl border border-white/6 bg-[#0B1120] p-2">
                <div className="space-y-2">
                {topEngineerFocusRows.map((engineer) => (
                  <div
                    key={engineer.userId}
                    role="button"
                    tabIndex={0}
                    className={
                      selectedEngineer?.userId === engineer.userId
                        ? "w-full rounded-xl bg-[#1D4ED8] text-white border border-blue-400/50 px-3 py-3 cursor-pointer"
                        : "w-full rounded-xl bg-transparent border border-white/8 text-slate-300 hover:bg-white/5 hover:text-white px-3 py-3 cursor-pointer"
                    }
                    onClick={() => setSelectedEngineerId(engineer.userId)}
                    onKeyDown={(event) => {
                      if (event.key === "Enter" || event.key === " ") {
                        event.preventDefault();
                        setSelectedEngineerId(engineer.userId);
                      }
                    }}
                  >
                    <div className="grid w-full gap-3 text-left md:grid-cols-[minmax(0,1fr)_minmax(0,0.9fr)_120px] md:items-center">
                      <div className="min-w-0">
                        <div className="flex flex-wrap items-center gap-2">
                          <Link href={engineerDetailHref(engineer.id)}>
                            <span
                              className="truncate font-medium hover:underline underline-offset-4"
                              onClick={(event) => event.stopPropagation()}
                            >
                              {engineer.name}
                            </span>
                          </Link>
                          <FunctionBadge role={engineer.engineerFunction} />
                        </div>
                      </div>
                      <div className="min-w-0">
                        <div className="h-2 rounded-full bg-white/6 overflow-hidden">
                          <div
                            className={`h-full rounded-full ${selectedEngineer?.userId === engineer.userId ? "bg-white/75" : "bg-blue-400/85"}`}
                            style={{ width: `${topEngineerCreditsMax ? (engineer.totalConsumption / topEngineerCreditsMax) * 100 : 0}%` }}
                          />
                        </div>
                        <p className="mt-1 text-xs text-slate-400">{engineer.activeDays} active days</p>
                      </div>
                      <div className="text-sm font-medium md:text-right">
                        {formatConsumption(engineer.totalConsumption)} credits
                      </div>
                    </div>
                  </div>
                ))}
                </div>
              </div>
            </div>
          ) : null}

          {currentScope ? (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-3">
              <ScopeStat
                label="Current Focus"
                value={currentScope.label}
                detail={currentScope.type}
                icon={<Compass className="w-4 h-4 text-blue-300" />}
              />
              <ScopeStat
                label="Consumption"
                value={`${formatConsumption(scopedInteractions.reduce((sum, interaction) => sum + interaction.estimatedCredits, 0))} credits`}
                detail={currentScope.subtitle}
                icon={<Zap className="w-4 h-4 text-blue-300" />}
              />
              <ScopeStat
                label="Use Case in Focus"
                value={topUseCase?.label ?? "No dominant use case"}
                detail={topUseCase ? `${formatConsumption(topUseCase.totalConsumption)} credits` : "Awaiting scoped interactions"}
                icon={<Sparkles className="w-4 h-4 text-blue-300" />}
              />
              <ScopeStat
                label="Evidence Traces"
                value={String(evidenceRichCount)}
                detail={`${scopedRecommendations.length} recommendations in scope`}
                icon={<Eye className="w-4 h-4 text-blue-300" />}
              />
            </div>
          ) : null}
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 xl:grid-cols-[0.92fr_1.08fr] gap-6">
        <Card className="bg-[#111827] border-white/5 shadow-lg overflow-hidden">
          <CardHeader className="bg-black/20 border-b border-white/5">
            <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
              <div>
                <CardTitle className="dashboard-card-title text-slate-100">
                  {selectedTeam ? "Engineer Contribution" : "Team Contribution"}
                </CardTitle>
                <CardDescription className="text-slate-400">{selectedWindow}</CardDescription>
              </div>
              <div className="flex flex-wrap items-center gap-2 text-xs text-slate-400">
                <span className="inline-flex items-center gap-2 rounded-full border border-white/8 bg-[#0B1120] px-3 py-1">
                  <span className="h-2 w-2 rounded-full bg-[#4B8BFF]" />
                  Credits
                </span>
                <span className="inline-flex items-center gap-2 rounded-full border border-white/8 bg-[#0B1120] px-3 py-1">
                  <span className="h-2 w-2 rounded-full bg-[#FFB443]" />
                  Overrun present
                </span>
                {isContributionTruncated ? (
                  <span className="rounded-full border border-white/8 bg-[#0B1120] px-3 py-1">
                    Showing top {contributionChartData.length}
                  </span>
                ) : null}
              </div>
            </div>
          </CardHeader>
          <CardContent className="pt-5">
            <LollipopRanking
              title={selectedTeam ? "Engineer Consumption Ladder" : "Team Consumption Ladder"}
              description="A more decision-friendly comparison of who is driving spend and which rows already carry overrun."
              items={contributionRankingItems}
            />
          </CardContent>
        </Card>

        <Card className="bg-[#111827] border-white/5 shadow-lg overflow-hidden">
          <CardHeader className="bg-black/20 border-b border-white/5">
            <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
              <div>
                <CardTitle className="dashboard-card-title text-slate-100">Daily AI Consumption</CardTitle>
                <CardDescription className="text-slate-400">{selectedWindow}</CardDescription>
              </div>
              <div className="rounded-2xl border border-white/8 bg-[#0B1120] px-4 py-3 min-w-[220px]">
                <p className="dashboard-metric-label">Peak Day</p>
                <p className="dashboard-metric-value text-slate-100">{formatChartDate(peakDay.date || TELEMETRY_DATA.meta.lastUpdated)}</p>
                <p className="text-sm text-slate-400 mt-1">
                  {peakDay.consumption ? `${formatConsumption(peakDay.consumption)} credits` : "No scoped interactions"}
                </p>
              </div>
            </div>
          </CardHeader>
          <CardContent className="pt-5">
            <div className="h-[280px]">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={dailyTrendData} margin={{ top: 8, right: 12, left: 6, bottom: 30 }}>
                  <CartesianGrid stroke={CHART_GRID} strokeDasharray="3 3" vertical={false} />
                  <XAxis
                    dataKey="date"
                    tick={{ fill: "#94A3B8", fontSize: 12 }}
                    tickFormatter={(value) => formatChartDate(value).replace(" ", "-")}
                    tickLine={false}
                    axisLine={false}
                    angle={-32}
                    textAnchor="end"
                    height={44}
                    label={{ value: "Date", position: "insideBottom", dy: 28, fill: "#94A3B8", fontSize: 12 }}
                  />
                  <YAxis
                    tick={{ fill: "#94A3B8", fontSize: 12 }}
                    tickLine={false}
                    axisLine={false}
                    label={{ value: "Credits", angle: -90, position: "insideLeft", fill: "#94A3B8", fontSize: 12 }}
                  />
                  <Tooltip
                    contentStyle={{
                      background: "#0F172A",
                      borderColor: "rgba(148,163,184,0.14)",
                      borderRadius: 16,
                      color: "#E2E8F0",
                    }}
                    labelFormatter={(label) => formatChartDate(String(label))}
                    formatter={(value: number) => [`${formatConsumption(value)} credits`, "Consumption"]}
                  />
                  <Line
                    type="monotone"
                    dataKey="consumption"
                    stroke={CHART_BLUE}
                    strokeWidth={3}
                    dot={{ r: 0 }}
                    activeDot={{ r: 6, fill: CHART_BLUE, stroke: "#F8FAFC", strokeWidth: 2 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
          </CardContent>
        </Card>
      </div>

      <SignalRing
        title="Request Source Pressure"
        centerLabel="scoped sources"
        centerValue={String(requestSourceMix.length)}
        items={requestSourceMix}
      />

      <div className="grid grid-cols-1 xl:grid-cols-[1.05fr_0.95fr] gap-6">
        <Card className="bg-[#111827] border-white/5 shadow-lg overflow-hidden">
          <CardHeader className="bg-black/20 border-b border-white/5">
            <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
              <div>
                <CardTitle className="dashboard-card-title text-slate-100">Weekly Engineer Spend</CardTitle>
                <CardDescription className="text-slate-400">{selectedWindow}</CardDescription>
              </div>
              <div className="flex flex-wrap items-center gap-2 text-xs text-slate-400">
                <span className="inline-flex items-center gap-2 rounded-full border border-white/8 bg-[#0B1120] px-3 py-1">
                  Last {weeklyEngineerMatrix[0]?.weeks.length ?? 0} weekly buckets
                </span>
                {hasWeeklyOverrunHighlights ? (
                  <span className="inline-flex items-center gap-2 rounded-full border border-amber-500/20 bg-amber-500/10 px-3 py-1 text-amber-200">
                    <span className="h-2 w-2 rounded-full bg-amber-300" />
                    Peak week for engineers with overrun
                  </span>
                ) : null}
              </div>
            </div>
          </CardHeader>
          <CardContent className="pt-5">
            <div className="space-y-3">
              {hasWeeklyOverrunHighlights ? (
                <p className="text-xs text-slate-400">
                  Amber cells mark each overrun engineer&apos;s heaviest week in the selected window.
                </p>
              ) : null}
              {weeklyEngineerMatrix.length ? (
                <>
                  <div className="grid grid-cols-[minmax(0,1.35fr)_repeat(6,minmax(0,0.8fr))_110px] gap-2 px-2">
                    <div className="text-[11px] uppercase tracking-[0.18em] text-slate-500">Engineer</div>
                    {weeklyEngineerMatrix[0]?.weeks.map((week) => (
                      <div key={week.key} className="text-center text-[11px] uppercase tracking-[0.18em] text-slate-500">
                        {week.label}
                      </div>
                    ))}
                    <div className="text-right text-[11px] uppercase tracking-[0.18em] text-slate-500">Total</div>
                  </div>
                  {weeklyEngineerMatrix.map((row) => (
                    (() => {
                      const peakWeekCredits = Math.max(...row.weeks.map((item) => item.credits));
                      return (
                        <div
                          key={row.engineer.userId}
                          className="grid grid-cols-[minmax(0,1.35fr)_repeat(6,minmax(0,0.8fr))_110px] items-center gap-2 rounded-2xl border border-white/6 bg-[#0B1120] px-3 py-3"
                        >
                          <div className="min-w-0">
                            <div className="flex flex-wrap items-center gap-2">
                              <Link href={engineerDetailHref(row.engineer.id)}>
                                <span className="text-sm font-medium text-slate-100 hover:underline underline-offset-4">
                                  {row.engineer.name}
                                </span>
                              </Link>
                              <FunctionBadge role={row.engineer.engineerFunction} />
                            </div>
                            <p className="mt-1 text-xs text-slate-500">{row.engineer.activeDays} active days</p>
                          </div>
                          {row.weeks.map((week) => {
                            const intensity = weeklyEngineerMax ? week.credits / weeklyEngineerMax : 0;
                            const isOverrunPeakWeek =
                              row.engineer.overrun > 0 && week.credits > 0 && week.credits === peakWeekCredits;
                            const fillClass =
                              week.credits === 0
                                ? "bg-white/[0.04] text-slate-600"
                                : isOverrunPeakWeek
                                  ? "bg-amber-500/22 text-amber-200 border border-amber-500/20"
                                  : "bg-blue-500/12 text-blue-100 border border-blue-500/14";
                            const label = isOverrunPeakWeek
                              ? `${row.engineer.name} peak overrun week on ${week.label}: ${formatConsumption(week.credits)} credits`
                              : `${row.engineer.name} on ${week.label}: ${week.credits > 0 ? `${formatConsumption(week.credits)} credits` : "no spend"}`;
                            return (
                              <div
                                key={`${row.engineer.userId}-${week.key}`}
                                className={`rounded-xl px-2 py-2 text-center text-xs font-medium ${fillClass}`}
                                style={{ opacity: week.credits === 0 ? 1 : 0.45 + intensity * 0.55 }}
                                title={label}
                              >
                                {week.credits > 0 ? formatConsumption(week.credits) : "—"}
                              </div>
                            );
                          })}
                          <div className="text-right text-sm font-medium text-slate-200">
                            {formatConsumption(row.engineer.totalConsumption)} credits
                          </div>
                        </div>
                      );
                    })()
                  ))}
                </>
              ) : (
                <div className="rounded-2xl border border-dashed border-white/10 bg-[#0B1120] px-4 py-10 text-center text-sm text-slate-500">
                  No weekly engineer activity was available in this scope.
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        <Card className="bg-[#111827] border-white/5 shadow-lg overflow-hidden">
          <CardHeader className="bg-black/20 border-b border-white/5">
            <CardTitle className="dashboard-card-title text-slate-100">License Hygiene Watchlist</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 pt-5">
            {watchlistEngineers.length ? (
              watchlistEngineers.map((engineer) => (
                <div key={engineer.userId} className="rounded-2xl border border-white/6 bg-[#0B1120] px-4 py-4">
                  <div className="flex items-start justify-between gap-3">
                    <div className="space-y-1 min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <Link href={engineerDetailHref(engineer.id)}>
                          <p className="dashboard-item-title hover:underline underline-offset-4 cursor-pointer">{engineer.name}</p>
                        </Link>
                        <FunctionBadge role={engineer.engineerFunction} />
                      </div>
                      <p className="text-sm text-slate-400">
                        {engineer.subscriptionTier} · {engineer.activeDays} active days · {formatConsumption(engineer.totalConsumption)} credits
                      </p>
                    </div>
                    <Badge className="bg-amber-500/12 text-amber-300 border border-amber-500/20">Watch</Badge>
                  </div>
                  <div className="flex flex-wrap gap-2 mt-3">
                    {engineer.reasons.map((reason) => (
                      <span
                        key={`${engineer.userId}-${reason}`}
                        className="inline-flex items-center rounded-full border border-white/8 bg-white/[0.03] px-2.5 py-1 text-xs text-slate-300"
                      >
                        {reason}
                      </span>
                    ))}
                  </div>
                </div>
              ))
            ) : (
              <div className="rounded-2xl border border-white/6 bg-[#0B1120] px-4 py-5 text-sm text-slate-400">
                No watchlist candidates in the current scope.
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <Card className="dashboard-panel">
        <CardHeader className="dashboard-panel-header">
          <CardTitle className="dashboard-card-title text-slate-100">Chargeback Detail</CardTitle>
        </CardHeader>
        <CardContent className="p-0 overflow-x-auto">
          <table className="dashboard-table min-w-[980px]">
            <thead className="dashboard-table-head">
              <tr>
                {["Engineer", "Cost Center", "Team", "Tier", "Active Days", "Messages", "Credits", "Overrun"].map((header) => (
                  <th key={header} className="dashboard-table-head-cell">
                    {header}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {chargebackRows.map((engineer) => (
                <tr key={engineer.userId} className="dashboard-table-row">
                  <td className="dashboard-table-cell-strong">
                    <div className="flex flex-wrap items-center gap-2 text-slate-200 font-medium">
                      <Link href={engineerDetailHref(engineer.id)}>
                        <span className="hover:underline underline-offset-4 cursor-pointer">{engineer.name}</span>
                      </Link>
                      <FunctionBadge role={engineer.engineerFunction} />
                    </div>
                  </td>
                  <td className="dashboard-table-cell text-slate-400">{engineer.costCenterName}</td>
                  <td className="dashboard-table-cell text-slate-400">{engineer.teamName}</td>
                  <td className="dashboard-table-cell text-slate-400">{engineer.subscriptionTier}</td>
                  <td className="dashboard-table-cell">{engineer.activeDays}</td>
                  <td className="dashboard-table-cell">{engineer.totalMessages.toLocaleString()}</td>
                  <td className="dashboard-table-cell-strong">{formatConsumption(engineer.totalConsumption)}</td>
                  <td className={`dashboard-table-cell ${engineer.overrun > 0 ? "text-amber-300" : "text-slate-500"}`}>
                    {formatConsumption(engineer.overrun)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 xl:grid-cols-[1.08fr_0.92fr] gap-6">
        <Card className="dashboard-panel">
          <CardHeader className="dashboard-panel-header">
            <CardTitle className="dashboard-card-title text-slate-100">High-Cost Interactions</CardTitle>
          </CardHeader>
          <CardContent className="p-0 overflow-x-auto">
            <table className="dashboard-table min-w-[900px]">
              <thead className="dashboard-table-head">
                <tr>
                  {["Request", "Engineer", "Use Case", "Model", "Plugin / MCP", "Credits", "Evidence"].map((header) => (
                    <th key={header} className="dashboard-table-head-cell">
                      {header}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {highCostInteractions.map((interaction) => (
                  <tr
                    key={interaction.id}
                    className="dashboard-table-row cursor-pointer hover:bg-white/[0.03]"
                    onClick={() => setEvidenceInteractionId(interaction.id)}
                  >
                    <td className="dashboard-table-cell-strong">
                      <p>{interaction.id}</p>
                      <p className="dashboard-table-subtext">{interaction.conversationId}</p>
                    </td>
                    <td className="dashboard-table-cell">
                      <div className="flex flex-wrap items-center gap-2 text-slate-300">
                        <Link href={engineerDetailHref(interaction.engineerId)}>
                          <span
                            className="hover:underline underline-offset-4 cursor-pointer"
                            onClick={(event) => event.stopPropagation()}
                          >
                            {interaction.engineerName}
                          </span>
                        </Link>
                        <FunctionBadge role={interaction.engineerFunction} />
                      </div>
                    </td>
                    <td className="dashboard-table-cell">{interaction.useCaseLabel}</td>
                    <td className="dashboard-table-cell">{interaction.modelName}</td>
                    <td className="dashboard-table-cell">
                      <p className="text-slate-300">{interaction.pluginName}</p>
                      <p className="dashboard-table-subtext">{interaction.mcpServer}</p>
                    </td>
                    <td className="dashboard-table-cell-strong">{formatConsumption(interaction.estimatedCredits)}</td>
                    <td className="dashboard-table-cell">
                      <span className="inline-flex items-center rounded-lg border border-white/8 bg-white/[0.04] px-3 py-1.5 text-xs text-slate-300">
                        <Eye className="w-3.5 h-3.5 mr-2 text-blue-300" />
                        {interaction.evidence.chatCount + interaction.evidence.inlineCount} traces
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </CardContent>
        </Card>

        <Card className="bg-[#111827] border-white/5 shadow-lg overflow-hidden">
          <CardHeader className="bg-black/20 border-b border-white/5">
            <CardTitle className="dashboard-card-title text-slate-100">Recommendations in Scope</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 pt-5">
            {scopedRecommendations.slice(0, 4).map((recommendation) => (
              <div key={recommendation.id} className="rounded-2xl border border-white/6 bg-[#0B1120] px-4 py-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="space-y-2 min-w-0">
                    <div className="flex items-center gap-2">
                      <SeverityBadge severity={recommendation.severity} />
                      <span className="text-xs uppercase tracking-[0.14em] text-slate-500">{recommendation.type}</span>
                    </div>
                    <p className="dashboard-item-title">{recommendation.title}</p>
                    <p className="text-sm text-slate-400 leading-relaxed">{recommendation.recommendedAction}</p>
                  </div>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function ScopeStat({
  label,
  value,
  detail,
  icon,
}: {
  label: string;
  value: string;
  detail: string;
  icon: React.ReactNode;
}) {
  return (
    <div className="rounded-2xl border border-white/6 bg-[#0B1120] px-4 py-4">
      <div className="flex items-center justify-between gap-3">
        <p className="dashboard-metric-label">{label}</p>
        {icon}
      </div>
      <p className="mt-3 text-[0.98rem] md:text-[1.04rem] font-semibold text-white leading-snug tracking-[-0.015em]">{value}</p>
      <p className="mt-1 text-[0.88rem] text-slate-400 leading-relaxed">{detail}</p>
    </div>
  );
}

function SeverityBadge({ severity }: { severity: "High" | "Medium" | "Low" }) {
  const styles =
    severity === "High"
      ? "bg-amber-500/12 text-amber-300 border border-amber-500/22"
      : severity === "Medium"
        ? "bg-blue-500/12 text-blue-300 border border-blue-500/22"
        : "bg-slate-500/12 text-slate-300 border border-slate-500/18";

  return <span className={`inline-flex items-center rounded-full px-2.5 py-1 text-[11px] font-medium ${styles}`}>{severity}</span>;
}

function FunctionBadge({ role }: { role: EngineerFunction }) {
  return (
    <span
      className={`inline-flex items-center rounded-full border px-2 py-0.5 text-[10px] font-semibold tracking-[0.08em] ${ENGINEER_FUNCTION_STYLES[role]}`}
    >
      {role}
    </span>
  );
}
