import React, { useState } from "react";
import { useAppStore, actions } from "@/hooks/use-store";
import {
  PageHeader,
  StatusBadge,
  PriorityIndicator,
  SourceLink,
  EmptyState,
} from "@/components/common";
import type { BuyingSignal, SignalCategory, SignalStatus } from "@/types";
import {
  Radio,
  Briefcase,
  TrendingUp,
  Coins,
  Cpu,
  UserPlus,
  Megaphone,
  Filter,
  CheckCircle2,
  X,
  ExternalLink,
  Calendar,
  Layers,
} from "lucide-react";

export function SignalsView() {
  const signals = useAppStore((s) => s.signals);
  const prospects = useAppStore((s) => s.prospects);

  const [categoryFilter, setCategoryFilter] = useState<string>("all");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [selectedSignal, setSelectedSignal] = useState<BuyingSignal | null>(null);

  const categories: Array<{ id: string; label: string; icon: React.ComponentType<{ className?: string }> }> = [
    { id: "all", label: "All Signals", icon: Layers },
    { id: "hiring", label: "Hiring Velocity", icon: Briefcase },
    { id: "funding", label: "Funding Rounds", icon: Coins },
    { id: "technology", label: "Tech Stack Shift", icon: Cpu },
    { id: "expansion", label: "Market Expansion", icon: TrendingUp },
    { id: "leadership", label: "Leadership Change", icon: UserPlus },
    { id: "announcement", label: "Announcements", icon: Megaphone },
  ];

  const filtered = signals.filter((s) => {
    const matchesCat = categoryFilter === "all" || s.category === categoryFilter;
    const matchesStatus = statusFilter === "all" || s.status === statusFilter;
    return matchesCat && matchesStatus;
  });

  const handleUpdateStatus = (id: string, status: SignalStatus) => {
    actions.setSignalStatus(id, status);
    if (selectedSignal && selectedSignal.id === id) {
      setSelectedSignal({ ...selectedSignal, status });
    }
  };

  const getCategoryIcon = (category: SignalCategory) => {
    switch (category) {
      case "hiring":
        return <Briefcase className="h-4 w-4 text-blue-500" />;
      case "funding":
        return <Coins className="h-4 w-4 text-emerald-500" />;
      case "technology":
        return <Cpu className="h-4 w-4 text-purple-500" />;
      case "expansion":
        return <TrendingUp className="h-4 w-4 text-indigo-500" />;
      case "leadership":
        return <UserPlus className="h-4 w-4 text-amber-500" />;
      case "announcement":
      default:
        return <Megaphone className="h-4 w-4 text-rose-500" />;
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Buying Signal Intelligence"
        description="Autonomous market signal detection: active hiring roles, funding rounds, technology migrations, and leadership changes."
      />

      {/* Category Pills Bar */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1">
        {categories.map((c) => {
          const Icon = c.icon;
          const count = c.id === "all" ? signals.length : signals.filter((s) => s.category === c.id).length;
          return (
            <button
              key={c.id}
              onClick={() => setCategoryFilter(c.id)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-colors border ${
                categoryFilter === c.id
                  ? "bg-primary text-primary-foreground border-primary font-semibold shadow-xs"
                  : "bg-card text-muted-foreground border-border hover:bg-muted hover:text-foreground"
              }`}
            >
              <Icon className="h-3.5 w-3.5" />
              <span>{c.label}</span>
              <span
                className={`text-[10px] px-1.5 py-0.2 rounded-full font-bold ${
                  categoryFilter === c.id ? "bg-primary-foreground/20 text-primary-foreground" : "bg-muted text-muted-foreground"
                }`}
              >
                {count}
              </span>
            </button>
          );
        })}
      </div>

      {/* Signals Grid & Detail Drawer Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Signals List */}
        <div className="lg:col-span-2 space-y-3">
          {filtered.length === 0 ? (
            <EmptyState
              icon={Radio}
              title="No Buying Signals Found"
              description="No signals matched the selected filter. Signals are extracted automatically as public profiles are analyzed."
            />
          ) : (
            filtered.map((s) => {
              const prospect = prospects.find((p) => p.id === s.prospectId);
              const isSelected = selectedSignal?.id === s.id;
              return (
                <div
                  key={s.id}
                  onClick={() => setSelectedSignal(s)}
                  className={`p-4 rounded-xl border bg-card transition-all cursor-pointer shadow-xs space-y-2.5 ${
                    isSelected ? "border-primary ring-1 ring-primary/30" : "border-border/80 hover:border-border"
                  }`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-2">
                      <div className="h-7 w-7 rounded-md bg-muted flex items-center justify-center shrink-0">
                        {getCategoryIcon(s.category)}
                      </div>
                      <div>
                        <span className="font-bold text-sm text-foreground">{s.title}</span>
                        <span className="text-[11px] text-muted-foreground block">
                          Company:{" "}
                          <span className="font-semibold text-foreground">
                            {prospect?.company || "Unknown Company"}
                          </span>
                        </span>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <PriorityIndicator priority={s.priority} />
                      <StatusBadge status={s.status} />
                    </div>
                  </div>

                  <p className="text-xs text-muted-foreground line-clamp-2 leading-relaxed">{s.description}</p>

                  <div className="flex items-center justify-between text-[11px] text-muted-foreground pt-2 border-t border-border/50">
                    <div className="flex items-center gap-2">
                      <span>Source:</span>
                      <SourceLink url={s.url} source={s.source} />
                    </div>
                    <div className="flex items-center gap-1">
                      <Calendar className="h-3 w-3" />
                      <span>{s.date}</span>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Right Column: Signal Detail Drawer / Inspect Panel */}
        <div className="rounded-xl border border-border bg-card p-5 space-y-4 self-start sticky top-20 text-xs">
          <div className="flex items-center justify-between border-b border-border/60 pb-3">
            <h3 className="font-bold text-sm text-foreground flex items-center gap-1.5">
              <Radio className="h-4 w-4 text-primary" />
              <span>Signal Analysis & Intent</span>
            </h3>
            {selectedSignal && (
              <span className="text-[10px] uppercase font-bold text-muted-foreground">
                Relevance: {selectedSignal.relevance}%
              </span>
            )}
          </div>

          {!selectedSignal ? (
            <div className="text-center py-12 text-muted-foreground italic space-y-2">
              <Radio className="h-8 w-8 text-muted-foreground/40 mx-auto" />
              <p>Select any buying signal from the list to inspect verified evidence and intent rationale.</p>
            </div>
          ) : (
            <div className="space-y-4">
              <div>
                <span className="text-[11px] font-semibold text-muted-foreground uppercase block">Signal Subject</span>
                <h4 className="text-sm font-bold text-foreground mt-0.5">{selectedSignal.title}</h4>
              </div>

              <div className="space-y-1">
                <span className="text-[11px] font-semibold text-muted-foreground uppercase block">Why this indicates intent</span>
                <p className="text-xs text-foreground bg-primary/5 p-3 rounded-lg border border-primary/20 leading-relaxed font-medium">
                  {selectedSignal.rationale}
                </p>
              </div>

              <div className="space-y-1">
                <span className="text-[11px] font-semibold text-muted-foreground uppercase block">Verified Public Evidence</span>
                <div className="p-3 rounded-lg bg-muted/40 border border-border text-muted-foreground leading-relaxed">
                  "{selectedSignal.evidence}"
                </div>
              </div>

              <div className="pt-2 border-t border-border space-y-2">
                <span className="text-[11px] font-semibold text-foreground block">Update Status</span>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    onClick={() => handleUpdateStatus(selectedSignal.id, "relevant")}
                    className="px-2.5 py-1.5 rounded bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 font-semibold hover:bg-emerald-100"
                  >
                    Mark Relevant
                  </button>
                  <button
                    onClick={() => handleUpdateStatus(selectedSignal.id, "acted")}
                    className="px-2.5 py-1.5 rounded bg-indigo-50 text-indigo-700 dark:bg-indigo-950/40 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800 font-semibold hover:bg-indigo-100"
                  >
                    Mark Acted
                  </button>
                  <button
                    onClick={() => handleUpdateStatus(selectedSignal.id, "irrelevant")}
                    className="px-2.5 py-1.5 rounded bg-muted text-muted-foreground border border-border hover:bg-accent col-span-2"
                  >
                    Mark Irrelevant
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
