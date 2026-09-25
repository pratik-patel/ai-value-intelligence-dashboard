import { Switch, Route, Redirect } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";

import NotFound from "@/pages/not-found";
import Layout from "@/components/layout/Layout";

import GovernanceOverview from "@/pages/GovernanceOverview";
import UsageExplorer from "@/pages/UsageExplorer";
import DetailWorkspace from "@/pages/DetailWorkspace";
import PolicySimulationStudio from "@/pages/PolicySimulationStudio";
import ReportEvidenceConsole from "@/pages/ReportEvidenceConsole";
import Recommendations from "@/pages/Recommendations";
import EfficiencyRoi from "@/pages/EfficiencyRoi";

function Router() {
  return (
    <Layout>
      <Switch>
        <Route path="/" component={GovernanceOverview} />
        <Route path="/explorer" component={UsageExplorer} />
        <Route path="/efficiency" component={EfficiencyRoi} />
        <Route path="/detail/:entityType/:entityId" component={DetailWorkspace} />
        <Route path="/recommendations" component={Recommendations} />
        <Route path="/studio" component={PolicySimulationStudio} />
        <Route path="/reports" component={ReportEvidenceConsole} />
        <Route path="/findings">
          <Redirect to="/recommendations" />
        </Route>
        <Route path="/execution">
          <Redirect to="/recommendations" />
        </Route>
        <Route path="/analytics">
          <Redirect to="/explorer" />
        </Route>
        <Route component={NotFound} />
      </Switch>
    </Layout>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Router />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
