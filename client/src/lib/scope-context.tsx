import { createContext, useContext, useMemo, useState, type ReactNode } from "react";

import { TELEMETRY_DATA } from "@/lib/telemetry-data";

type Period = "30d" | "60d" | "90d";

type DashboardScopeContextValue = {
  portfolioId: string;
  teamId: string;
  userId: string;
  period: Period;
  application: string;
  portfolio: (typeof TELEMETRY_DATA.costCenters)[number] | undefined;
  team: (typeof TELEMETRY_DATA.teams)[number] | undefined;
  user: (typeof TELEMETRY_DATA.engineers)[number] | undefined;
  teams: typeof TELEMETRY_DATA.teams;
  users: typeof TELEMETRY_DATA.engineers;
  applications: string[];
  selectPortfolio: (id: string) => void;
  selectTeam: (id: string) => void;
  selectUser: (id: string) => void;
  setPeriod: (period: Period) => void;
  setApplication: (application: string) => void;
  clearScope: () => void;
};

const DashboardScopeContext = createContext<DashboardScopeContextValue | null>(null);

export function DashboardScopeProvider({ children }: { children: ReactNode }) {
  const [portfolioId, setPortfolioId] = useState("");
  const [teamId, setTeamId] = useState("");
  const [userId, setUserId] = useState("");
  const [period, setPeriod] = useState<Period>("30d");
  const [application, setApplication] = useState("all");

  const portfolio = TELEMETRY_DATA.costCenters.find((item) => item.id === portfolioId);
  const team = TELEMETRY_DATA.teams.find((item) => item.id === teamId);
  const user = TELEMETRY_DATA.engineers.find((item) => item.userId === userId || item.id === userId);
  const teams = TELEMETRY_DATA.teams.filter((item) => !portfolioId || item.costCenterId === portfolioId);
  const users = TELEMETRY_DATA.engineers.filter((item) => teamId ? item.teamId === teamId : portfolioId ? item.costCenterId === portfolioId : true);
  const applications = useMemo(
    () => Array.from(new Set(TELEMETRY_DATA.interactions.map((item) => item.interactionChannel))).filter(Boolean).sort(),
    [],
  );

  function selectPortfolio(id: string) {
    setPortfolioId(id);
    setTeamId("");
    setUserId("");
  }

  function selectTeam(id: string) {
    const next = TELEMETRY_DATA.teams.find((item) => item.id === id);
    if (next) setPortfolioId(next.costCenterId);
    setTeamId(id);
    setUserId("");
  }

  function selectUser(id: string) {
    if (!id) {
      setUserId("");
      return;
    }
    const next = TELEMETRY_DATA.engineers.find((item) => item.userId === id || item.id === id);
    if (next) {
      setPortfolioId(next.costCenterId);
      setTeamId(next.teamId);
      setUserId(next.userId);
    }
  }

  function clearScope() {
    setPortfolioId("");
    setTeamId("");
    setUserId("");
  }

  return (
    <DashboardScopeContext.Provider
      value={{
        portfolioId,
        teamId,
        userId,
        period,
        application,
        portfolio,
        team,
        user,
        teams,
        users,
        applications,
        selectPortfolio,
        selectTeam,
        selectUser,
        setPeriod,
        setApplication,
        clearScope,
      }}
    >
      {children}
    </DashboardScopeContext.Provider>
  );
}

export function useDashboardScope() {
  const value = useContext(DashboardScopeContext);
  if (!value) throw new Error("useDashboardScope must be used inside DashboardScopeProvider");
  return value;
}

export function getScopedInteractions(scope: Pick<DashboardScopeContextValue, "portfolioId" | "teamId" | "userId" | "application" | "period">) {
  const allDates = TELEMETRY_DATA.interactions.map((item) => new Date(item.timestamp).getTime());
  const maxDate = Math.max(...allDates);
  const periodDays = Number(scope.period.replace("d", ""));
  const cutoff = maxDate - periodDays * 24 * 60 * 60 * 1000;

  return TELEMETRY_DATA.interactions.filter((item) => {
    if (scope.userId && item.engineerId !== scope.userId) return false;
    if (!scope.userId && scope.teamId && item.teamId !== scope.teamId) return false;
    if (!scope.userId && !scope.teamId && scope.portfolioId && item.costCenterId !== scope.portfolioId) return false;
    if (scope.application !== "all" && item.interactionChannel !== scope.application) return false;
    return new Date(item.timestamp).getTime() >= cutoff;
  });
}
