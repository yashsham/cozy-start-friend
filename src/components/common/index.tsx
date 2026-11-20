import React from "react";
import { cn } from "@/lib/utils";
import { ExternalLink, ShieldCheck, Info, CheckCircle2, Clock } from "lucide-react";
import type { Confidence, Priority, ProspectStatus, SignalStatus } from "@/types";

export interface PageHeaderProps {
  title: string;
  description?: string;
  badge?: React.ReactNode;
  children?: React.ReactNode;
  className?: string;
}

export function PageHeader({ title, description, badge, children, className }: PageHeaderProps) {
  return (
    <div className={cn("flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-6 border-b border-border/60", className)}>
      <div className="space-y-1">
        <div className="flex items-center gap-2.5">
          <h1 className="text-2xl font-bold tracking-tight text-foreground">{title}</h1>
          {badge}
        </div>
        {description && <p className="text-sm text-muted-foreground max-w-2xl">{description}</p>}
      </div>
      {children && <div className="flex items-center gap-2.5 flex-wrap">{children}</div>}
    </div>
  );
}

export interface StatCardProps {
  title: string;
  value: string | number;
  subtext?: string;
  icon?: React.ComponentType<{ className?: string }>;
  trend?: { value: number; label: string };
  className?: string;
}

export function StatCard({ title, value, subtext, icon: Icon, trend, className }: StatCardProps) {
  return (
    <div className={cn("rounded-xl border border-border/70 bg-card p-5 text-card-foreground shadow-sm transition-all hover:border-border", className)}>
      <div className="flex items-center justify-between space-y-0 pb-2">
        <span className="text-xs font-medium uppercase tracking-wider text-muted-foreground">{title}</span>
        {Icon && <Icon className="h-4 w-4 text-muted-foreground/70" />}
      </div>
      <div className="flex items-baseline gap-2">
        <div className="text-2xl font-bold tracking-tight text-foreground">{value}</div>
        {trend && (
          <span className={cn("text-xs font-medium", trend.value >= 0 ? "text-emerald-600 dark:text-emerald-400" : "text-rose-600 dark:text-rose-400")}>
            {trend.value >= 0 ? "+" : ""}{trend.value}% {trend.label}
          </span>
        )}
      </div>
      {subtext && <p className="mt-1 text-xs text-muted-foreground">{subtext}</p>}
    </div>
  );
}

export function StatusBadge({ status }: { status: ProspectStatus | SignalStatus | string }) {
  const styles: Record<string, string> = {
    qualified: "bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-800",
    researched: "bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950/40 dark:text-blue-300 dark:border-blue-800",
    unresearched: "bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/40 dark:text-amber-300 dark:border-amber-800",
    rejected: "bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-950/40 dark:text-rose-300 dark:border-rose-800",
    new: "bg-sky-50 text-sky-700 border-sky-200 dark:bg-sky-950/40 dark:text-sky-300 dark:border-sky-800",
    reviewed: "bg-purple-50 text-purple-700 border-purple-200 dark:bg-purple-950/40 dark:text-purple-300 dark:border-purple-800",
    relevant: "bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-800",
    irrelevant: "bg-neutral-100 text-neutral-600 border-neutral-200 dark:bg-neutral-800 dark:text-neutral-400 dark:border-neutral-700",
    acted: "bg-indigo-50 text-indigo-700 border-indigo-200 dark:bg-indigo-950/40 dark:text-indigo-300 dark:border-indigo-800",
    active: "bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-800",
    draft: "bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/40 dark:text-amber-300 dark:border-amber-800",
  };

  const currentStyle = styles[status] || "bg-muted text-muted-foreground border-border";

  return (
    <span className={cn("inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium border capitalize", currentStyle)}>
      {status}
    </span>
  );
}

export function ScoreIndicator({ score, label }: { score: number; label?: string }) {
  let color = "bg-rose-500 text-rose-50";
  let textColor = "text-rose-600 dark:text-rose-400";
  if (score >= 80) {
    color = "bg-emerald-500 text-emerald-50";
    textColor = "text-emerald-600 dark:text-emerald-400";
  } else if (score >= 60) {
    color = "bg-blue-500 text-blue-50";
    textColor = "text-blue-600 dark:text-blue-400";
  } else if (score >= 40) {
    color = "bg-amber-500 text-amber-50";
    textColor = "text-amber-600 dark:text-amber-400";
  }

  return (
    <div className="flex items-center gap-1.5" title={`Score: ${score}/100`}>
      <span className={cn("inline-flex items-center justify-center h-6 w-8 rounded text-xs font-bold", color)}>
        {score}
      </span>
      {label && <span className={cn("text-xs font-medium", textColor)}>{label}</span>}
    </div>
  );
}

export function PriorityIndicator({ priority }: { priority: Priority }) {
  const map: Record<Priority, { label: string; dot: string; text: string }> = {
    high: { label: "High", dot: "bg-rose-500", text: "text-rose-700 dark:text-rose-300" },
    medium: { label: "Medium", dot: "bg-amber-500", text: "text-amber-700 dark:text-amber-300" },
    low: { label: "Low", dot: "bg-blue-500", text: "text-blue-700 dark:text-blue-300" },
  };
  const cfg = map[priority] || map.low;
  return (
    <span className={cn("inline-flex items-center gap-1.5 text-xs font-medium", cfg.text)}>
      <span className={cn("h-1.5 w-1.5 rounded-full", cfg.dot)} />
      {cfg.label}
    </span>
  );
}

export function ConfidenceIndicator({ confidence }: { confidence: Confidence }) {
  const map: Record<Confidence, { label: string; color: string }> = {
    high: { label: "High Confidence", color: "text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/40 border-emerald-200 dark:border-emerald-800" },
    medium: { label: "Medium Confidence", color: "text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/40 border-amber-200 dark:border-amber-800" },
    low: { label: "Low Confidence", color: "text-neutral-600 dark:text-neutral-400 bg-neutral-100 dark:bg-neutral-800 border-neutral-200 dark:border-neutral-700" },
  };
  const cfg = map[confidence] || map.low;
  return (
    <span className={cn("inline-flex items-center px-2 py-0.5 rounded text-[11px] font-medium border", cfg.color)}>
      {cfg.label}
    </span>
  );
}

export function SourceLink({ url, source }: { url: string; source: string }) {
  return (
    <a
      href={url}
      target="_blank"
      rel="noreferrer noopener"
      className="inline-flex items-center gap-1 text-xs text-primary hover:underline font-medium"
      title={`Open source: ${url}`}
    >
      <span>{source}</span>
      <ExternalLink className="h-3 w-3" />
    </a>
  );
}

export function EvidencePanel({
  evidence,
}: {
  evidence: Array<{ claim: string; source: string; url: string; capturedAt: string; verified: boolean }>;
}) {
  if (!evidence || evidence.length === 0) {
    return <p className="text-xs text-muted-foreground italic">No verified evidence recorded.</p>;
  }

  return (
    <div className="space-y-2">
      {evidence.map((item, idx) => (
        <div key={idx} className="p-3 rounded-lg border border-border/70 bg-muted/30 text-xs space-y-1">
          <div className="flex items-start justify-between gap-2">
            <span className="font-medium text-foreground">{item.claim}</span>
            {item.verified ? (
              <span className="inline-flex items-center gap-0.5 text-[10px] text-emerald-600 dark:text-emerald-400 font-semibold uppercase">
                <CheckCircle2 className="h-3 w-3" /> Verified
              </span>
            ) : (
              <span className="inline-flex items-center gap-0.5 text-[10px] text-amber-600 dark:text-amber-400 font-semibold uppercase">
                <Clock className="h-3 w-3" /> Unverified
              </span>
            )}
          </div>
          <div className="flex items-center justify-between text-[11px] text-muted-foreground pt-1 border-t border-border/40">
            <SourceLink url={item.url} source={item.source} />
            <span>Captured: {item.capturedAt}</span>
          </div>
        </div>
      ))}
    </div>
  );
}

export function EmptyState({
  icon: Icon = Info,
  title,
  description,
  action,
}: {
  icon?: React.ComponentType<{ className?: string }>;
  title: string;
  description: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="flex flex-col items-center justify-center p-8 text-center rounded-xl border border-dashed border-border bg-card/40 my-4">
      <div className="h-10 w-10 rounded-full bg-muted flex items-center justify-center text-muted-foreground mb-3">
        <Icon className="h-5 w-5" />
      </div>
      <h3 className="text-base font-semibold text-foreground">{title}</h3>
      <p className="mt-1 text-sm text-muted-foreground max-w-sm">{description}</p>
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}

export function LoadingSkeleton({ count = 3 }: { count?: number }) {
  return (
    <div className="space-y-3">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="h-16 w-full rounded-xl bg-muted/60 animate-pulse" />
      ))}
    </div>
  );
}

export function OfflineIndicator() {
  return (
    <span
      className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-emerald-50 text-emerald-700 border border-emerald-200 dark:bg-emerald-950/50 dark:text-emerald-300 dark:border-emerald-800"
      title="All inference and storage runs 100% locally. Zero cloud data leaks."
    >
      <ShieldCheck className="h-3.5 w-3.5 text-emerald-600 dark:text-emerald-400" />
      <span>Local AI Offline</span>
    </span>
  );
}
