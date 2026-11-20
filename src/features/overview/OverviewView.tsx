import React from "react";
import { useAppStore, actions } from "@/hooks/use-store";
import { PageHeader, StatCard, StatusBadge, ScoreIndicator, PriorityIndicator, OfflineIndicator } from "@/components/common";
import {
  Users,
  CheckCircle2,
  AlertTriangle,
  Mail,
  Cpu,
  PlusCircle,
  Compass,
  ArrowRight,
  Radio,
  Activity,
  Layers,
  Sparkles,
  Bot,
} from "lucide-react";

interface OverviewViewProps {
  onNavigate: (tab: any) => void;
}

export function OverviewView({ onNavigate }: OverviewViewProps) {
  const prospects = useAppStore((s) => s.prospects);
  const products = useAppStore((s) => s.products);
  const signals = useAppStore((s) => s.signals);
  const drafts = useAppStore((s) => s.drafts);
  const runs = useAppStore((s) => s.runs);
  const icps = useAppStore((s) => s.icps);
  const prefs = useAppStore((s) => s.prefs);

  const totalProspects = prospects.length;
  const qualifiedCount = prospects.filter((p) => p.status === "qualified").length;
  const highPriorityCount = prospects.filter((p) => p.priority === "high").length;
  const draftsCount = drafts.length;

  // Funnel calculations
  const unresearched = prospects.filter((p) => p.status === "unresearched").length;
  const researched = prospects.filter((p) => p.status === "researched").length;
  const qualified = qualifiedCount;
  const rejected = prospects.filter((p) => p.status === "rejected").length;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Executive Overview"
        description="Real-time sales intelligence, autonomous agent execution, and pipeline analytics running 100% locally."
        badge={<OfflineIndicator />}
      >
        <button
          onClick={() => onNavigate("discovery")}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-primary text-primary-foreground text-xs font-semibold hover:bg-primary/90 transition-colors shadow-xs"
        >
          <Compass className="h-4 w-4" />
          <span>Discover Prospects</span>
        </button>
        <button
          onClick={() => onNavigate("products")}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-border bg-card text-foreground text-xs font-semibold hover:bg-accent transition-colors"
        >
          <PlusCircle className="h-4 w-4" />
          <span>Add Product</span>
        </button>
      </PageHeader>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Total Prospects"
          value={totalProspects}
          subtext={`${researched} researched across ${products.length} products`}
          icon={Users}
          trend={{ value: 12, label: "vs last cycle" }}
        />
        <StatCard
          title="Qualified Leads"
          value={qualifiedCount}
          subtext={`${totalProspects > 0 ? Math.round((qualifiedCount / totalProspects) * 100) : 0}% qualification rate`}
          icon={CheckCircle2}
          trend={{ value: 8, label: "conversion" }}
        />
        <StatCard
          title="High Priority"
          value={highPriorityCount}
          subtext="Strong ICP fit + urgent buying signal"
          icon={AlertTriangle}
        />
        <StatCard
          title="Outreach Drafts"
          value={draftsCount}
          subtext={`${drafts.filter((d) => d.reviewState === "draft").length} awaiting human review`}
          icon={Mail}
        />
      </div>

      {/* Main Grid: Pipeline Funnel & Local AI Health */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Pipeline Funnel Stage (2 cols) */}
        <div className="lg:col-span-2 rounded-xl border border-border/80 bg-card p-5 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-semibold text-foreground">Qualification Funnel</h3>
              <p className="text-xs text-muted-foreground">Prospect progression from public web search to qualified outreach</p>
            </div>
            <button
              onClick={() => onNavigate("prospects")}
              className="text-xs text-primary font-medium hover:underline inline-flex items-center gap-1"
            >
              View All <ArrowRight className="h-3 w-3" />
            </button>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2">
            <div className="p-3.5 rounded-lg border border-amber-200/60 bg-amber-50/50 dark:bg-amber-950/20 dark:border-amber-800/40">
              <span className="text-[11px] font-medium text-amber-700 dark:text-amber-300 uppercase">Unresearched</span>
              <div className="text-2xl font-bold text-foreground mt-1">{unresearched}</div>
              <p className="text-[10px] text-muted-foreground mt-0.5">Discovered entities</p>
            </div>
            <div className="p-3.5 rounded-lg border border-blue-200/60 bg-blue-50/50 dark:bg-blue-950/20 dark:border-blue-800/40">
              <span className="text-[11px] font-medium text-blue-700 dark:text-blue-300 uppercase">Researched</span>
              <div className="text-2xl font-bold text-foreground mt-1">{researched}</div>
              <p className="text-[10px] text-muted-foreground mt-0.5">Scraped & profiled</p>
            </div>
            <div className="p-3.5 rounded-lg border border-emerald-200/60 bg-emerald-50/50 dark:bg-emerald-950/20 dark:border-emerald-800/40">
              <span className="text-[11px] font-medium text-emerald-700 dark:text-emerald-300 uppercase">Qualified</span>
              <div className="text-2xl font-bold text-foreground mt-1">{qualified}</div>
              <p className="text-[10px] text-muted-foreground mt-0.5">Matches product ICP</p>
            </div>
            <div className="p-3.5 rounded-lg border border-rose-200/60 bg-rose-50/50 dark:bg-rose-950/20 dark:border-rose-800/40">
              <span className="text-[11px] font-medium text-rose-700 dark:text-rose-300 uppercase">Rejected</span>
              <div className="text-2xl font-bold text-foreground mt-1">{rejected}</div>
              <p className="text-[10px] text-muted-foreground mt-0.5">Outside ICP criteria</p>
            </div>
          </div>

          {/* Visual Bar representation */}
          <div className="space-y-1.5 pt-2">
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>Pipeline Distribution</span>
              <span>{totalProspects} Total Ingested</span>
            </div>
            <div className="h-3 w-full rounded-full bg-muted overflow-hidden flex">
              <div style={{ width: `${(unresearched / Math.max(totalProspects, 1)) * 100}%` }} className="bg-amber-400" title={`Unresearched: ${unresearched}`} />
              <div style={{ width: `${(researched / Math.max(totalProspects, 1)) * 100}%` }} className="bg-blue-500" title={`Researched: ${researched}`} />
              <div style={{ width: `${(qualified / Math.max(totalProspects, 1)) * 100}%` }} className="bg-emerald-500" title={`Qualified: ${qualified}`} />
              <div style={{ width: `${(rejected / Math.max(totalProspects, 1)) * 100}%` }} className="bg-rose-400" title={`Rejected: ${rejected}`} />
            </div>
          </div>
        </div>

        {/* Local AI Engine Status (1 col) */}
        <div className="rounded-xl border border-border/80 bg-card p-5 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="h-7 w-7 rounded-md bg-primary/10 text-primary flex items-center justify-center">
                <Cpu className="h-4 w-4" />
              </div>
              <h3 className="text-sm font-semibold text-foreground">Local AI Stack</h3>
            </div>
            <button
              onClick={() => onNavigate("local-ai")}
              className="text-xs text-primary font-medium hover:underline inline-flex items-center gap-0.5"
            >
              Control <ArrowRight className="h-3 w-3" />
            </button>
          </div>

          <div className="space-y-3 text-xs">
            <div className="flex items-center justify-between p-2.5 rounded-lg bg-muted/40 border border-border/50">
              <span className="text-muted-foreground">Inference Server</span>
              <span className="font-semibold text-foreground flex items-center gap-1.5">
                <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
                Ollama Localhost:11434
              </span>
            </div>
            <div className="flex items-center justify-between p-2.5 rounded-lg bg-muted/40 border border-border/50">
              <span className="text-muted-foreground">Active Primary Model</span>
              <span className="font-mono font-medium text-foreground">qwen2.5:7b-instruct</span>
            </div>
            <div className="flex items-center justify-between p-2.5 rounded-lg bg-muted/40 border border-border/50">
              <span className="text-muted-foreground">Local Embeddings</span>
              <span className="font-semibold text-emerald-600 dark:text-emerald-400">all-MiniLM-L6-v2</span>
            </div>
            <div className="flex items-center justify-between p-2.5 rounded-lg bg-muted/40 border border-border/50">
              <span className="text-muted-foreground">Cloud Fallbacks</span>
              <span className="font-bold text-muted-foreground">Zero (Air-Gapped)</span>
            </div>
          </div>
        </div>
      </div>

      {/* Split Section: Recent Priority Opportunities & Agent Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent High-Priority Prospects */}
        <div className="rounded-xl border border-border/80 bg-card p-5 space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Radio className="h-4 w-4 text-primary" />
              <h3 className="text-sm font-semibold text-foreground">Priority Prospect Opportunities</h3>
            </div>
            <button
              onClick={() => onNavigate("prospects")}
              className="text-xs text-primary hover:underline font-medium"
            >
              View CRM
            </button>
          </div>

          <div className="divide-y divide-border/60">
            {prospects.slice(0, 4).map((p) => (
              <div key={p.id} className="py-2.5 flex items-center justify-between gap-3 text-xs">
                <div className="space-y-0.5 truncate">
                  <div className="font-semibold text-foreground truncate flex items-center gap-1.5">
                    {p.company}
                    <span className="text-[10px] text-muted-foreground font-normal">({p.location})</span>
                  </div>
                  <div className="text-muted-foreground text-[11px] truncate">{p.industry} • {p.size}</div>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <ScoreIndicator score={p.productFit} label="Fit" />
                  <StatusBadge status={p.status} />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Recent Agent Activity */}
        <div className="rounded-xl border border-border/80 bg-card p-5 space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Activity className="h-4 w-4 text-primary" />
              <h3 className="text-sm font-semibold text-foreground">Recent Agent Runs</h3>
            </div>
            <button
              onClick={() => onNavigate("agents")}
              className="text-xs text-primary hover:underline font-medium"
            >
              All Runs
            </button>
          </div>

          <div className="divide-y divide-border/60">
            {runs.slice(0, 4).map((r) => (
              <div key={r.id} className="py-2.5 flex items-center justify-between gap-3 text-xs">
                <div className="space-y-0.5 truncate">
                  <div className="font-semibold text-foreground truncate flex items-center gap-1.5">
                    <Bot className="h-3.5 w-3.5 text-primary shrink-0" />
                    {r.task}
                  </div>
                  <div className="text-[11px] text-muted-foreground truncate">{r.result}</div>
                </div>
                <div className="text-right shrink-0">
                  <span className="inline-block px-1.5 py-0.5 rounded text-[10px] font-semibold bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300">
                    {r.status}
                  </span>
                  <div className="text-[10px] text-muted-foreground mt-0.5">{(r.durationMs / 1000).toFixed(1)}s</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
