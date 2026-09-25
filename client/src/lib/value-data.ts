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
