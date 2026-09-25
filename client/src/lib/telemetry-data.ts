import Papa from "papaparse";

import subscriptionsCsv from "../../../attached_assets/telemetry_subscriptions_export.csv?raw";
import groupMappingCsv from "../../../attached_assets/telemetry_org_user_mapping.csv?raw";
import userActivityIdeCsv from "../../../attached_assets/telemetry_user_activity_IDE.csv?raw";
import userActivityCliCsv from "../../../attached_assets/telemetry_user_activity_CLI.csv?raw";
import userActivityPluginCsv from "../../../attached_assets/telemetry_user_activity_EXTENSION.csv?raw";
import interactionTelemetryCsv from "../../../attached_assets/telemetry_interactions.csv?raw";
import chatLogsCsv from "../../../attached_assets/telemetry_chat_evidence.csv?raw";
import inlineLogsCsv from "../../../attached_assets/telemetry_inline_evidence.csv?raw";

type Severity = "High" | "Medium" | "Low";
export type EngineerFunction = "FE" | "BE" | "QA" | "AI";
type RecommendationType =
  | "Model Routing"
  | "Prompt Discipline"
  | "Steering Scope"
  | "Plugin Governance"
  | "MCP Governance"
  | "Use Case Optimization"
  | "License Hygiene"
  | "Spend Concentration"
  | "Overrun Risk"
  | "Team Coaching";

interface SubscriptionRow {
  "User name": string;
  "Subscription status": string;
  "Plan": string;
  "Plan source": string;
  "Activation date": string;
}

interface GroupMappingRow {
  Group_Name: string;
  Box_Name: string;
  UserId: string;
  User_Name: string;
  Subscription_Tier: string;
  Subscription_Status: string;
  Plan_Source: string;
  Cost_Center: string;
  Engineering_Manager: string;
  Primary_Workflow: string;
}

interface UserActivityRow {
  Date: string;
  UserId: string;
  Client_Type: string;
  Chat_Conversations: string;
  Credits_Used: string;
  Overage_Credits_Used: string;
  Subscription_Tier: string;
  Total_Messages: string;
  New_User: string;
}

interface InteractionTelemetryRow {
  Event_Timestamp_UTC: string;
  Request_Id: string;
  Conversation_Id: string;
  UserId: string;
  User_Name: string;
  Group_Name: string;
  Box_Name: string;
  Client_Type: string;
  Channel: string;
  Chat_Trigger_Type: string;
  Request_Source: string;
  Workflow_Area: string;
  Agent_Pattern: string;
  Plugin_Name: string;
  MCP_Server: string;
  Tool_Invocation_Count: string;
  Model_Name: string;
  Estimated_Credits_Used: string;
  Prompt_Chars: string;
  Response_Chars: string;
}

interface ChatLogRow {
  Request_Id: string;
  Conversation_Id: string;
  UserId: string;
  TimeStamp_UTC: string;
  Prompt: string;
  Assistant_Response: string;
  Followup_Prompts: string;
  Chat_Trigger_Type: string;
  Supplementary_Web_Links_Count: string;
}

interface InlineLogRow {
  Request_Id: string;
  UserId: string;
  TimeStamp_UTC: string;
  Left_Context: string;
  Right_Context: string;
  File_Name: string;
  Accepted_Completion: string;
  Completion_Count: string;
}

export interface EvidenceArtifact {
  requestId: string;
  conversationId: string;
  prompt?: string;
  assistantResponse?: string;
  followupPrompts?: string;
  leftContext?: string;
  rightContext?: string;
  fileName?: string;
  acceptedCompletion?: string;
  chatCount: number;
  inlineCount: number;
}

export interface InputDriverBreakdownItem {
  label: string;
  kind: "Observed" | "Estimated";
  value: string;
  note: string;
  confidence?: "High" | "Medium" | "Low";
}

export interface InteractionSummary {
  id: string;
  conversationId: string;
  userId: string;
  engineerId: string;
  engineerName: string;
  engineerFunction: EngineerFunction;
  teamId: string;
  teamName: string;
  costCenterId: string;
  costCenterName: string;
  costCenterCode: string;
  useCaseKey: string;
  useCaseLabel: string;
  modelName: string;
  modelCategory: "High Reasoning" | "Balanced" | "Coder" | "Auto";
  interactionChannel: string;
  requestSource: string;
  agentPattern: string;
  pluginName: string;
  mcpServer: string;
  toolInvocationCount: number;
  estimatedCredits: number;
  promptChars: number;
  responseChars: number;
  timestamp: string;
  evidence: EvidenceArtifact;
  inputDrivers: InputDriverBreakdownItem[];
}

export interface UseCaseSummary {
  key: string;
  label: string;
  category: string;
  summary: string;
  recommendedModelTier: string;
  totalConsumption: number;
  interactionCount: number;
  avgPromptChars: number;
  avgResponseChars: number;
  dominantModel: string;
  dominantPlugin: string;
  dominantMcp: string;
  topRequestSource: string;
  dominantAgentPattern: string;
  deterministicShare: number;
  highReasoningShare: number;
  executionPattern: string;
  relatedRecommendationIds: string[];
}

export interface EngineerSummary {
  id: string;
  userId: string;
  name: string;
  engineerFunction: EngineerFunction;
  teamId: string;
  teamName: string;
  costCenterId: string;
  costCenterName: string;
  costCenterCode: string;
  engineeringManager: string;
  subscriptionTier: string;
  subscriptionStatus: string;
  planSource: string;
  activationDate?: string;
  totalConsumption: number;
  overrun: number;
  activeDays: number;
  totalMessages: number;
  chatConversations: number;
  clientMix: Record<string, number>;
  topUseCase: string;
  topModel: string;
  topPlugin: string;
  interactionCount: number;
  recommendationIds: string[];
}

export interface TeamSummary {
  id: string;
  name: string;
  costCenterId: string;
  costCenterName: string;
  costCenterCode: string;
  engineeringManager: string;
  totalConsumption: number;
  overrun: number;
  activeEngineers: number;
  topEngineer: string;
  topUseCase: string;
  topModel: string;
  topChannel: string;
  recommendationIds: string[];
}

export interface CostCenterSummary {
  id: string;
  code: string;
  name: string;
  totalConsumption: number;
  overrun: number;
  activeEngineers: number;
  teamCount: number;
  topTeam: string;
  topUseCase: string;
  topModel: string;
  topEngineer: string;
  recommendationIds: string[];
}

export interface Recommendation {
  id: string;
  title: string;
  type: RecommendationType;
  severity: Severity;
  scopeType: "Enterprise" | "Cost Center" | "Team" | "Engineer" | "Interaction" | "Use Case";
  scopeId: string;
  scopeLabel: string;
  whyItMatters: string;
  supportingSignals: string[];
  recommendedAction: string;
  expectedImpact: string;
  evidenceInteractionIds: string[];
}

export interface AdvisorRun {
  id: string;
  title: string;
  mode: "AI Advisor" | "Strategic Report" | "Policy Simulation";
  scopeLabel: string;
  status: "Completed" | "Running" | "Queued";
  startedAt: string;
  summary: string;
}

export interface ReportSummary {
  id: string;
  title: string;
  scopeLabel: string;
  audience: "Executive Sponsor" | "Delivery Manager" | "Architect";
  status: "Completed" | "Processing" | "Stale";
  generatedAt: string;
  executiveSummary: string;
}

export interface TelemetryDataset {
  meta: {
    mode: "Connected Mode";
    freshness: "Last updated: 1 day ago";
    lastUpdated: string;
  };
  kpis: {
    totalConsumption: number;
    overrun: number;
    activeEngineers: number;
    consumptionPerEngineer: number;
    topCostCenter: string;
    topEngineer: string;
    topTeam: string;
    topUseCase: string;
  };
  licenseSummary: {
    totalLicenses: number;
    adoptedLicenses: number;
    unusedLicenses: number;
    idleThresholdDays: number;
    otherActiveAlerts: number;
  };
  costCenters: CostCenterSummary[];
  teams: TeamSummary[];
  engineers: EngineerSummary[];
  interactions: InteractionSummary[];
  useCases: UseCaseSummary[];
  recommendations: Recommendation[];
  runs: AdvisorRun[];
  reports: ReportSummary[];
  dailyTrend: Array<{ date: string; consumption: number; overrun: number }>;
  monthlyByCostCenter: Array<Record<string, string | number>>;
  clientMixByCostCenter: Array<{ name: string; ide: number; cli: number; plugin: number }>;
}

interface Scope {
  costCenterId?: string;
  teamId?: string;
  engineerId?: string;
  useCaseKey?: string;
}

const USE_CASES: Record<
  string,
  { label: string; category: string; summary: string; recommendedModelTier: string }
> = {
  "spec-orchestration": {
    label: "Impact Analysis",
    category: "Requirements & Architecture",
    summary: "Assessing business, policy, and technical change impact before implementation work begins.",
    recommendedModelTier: "Balanced unless the architecture scope is genuinely broad",
  },
  "legacy-modernization": {
    label: "Implementation & Refactoring",
    category: "Implementation",
    summary: "Implementing code changes, refactoring services, and modernizing delivery components.",
    recommendedModelTier: "Balanced for focused change sets, escalate only for cross-service reasoning",
  },
  "platform-hardening": {
    label: "Static Quality Gates",
    category: "Release & Reliability",
    summary: "Validating deterministic quality gates, hooks, policy checks, and configuration controls before release.",
    recommendedModelTier: "Balanced with tool-first workflows and deterministic automation",
  },
  "retail-analytics": {
    label: "RCA & Bug Fixes",
    category: "Delivery Reporting",
    summary: "Investigating root causes, debugging production issues, and driving corrective fixes through delivery teams.",
    recommendedModelTier: "Balanced for summaries, escalate only for cross-source synthesis",
  },
  "guardrail-evaluation": {
    label: "Code Review & Control Validation",
    category: "Governance & Quality",
    summary: "Reviewing code changes, validating controls, and checking quality or compliance guardrails.",
    recommendedModelTier: "Lower or balanced reasoning is usually sufficient before escalation",
  },
  "test-generation": {
    label: "Test Generation & Coverage Expansion",
    category: "Quality Engineering",
    summary: "Generating tests, expanding coverage, and refining unit or integration test scaffolds.",
    recommendedModelTier: "Lower-cost coder models first, escalate only for unusual fixture design",
  },
};

const DETERMINISTIC_SOURCES = new Set(["hook", "automation", "mcp-tool", "plugin-action", "slash-command"]);
const LOWER_COST_MODEL_HINTS = ["Qwen3 Coder Next", "DeepSeek V3.2"];
const REVIEW_DRIVEN_SOURCES = new Set(["review"]);
const EXECUTIVE_LICENSE_SCENARIO = {
  totalLicenses: 60,
  unusedLicenses: 12,
  idleThresholdDays: 7,
} as const;
const RECOMMENDATION_PRIORITY: RecommendationType[] = [
  "Steering Scope",
  "Use Case Optimization",
  "Model Routing",
  "Prompt Discipline",
  "Plugin Governance",
  "MCP Governance",
  "Overrun Risk",
  "Spend Concentration",
  "License Hygiene",
  "Team Coaching",
];

const COST_CENTER_DISPLAY_NAMES: Record<string, string> = {
  "CC-4402": "Loan Origination Operations",
  "CC-4101": "Underwriting & Risk Controls",
  "CC-4308": "Servicing & Collateral Operations",
  "CC-4204": "Capital Markets & Regulatory Insights",
};

const ENGINEER_TEAM_ASSIGNMENTS: Record<string, string> = {
  "Aisha Khan": "Origination Workflow Squad",
  "Ben Foster": "Loan Product & Pricing Squad",
  "Chloe Martin": "Origination Workflow Squad",
  "Ethan Brooks": "Underwriting Decisioning Squad",
  "Marco Silva": "Eligibility & Rules Controls Squad",
  "Priya Nair": "Underwriting Decisioning Squad",
  "Elena Garcia": "Seller / Servicer Experience Squad",
  "Lucy Chen": "Collateral & Appraisal Operations Squad",
  "Sam Walker": "Seller / Servicer Experience Squad",
  "Victor Chen": "Collateral & Appraisal Operations Squad",
  "Casey Liu": "Capital Markets Delivery Squad",
  "David Kim": "Reporting & Regulatory Insights Squad",
  "Nina Patel": "Capital Markets Delivery Squad",
  "Omar Haddad": "Reporting & Regulatory Insights Squad",
};

const ENGINEER_FUNCTION_BY_NAME: Record<string, EngineerFunction> = {
  "Aisha Khan": "AI",
  "Ben Foster": "BE",
  "Casey Liu": "FE",
  "Chloe Martin": "FE",
  "David Kim": "BE",
  "Elena Garcia": "AI",
  "Ethan Brooks": "BE",
  "Lucy Chen": "FE",
  "Marco Silva": "QA",
  "Nina Patel": "QA",
  "Omar Haddad": "AI",
  "Priya Nair": "FE",
  "Sam Walker": "BE",
  "Victor Chen": "QA",
};

const COST_CENTER_SCALE_BY_CODE: Record<string, number> = {
  "CC-4402": 2.9,
  "CC-4101": 2.7,
  "CC-4308": 2.4,
  "CC-4204": 2.2,
};

const ENGINEER_FUNCTION_CREDIT_SCALE: Record<EngineerFunction, number> = {
  AI: 1.16,
  BE: 1.08,
  FE: 1,
  QA: 0.96,
};

const USE_CASE_VARIANTS: Record<string, string[]> = {
  "spec-orchestration": ["spec-orchestration", "legacy-modernization", "guardrail-evaluation", "retail-analytics"],
  "legacy-modernization": ["legacy-modernization", "guardrail-evaluation", "retail-analytics", "spec-orchestration"],
  "platform-hardening": ["platform-hardening", "guardrail-evaluation", "legacy-modernization"],
  "retail-analytics": ["retail-analytics", "legacy-modernization", "spec-orchestration"],
  "guardrail-evaluation": ["guardrail-evaluation", "platform-hardening", "test-generation", "legacy-modernization"],
  "test-generation": ["test-generation", "guardrail-evaluation", "legacy-modernization", "platform-hardening"],
};

const USE_CASE_PROMPT_SCALE: Record<string, number> = {
  "spec-orchestration": 1.24,
  "legacy-modernization": 1.08,
  "platform-hardening": 0.94,
  "retail-analytics": 1.02,
  "guardrail-evaluation": 1.1,
  "test-generation": 1.14,
};

const USE_CASE_RESPONSE_SCALE: Record<string, number> = {
  "spec-orchestration": 1.12,
  "legacy-modernization": 1.02,
  "platform-hardening": 0.96,
  "retail-analytics": 1.06,
  "guardrail-evaluation": 1.02,
  "test-generation": 1.08,
};

const ACTIVE_ENGINEER_RULE = {
  minActiveDays: 3,
  minCredits: 250,
} as const;

function normalizeTeamName(userName: string, fallbackTeamName: string) {
  return ENGINEER_TEAM_ASSIGNMENTS[userName] ?? fallbackTeamName;
}

function normalizeCostCenterName(costCenterCode: string | undefined, fallbackCostCenterName: string) {
  if (!costCenterCode) return fallbackCostCenterName;
  return COST_CENTER_DISPLAY_NAMES[costCenterCode] ?? fallbackCostCenterName;
}

function getEngineerFunction(name: string): EngineerFunction {
  return ENGINEER_FUNCTION_BY_NAME[name] ?? "BE";
}

function deterministicHash(value: string) {
  let hash = 0;
  for (const character of value) {
    hash = (hash * 31 + character.charCodeAt(0)) | 0;
  }
  return Math.abs(hash);
}

function seededFactor(seed: string, min: number, max: number) {
  const ratio = (deterministicHash(seed) % 1000) / 999;
  return min + (max - min) * ratio;
}

function getEnterpriseScale(userName: string, costCenterCode: string | undefined, engineerFunction = getEngineerFunction(userName)) {
  const costCenterScale = costCenterCode ? COST_CENTER_SCALE_BY_CODE[costCenterCode] ?? 2.4 : 2.4;
  const functionScale = ENGINEER_FUNCTION_CREDIT_SCALE[engineerFunction] ?? 1;
  const identityFactor = seededFactor(`${userName}:${costCenterCode ?? "unmapped"}`, 0.94, 1.04);
  return costCenterScale * functionScale * identityFactor;
}

function diversifyUseCaseKey(row: InteractionTelemetryRow, engineerFunction: EngineerFunction) {
  const variants = USE_CASE_VARIANTS[row.Workflow_Area] ?? [row.Workflow_Area];
  if (variants.length === 1) return variants[0];

  const bucket = deterministicHash(
    `${row.Request_Id}:${row.Conversation_Id}:${row.UserId}:${engineerFunction}:${row.Request_Source}`,
  ) % 100;

  if (bucket < 64) return variants[0];
  if (bucket < 84) return variants[1] ?? variants[0];
  if (bucket < 95) return variants[2] ?? variants[1] ?? variants[0];
  return variants[3] ?? variants[2] ?? variants[1] ?? variants[0];
}

function scaleActivityCredits(userName: string, costCenterCode: string | undefined, date: string, value: number) {
  const scale = getEnterpriseScale(userName, costCenterCode);
  return Number((value * scale * seededFactor(`${userName}:${date}:activity-credit`, 0.95, 1.05)).toFixed(2));
}

function scaleActivityOverrun(userName: string, costCenterCode: string | undefined, date: string, value: number) {
  const scale = getEnterpriseScale(userName, costCenterCode);
  return Number((value * scale * seededFactor(`${userName}:${date}:activity-overrun`, 0.96, 1.08)).toFixed(2));
}

function scaleActivityMessages(userName: string, costCenterCode: string | undefined, date: string, value: number) {
  const scale = Math.max(1.2, getEnterpriseScale(userName, costCenterCode) * 0.58);
  return Math.round(value * scale * seededFactor(`${userName}:${date}:activity-messages`, 0.97, 1.09));
}

function scaleActivityConversations(userName: string, costCenterCode: string | undefined, date: string, value: number) {
  const scale = Math.max(1.1, getEnterpriseScale(userName, costCenterCode) * 0.34);
  return Math.round(value * scale * seededFactor(`${userName}:${date}:activity-conversations`, 0.96, 1.04));
}

function scaleInteractionCredits(
  row: InteractionTelemetryRow,
  costCenterCode: string | undefined,
  engineerFunction: EngineerFunction,
) {
  const scale = getEnterpriseScale(row.User_Name, costCenterCode, engineerFunction);
  return Number((toNumber(row.Estimated_Credits_Used) * scale * seededFactor(`${row.Request_Id}:credit`, 0.95, 1.06)).toFixed(2));
}

function scaleInteractionPromptChars(
  row: InteractionTelemetryRow,
  useCaseKey: string,
  costCenterCode: string | undefined,
  engineerFunction: EngineerFunction,
) {
  const scale =
    Math.max(1.22, getEnterpriseScale(row.User_Name, costCenterCode, engineerFunction) * 0.46) *
    (USE_CASE_PROMPT_SCALE[useCaseKey] ?? 1) *
    seededFactor(`${row.Request_Id}:prompt`, 0.97, 1.08);
  return Math.round(toNumber(row.Prompt_Chars) * scale);
}

function scaleInteractionResponseChars(
  row: InteractionTelemetryRow,
  useCaseKey: string,
  costCenterCode: string | undefined,
  engineerFunction: EngineerFunction,
) {
  const scale =
    Math.max(1.15, getEnterpriseScale(row.User_Name, costCenterCode, engineerFunction) * 0.36) *
    (USE_CASE_RESPONSE_SCALE[useCaseKey] ?? 1) *
    seededFactor(`${row.Request_Id}:response`, 0.96, 1.06);
  return Math.round(toNumber(row.Response_Chars) * scale);
}

function isMateriallyActiveEngineer(engineer: Pick<EngineerSummary, "activeDays" | "totalConsumption">) {
  return (
    engineer.activeDays >= ACTIVE_ENGINEER_RULE.minActiveDays &&
    engineer.totalConsumption >= ACTIVE_ENGINEER_RULE.minCredits
  );
}

function parseCsv<T>(content: string): T[] {
  return Papa.parse<T>(content.trim(), {
    header: true,
    skipEmptyLines: true,
  }).data;
}

function toNumber(value: string | number | undefined | null) {
  const parsed = Number(value ?? 0);
  return Number.isFinite(parsed) ? parsed : 0;
}

function slugify(value: string) {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

function formatModelName(value: string) {
  return value
    .replace(/_messages$/, "")
    .replace(/_/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function modelCategory(modelName: string): InteractionSummary["modelCategory"] {
  if (modelName.includes("Opus")) return "High Reasoning";
  if (modelName.includes("Haiku")) return "Balanced";
  if (modelName.includes("Qwen") || modelName.includes("DeepSeek")) return "Coder";
  return modelName.includes("Auto") ? "Auto" : "Balanced";
}

function formatCompact(value: number, digits = 1) {
  if (value >= 1000) return `${(value / 1000).toFixed(digits)}K`;
  return value.toFixed(digits);
}

function toPercentMap(source: Record<string, number>) {
  const total = Object.values(source).reduce((sum, value) => sum + value, 0);
  return Object.fromEntries(
    Object.entries(source).map(([key, value]) => [key, total ? Math.round((value / total) * 100) : 0]),
  );
}

function topKeyFromMap(map: Map<string, number>, fallback = "N/A") {
  let winner = fallback;
  let topValue = -Infinity;
  map.forEach((value, key) => {
    if (value > topValue) {
      topValue = value;
      winner = key;
    }
  });
  return winner;
}

function makeObservedDrivers(interaction: Omit<InteractionSummary, "inputDrivers">): InputDriverBreakdownItem[] {
  const observed: InputDriverBreakdownItem[] = [
    {
      label: "Model",
      kind: "Observed",
      value: interaction.modelName,
      note: `${interaction.modelCategory} reasoning profile for this request.`,
    },
    {
      label: "Prompt Size",
      kind: "Observed",
      value: `${interaction.promptChars.toLocaleString()} chars`,
      note: "Direct prompt payload measured from telemetry.",
    },
    {
      label: "Response Size",
      kind: "Observed",
      value: `${interaction.responseChars.toLocaleString()} chars`,
      note: "Assistant output length for the interaction.",
    },
    {
      label: "Tooling",
      kind: "Observed",
      value: `${interaction.pluginName} / ${interaction.mcpServer}`,
      note: `${interaction.toolInvocationCount} tool calls recorded.`,
    },
    {
      label: "Use Case",
      kind: "Observed",
      value: interaction.useCaseLabel,
      note: `${interaction.requestSource} via ${interaction.interactionChannel}.`,
    },
  ];

  const estimated: InputDriverBreakdownItem[] = [];

  if (interaction.promptChars >= 6000) {
    estimated.push({
      label: "Retrieved Context Overhead",
      kind: "Estimated",
      value: "High",
      confidence: "High",
      note: "Large prompt volume suggests substantial attached or retrieved context.",
    });
  }

  if (interaction.agentPattern.includes("spec") || interaction.useCaseKey === "spec-orchestration") {
    estimated.push({
      label: "Specification / Workflow Context",
      kind: "Estimated",
      value: "Elevated",
      confidence: "Medium",
      note: "Spec-driven flows typically carry repeated planning and requirements context.",
    });
  }

  if (interaction.toolInvocationCount >= 5 || interaction.pluginName !== "Direct Assistant" || interaction.mcpServer !== "No MCP Invoked") {
    estimated.push({
      label: "Tool Augmentation Burden",
      kind: "Estimated",
      value: "Moderate",
      confidence: "Medium",
      note: "Plugins or MCP enrichment likely expanded the effective input and review surface.",
    });
  }

  if (
    ["test-generation", "guardrail-evaluation"].includes(interaction.useCaseKey) &&
    interaction.modelCategory === "High Reasoning"
  ) {
    estimated.push({
      label: "Model Mismatch",
      kind: "Estimated",
      value: "Likely",
      confidence: "High",
      note: "This use case usually fits a lighter reasoning tier than the current model.",
    });
  }

  if (interaction.agentPattern === "orchestrated-multi-agent") {
    estimated.push({
      label: "Instruction / Steering Overhead",
      kind: "Estimated",
      value: "High",
      confidence: "Medium",
      note: "Multi-agent orchestration often repeats agent goals and shared steering context.",
    });
  }

  return [...observed, ...estimated];
}

function buildDataset(): TelemetryDataset {
  const subscriptionRows = parseCsv<SubscriptionRow>(subscriptionsCsv);
  const mappingRows = parseCsv<GroupMappingRow>(groupMappingCsv);
  const activityRows = [
    ...parseCsv<UserActivityRow>(userActivityIdeCsv),
    ...parseCsv<UserActivityRow>(userActivityCliCsv),
    ...parseCsv<UserActivityRow>(userActivityPluginCsv),
  ];
  const interactionRows = parseCsv<InteractionTelemetryRow>(interactionTelemetryCsv);
  const chatRows = parseCsv<ChatLogRow>(chatLogsCsv);
  const inlineRows = parseCsv<InlineLogRow>(inlineLogsCsv);

  const subscriptionsByName = new Map(
    subscriptionRows.map((row) => [
      row["User name"],
      {
        status: row["Subscription status"],
        tier: row["Plan"],
        planSource: row["Plan source"],
        activationDate: row["Activation date"],
      },
    ]),
  );
  const mappingByUserId = new Map(mappingRows.map((row) => [row.UserId, row]));
  const chatByRequestId = new Map(chatRows.map((row) => [row.Request_Id, row]));
  const inlineByRequestId = new Map(inlineRows.map((row) => [row.Request_Id, row]));

  const userMetrics = new Map<
    string,
    {
      userId: string;
      name: string;
      engineerFunction: EngineerFunction;
      teamId: string;
      teamName: string;
      costCenterId: string;
      costCenterName: string;
      costCenterCode: string;
      engineeringManager: string;
      subscriptionTier: string;
      subscriptionStatus: string;
      planSource: string;
      activationDate?: string;
      totalConsumption: number;
      overrun: number;
      activeDays: Set<string>;
      totalMessages: number;
      chatConversations: number;
      clientCredits: Record<string, number>;
      topUseCaseMap: Map<string, number>;
      topModelMap: Map<string, number>;
      topPluginMap: Map<string, number>;
      interactionIds: string[];
    }
  >();

  activityRows.forEach((row) => {
    const mapping = mappingByUserId.get(row.UserId);
    if (!mapping) return;
    const subscription = subscriptionsByName.get(mapping.User_Name);
    const engineerId = row.UserId;
    const teamName = normalizeTeamName(mapping.User_Name, mapping.Group_Name);
    const teamId = slugify(teamName);
    const costCenterId = mapping.Cost_Center || slugify(mapping.Box_Name);
    const costCenterName = normalizeCostCenterName(mapping.Cost_Center, mapping.Box_Name);
    if (!userMetrics.has(engineerId)) {
      userMetrics.set(engineerId, {
        userId: engineerId,
        name: mapping.User_Name,
        engineerFunction: getEngineerFunction(mapping.User_Name),
        teamId,
        teamName,
        costCenterId,
        costCenterName,
        costCenterCode: mapping.Cost_Center,
        engineeringManager: mapping.Engineering_Manager,
        subscriptionTier: subscription?.tier || mapping.Subscription_Tier,
        subscriptionStatus: subscription?.status || mapping.Subscription_Status,
        planSource: subscription?.planSource || mapping.Plan_Source,
        activationDate: subscription?.activationDate,
        totalConsumption: 0,
        overrun: 0,
        activeDays: new Set<string>(),
        totalMessages: 0,
        chatConversations: 0,
        clientCredits: { IDE: 0, CLI: 0, PLUGIN: 0 },
        topUseCaseMap: new Map(),
        topModelMap: new Map(),
        topPluginMap: new Map(),
        interactionIds: [],
      });
    }
    const metric = userMetrics.get(engineerId)!;
    const scaledCredits = scaleActivityCredits(mapping.User_Name, mapping.Cost_Center, row.Date, toNumber(row.Credits_Used));
    const scaledOverrun = scaleActivityOverrun(
      mapping.User_Name,
      mapping.Cost_Center,
      row.Date,
      toNumber(row.Overage_Credits_Used),
    );
    const scaledMessages = scaleActivityMessages(
      mapping.User_Name,
      mapping.Cost_Center,
      row.Date,
      toNumber(row.Total_Messages),
    );
    const scaledConversations = scaleActivityConversations(
      mapping.User_Name,
      mapping.Cost_Center,
      row.Date,
      toNumber(row.Chat_Conversations),
    );

    metric.totalConsumption += scaledCredits;
    metric.overrun += scaledOverrun;
    if (scaledCredits > 0) {
      metric.activeDays.add(row.Date);
    }
    metric.totalMessages += scaledMessages;
    metric.chatConversations += scaledConversations;
    metric.clientCredits[row.Client_Type] = (metric.clientCredits[row.Client_Type] || 0) + scaledCredits;
  });

  const interactions: InteractionSummary[] = interactionRows.map((row) => {
    const mapping = mappingByUserId.get(row.UserId);
    const teamName = normalizeTeamName(row.User_Name, mapping?.Group_Name || row.Group_Name);
    const costCenterName = mapping?.Box_Name || row.Box_Name;
    const normalizedCostCenterName = normalizeCostCenterName(mapping?.Cost_Center, costCenterName);
    const costCenterId = mapping?.Cost_Center || slugify(costCenterName);
    const teamId = slugify(teamName);
    const engineerId = row.UserId;
    const engineerFunction = getEngineerFunction(row.User_Name);
    const diversifiedUseCaseKey = diversifyUseCaseKey(row, engineerFunction);
    const useCaseMeta = USE_CASES[diversifiedUseCaseKey] ?? {
      label: diversifiedUseCaseKey.replace(/-/g, " "),
      category: "General SDLC Support",
      summary: "General AI-assisted software delivery workflow.",
      recommendedModelTier: "Balanced",
    };
    const scaledInteractionCredits = scaleInteractionCredits(row, mapping?.Cost_Center, engineerFunction);
    const scaledPromptChars = scaleInteractionPromptChars(row, diversifiedUseCaseKey, mapping?.Cost_Center, engineerFunction);
    const scaledResponseChars = scaleInteractionResponseChars(
      row,
      diversifiedUseCaseKey,
      mapping?.Cost_Center,
      engineerFunction,
    );

    const chat = chatByRequestId.get(row.Request_Id);
    const inline = inlineByRequestId.get(row.Request_Id);
    const interactionBase = {
      id: row.Request_Id,
      conversationId: row.Conversation_Id,
      userId: row.UserId,
      engineerId,
      engineerName: row.User_Name,
      engineerFunction,
      teamId,
      teamName,
      costCenterId,
      costCenterName: normalizedCostCenterName,
      costCenterCode: mapping?.Cost_Center || "",
      useCaseKey: diversifiedUseCaseKey,
      useCaseLabel: useCaseMeta.label,
      modelName: formatModelName(row.Model_Name),
      modelCategory: modelCategory(formatModelName(row.Model_Name)),
      interactionChannel: row.Channel,
      requestSource: row.Request_Source,
      agentPattern: row.Agent_Pattern,
      pluginName: row.Plugin_Name || "Direct Assistant",
      mcpServer: row.MCP_Server || "No MCP Invoked",
      toolInvocationCount: toNumber(row.Tool_Invocation_Count),
      estimatedCredits: scaledInteractionCredits,
      promptChars: scaledPromptChars,
      responseChars: scaledResponseChars,
      timestamp: row.Event_Timestamp_UTC,
      evidence: {
        requestId: row.Request_Id,
        conversationId: row.Conversation_Id,
        prompt: chat?.Prompt,
        assistantResponse: chat?.Assistant_Response,
        followupPrompts: chat?.Followup_Prompts,
        leftContext: inline?.Left_Context,
        rightContext: inline?.Right_Context,
        fileName: inline?.File_Name,
        acceptedCompletion: inline?.Accepted_Completion,
        chatCount: chat ? 1 : 0,
        inlineCount: inline ? 1 : 0,
      },
    } as Omit<InteractionSummary, "inputDrivers">;

    return {
      ...interactionBase,
      inputDrivers: makeObservedDrivers(interactionBase),
    };
  });

  interactions.forEach((interaction) => {
    const user = userMetrics.get(interaction.userId);
    if (!user) return;
    user.topUseCaseMap.set(
      interaction.useCaseLabel,
      (user.topUseCaseMap.get(interaction.useCaseLabel) || 0) + interaction.estimatedCredits,
    );
    user.topModelMap.set(
      interaction.modelName,
      (user.topModelMap.get(interaction.modelName) || 0) + interaction.estimatedCredits,
    );
    user.topPluginMap.set(
      interaction.pluginName,
      (user.topPluginMap.get(interaction.pluginName) || 0) + interaction.estimatedCredits,
    );
    user.interactionIds.push(interaction.id);
  });

  const engineers: EngineerSummary[] = Array.from(userMetrics.values())
    .map((metric) => ({
      id: slugify(metric.name),
      userId: metric.userId,
      name: metric.name,
      engineerFunction: metric.engineerFunction,
      teamId: metric.teamId,
      teamName: metric.teamName,
      costCenterId: metric.costCenterId,
      costCenterName: metric.costCenterName,
      costCenterCode: metric.costCenterCode,
      engineeringManager: metric.engineeringManager,
      subscriptionTier: metric.subscriptionTier,
      subscriptionStatus: metric.subscriptionStatus,
      planSource: metric.planSource,
      activationDate: metric.activationDate,
      totalConsumption: metric.totalConsumption,
      overrun: metric.overrun,
      activeDays: metric.activeDays.size,
      totalMessages: metric.totalMessages,
      chatConversations: metric.chatConversations,
      clientMix: toPercentMap(metric.clientCredits),
      topUseCase: topKeyFromMap(metric.topUseCaseMap),
      topModel: topKeyFromMap(metric.topModelMap),
      topPlugin: topKeyFromMap(metric.topPluginMap, "Direct Assistant"),
      interactionCount: metric.interactionIds.length,
      recommendationIds: [],
    }))
    .sort((a, b) => b.totalConsumption - a.totalConsumption);

  const teamsMap = new Map<string, TeamSummary>();
  engineers.forEach((engineer) => {
    if (!teamsMap.has(engineer.teamId)) {
      teamsMap.set(engineer.teamId, {
        id: engineer.teamId,
        name: engineer.teamName,
        costCenterId: engineer.costCenterId,
        costCenterName: engineer.costCenterName,
        costCenterCode: engineer.costCenterCode,
        engineeringManager: engineer.engineeringManager,
        totalConsumption: 0,
        overrun: 0,
        activeEngineers: 0,
        topEngineer: "",
        topUseCase: "",
        topModel: "",
        topChannel: "",
        recommendationIds: [],
      });
    }
    const team = teamsMap.get(engineer.teamId)!;
    team.totalConsumption += engineer.totalConsumption;
    team.overrun += engineer.overrun;
    team.activeEngineers += isMateriallyActiveEngineer(engineer) ? 1 : 0;
  });

  teamsMap.forEach((team) => {
    const teamEngineers = engineers.filter((engineer) => engineer.teamId === team.id);
    team.topEngineer = teamEngineers[0]?.name || "N/A";
    team.topUseCase = topKeyFromMap(
      new Map(
        teamEngineers.map((engineer) => [engineer.topUseCase, engineer.totalConsumption]),
      ),
    );
    team.topModel = topKeyFromMap(
      new Map(teamEngineers.map((engineer) => [engineer.topModel, engineer.totalConsumption])),
    );
    const teamInteractions = interactions.filter((interaction) => interaction.teamId === team.id);
    team.topChannel = topKeyFromMap(
      new Map(
        Array.from(
          teamInteractions.reduce((acc, interaction) => {
            acc.set(interaction.interactionChannel, (acc.get(interaction.interactionChannel) || 0) + 1);
            return acc;
          }, new Map<string, number>()),
        ),
      ),
    );
  });
  const teams = Array.from(teamsMap.values()).sort((a, b) => b.totalConsumption - a.totalConsumption);

  const costCenterMap = new Map<string, CostCenterSummary>();
  teams.forEach((team) => {
    if (!costCenterMap.has(team.costCenterId)) {
      costCenterMap.set(team.costCenterId, {
        id: team.costCenterId,
        code: team.costCenterCode,
        name: team.costCenterName,
        totalConsumption: 0,
        overrun: 0,
        activeEngineers: 0,
        teamCount: 0,
        topTeam: "",
        topUseCase: "",
        topModel: "",
        topEngineer: "",
        recommendationIds: [],
      });
    }
    const costCenter = costCenterMap.get(team.costCenterId)!;
    costCenter.totalConsumption += team.totalConsumption;
    costCenter.overrun += team.overrun;
    costCenter.activeEngineers += team.activeEngineers;
    costCenter.teamCount += 1;
  });
  costCenterMap.forEach((costCenter) => {
    const ccTeams = teams.filter((team) => team.costCenterId === costCenter.id);
    const ccEngineers = engineers.filter((engineer) => engineer.costCenterId === costCenter.id);
    costCenter.topTeam = ccTeams[0]?.name || "N/A";
    costCenter.topEngineer = ccEngineers[0]?.name || "N/A";
    costCenter.topUseCase = topKeyFromMap(
      new Map(ccEngineers.map((engineer) => [engineer.topUseCase, engineer.totalConsumption])),
    );
    costCenter.topModel = topKeyFromMap(
      new Map(ccEngineers.map((engineer) => [engineer.topModel, engineer.totalConsumption])),
    );
  });
  const costCenters = Array.from(costCenterMap.values()).sort((a, b) => b.totalConsumption - a.totalConsumption);

  const useCaseMap = new Map<string, UseCaseSummary>();
  interactions.forEach((interaction) => {
    if (!useCaseMap.has(interaction.useCaseKey)) {
      const meta = USE_CASES[interaction.useCaseKey] ?? {
        label: interaction.useCaseLabel,
        category: "General SDLC Support",
        summary: "General AI-assisted software delivery workflow.",
        recommendedModelTier: "Balanced",
      };
      useCaseMap.set(interaction.useCaseKey, {
        key: interaction.useCaseKey,
        label: meta.label,
        category: meta.category,
        summary: meta.summary,
        recommendedModelTier: meta.recommendedModelTier,
        totalConsumption: 0,
        interactionCount: 0,
        avgPromptChars: 0,
        avgResponseChars: 0,
        dominantModel: "",
        dominantPlugin: "",
        dominantMcp: "",
        topRequestSource: "",
        dominantAgentPattern: "",
        deterministicShare: 0,
        highReasoningShare: 0,
        executionPattern: "Reasoning-led",
        relatedRecommendationIds: [],
      });
    }
    const useCase = useCaseMap.get(interaction.useCaseKey)!;
    useCase.totalConsumption += interaction.estimatedCredits;
    useCase.interactionCount += 1;
    useCase.avgPromptChars += interaction.promptChars;
    useCase.avgResponseChars += interaction.responseChars;
  });
  useCaseMap.forEach((useCase, key) => {
    const scopedInteractions = interactions.filter((interaction) => interaction.useCaseKey === key);
    useCase.avgPromptChars = Math.round(useCase.avgPromptChars / Math.max(1, useCase.interactionCount));
    useCase.avgResponseChars = Math.round(useCase.avgResponseChars / Math.max(1, useCase.interactionCount));
    useCase.dominantModel = topKeyFromMap(
      new Map(
        Array.from(
          scopedInteractions.reduce((acc, interaction) => {
            acc.set(interaction.modelName, (acc.get(interaction.modelName) || 0) + interaction.estimatedCredits);
            return acc;
          }, new Map<string, number>()),
        ),
      ),
    );
    useCase.dominantPlugin = topKeyFromMap(
      new Map(
        Array.from(
          scopedInteractions.reduce((acc, interaction) => {
            acc.set(interaction.pluginName, (acc.get(interaction.pluginName) || 0) + interaction.estimatedCredits);
            return acc;
          }, new Map<string, number>()),
        ),
      ),
      "Direct Assistant",
    );
    useCase.dominantMcp = topKeyFromMap(
      new Map(
        Array.from(
          scopedInteractions.reduce((acc, interaction) => {
            acc.set(interaction.mcpServer, (acc.get(interaction.mcpServer) || 0) + interaction.estimatedCredits);
            return acc;
          }, new Map<string, number>()),
        ),
      ),
      "No MCP Invoked",
    );
    useCase.topRequestSource = topKeyFromMap(
      new Map(
        Array.from(
          scopedInteractions.reduce((acc, interaction) => {
            acc.set(interaction.requestSource, (acc.get(interaction.requestSource) || 0) + interaction.estimatedCredits);
            return acc;
          }, new Map<string, number>()),
        ),
      ),
    );
    useCase.dominantAgentPattern = topKeyFromMap(
      new Map(
        Array.from(
          scopedInteractions.reduce((acc, interaction) => {
            acc.set(interaction.agentPattern, (acc.get(interaction.agentPattern) || 0) + interaction.estimatedCredits);
            return acc;
          }, new Map<string, number>()),
        ),
      ),
    );
    useCase.deterministicShare = Number(
      (
        scopedInteractions.filter((interaction) => DETERMINISTIC_SOURCES.has(interaction.requestSource)).length /
        Math.max(scopedInteractions.length, 1)
      ).toFixed(2),
    );
    useCase.highReasoningShare = Number(
      (
        scopedInteractions.filter((interaction) => interaction.modelCategory === "High Reasoning").length /
        Math.max(scopedInteractions.length, 1)
      ).toFixed(2),
    );
    useCase.executionPattern =
      useCase.deterministicShare >= 0.35 ? "Hooks / tools first" : "Reasoning-led";
  });
  const useCases = Array.from(useCaseMap.values()).sort((a, b) => b.totalConsumption - a.totalConsumption);

  const recommendations: Recommendation[] = [];
  const addRecommendation = (recommendation: Recommendation) => recommendations.push(recommendation);

  costCenters.forEach((costCenter) => {
    const scopedEngineers = engineers.filter((engineer) => engineer.costCenterId === costCenter.id);
    const topEngineer = scopedEngineers[0];
    if (topEngineer && topEngineer.totalConsumption / Math.max(costCenter.totalConsumption, 1) > 0.18) {
      addRecommendation({
        id: `rec-spend-${costCenter.id}`,
        title: `Reduce spend concentration in ${costCenter.name}`,
        type: "Spend Concentration",
        severity: "High",
        scopeType: "Cost Center",
        scopeId: costCenter.id,
        scopeLabel: costCenter.name,
        whyItMatters: `${topEngineer.name} drives an outsized share of AI consumption inside this cost center.`,
        supportingSignals: [
          `${topEngineer.name} contributes ${Math.round((topEngineer.totalConsumption / costCenter.totalConsumption) * 100)}% of AI consumption.`,
          `${costCenter.topUseCase} is the dominant use case under this scope.`,
        ],
        recommendedAction: "Review the highest-cost workflows in this cost center and add team-level routing or coaching guardrails.",
        expectedImpact: "Lower concentration risk and reduce surprise overrun spikes.",
        evidenceInteractionIds: interactions
          .filter((interaction) => interaction.costCenterId === costCenter.id)
          .sort((a, b) => b.estimatedCredits - a.estimatedCredits)
          .slice(0, 2)
          .map((interaction) => interaction.id),
      });
    }

    if (costCenter.overrun > 100) {
      addRecommendation({
        id: `rec-overrun-${costCenter.id}`,
        title: `Control overrun exposure in ${costCenter.name}`,
        type: "Overrun Risk",
        severity: costCenter.overrun > 250 ? "High" : "Medium",
        scopeType: "Cost Center",
        scopeId: costCenter.id,
        scopeLabel: costCenter.name,
        whyItMatters: "This cost center is already generating meaningful overrun credits in the current reporting window.",
        supportingSignals: [
          `Overrun credits: ${formatCompact(costCenter.overrun)}`,
          `Top model pressure: ${costCenter.topModel}`,
        ],
        recommendedAction: "Prioritize lower-cost models for repeatable use cases and add alert thresholds for high-cost interactions.",
        expectedImpact: "Reduces overrun risk without blocking the highest-value workflows.",
        evidenceInteractionIds: interactions
          .filter((interaction) => interaction.costCenterId === costCenter.id)
          .sort((a, b) => b.estimatedCredits - a.estimatedCredits)
          .slice(0, 2)
          .map((interaction) => interaction.id),
      });
    }
  });

  useCases.forEach((useCase) => {
    if (useCase.key === "spec-orchestration" && (useCase.avgPromptChars > 4500 || useCase.dominantAgentPattern === "spec-driven")) {
      addRecommendation({
        id: `rec-spec-steering-${useCase.key}`,
        title: "Break requirements-heavy workflows into scoped delivery stages",
        type: "Steering Scope",
        severity: useCase.avgPromptChars > 6000 ? "High" : "Medium",
        scopeType: "Use Case",
        scopeId: useCase.key,
        scopeLabel: useCase.label,
        whyItMatters: "Requirements and specification threads are carrying large planning context before implementation work even begins.",
        supportingSignals: [
          `Average prompt size: ${useCase.avgPromptChars.toLocaleString()} chars`,
          `Dominant agent pattern: ${useCase.dominantAgentPattern}`,
          `Top request source: ${useCase.topRequestSource}`,
        ],
        recommendedAction: "Keep the specification thread for planning, then hand off focused implementation packets. Avoid replaying the full requirements history into each downstream interaction.",
        expectedImpact: "Reduces input bloat and keeps specification work from inflating every downstream delivery interaction.",
        evidenceInteractionIds: interactions
          .filter((interaction) => interaction.useCaseKey === useCase.key)
          .sort((a, b) => b.promptChars - a.promptChars)
          .slice(0, 2)
          .map((interaction) => interaction.id),
      });
    }

    if (
      useCase.key === "test-generation" &&
      !LOWER_COST_MODEL_HINTS.some((model) => useCase.dominantModel.includes(model))
    ) {
      addRecommendation({
        id: `rec-usecase-${useCase.key}`,
        title: "Route test generation and coverage expansion to a lighter model tier",
        type: "Model Routing",
        severity: "Medium",
        scopeType: "Use Case",
        scopeId: useCase.key,
        scopeLabel: useCase.label,
        whyItMatters: "Test generation and coverage expansion rarely need the most expensive reasoning tier.",
        supportingSignals: [
          `Dominant model: ${useCase.dominantModel}`,
          `Average prompt size: ${useCase.avgPromptChars.toLocaleString()} chars`,
        ],
        recommendedAction: "Default unit-test generation to lower-cost coder models such as Qwen3 Coder Next or DeepSeek V3.2, and escalate only for unusual fixtures, integration complexity, or cross-service reasoning.",
        expectedImpact: "Reduces routine test-generation cost while keeping AI assistant focused on coverage expansion rather than expensive default reasoning.",
        evidenceInteractionIds: interactions
          .filter((interaction) => interaction.useCaseKey === useCase.key)
          .slice(0, 2)
          .map((interaction) => interaction.id),
      });
    }

    if (["test-generation", "guardrail-evaluation", "platform-hardening"].includes(useCase.key) && useCase.deterministicShare >= 0.35) {
      const deterministicTitle =
        useCase.key === "platform-hardening"
          ? "Automate deterministic CI/CD and release validation steps"
          : useCase.key === "guardrail-evaluation"
            ? "Automate deterministic review and control checks"
            : "Automate deterministic test-generation steps";

      addRecommendation({
        id: `rec-deterministic-${useCase.key}`,
        title: deterministicTitle,
        type: "Use Case Optimization",
        severity: "High",
        scopeType: "Use Case",
        scopeId: useCase.key,
        scopeLabel: useCase.label,
        whyItMatters: "This workflow is spending material AI consumption on steps that are often deterministic and repeatable.",
        supportingSignals: [
          `Deterministic source share: ${Math.round(useCase.deterministicShare * 100)}%`,
          `Top request source: ${useCase.topRequestSource}`,
          `Dominant plugin/MCP: ${useCase.dominantPlugin} / ${useCase.dominantMcp}`,
        ],
        recommendedAction: "Move repeatable checks into hooks, scripts, or workflow automation for steps such as CI validation, security gates, quality checks, and test execution. Keep AI assistant focused on interpretation, exception handling, and remediation choices.",
        expectedImpact: "Reduces chat-driven spend and produces more repeatable, policy-controlled delivery behavior.",
        evidenceInteractionIds: interactions
          .filter((interaction) => interaction.useCaseKey === useCase.key)
          .sort((a, b) => b.estimatedCredits - a.estimatedCredits)
          .slice(0, 2)
          .map((interaction) => interaction.id),
      });
    }

    if ((useCase.key === "guardrail-evaluation" || REVIEW_DRIVEN_SOURCES.has(useCase.topRequestSource)) && useCase.highReasoningShare > 0) {
      addRecommendation({
        id: `rec-review-routing-${useCase.key}`,
        title: "Keep code review and control validation on balanced reasoning before escalation",
        type: "Model Routing",
        severity: "Medium",
        scopeType: "Use Case",
        scopeId: useCase.key,
        scopeLabel: useCase.label,
        whyItMatters: "Review-heavy workflows benefit more from consistent guardrails and deterministic checks than from defaulting to the highest reasoning tier.",
        supportingSignals: [
          `High-reasoning share: ${Math.round(useCase.highReasoningShare * 100)}%`,
          `Top request source: ${useCase.topRequestSource}`,
          `Recommended tier: ${useCase.recommendedModelTier}`,
        ],
        recommendedAction: "Start code review, validation, and guardrail checks on balanced or lower-cost models, then escalate only when the findings need architectural interpretation or non-deterministic reasoning.",
        expectedImpact: "Lowers review cost while preserving escalation paths for truly complex reasoning.",
        evidenceInteractionIds: interactions
          .filter((interaction) => interaction.useCaseKey === useCase.key)
          .sort((a, b) => b.estimatedCredits - a.estimatedCredits)
          .slice(0, 2)
          .map((interaction) => interaction.id),
      });
    }

    if (useCase.avgPromptChars > 5500) {
      addRecommendation({
        id: `rec-prompt-${useCase.key}`,
        title: `Trim repeated context in ${useCase.label}`,
        type: "Prompt Discipline",
        severity: "Medium",
        scopeType: "Use Case",
        scopeId: useCase.key,
        scopeLabel: useCase.label,
        whyItMatters: "This use case shows consistently large prompt payloads that are likely carrying repeated context or broad instructions.",
        supportingSignals: [
          `Average prompt size: ${useCase.avgPromptChars.toLocaleString()} chars`,
          `Dominant plugin/MCP: ${useCase.dominantPlugin} / ${useCase.dominantMcp}`,
        ],
        recommendedAction: "Review steering, retrieved context, and reusable prompt templates for this workflow before escalating models.",
        expectedImpact: "Reduces input size and lowers hallucination risk caused by over-broad instructions.",
        evidenceInteractionIds: interactions
          .filter((interaction) => interaction.useCaseKey === useCase.key)
          .sort((a, b) => b.promptChars - a.promptChars)
          .slice(0, 2)
          .map((interaction) => interaction.id),
      });
    }

    if (
      useCase.dominantPlugin !== "Direct Assistant" &&
      (["plugin-action", "mcp-tool"].includes(useCase.topRequestSource) || useCase.deterministicShare >= 0.25)
    ) {
      addRecommendation({
        id: `rec-plugin-workflow-${useCase.key}`,
        title: `Reduce tool-driven loops in ${useCase.label}`,
        type: "Plugin Governance",
        severity: "Medium",
        scopeType: "Use Case",
        scopeId: useCase.key,
        scopeLabel: useCase.label,
        whyItMatters: "This workflow is leaning on plugin or MCP augmentation in places where a narrower hook or direct AI assistant path may be enough.",
        supportingSignals: [
          `Top request source: ${useCase.topRequestSource}`,
          `Dominant plugin/MCP: ${useCase.dominantPlugin} / ${useCase.dominantMcp}`,
        ],
        recommendedAction: "Inspect whether the same plugin sequence is being repeated. Where the outcome is deterministic, move it into hooks, scripts, or a narrower direct workflow and reserve plugin-assisted reasoning for exception handling.",
        expectedImpact: "Cuts tool-amplified input growth and keeps augmentation focused on non-deterministic reasoning steps.",
        evidenceInteractionIds: interactions
          .filter((interaction) => interaction.useCaseKey === useCase.key)
          .sort((a, b) => b.estimatedCredits - a.estimatedCredits)
          .slice(0, 2)
          .map((interaction) => interaction.id),
      });
    }
  });

  const conversationStats = Array.from(
    interactions.reduce((acc, interaction) => {
      const current = acc.get(interaction.conversationId) ?? { turns: 0, promptChars: 0, credits: 0 };
      current.turns += 1;
      current.promptChars += interaction.promptChars;
      current.credits += interaction.estimatedCredits;
      acc.set(interaction.conversationId, current);
      return acc;
    }, new Map<string, { turns: number; promptChars: number; credits: number }>()),
  );
  const longThreadCount = conversationStats.filter(([, stat]) => stat.turns >= 3 && stat.promptChars / stat.turns >= 3500).length;
  if (longThreadCount) {
    addRecommendation({
      id: "rec-conversation-hygiene",
      title: "Restart or summarize long-running conversations before context compounds",
      type: "Prompt Discipline",
      severity: "Medium",
      scopeType: "Enterprise",
      scopeId: "enterprise",
      scopeLabel: "Enterprise",
      whyItMatters: "Longer conversation chains accumulate prior turns, summaries, and tool output, which increases input size even when the next task is narrow.",
      supportingSignals: [
        `${longThreadCount} conversations already exceed 2 turns with large average prompt payloads.`,
        "Spec-driven and review-heavy threads are the most likely to accumulate repeated context.",
      ],
      recommendedAction: "Summarize decisions, restart the thread with only the necessary context, and avoid replaying the full planning or validation history into each follow-up.",
      expectedImpact: "Lowers avoidable prompt growth and reduces the chance that stale context shapes later answers.",
      evidenceInteractionIds: interactions
        .sort((a, b) => b.promptChars - a.promptChars)
        .slice(0, 2)
        .map((interaction) => interaction.id),
    });
  }

  const lowUtilizationEngineers = engineers.filter(
    (engineer) => engineer.subscriptionStatus.toLowerCase() === "active" && engineer.activeDays <= 3,
  );
  if (EXECUTIVE_LICENSE_SCENARIO.unusedLicenses > 0 || lowUtilizationEngineers.length) {
    addRecommendation({
      id: "rec-license-hygiene-global",
      title: "Reclaim or reassign idle active licenses",
      type: "License Hygiene",
      severity: "Medium",
      scopeType: "Enterprise",
      scopeId: "enterprise",
      scopeLabel: "Enterprise",
      whyItMatters: "Idle seats dilute license adoption and make it harder to justify the current subscription footprint.",
      supportingSignals: [
        `${EXECUTIVE_LICENSE_SCENARIO.unusedLicenses} current licenses have been idle for more than ${EXECUTIVE_LICENSE_SCENARIO.idleThresholdDays} days.`,
        lowUtilizationEngineers[0]
          ? `Most affected observed scope: ${lowUtilizationEngineers[0].costCenterName}`
          : `Executive license posture is modeled at ${EXECUTIVE_LICENSE_SCENARIO.totalLicenses} total licenses.`,
      ],
      recommendedAction: "Reclaim, reassign, or coach idle seats before the next billing cycle so active licenses align with current demand.",
      expectedImpact: "Improves license efficiency and reduces avoidable subscription waste without limiting active delivery teams.",
      evidenceInteractionIds: [],
    });
  }

  const pluginHotspot = Array.from(
    interactions.reduce((acc, interaction) => {
      if (interaction.pluginName === "Direct Assistant") return acc;
      acc.set(interaction.pluginName, (acc.get(interaction.pluginName) || 0) + interaction.estimatedCredits);
      return acc;
    }, new Map<string, number>()),
  ).sort((a, b) => b[1] - a[1])[0];

  if (pluginHotspot) {
    addRecommendation({
      id: "rec-plugin-hotspot",
      title: `Review ${pluginHotspot[0]} plugin-heavy workflows`,
      type: "Plugin Governance",
      severity: "Medium",
      scopeType: "Enterprise",
      scopeId: "enterprise",
      scopeLabel: "Enterprise",
      whyItMatters: "One plugin is disproportionately associated with AI consumption and may be amplifying context volume.",
      supportingSignals: [`${pluginHotspot[0]} is the highest plugin cost contributor at ${formatCompact(pluginHotspot[1])}.`],
      recommendedAction: "Inspect the top interactions using this plugin and decide whether narrower scope or tool-first validation should come earlier.",
      expectedImpact: "Reduces tool-amplified input growth and clarifies when plugin augmentation is necessary.",
      evidenceInteractionIds: interactions
        .filter((interaction) => interaction.pluginName === pluginHotspot[0])
        .sort((a, b) => b.estimatedCredits - a.estimatedCredits)
        .slice(0, 2)
        .map((interaction) => interaction.id),
    });
  }

  const mcpHotspot = Array.from(
    interactions.reduce((acc, interaction) => {
      if (interaction.mcpServer === "No MCP Invoked") return acc;
      acc.set(interaction.mcpServer, (acc.get(interaction.mcpServer) || 0) + interaction.estimatedCredits);
      return acc;
    }, new Map<string, number>()),
  ).sort((a, b) => b[1] - a[1])[0];

  if (mcpHotspot) {
    addRecommendation({
      id: "rec-mcp-hotspot",
      title: `Audit MCP-heavy usage through ${mcpHotspot[0]}`,
      type: "MCP Governance",
      severity: "Low",
      scopeType: "Enterprise",
      scopeId: "enterprise",
      scopeLabel: "Enterprise",
      whyItMatters: "MCP-heavy flows can be high-value, but they also expand evidence and context loads.",
      supportingSignals: [`${mcpHotspot[0]} drives ${formatCompact(mcpHotspot[1])} estimated credits.`],
      recommendedAction: "Validate whether MCP payloads are summarized before being injected back into long-running conversations.",
      expectedImpact: "Improves tool efficiency and reduces avoidable context carryover.",
      evidenceInteractionIds: interactions
        .filter((interaction) => interaction.mcpServer === mcpHotspot[0])
        .sort((a, b) => b.estimatedCredits - a.estimatedCredits)
        .slice(0, 2)
        .map((interaction) => interaction.id),
    });
  }

  recommendations.sort((left, right) => {
    const severityWeight = { High: 0, Medium: 1, Low: 2 } as const;
    const severityDelta = severityWeight[left.severity] - severityWeight[right.severity];
    if (severityDelta !== 0) return severityDelta;
    const typeDelta =
      RECOMMENDATION_PRIORITY.indexOf(left.type) - RECOMMENDATION_PRIORITY.indexOf(right.type);
    if (typeDelta !== 0) return typeDelta;
    return left.title.localeCompare(right.title);
  });

  const recommendationIdsByScope = new Map<string, string[]>();
  recommendations.forEach((recommendation) => {
    const key = `${recommendation.scopeType}:${recommendation.scopeId}`;
    recommendationIdsByScope.set(key, [...(recommendationIdsByScope.get(key) || []), recommendation.id]);
  });
  costCenters.forEach((costCenter) => {
    costCenter.recommendationIds = recommendationIdsByScope.get(`Cost Center:${costCenter.id}`) || [];
  });
  teams.forEach((team) => {
    team.recommendationIds = recommendationIdsByScope.get(`Team:${team.id}`) || [];
  });
  engineers.forEach((engineer) => {
    engineer.recommendationIds = recommendationIdsByScope.get(`Engineer:${engineer.userId}`) || [];
  });
  useCases.forEach((useCase) => {
    useCase.relatedRecommendationIds = recommendationIdsByScope.get(`Use Case:${useCase.key}`) || [];
  });

  const latestDate = activityRows.reduce((latest, row) => (row.Date > latest ? row.Date : latest), activityRows[0]?.Date || "2026-05-31");
  const dailyTrend = Array.from(
    activityRows.reduce((acc, row) => {
      const mapping = mappingByUserId.get(row.UserId);
      if (!mapping) return acc;
      const existing = acc.get(row.Date) || { date: row.Date, consumption: 0, overrun: 0 };
      existing.consumption += scaleActivityCredits(mapping.User_Name, mapping.Cost_Center, row.Date, toNumber(row.Credits_Used));
      existing.overrun += scaleActivityOverrun(
        mapping.User_Name,
        mapping.Cost_Center,
        row.Date,
        toNumber(row.Overage_Credits_Used),
      );
      acc.set(row.Date, existing);
      return acc;
    }, new Map<string, { date: string; consumption: number; overrun: number }>()),
  )
    .map(([, value]) => value)
    .sort((a, b) => a.date.localeCompare(b.date));

  const monthlyByCostCenterMap = new Map<string, Record<string, string | number>>();
  activityRows.forEach((row) => {
    const mapping = mappingByUserId.get(row.UserId);
    if (!mapping) return;
    const month = row.Date.slice(0, 7);
    const key = `${month}:${mapping.Box_Name}`;
    const existing = monthlyByCostCenterMap.get(key) || {
      month,
      costCenterId: mapping.Cost_Center,
      costCenterName: mapping.Box_Name,
      consumption: 0,
      overrun: 0,
    };
    existing.consumption =
      toNumber(existing.consumption) +
      scaleActivityCredits(mapping.User_Name, mapping.Cost_Center, row.Date, toNumber(row.Credits_Used));
    existing.overrun =
      toNumber(existing.overrun) +
      scaleActivityOverrun(mapping.User_Name, mapping.Cost_Center, row.Date, toNumber(row.Overage_Credits_Used));
    monthlyByCostCenterMap.set(key, existing);
  });
  const monthlyByCostCenter = Array.from(monthlyByCostCenterMap.values()).sort((a, b) =>
    `${a.month}`.localeCompare(`${b.month}`),
  );

  const clientMixByCostCenter = costCenters.map((costCenter) => {
    const scopedEngineers = engineers.filter((engineer) => engineer.costCenterId === costCenter.id);
    const totals = scopedEngineers.reduce(
      (acc, engineer) => {
        acc.ide += engineer.clientMix.IDE || 0;
        acc.cli += engineer.clientMix.CLI || 0;
        acc.plugin += engineer.clientMix.PLUGIN || 0;
        return acc;
      },
      { ide: 0, cli: 0, plugin: 0 },
    );
    return {
      name: costCenter.name,
      ide: Math.round(totals.ide / Math.max(scopedEngineers.length, 1)),
      cli: Math.round(totals.cli / Math.max(scopedEngineers.length, 1)),
      plugin: Math.round(totals.plugin / Math.max(scopedEngineers.length, 1)),
    };
  });

  const runs: AdvisorRun[] = [
    {
      id: "run-ai-001",
      title: "Enterprise AI Advisor Review",
      mode: "AI Advisor",
      scopeLabel: "Enterprise",
      status: "Completed",
      startedAt: `${latestDate} 09:10`,
      summary: "Flagged concentration risk, prompt bloat in spec workflows, and low-utilization seats.",
    },
    {
      id: "run-sim-002",
      title: "Model Routing Scenario",
      mode: "Policy Simulation",
      scopeLabel: "Underwriting & Risk Controls",
      status: "Running",
      startedAt: `${latestDate} 11:35`,
      summary: "Testing lighter-model routing for transformation and test-generation tasks.",
    },
    {
      id: "run-report-003",
      title: "Capital Markets & Regulatory Insights Strategic Report",
      mode: "Strategic Report",
      scopeLabel: "Capital Markets & Regulatory Insights",
      status: "Queued",
      startedAt: `${latestDate} 13:00`,
      summary: "Preparing report with overrun and plugin governance emphasis.",
    },
  ];

  const reports: ReportSummary[] = [
    {
      id: "rep-enterprise-q2",
      title: "Q2 Enterprise AI Governance Review",
      scopeLabel: "Enterprise",
      audience: "Executive Sponsor",
      status: "Completed",
      generatedAt: `${latestDate} 10:20`,
      executiveSummary: "Enterprise spend is concentrated in two cost centers, with clear savings opportunities in test-generation and large spec workflows.",
    },
    {
      id: "rep-payments-ops",
      title: "Underwriting & Risk Controls Optimization Review",
      scopeLabel: "Underwriting & Risk Controls",
      audience: "Delivery Manager",
      status: "Completed",
      generatedAt: `${latestDate} 08:40`,
      executiveSummary: "Underwriting & Risk Controls shows high concentration and repeated context-heavy decisioning prompts that warrant routing and prompt-template changes.",
    },
    {
      id: "rep-retail-risk",
      title: "Capital Markets & Regulatory Insights Overage Watch",
      scopeLabel: "Capital Markets & Regulatory Insights",
      audience: "Architect",
      status: "Processing",
      generatedAt: `${latestDate} 12:55`,
      executiveSummary: "Retail workflows are plugin-heavy and trending toward avoidable overrun unless browser-driven prompts are narrowed.",
    },
  ];

  const highSeverityCount = recommendations.filter((recommendation) => recommendation.severity === "High").length;
  const licenseSummary = {
    totalLicenses: EXECUTIVE_LICENSE_SCENARIO.totalLicenses,
    adoptedLicenses: EXECUTIVE_LICENSE_SCENARIO.totalLicenses - EXECUTIVE_LICENSE_SCENARIO.unusedLicenses,
    unusedLicenses: EXECUTIVE_LICENSE_SCENARIO.unusedLicenses,
    idleThresholdDays: EXECUTIVE_LICENSE_SCENARIO.idleThresholdDays,
    otherActiveAlerts: Math.max(highSeverityCount - 1, 0),
  };

  return {
    meta: {
      mode: "Connected Mode",
      freshness: "Last updated: 1 day ago",
      lastUpdated: latestDate,
    },
    kpis: {
      totalConsumption: engineers.reduce((sum, engineer) => sum + engineer.totalConsumption, 0),
      overrun: engineers.reduce((sum, engineer) => sum + engineer.overrun, 0),
      activeEngineers: engineers.filter(isMateriallyActiveEngineer).length,
      consumptionPerEngineer:
        engineers.reduce((sum, engineer) => sum + engineer.totalConsumption, 0) / Math.max(engineers.length, 1),
      topCostCenter: costCenters[0]?.name || "N/A",
      topEngineer: engineers[0]?.name || "N/A",
      topTeam: teams[0]?.name || "N/A",
      topUseCase: useCases[0]?.label || "N/A",
    },
    licenseSummary,
    costCenters,
    teams,
    engineers,
    interactions: interactions.sort((a, b) => b.estimatedCredits - a.estimatedCredits),
    useCases,
    recommendations,
    runs,
    reports,
    dailyTrend,
    monthlyByCostCenter,
    clientMixByCostCenter,
  };
}

export const TELEMETRY_DATA = buildDataset();

export function getTeamsForCostCenter(costCenterId: string) {
  return TELEMETRY_DATA.teams.filter((team) => team.costCenterId === costCenterId);
}

export function getEngineersForTeam(teamId: string) {
  return TELEMETRY_DATA.engineers.filter((engineer) => engineer.teamId === teamId);
}

export function getInteractionsForScope(scope: Scope) {
  return TELEMETRY_DATA.interactions.filter((interaction) => {
    if (scope.costCenterId && interaction.costCenterId !== scope.costCenterId) return false;
    if (scope.teamId && interaction.teamId !== scope.teamId) return false;
    if (scope.engineerId && interaction.userId !== scope.engineerId) return false;
    if (scope.useCaseKey && interaction.useCaseKey !== scope.useCaseKey) return false;
    return true;
  });
}

export function getUseCaseSummariesForScope(scope: Scope) {
  const scopedInteractions = getInteractionsForScope(scope);
  const summaries = new Map<string, UseCaseSummary>();
  scopedInteractions.forEach((interaction) => {
    const base = TELEMETRY_DATA.useCases.find((useCase) => useCase.key === interaction.useCaseKey);
    if (!base) return;
    if (!summaries.has(base.key)) {
      summaries.set(base.key, { ...base, totalConsumption: 0, interactionCount: 0, avgPromptChars: 0, avgResponseChars: 0, relatedRecommendationIds: base.relatedRecommendationIds });
    }
    const summary = summaries.get(base.key)!;
    summary.totalConsumption += interaction.estimatedCredits;
    summary.interactionCount += 1;
    summary.avgPromptChars += interaction.promptChars;
    summary.avgResponseChars += interaction.responseChars;
  });
  return Array.from(summaries.values())
    .map((summary) => ({
      ...summary,
      avgPromptChars: Math.round(summary.avgPromptChars / Math.max(summary.interactionCount, 1)),
      avgResponseChars: Math.round(summary.avgResponseChars / Math.max(summary.interactionCount, 1)),
    }))
    .sort((a, b) => b.totalConsumption - a.totalConsumption);
}

export function getRecommendationsForScope(scopeType: Recommendation["scopeType"], scopeId: string) {
  return TELEMETRY_DATA.recommendations.filter(
    (recommendation) =>
      (recommendation.scopeType === scopeType && recommendation.scopeId === scopeId) ||
      recommendation.scopeType === "Enterprise",
  );
}

export function getInteractionById(interactionId: string | null | undefined) {
  return TELEMETRY_DATA.interactions.find((interaction) => interaction.id === interactionId) || null;
}

export function getCostCenterById(costCenterId: string | undefined) {
  return TELEMETRY_DATA.costCenters.find((costCenter) => costCenter.id === costCenterId) || null;
}

export function getTeamById(teamId: string | undefined) {
  return TELEMETRY_DATA.teams.find((team) => team.id === teamId) || null;
}

export function getEngineerBySlug(engineerSlug: string | undefined) {
  return TELEMETRY_DATA.engineers.find((engineer) => engineer.id === engineerSlug) || null;
}

export function formatConsumption(value: number) {
  return formatCompact(value, value >= 1000 ? 1 : 0);
}

export function formatPercent(value: number) {
  return `${Math.round(value)}%`;
}
