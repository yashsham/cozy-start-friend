import React, { useState } from "react";
import type { Prospect } from "@/types";
import {
  StatusBadge,
  ScoreIndicator,
  PriorityIndicator,
  EvidencePanel,
  SourceLink,
  ConfidenceIndicator,
} from "@/components/common";
import {
  X,
  Building2,
  Globe,
  MapPin,
  Users,
  CheckCircle2,
  XCircle,
  Radio,
  AlertTriangle,
  Mail,
  Scale,
  Sparkles,
} from "lucide-react";

interface ProspectDetailModalProps {
  prospect: Prospect | null;
  onClose: () => void;
  onNavigateToOutreach?: (prospectId: string) => void;
}

export function ProspectDetailModal({
  prospect,
  onClose,
  onNavigateToOutreach,
}: ProspectDetailModalProps) {
  const [activeTab, setActiveTab] = useState<
    "overview" | "research" | "icp" | "signals" | "problems" | "scoring" | "outreach"
  >("overview");

  if (!prospect) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-xs p-4 overflow-y-auto">
      <div className="w-full max-w-3xl rounded-xl border border-border bg-card shadow-2xl overflow-hidden my-6 flex flex-col max-h-[90vh]">
        {/* Modal Header */}
        <div className="flex items-start justify-between p-6 border-b border-border bg-muted/20">
          <div className="space-y-1">
            <div className="flex items-center gap-2.5">
              <h2 className="text-xl font-bold text-foreground">{prospect.company}</h2>
              <StatusBadge status={prospect.status} />
              <PriorityIndicator priority={prospect.priority} />
            </div>
            <div className="flex items-center gap-3 text-xs text-muted-foreground">
              <a
                href={prospect.website}
                target="_blank"
                rel="noreferrer"
                className="hover:underline text-primary inline-flex items-center gap-1"
              >
                <Globe className="h-3 w-3" /> {prospect.website}
              </a>
              <span>•</span>
              <span className="inline-flex items-center gap-1">
                <MapPin className="h-3 w-3" /> {prospect.location}
              </span>
              <span>•</span>
              <span className="inline-flex items-center gap-1">
                <Building2 className="h-3 w-3" /> {prospect.industry}
              </span>
            </div>
          </div>
          <button
            onClick={onClose}
            className="rounded p-1 text-muted-foreground hover:bg-muted transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* 7 Tab Bar */}
        <div className="flex items-center overflow-x-auto border-b border-border px-6 bg-card text-xs font-medium">
          {[
            { id: "overview", label: "Overview" },
            { id: "research", label: `Research (${prospect.research.length})` },
            { id: "icp", label: `ICP Fit (${prospect.criteria.length})` },
            { id: "problems", label: `Problems (${prospect.problems.length})` },
            { id: "scoring", label: "Score Breakdown" },
            { id: "outreach", label: "Outreach" },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`py-3 px-3 border-b-2 font-semibold whitespace-nowrap transition-colors ${
                activeTab === tab.id
                  ? "border-primary text-primary"
                  : "border-transparent text-muted-foreground hover:text-foreground"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Tab Contents */}
        <div className="flex-1 overflow-y-auto p-6 text-xs space-y-4">
          {/* TAB 1: OVERVIEW */}
          {activeTab === "overview" && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div className="p-3 rounded-lg border border-border/70 bg-muted/30">
                  <span className="text-[10px] text-muted-foreground uppercase font-semibold">Headcount</span>
                  <div className="font-bold text-foreground text-sm mt-0.5">{prospect.size}</div>
                </div>
                <div className="p-3 rounded-lg border border-border/70 bg-muted/30">
                  <span className="text-[10px] text-muted-foreground uppercase font-semibold">Product Fit</span>
                  <div className="mt-0.5">
                    <ScoreIndicator score={prospect.productFit} label="Fit Score" />
                  </div>
                </div>
                <div className="p-3 rounded-lg border border-border/70 bg-muted/30">
                  <span className="text-[10px] text-muted-foreground uppercase font-semibold">ICP Match</span>
                  <div className="mt-0.5">
                    <ScoreIndicator score={prospect.icpMatch} label="Match Score" />
                  </div>
                </div>
                <div className="p-3 rounded-lg border border-border/70 bg-muted/30">
                  <span className="text-[10px] text-muted-foreground uppercase font-semibold">Last Researched</span>
                  <div className="font-bold text-foreground text-xs mt-1">
                    {prospect.lastResearched ? new Date(prospect.lastResearched).toLocaleDateString() : "Pending"}
                  </div>
                </div>
              </div>

              <div className="space-y-1.5">
                <h4 className="font-semibold text-foreground">Company Overview</h4>
                <p className="text-muted-foreground leading-relaxed bg-muted/20 p-3 rounded-lg border border-border/60">
                  {prospect.description}
                </p>
              </div>
            </div>
          )}

          {/* TAB 2: RESEARCH & EVIDENCE */}
          {activeTab === "research" && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h4 className="font-semibold text-foreground">Verified Public Web Evidence</h4>
                <span className="text-[11px] text-muted-foreground">Extracted via Scrapy & DOM analysis</span>
              </div>
              <EvidencePanel evidence={prospect.research} />
            </div>
          )}

          {/* TAB 3: ICP FIT CRITERIA */}
          {activeTab === "icp" && (
            <div className="space-y-3">
              <h4 className="font-semibold text-foreground">ICP Qualification Criteria Breakdown</h4>
              <div className="space-y-2">
                {prospect.criteria.map((c, i) => (
                  <div key={i} className="p-3 rounded-lg border border-border/60 bg-muted/30 flex items-start gap-2.5">
                    {c.matched ? (
                      <CheckCircle2 className="h-4 w-4 text-emerald-500 shrink-0 mt-0.5" />
                    ) : (
                      <XCircle className="h-4 w-4 text-rose-500 shrink-0 mt-0.5" />
                    )}
                    <div className="space-y-0.5 flex-1">
                      <span className="font-medium text-foreground block">{c.criterion}</span>
                      <p className="text-[11px] text-muted-foreground">{c.explanation}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TAB 4: PROBLEM ANALYSIS */}
          {activeTab === "problems" && (
            <div className="space-y-3">
              <h4 className="font-semibold text-foreground">Inferred Business Challenges</h4>
              <div className="space-y-2.5">
                {prospect.problems.map((p, i) => (
                  <div key={i} className="p-3.5 rounded-lg border border-border bg-card space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-foreground text-xs">{p.problem}</span>
                      <ConfidenceIndicator confidence={p.confidence} />
                    </div>
                    <div className="text-[11px] text-muted-foreground bg-muted/40 p-2 rounded">
                      <span className="font-semibold text-foreground">Supporting Evidence:</span> {p.evidence}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TAB 5: SCORING FACTORS */}
          {activeTab === "scoring" && (
            <div className="space-y-3">
              <h4 className="font-semibold text-foreground">Weighted ICP Fit Score Attribution</h4>
              <div className="divide-y divide-border/60 rounded-lg border border-border">
                {prospect.scoring.map((s, i) => (
                  <div key={i} className="p-3 flex items-center justify-between gap-4">
                    <div className="space-y-0.5 flex-1">
                      <span className="font-semibold text-foreground block">{s.factor}</span>
                      <p className="text-[11px] text-muted-foreground">{s.explanation}</p>
                    </div>
                    <div className="text-right shrink-0">
                      <span className="font-bold text-foreground text-sm">+{s.score} pts</span>
                      <span className="text-[10px] text-muted-foreground block">Weight: {s.weight * 100}%</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TAB 6: OUTREACH ACTIONS */}
          {activeTab === "outreach" && (
            <div className="space-y-4 text-center py-6">
              <div className="h-10 w-10 rounded-full bg-primary/10 text-primary flex items-center justify-center mx-auto">
                <Mail className="h-5 w-5" />
              </div>
              <div>
                <h4 className="font-bold text-sm text-foreground">Personalized Cold Outreach</h4>
                <p className="text-xs text-muted-foreground max-w-md mx-auto mt-1">
                  Draft a tailored 3-email sequence referencing {prospect.company}'s specific verified signals and ICP criteria.
                </p>
              </div>
              {onNavigateToOutreach && (
                <button
                  onClick={() => {
                    onClose();
                    onNavigateToOutreach(prospect.id);
                  }}
                  className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-primary text-primary-foreground font-semibold text-xs hover:bg-primary/90 transition-colors shadow-xs"
                >
                  <Sparkles className="h-4 w-4" /> Open in Outreach Studio
                </button>
              )}
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="p-4 border-t border-border bg-muted/10 flex justify-end gap-2">
          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-lg border border-border text-xs font-semibold text-foreground hover:bg-muted"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
