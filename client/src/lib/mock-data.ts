export const MOCK_DATA = {
  kpis: {
    totalConsumption: "1,452K",
    overrun: "34.5K",
    activeEngineers: "842",
    consumptionPerEngineer: "1.7K",
    topCostCenter: "Underwriting & Risk Controls",
    topEngineer: "Aisha Khan"
  },
  costCenters: [
    { id: "cc-4101", name: "Underwriting & Risk Controls", consumption: "542K", overrun: "12K", activeEngineers: 145, topUseCase: "legacy-modernization", lastActive: "2m ago" },
    { id: "cc-4402", name: "Loan Origination Operations", consumption: "480K", overrun: "8.5K", activeEngineers: 210, topUseCase: "spec-orchestration", lastActive: "Just now" },
    { id: "cc-4308", name: "Servicing & Collateral Operations", consumption: "245K", overrun: "0", activeEngineers: 85, topUseCase: "platform-hardening", lastActive: "15m ago" },
    { id: "cc-4204", name: "Capital Markets & Regulatory Insights", consumption: "185K", overrun: "14K", activeEngineers: 402, topUseCase: "retail-analytics", lastActive: "5m ago" }
  ],
  teams: [
    { id: "t-1", name: "Underwriting Decisioning Squad", costCenter: "Underwriting & Risk Controls", consumption: "542K", activeEngineers: 145, topEngineer: "Priya Nair", topChannel: "IDE" },
    { id: "t-2", name: "Origination Workflow Squad", costCenter: "Loan Origination Operations", consumption: "480K", activeEngineers: 210, topEngineer: "Aisha Khan", topChannel: "IDE" },
    { id: "t-3", name: "Seller / Servicer Experience Squad", costCenter: "Servicing & Collateral Operations", consumption: "245K", activeEngineers: 85, topEngineer: "Elena Garcia", topChannel: "CLI" },
    { id: "t-4", name: "Capital Markets Delivery Squad", costCenter: "Capital Markets & Regulatory Insights", consumption: "185K", activeEngineers: 402, topEngineer: "Nina Patel", topChannel: "PLUGIN" }
  ],
  engineers: [
    { id: "e-1", name: "Aisha Khan", team: "Origination Workflow Squad", costCenter: "Loan Origination Operations", consumption: "12.4K", activeDays: 27, status: "Active", clientMix: { ide: 65, cli: 20, plugin: 15 } },
    { id: "e-2", name: "Priya Nair", team: "Underwriting Decisioning Squad", costCenter: "Underwriting & Risk Controls", consumption: "11.2K", activeDays: 27, status: "Active", clientMix: { ide: 80, cli: 10, plugin: 10 } },
    { id: "e-3", name: "Elena Garcia", team: "Seller / Servicer Experience Squad", costCenter: "Servicing & Collateral Operations", consumption: "8.5K", activeDays: 23, status: "Active", clientMix: { ide: 40, cli: 55, plugin: 5 } },
    { id: "e-4", name: "Marco Silva", team: "Eligibility & Rules Controls Squad", costCenter: "Underwriting & Risk Controls", consumption: "7.8K", activeDays: 20, status: "Active", clientMix: { ide: 70, cli: 20, plugin: 10 } },
    { id: "e-5", name: "Ben Foster", team: "Loan Product & Pricing Squad", costCenter: "Loan Origination Operations", consumption: "7.2K", activeDays: 24, status: "Active", clientMix: { ide: 60, cli: 25, plugin: 15 } }
  ],
  interactions: [
    { id: "req-d3660255cf38", convId: "conv-8dae4bb19b", engineer: "Nina Patel", costCenter: "Capital Markets & Regulatory Insights", useCase: "retail-analytics", model: "Claude_Sonnet_4.6", plugin: "Browser", mcp: "No MCP Invoked", consumption: "13.96", evidence: true },
    { id: "req-39ba85c122c7", convId: "conv-47d541ba50", engineer: "Ethan Brooks", costCenter: "Underwriting & Risk Controls", useCase: "legacy-modernization", model: "Auto", plugin: "GitHub", mcp: "github", consumption: "3.18", evidence: true },
    { id: "req-b0cc3b47bccb", convId: "conv-d984e408fa", engineer: "Casey Liu", costCenter: "Capital Markets & Regulatory Insights", useCase: "retail-analytics", model: "Auto", plugin: "Direct Assistant", mcp: "No MCP Invoked", consumption: "2.72", evidence: false },
    { id: "req-d8d05ef11e2b", convId: "conv-646ebceb1b", engineer: "Aisha Khan", costCenter: "Loan Origination Operations", useCase: "spec-orchestration", model: "Claude_Sonnet_4.6", plugin: "Jira", mcp: "No MCP Invoked", consumption: "27.73", evidence: true },
    { id: "req-7653a608668f", convId: "conv-68ac4a536a", engineer: "Elena Garcia", costCenter: "Servicing & Collateral Operations", useCase: "platform-hardening", model: "Claude_Sonnet_4.6", plugin: "Knowledge Search", mcp: "No MCP Invoked", consumption: "4.91", evidence: true }
  ],
  models: [
    { id: "m-1", name: "Claude_Sonnet_4.6", consumption: "420K", interactions: 15420, topCostCenters: "Underwriting & Risk Controls, Capital Markets & Regulatory Insights", topUseCases: "legacy-modernization" },
    { id: "m-2", name: "Claude_Opus_4.6", consumption: "350K", interactions: 2150, topCostCenters: "Servicing & Collateral Operations", topUseCases: "platform-hardening" },
    { id: "m-3", name: "Auto", consumption: "245K", interactions: 8500, topCostCenters: "Loan Origination Operations", topUseCases: "retail-analytics" },
    { id: "m-4", name: "Claude_Haiku_4.6", consumption: "185K", interactions: 32000, topCostCenters: "Underwriting & Risk Controls", topUseCases: "spec-orchestration" }
  ],
  tools: [
    { id: "tl-1", name: "GitHub", type: "Plugin", consumption: "125K", interactions: 4500, topCostCenters: "Loan Origination Operations" },
    { id: "tl-2", name: "Jira", type: "Plugin", consumption: "85K", interactions: 3200, topCostCenters: "Underwriting & Risk Controls" },
    { id: "tl-3", name: "Browser", type: "Plugin", consumption: "45K", interactions: 12000, topCostCenters: "Capital Markets & Regulatory Insights" },
    { id: "tl-4", name: "Knowledge Search", type: "Plugin", consumption: "25K", interactions: 1800, topCostCenters: "Servicing & Collateral Operations" },
    { id: "tl-5", name: "github", type: "MCP", consumption: "115K", interactions: 2800, topCostCenters: "Loan Origination Operations" },
    { id: "tl-6", name: "database-schema", type: "MCP", consumption: "90K", interactions: 1500, topCostCenters: "Underwriting & Risk Controls" }
  ],
  dailyTrend: [
    { date: "2026-04-01", consumption: 420 },
    { date: "2026-04-02", consumption: 480 },
    { date: "2026-04-03", consumption: 450 },
    { date: "2026-04-04", consumption: 380 },
    { date: "2026-04-05", consumption: 350 },
    { date: "2026-04-06", consumption: 520 },
    { date: "2026-04-07", consumption: 580 },
    { date: "2026-04-08", consumption: 610 },
    { date: "2026-04-09", consumption: 590 },
    { date: "2026-04-10", consumption: 540 }
  ],
  clientMix: [
    { name: "Underwriting & Risk Controls", ide: 65, cli: 20, plugin: 15 },
    { name: "Loan Origination Operations", ide: 75, cli: 15, plugin: 10 },
    { name: "Servicing & Collateral Operations", ide: 40, cli: 55, plugin: 5 },
    { name: "Capital Markets & Regulatory Insights", ide: 50, cli: 10, plugin: 40 }
  ],
  reports: [
    { id: 'rep-1', title: 'Q2 Core Engineering AI Review', scope: 'Core Engineering', audience: 'Executive Sponsor', createdAt: '2026-05-28 09:00', status: 'Completed' },
    { id: 'rep-2', title: 'Data Science Model Routing Optimization', scope: 'Data Science', audience: 'Architect', createdAt: '2026-05-27 14:30', status: 'Completed' },
    { id: 'rep-3', title: 'Retail App License Hygiene', scope: 'Retail App Team', audience: 'Delivery Manager', createdAt: '2026-05-28 16:45', status: 'Processing' }
  ],
  findings: [
    { id: "f-1", title: "High Spend Concentration", severity: "High", scope: "Cost Center", description: "Top 5% of engineers drive 45% of AI consumption in Underwriting & Risk Controls.", category: "Spend Concentration" },
    { id: "f-2", title: "Low Seat Utilization", severity: "Medium", scope: "Team", description: "12 engineers in Capital Markets Delivery Squad have < 3 active days this month.", category: "Low-Utilization Seats" },
    { id: "f-3", title: "Expensive Model Usage", severity: "High", scope: "Engineer", description: "Frequent use of Opus 4.6 for basic code generation tasks by Aisha Khan.", category: "Model Routing Opportunity" },
    { id: "f-4", title: "Unusual Usage Spike", severity: "Low", scope: "Team", description: "Seller / Servicer Experience Squad CLI usage spiked 300% on April 8th.", category: "Unusual Usage Spike" },
    { id: "f-5", title: "Overage Risk Detected", severity: "High", scope: "Cost Center", description: "Capital Markets & Regulatory Insights is projected to hit overage cap in 4 days.", category: "Overrun Risk" }
  ]
};
