import { formatConsumption } from "@/lib/telemetry-data";
import type { InteractionSummary, Recommendation } from "@/lib/telemetry-data";

type RecommendationInsightLike = {
  recommendation: Recommendation;
  evidence: InteractionSummary[];
  scopeExposure: number;
};

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

export function RecommendationLandscape({
  landscape,
  sections,
  selectedRecommendationId,
  onSelectRecommendation,
}: {
  landscape: Array<{
    key: string;
    label: string;
    description: string;
    accent: string;
    total: number;
    rows: Array<{ severity: "High" | "Medium" | "Low"; items: RecommendationInsightLike[] }>;
  }>;
  sections: Array<{ severity: "High" | "Medium" | "Low"; title: string; recommendations: RecommendationInsightLike[] }>;
  selectedRecommendationId: string;
  onSelectRecommendation: (recommendationId: string) => void;
}) {
  return (
    <div className="overflow-x-auto">
      <div className="min-w-[980px] space-y-3">
        <div className="grid grid-cols-[136px_repeat(4,minmax(0,1fr))] gap-3">
          <div />
          {landscape.map((cluster) => (
            <div key={cluster.key} className="rounded-2xl border border-white/6 bg-[#0b1120] p-4">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-sm font-semibold text-white">{cluster.label}</p>
                  <p className="mt-1 text-xs leading-relaxed text-slate-500">{cluster.description}</p>
                </div>
                <span className={`rounded-full border px-2.5 py-1 text-[10px] uppercase tracking-[0.22em] ${cluster.accent}`}>
                  {cluster.total}
                </span>
              </div>
            </div>
          ))}
        </div>

        {sections.map((section) => (
          <div key={section.severity} className="grid grid-cols-[136px_repeat(4,minmax(0,1fr))] gap-3">
            <div className={`rounded-2xl border p-4 ${severityMeta[section.severity].accent}`}>
              <p className="text-[11px] uppercase tracking-[0.24em] text-slate-500">{section.title}</p>
              <p className={`mt-3 text-2xl font-semibold ${severityMeta[section.severity].muted}`}>{section.recommendations.length}</p>
            </div>

            {landscape.map((cluster) => {
              const row = cluster.rows.find((item) => item.severity === section.severity);
              const items = row?.items ?? [];

              return (
                <div key={`${cluster.key}-${section.severity}`} className="min-h-[180px] rounded-[24px] border border-white/6 bg-[#0b1120] p-3">
                  {items.length ? (
                    <div className="space-y-2">
                      {items.map((insight) => (
                        <button
                          key={insight.recommendation.id}
                          type="button"
                          onClick={() => onSelectRecommendation(insight.recommendation.id)}
                          className={`w-full rounded-2xl border p-3 text-left transition-all ${
                            insight.recommendation.id === selectedRecommendationId
                              ? "border-blue-500/40 bg-blue-500/10 shadow-[0_0_0_1px_rgba(59,130,246,0.16)]"
                              : "border-white/6 bg-black/20 hover:bg-white/[0.03]"
                          }`}
                        >
                          <p className="text-[13px] font-medium leading-5 text-slate-100">{insight.recommendation.title}</p>
                          <div className="mt-3 flex flex-wrap gap-2 text-[11px] text-slate-500">
                            <span>{formatConsumption(insight.scopeExposure)} credits</span>
                            <span>&bull;</span>
                            <span>{insight.evidence.length} traces</span>
                          </div>
                        </button>
                      ))}
                    </div>
                  ) : (
                    <div className="flex h-full items-center justify-center rounded-2xl border border-dashed border-white/8 bg-black/10 px-3 text-center text-xs text-slate-600">
                      No actions
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        ))}
      </div>
    </div>
  );
}
