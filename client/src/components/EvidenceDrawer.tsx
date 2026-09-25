import type { ReactNode } from "react";

import {
  BarChart3,
  CheckCircle2,
  Copy,
  Eye,
  FileCode,
  Hash,
  Link2,
  MessagesSquare,
  Terminal,
} from "lucide-react";

import { RangeBulletGroup } from "@/components/experience/RangeBullet";
import { Button } from "@/components/ui/button";
import { Drawer, DrawerClose, DrawerContent, DrawerHeader, DrawerTitle } from "@/components/ui/drawer";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { formatConsumption, getInteractionById } from "@/lib/telemetry-data";

interface EvidenceDrawerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  interactionId: string | null;
  contextTitle?: string;
  contextSummary?: string;
  contextSeverity?: "High" | "Medium" | "Low";
}

export function EvidenceDrawer({
  open,
  onOpenChange,
  interactionId,
  contextTitle,
  contextSummary,
  contextSeverity,
}: EvidenceDrawerProps) {
  const interaction = getInteractionById(interactionId);

  if (!interaction) {
    return (
      <Drawer open={open} onOpenChange={onOpenChange}>
        <DrawerContent className="bg-[#0B1120] border-white/10 text-white max-h-[90vh]">
          <DrawerHeader className="border-b border-white/5 pb-4 px-6 bg-[#121A2B]">
            <DrawerTitle className="dashboard-card-title text-slate-200 flex items-center">
              <Eye className="w-5 h-5 mr-2 text-slate-400" />
              Interaction Evidence
            </DrawerTitle>
          </DrawerHeader>
          <div className="p-6 text-slate-400">No evidence was found for this interaction.</div>
        </DrawerContent>
      </Drawer>
    );
  }

  const hasInline = interaction.evidence.inlineCount > 0;
  const evidenceArtifactCount = interaction.evidence.chatCount + interaction.evidence.inlineCount;
  const traceAnatomy = [
    {
      label: "Prompt load",
      value: `${formatCompact(interaction.promptChars)} chars`,
      note: "Prompt characters captured for this trace.",
      ratio: interaction.promptChars / 12000,
      tone: "blue" as const,
    },
    {
      label: "Response load",
      value: `${formatCompact(interaction.responseChars)} chars`,
      note: "Assistant output captured for this trace.",
      ratio: interaction.responseChars / 7000,
      tone: "violet" as const,
    },
    {
      label: "Tool activity",
      value: `${interaction.toolInvocationCount} calls`,
      note: "Tool calls recorded in telemetry.",
      ratio: interaction.toolInvocationCount / 8,
      tone: "amber" as const,
    },
    {
      label: "Captured artifacts",
      value: `${evidenceArtifactCount} artifacts`,
      note: "Chat and inline artifacts available for inspection.",
      ratio: evidenceArtifactCount / 4,
      tone: "teal" as const,
    },
  ];
  const severityTone =
    contextSeverity === "High"
      ? "border-red-500/20 bg-red-500/10 text-red-200"
      : contextSeverity === "Medium"
        ? "border-amber-500/20 bg-amber-500/10 text-amber-200"
        : contextSeverity === "Low"
          ? "border-blue-500/20 bg-blue-500/10 text-blue-200"
          : "border-teal-500/20 bg-teal-500/10 text-teal-200";
  const contextualSummary =
    contextSummary ??
    `This trace shows ${interaction.engineerName} working through ${interaction.useCaseLabel} with ${interaction.modelName}. Only captured telemetry and captured artifacts are shown here.`;

  return (
    <Drawer open={open} onOpenChange={onOpenChange}>
      <DrawerContent className="bg-[#0B1120] border-white/10 text-white max-h-[92vh] lg:max-h-[90vh]">
        <DrawerHeader className="border-b border-white/5 pb-4 px-6 flex justify-between items-center bg-[#121A2B]">
          <div>
            <DrawerTitle className="dashboard-card-title text-slate-200 flex items-center">
              <Eye className="w-5 h-5 mr-2 text-teal-400" />
              Interaction Evidence
            </DrawerTitle>
            <p className="text-sm text-slate-400 font-mono mt-1">{interaction.id}</p>
          </div>
          <DrawerClose asChild>
            <Button variant="ghost" className="text-slate-400 hover:text-white hover:bg-white/5">
              Close
            </Button>
          </DrawerClose>
        </DrawerHeader>

        <div className="border-b border-white/5 bg-[radial-gradient(circle_at_top_left,rgba(56,189,248,0.18),transparent_28%),radial-gradient(circle_at_bottom_right,rgba(139,92,246,0.16),transparent_26%),linear-gradient(180deg,#10182b,#0b1120)]">
          <div className="mx-auto max-w-[1400px] px-6 py-6">
            <div className="grid gap-6 xl:grid-cols-[1.05fr_0.95fr]">
              <div className="space-y-4">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="inline-flex items-center gap-2 rounded-full border border-blue-500/20 bg-blue-500/10 px-3 py-1 text-[11px] font-medium uppercase tracking-[0.22em] text-blue-200">
                    <Link2 className="h-3.5 w-3.5" />
                    {contextTitle ? "Linked evidence" : "Trace spotlight"}
                  </span>
                  {contextSeverity ? (
                    <span className={`inline-flex items-center rounded-full border px-3 py-1 text-[11px] font-medium uppercase tracking-[0.22em] ${severityTone}`}>
                      {contextSeverity} priority
                    </span>
                  ) : null}
                </div>

                <div>
                  <p className="text-xs uppercase tracking-[0.26em] text-slate-500">
                    {contextTitle ? "Supports recommendation" : "Active interaction"}
                  </p>
                  <h2 className="mt-3 text-[1.9rem] font-semibold leading-tight text-white md:text-[2.3rem]">
                    {contextTitle ?? interaction.useCaseLabel}
                  </h2>
                  <p className="mt-4 max-w-4xl text-base leading-8 text-slate-300">
                    {contextualSummary}
                  </p>
                  <p className="mt-3 text-sm text-slate-500">
                    Only directly captured telemetry and artifacts are shown here.
                  </p>
                </div>

                <div className="flex flex-wrap gap-2 text-xs text-slate-300">
                  <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1.5">{interaction.engineerName}</span>
                  <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1.5">{interaction.useCaseLabel}</span>
                  <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1.5">{interaction.modelName}</span>
                  <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1.5">{interaction.requestSource}</span>
                </div>
              </div>

              <div className="grid gap-3 sm:grid-cols-2">
                <EvidenceHeroMetric
                  label="Telemetry credits"
                  value={`${formatConsumption(interaction.estimatedCredits)} credits`}
                  note="Estimated from telemetry."
                  tone="blue"
                />
                <EvidenceHeroMetric
                  label="Prompt / response"
                  value={`${formatCompact(interaction.promptChars)} / ${formatCompact(interaction.responseChars)}`}
                  note="Character volume captured from telemetry."
                  tone="violet"
                />
                <EvidenceHeroMetric
                  label="Tool activity"
                  value={`${interaction.toolInvocationCount} invocations`}
                  note={`${interaction.pluginName} / ${interaction.mcpServer}`}
                  tone="amber"
                />
                <EvidenceHeroMetric
                  label="Artifacts captured"
                  value={`${evidenceArtifactCount} proof items`}
                  note={`${interaction.evidence.chatCount} chat and ${interaction.evidence.inlineCount} inline artifacts.`}
                  tone="teal"
                />
              </div>
            </div>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-6 bg-[#0B1120]">
          <div className="mx-auto max-w-[1400px] grid grid-cols-1 gap-6 xl:grid-cols-[0.82fr_1.18fr]">
            <div className="space-y-6">
              <RangeBulletGroup
                title="Observed Telemetry"
                description="Only directly captured fields are shown on this review surface."
                items={traceAnatomy}
              />
            </div>

            <div className="space-y-6">
              <section className="rounded-[28px] border border-white/6 bg-[linear-gradient(180deg,rgba(15,22,38,0.96),rgba(9,14,24,0.98))] p-5 shadow-[0_20px_60px_rgba(2,6,23,0.28)]">
                <div className="mb-4 flex items-center justify-between gap-3">
                  <div>
                    <h3 className="dashboard-section-title text-slate-100">Captured Evidence</h3>
                    <p className="mt-2 text-sm text-slate-400">Open the direct chat or inline artifact captured for this trace.</p>
                  </div>
                  <div className="text-right text-xs text-slate-500">
                    <p>{interaction.evidence.chatCount} chat</p>
                    <p>{interaction.evidence.inlineCount} inline</p>
                  </div>
                </div>

                <div className="grid gap-3 md:grid-cols-3">
                  <EvidenceHighlight label="Telemetry credits" value={`${formatConsumption(interaction.estimatedCredits)}`} note="Estimated from telemetry." />
                  <EvidenceHighlight label="Prompt / response" value={`${formatCompact(interaction.promptChars)} / ${formatCompact(interaction.responseChars)}`} note="Captured character counts." />
                  <EvidenceHighlight label="Tool calls" value={`${interaction.toolInvocationCount}`} note="Recorded plugin or MCP calls." />
                </div>
              </section>

              <Tabs defaultValue="chat" className="w-full">
                <div className="flex items-center justify-between border-b border-white/5 pb-4 mb-6">
                  <TabsList className="bg-[#121A2B] border border-white/10 p-1">
                    <TabsTrigger value="chat" className="data-[state=active]:bg-blue-600/20 data-[state=active]:text-blue-400">
                      <MessagesSquare className="w-4 h-4 mr-2" />
                      Chat Evidence
                    </TabsTrigger>
                    <TabsTrigger
                      value="inline"
                      className="data-[state=active]:bg-blue-600/20 data-[state=active]:text-blue-400"
                      disabled={!hasInline}
                    >
                      <FileCode className="w-4 h-4 mr-2" />
                      Inline Evidence
                    </TabsTrigger>
                  </TabsList>
                  <Button variant="ghost" size="sm" className="text-slate-400 hover:text-white">
                    <Copy className="w-4 h-4 mr-2" />
                    Copy Trace
                  </Button>
                </div>

                <TabsContent value="chat" className="m-0 space-y-6">
                  <EvidenceBlock
                    title="Chat Prompt"
                    icon={<MessagesSquare className="w-4 h-4 mr-2" />}
                    content={interaction.evidence.prompt || "No chat prompt captured."}
                    tone="blue"
                  />
                  <EvidenceBlock
                    title="Assistant Response"
                    icon={<Terminal className="w-4 h-4 mr-2" />}
                    content={interaction.evidence.assistantResponse || "No assistant response captured."}
                    tone="indigo"
                  />
                  {interaction.evidence.followupPrompts ? (
                    <EvidenceBlock
                      title="Follow-up Prompts"
                      icon={<Hash className="w-4 h-4 mr-2" />}
                      content={interaction.evidence.followupPrompts}
                      tone="neutral"
                    />
                  ) : null}
                </TabsContent>

                <TabsContent value="inline" className="m-0 space-y-6">
                  <div className="bg-[#121A2B] border border-white/5 rounded-xl overflow-hidden shadow-lg">
                    <div className="bg-black/40 border-b border-white/5 px-4 py-2 flex items-center justify-between">
                      <span className="text-xs font-mono text-slate-400 flex items-center">
                        <Hash className="w-3 h-3 mr-1" />
                        {interaction.evidence.fileName || "No file captured"}
                      </span>
                      <span className="text-xs font-medium text-teal-400 flex items-center bg-teal-500/10 px-2 py-0.5 rounded border border-teal-500/20">
                        <CheckCircle2 className="w-3 h-3 mr-1" />
                        Inline Suggestion
                      </span>
                    </div>
                    <div className="p-4 bg-[#0a0f18] space-y-4">
                      <CodePanel label="Left Context" content={interaction.evidence.leftContext || "No left context captured."} />
                      <CodePanel
                        label="Accepted Completion"
                        content={interaction.evidence.acceptedCompletion || "No accepted completion captured."}
                        highlight
                      />
                      <CodePanel label="Right Context" content={interaction.evidence.rightContext || "No right context captured."} />
                    </div>
                  </div>
                </TabsContent>
              </Tabs>
            </div>
          </div>
        </div>
      </DrawerContent>
    </Drawer>
  );
}

function EvidenceBlock({
  title,
  icon,
  content,
  tone,
}: {
  title: string;
  icon: ReactNode;
  content: string;
  tone: "blue" | "indigo" | "neutral";
}) {
  const toneClass =
    tone === "blue"
      ? "bg-black/30 border-white/5"
      : tone === "indigo"
        ? "bg-[#1E2A40]/50 border-blue-500/10"
        : "bg-black/20 border-white/5";

  return (
    <div className={`border rounded-xl p-5 shadow-lg ${toneClass}`}>
      <h3 className="dashboard-eyebrow mb-4 text-slate-300 flex items-center">{icon}{title}</h3>
      <p className="dashboard-body font-mono whitespace-pre-wrap">{content}</p>
    </div>
  );
}

function CodePanel({
  label,
  content,
  highlight = false,
}: {
  label: string;
  content: string;
  highlight?: boolean;
}) {
  return (
    <div className={`rounded-lg border ${highlight ? "border-blue-500/20 bg-blue-900/10" : "border-white/5 bg-black/20"} p-4`}>
      <p className="dashboard-metric-label mb-3">{label}</p>
      <pre className="whitespace-pre-wrap text-sm text-slate-300 font-mono leading-relaxed">{content}</pre>
    </div>
  );
}

function EvidenceHeroMetric({
  label,
  value,
  note,
  tone,
}: {
  label: string;
  value: string;
  note: string;
  tone: "blue" | "violet" | "amber" | "teal";
}) {
  const toneClass =
    tone === "blue"
      ? "border-blue-500/18 bg-blue-500/10"
      : tone === "violet"
        ? "border-violet-500/18 bg-violet-500/10"
        : tone === "amber"
          ? "border-amber-500/18 bg-amber-500/10"
          : "border-teal-500/18 bg-teal-500/10";

  return (
    <div className={`rounded-2xl border p-4 ${toneClass}`}>
      <p className="text-[11px] uppercase tracking-[0.24em] text-slate-400">{label}</p>
      <p className="mt-3 text-lg font-semibold leading-tight text-white">{value}</p>
      <p className="mt-2 text-xs leading-relaxed text-slate-400">{note}</p>
    </div>
  );
}

function EvidenceHighlight({
  label,
  value,
  note,
}: {
  label: string;
  value: string;
  note: string;
}) {
  return (
    <div className="rounded-2xl border border-white/5 bg-white/[0.02] p-4">
      <p className="text-[11px] uppercase tracking-[0.24em] text-slate-500">{label}</p>
      <p className="mt-3 text-sm font-semibold leading-snug text-slate-100">{value}</p>
      <p className="mt-2 text-xs leading-relaxed text-slate-400">{note}</p>
    </div>
  );
}

function formatCompact(value: number) {
  if (value >= 1000) return `${(value / 1000).toFixed(1)}K`;
  return `${value}`;
}
