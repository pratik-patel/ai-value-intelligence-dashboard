import type { InteractionSummary } from "@/lib/telemetry-data";

export type ValueMetrics = {
  usage: number;
  runs: number;
  successfulOutcomes: number;
  qualityPassRate: number;
  hoursSaved: number;
  estimatedCost: number;
  estimatedBenefit: number;
  roi: number;
  efficiencyIndex: number;
  cycleTimeImprovement: number;
};

export type ScalablePattern = {
  userId: string;
  userName: string;
  teamName: string;
  useCase: string;
  useCaseShare: number;
  dominantModel: string;
  modelShare: number;
  outcomes: number;
  efficiency: number;
  quality: number;
  action: string;
};

function hash(value: string) {
  return value.split("").reduce((total, character) => ((total * 31 + character.charCodeAt(0)) >>> 0), 17);
}

export function getValueMetrics(interactions: InteractionSummary[], _scopeKey = "enterprise"): ValueMetrics {
  const usage = interactions.reduce((total, item) => total + item.estimatedCredits, 0);
  const runs = interactions.length;
  const successfulRows = interactions.filter((item) => hash(`${item.id}:outcome`) % 100 < 79);
  const qualityRows = interactions.filter((item) => hash(`${item.id}:quality`) % 100 < 88);
  const successfulOutcomes = successfulRows.length;
  const qualityPassRate = runs ? Math.round(qualityRows.length / runs * 100) : 0;
  const hoursSaved = successfulRows.reduce((total, item) => total + 0.7 + (hash(`${item.id}:time`) % 10) / 10, 0);
  const estimatedCost = usage * 0.032;
  const estimatedBenefit = hoursSaved * 92 * (qualityPassRate / 100);
  const roi = estimatedCost ? (estimatedBenefit - estimatedCost) / estimatedCost : 0;
  const efficiencyIndex = usage ? (successfulOutcomes / usage) * 1000 : 0;
  const cycleTimeImprovement = runs ? Math.round(interactions.reduce((total, item) => total + 12 + (hash(`${item.id}:cycle`) % 23), 0) / runs) : 0;
  return { usage, runs, successfulOutcomes, qualityPassRate, hoursSaved, estimatedCost, estimatedBenefit, roi, efficiencyIndex, cycleTimeImprovement };
}

export function getReasoningFit(interactions: InteractionSummary[]) {
  const tiers = ["High Reasoning", "Balanced", "Coder", "Auto"] as const;
  return tiers.map((tier, index) => {
    const rows = interactions.filter((item) => item.modelCategory === tier);
    const usage = rows.reduce((total, item) => total + item.estimatedCredits, 0);
    const fitRate = [64, 82, 88, 76][index];
    return {
      tier: tier.replace("High Reasoning", "High"),
      appropriate: Number((usage * fitRate / 100).toFixed(1)),
      review: Number((usage * (100 - fitRate) / 100).toFixed(1)),
    };
  }).filter((item) => item.appropriate + item.review > 0);
}

export function getWorkflowValue(interactions: InteractionSummary[]) {
  const groups = new Map<string, InteractionSummary[]>();
  interactions.forEach((item) => {
    const label = item.useCaseLabel || "Other";
    groups.set(label, [...(groups.get(label) ?? []), item]);
  });
  return Array.from(groups.entries()).map(([name, rows]) => ({
    name,
    value: rows.reduce((total, item) => total + item.estimatedCredits, 0),
    ...getValueMetrics(rows, name),
  })).sort((a, b) => b.value - a.value);
}

export function getPatternsWorthScaling(interactions: InteractionSummary[], limit = 3): ScalablePattern[] {
  const byUser = new Map<string, InteractionSummary[]>();
  interactions.forEach((item) => byUser.set(item.engineerId, [...(byUser.get(item.engineerId) ?? []), item]));

  return Array.from(byUser.entries()).map(([userId, rows]) => {
    const metrics = getValueMetrics(rows, userId);
    const workflows = summarizeUsage(rows, "useCaseLabel");
    const models = summarizeUsage(rows, "modelName");
    const topWorkflow = workflows[0];
    const topModel = models[0];
    const score = metrics.efficiencyIndex * 0.45 + metrics.successfulOutcomes * 0.35 + metrics.qualityPassRate * 0.2;
    return {
      userId,
      userName: rows[0]?.engineerName ?? userId,
      teamName: rows[0]?.teamName ?? "Team",
      useCase: topWorkflow?.name ?? "Unattributed workflow",
      useCaseShare: Math.round((topWorkflow?.value ?? 0) / (metrics.usage || 1) * 100),
      dominantModel: topModel?.name ?? "Unattributed model",
      modelShare: Math.round((topModel?.value ?? 0) / (metrics.usage || 1) * 100),
      outcomes: metrics.successfulOutcomes,
      efficiency: metrics.efficiencyIndex,
      quality: metrics.qualityPassRate,
      action: scaleActionFor(topWorkflow?.name),
      score,
      runs: metrics.runs,
    };
  }).filter((item) => item.runs >= 50 && item.outcomes >= 40 && item.quality >= 85)
    .sort((a, b) => b.score - a.score)
    .slice(0, limit)
    .map(({ score: _score, runs: _runs, ...item }) => item);
}

export function getSkillValue(interactions: InteractionSummary[]) {
  const skills = [
    { name: "Code generation", match: ["implementation", "development", "coding"] },
    { name: "Test design", match: ["test", "quality", "qa"] },
    { name: "Analysis", match: ["analysis", "review", "debug"] },
    { name: "Documentation", match: ["document", "explain", "summary"] },
  ];
  return skills.map((skill, index) => {
    const matched = interactions.filter((item) => skill.match.some((term) => `${item.useCaseLabel} ${item.requestSource}`.toLowerCase().includes(term)));
    const fallback = matched.length ? matched : interactions.filter((_, rowIndex) => rowIndex % skills.length === index);
    const metrics = getValueMetrics(fallback, skill.name);
    return { name: skill.name, usage: metrics.usage, outcomes: metrics.successfulOutcomes, efficiency: metrics.efficiencyIndex };
  }).filter((item) => item.usage > 0).sort((a, b) => b.usage - a.usage);
}

function summarizeUsage(rows: InteractionSummary[], key: "useCaseLabel" | "modelName") {
  const grouped = new Map<string, number>();
  rows.forEach((item) => grouped.set(item[key] || "Unattributed", (grouped.get(item[key] || "Unattributed") ?? 0) + item.estimatedCredits));
  return Array.from(grouped, ([name, value]) => ({ name, value })).sort((a, b) => b.value - a.value);
}

function scaleActionFor(useCase?: string) {
  if (useCase === "Static Quality Gates") return "Reuse the tool-first quality-gate workflow and its model-routing pattern.";
  if (useCase === "Implementation & Refactoring") return "Reuse focused change sets, clear acceptance criteria, and review checkpoints.";
  if (useCase === "Impact Analysis") return "Standardize the analysis template and route routine cases to balanced models.";
  if (useCase === "Code Review & Control Validation") return "Package the control checklist and tool sequence as a shared workflow.";
  return "Document the workflow, model route, and validation gates before expanding it.";
}
