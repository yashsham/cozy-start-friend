import React, { useState } from "react";
import { useAppStore } from "@/hooks/use-store";
import { PageHeader, StatusBadge } from "@/components/common";
import type { AgentRun, AgentDefinition, WorkflowStepState } from "@/types";
import {
  Activity,
  Bot,
  Clock,
  CheckCircle2,
  AlertCircle,
  XCircle,
  ChevronDown,
  ChevronRight,
  RotateCcw,
  Terminal,
  ShieldCheck,
  Compass,
  FileEdit,
  MailCheck,
  MessageSquare,
  BarChart3,
} from "lucide-react";

const AGENT_DEFINITIONS: AgentDefinition[] = [
  { name: "Scout Agent", responsibility: "Discovers companies from OpenStreetMap and crawls homepages for key decision-makers." },
  { name: "Enricher & Profile Agent", responsibility: "Extracts technology stacks and ATS job postings (Greenhouse/Lever) to build buying signals." },
  { name: "Writer Agent", responsibility: "Generates tailored 3-touch sequence emails adhering to strict length, tone, and ICP match constraints." },
  { name: "Deterministic Gate", responsibility: "Last-line pre-send safety guard: verifies spam phrases, unrendered tags, and character ceilings." },
  { name: "Handler Agent", responsibility: "Listens for inbound replies, categorizes intent, manages conversation stage, and triggers stop-on-reply." },
  { name: "Analyst Agent", responsibility: "Computes SQL pipeline metrics and conversion analytics during idle daemon cycles without LLM calls." },
];

export function AgentsView() {
  const runs = useAppStore((s) => s.runs);
  const products = useAppStore((s) => s.products);
  const [expandedRunId, setExpandedRunId] = useState<string | null>(runs[0]?.id || null);

  const getStepIcon = (status: WorkflowStepState["status"]) => {
    switch (status) {
      case "completed":
        return <CheckCircle2 className="h-4 w-4 text-emerald-500" />;
      case "running":
        return <Clock className="h-4 w-4 text-blue-500 animate-spin" />;
      case "failed":
        return <XCircle className="h-4 w-4 text-rose-500" />;
      case "queued":
      default:
        return <Clock className="h-4 w-4 text-muted-foreground" />;
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Autonomous Agent Execution & Observability"
        description="Monitor multi-agent lifecycle runs, step-by-step state transitions, token metrics, and execution logs running inside the local LangGraph orchestrator."
      />

      {/* Agents Roster Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
        {AGENT_DEFINITIONS.map((agent, i) => (
          <div key={i} className="p-3.5 rounded-xl border border-border bg-card text-xs space-y-1 shadow-xs">
            <div className="flex items-center gap-2 font-bold text-foreground">
              <Bot className="h-4 w-4 text-primary shrink-0" />
              <span>{agent.name}</span>
            </div>
            <p className="text-[11px] text-muted-foreground leading-relaxed">{agent.responsibility}</p>
          </div>
        ))}
      </div>

      {/* Execution History & Timeline */}
      <div className="rounded-xl border border-border bg-card p-5 space-y-4 shadow-xs">
        <div className="flex items-center justify-between border-b border-border/60 pb-3">
          <h3 className="font-bold text-sm text-foreground flex items-center gap-2">
            <Activity className="h-4 w-4 text-primary" />
            <span>Agent Run History ({runs.length})</span>
          </h3>
          <span className="text-xs text-muted-foreground">All executions isolated locally</span>
        </div>

        <div className="space-y-3">
          {runs.map((r) => {
            const isExpanded = expandedRunId === r.id;
            const product = products.find((p) => p.id === r.productId);

            return (
              <div
                key={r.id}
                className="rounded-lg border border-border/70 bg-card overflow-hidden transition-all text-xs"
              >
                {/* Run Row Header */}
                <div
                  onClick={() => setExpandedRunId(isExpanded ? null : r.id)}
                  className="flex items-center justify-between p-3.5 cursor-pointer hover:bg-muted/30 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    {isExpanded ? (
                      <ChevronDown className="h-4 w-4 text-muted-foreground" />
                    ) : (
                      <ChevronRight className="h-4 w-4 text-muted-foreground" />
                    )}
                    <div>
                      <span className="font-bold text-foreground text-xs block">{r.task}</span>
                      <span className="text-[11px] text-muted-foreground">
                        Product: {product?.name || "Global"} • Started: {new Date(r.startedAt).toLocaleTimeString()}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <span className="text-muted-foreground text-[11px]">
                      Duration: {(r.durationMs / 1000).toFixed(1)}s
                    </span>
                    <span
                      className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                        r.status === "completed"
                          ? "bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300"
                          : "bg-blue-50 text-blue-700 dark:bg-blue-950/40 dark:text-blue-300"
                      }`}
                    >
                      {r.status}
                    </span>
                  </div>
                </div>

                {/* Expanded Timeline & Logs */}
                {isExpanded && (
                  <div className="p-4 border-t border-border/60 bg-muted/20 space-y-4">
                    <div className="space-y-1">
                      <span className="text-[11px] font-semibold text-muted-foreground uppercase">Execution Summary:</span>
                      <p className="text-xs text-foreground font-medium">{r.result}</p>
                    </div>

                    {/* Step-by-Step Workflow Timeline */}
                    <div className="space-y-2">
                      <span className="text-[11px] font-semibold text-muted-foreground uppercase block">
                        LangGraph Node State Progression:
                      </span>
                      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-2">
                        {r.steps.map((s, idx) => (
                          <div
                            key={idx}
                            className="p-2.5 rounded-lg border border-border bg-card flex items-start gap-2 text-xs"
                          >
                            {getStepIcon(s.status)}
                            <div className="truncate">
                              <span className="font-semibold text-foreground block truncate">{s.name}</span>
                              <span className="text-[10px] text-muted-foreground block">
                                {s.agent} • {s.durationMs ? `${s.durationMs}ms` : "Queued"}
                              </span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Step Logs Console */}
                    {r.steps.some((s) => s.log && s.log.length > 0) && (
                      <div className="rounded-lg bg-zinc-950 p-3 text-[11px] font-mono text-zinc-300 border border-zinc-800 space-y-1 max-h-40 overflow-y-auto">
                        <div className="flex items-center gap-1.5 text-zinc-500 text-[10px] pb-1 border-b border-zinc-800">
                          <Terminal className="h-3 w-3" />
                          <span>Agent Execution Logs</span>
                        </div>
                        {r.steps.flatMap((s) => s.log || []).map((line, i) => (
                          <div key={i}>{line}</div>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
