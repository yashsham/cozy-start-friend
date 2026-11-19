import { useState, type ReactNode } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Search, X, Filter, ChevronLeft, ChevronRight, Sparkles, WifiOff, AlertCircle, Plus, Check, CircleHelp } from "lucide-react";
import { toast } from "sonner";
import type { Confidence, Priority, ProspectStatus, ProductStatus, RunStatus, SignalStatus } from "@/types";

export const cx = (...classes: (string | false | undefined | null)[]) => classes.filter(Boolean).join(" ");
export function PageHeader({ eyebrow, title, description, action, children }: { eyebrow?: string; title: string; description?: string; action?: ReactNode; children?: ReactNode }) {
  return <div className="mb-7 flex flex-col gap-4 border-b border-border pb-5 sm:flex-row sm:items-end sm:justify-between">
    <div className="min-w-0"><div className="mb-2 flex items-center gap-2 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">{eyebrow && <span>{eyebrow}</span>}{eyebrow && <span className="text-border">/</span>}<span>LOCAL WORKSPACE</span></div><h1 className="text-2xl font-semibold tracking-tight sm:text-[27px]">{title}</h1>{description && <p className="mt-1.5 max-w-2xl text-sm leading-6 text-muted-foreground">{description}</p>}</div>
    <div className="flex shrink-0 items-center gap-2">{children}{action}</div>
  </div>;
}

export function SectionTitle({ title, caption, action }: { title: string; caption?: string; action?: ReactNode }) {
  return <div className="mb-3 flex items-center justify-between gap-3"><div><h2 className="text-sm font-semibold">{title}</h2>{caption && <p className="mt-0.5 text-xs text-muted-foreground">{caption}</p>}</div>{action}</div>;
}

export function DemoBanner() { return <div className="mb-5 flex items-start gap-2 border border-warning/40 bg-warning/10 px-3 py-2.5 text-xs leading-5 text-warning-foreground"><Sparkles className="mt-0.5 h-3.5 w-3.5 shrink-0"/><span><strong>Sample workspace.</strong> Illustrative records only — not verified research or live activity. Turn off sample data in Settings to see empty states.</span></div>; }

export function StatusBadge({ status }: { status: ProspectStatus | ProductStatus | SignalStatus | RunStatus | string }) {
  const map: Record<string, string> = {
    qualified: "bg-success/12 text-success", active: "bg-success/12 text-success", completed: "bg-success/12 text-success", relevant: "bg-success/12 text-success", acted: "bg-success/12 text-success",
    researched: "bg-info/12 text-info", reviewed: "bg-info/12 text-info", running: "bg-info/12 text-info",
    high: "bg-destructive/10 text-destructive", failed: "bg-destructive/10 text-destructive", rejected: "bg-destructive/10 text-destructive", irrelevant: "bg-muted text-muted-foreground",
    medium: "bg-warning/15 text-warning-foreground", queued: "bg-muted text-muted-foreground", unresearched: "bg-muted text-muted-foreground", draft: "bg-muted text-muted-foreground", cancelled: "bg-muted text-muted-foreground", low: "bg-muted text-muted-foreground", archived: "bg-muted text-muted-foreground",
    new: "bg-primary/10 text-primary",
  };
  return <Badge variant="outline" className={cx("h-5 rounded-sm border-0 px-1.5 text-[10px] font-medium capitalize", map[status] ?? "bg-muted text-muted-foreground")}>{status.replaceAll("_", " ")}</Badge>;
}

export function Score({ value, label = "score" }: { value: number; label?: string }) {
  const style = value >= 80 ? "text-success" : value >= 60 ? "text-info" : value >= 40 ? "text-warning-foreground" : "text-muted-foreground";
  return <span className={cx("tabular font-mono text-sm font-semibold", style)} aria-label={`${label} ${value} out of 100`}>{value}<span className="text-[10px] font-normal text-muted-foreground">/100</span></span>;
}
export function PriorityLabel({ priority }: { priority: Priority }) { return <span className="inline-flex items-center gap-1.5 text-xs capitalize"><span className={cx("h-1.5 w-1.5 rounded-full", priority === "high" ? "bg-destructive" : priority === "medium" ? "bg-warning" : "bg-muted-foreground/50")}/>{priority}</span>; }
export function ConfidenceBadge({ confidence }: { confidence: Confidence }) { return <span className="inline-flex items-center gap-1 text-[10px] capitalize text-muted-foreground"><CircleHelp className="h-3 w-3"/>{confidence} confidence</span>; }
export function OriginBadge({ origin }: { origin: "user" | "researched" | "assumption" | "demo" }) { const labels = { user: "Provided", researched: "Sourced", assumption: "Assumption", demo: "Sample" }; return <Badge variant="outline" className={cx("rounded-sm px-1.5 py-0 text-[9px] font-normal", origin === "assumption" && "border-warning/40 text-warning-foreground", origin === "researched" && "border-info/30 text-info")}>{labels[origin]}</Badge>; }

export function MetricCard({ label, value, note, icon, accent }: { label: string; value: string | number; note?: string; icon: ReactNode; accent?: "green" | "teal" | "amber" | "red" }) {
  return <Card className="rounded-sm border bg-card p-4 shadow-none"><div className="flex items-center justify-between"><span className="text-xs font-medium text-muted-foreground">{label}</span><span className={cx("flex h-7 w-7 items-center justify-center rounded-sm bg-muted text-muted-foreground", accent === "green" && "bg-success/10 text-success", accent === "teal" && "bg-primary/10 text-primary", accent === "amber" && "bg-warning/15 text-warning-foreground", accent === "red" && "bg-destructive/10 text-destructive")}>{icon}</span></div><div className="mt-3 font-mono text-2xl font-semibold tabular">{value}</div>{note && <div className="mt-1 text-[11px] text-muted-foreground">{note}</div>}</Card>;
}

export function EmptyState({ title, detail, action, icon }: { title: string; detail: string; action?: ReactNode; icon?: ReactNode }) {
  return <div className="flex min-h-48 flex-col items-center justify-center border border-dashed border-border px-5 py-10 text-center"><div className="mb-3 text-muted-foreground">{icon ?? <WifiOff className="h-5 w-5"/>}</div><h3 className="text-sm font-semibold">{title}</h3><p className="mt-1 max-w-sm text-xs leading-5 text-muted-foreground">{detail}</p>{action && <div className="mt-4">{action}</div>}</div>;
}
export function ErrorState({ title, message, retry }: { title: string; message: string; retry?: () => void }) {
  return <div className="flex gap-3 border border-destructive/30 bg-destructive/5 p-4 text-sm"><AlertCircle className="h-4 w-4 shrink-0 text-destructive"/><div className="min-w-0 flex-1"><p className="font-medium">{title}</p><p className="mt-1 text-xs text-muted-foreground">{message}</p></div>{retry && <Button size="sm" variant="outline" onClick={retry}>Retry</Button>}</div>;
}
export function LoadingRows({ rows = 5 }: { rows?: number }) { return <div className="space-y-2">{Array.from({ length: rows }, (_, i) => <Skeleton key={i} className="h-12 w-full rounded-sm"/>)}</div>; }

export function SearchBar({ value, onChange, placeholder = "Search…", className }: { value: string; onChange: (v: string) => void; placeholder?: string; className?: string }) {
  return <div className={cx("relative", className)}><Search className="absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground"/><Input className="h-9 rounded-sm pl-8 pr-8 text-xs" value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder}/>{value && <button aria-label="Clear search" className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground" onClick={() => onChange("")}><X className="h-3.5 w-3.5"/></button>}</div>;
}
export function SelectFilter({ value, onChange, options, label }: { value: string; onChange: (s: string) => void; options: { value: string; label: string }[]; label: string }) {
  return <select aria-label={label} value={value} onChange={(e) => onChange(e.target.value)} className="h-9 max-w-48 rounded-sm border border-input bg-background px-2.5 text-xs text-foreground outline-none focus:ring-1 focus:ring-ring">{options.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}</select>;
}
export function ToolIcon({ label, children, onClick, disabled }: { label: string; children: ReactNode; onClick?: () => void; disabled?: boolean }) {
  return <TooltipProvider delayDuration={250}><Tooltip><TooltipTrigger asChild><Button type="button" variant="ghost" size="icon" disabled={disabled} aria-label={label} onClick={onClick} className="h-8 w-8 rounded-sm text-muted-foreground">{children}</Button></TooltipTrigger><TooltipContent>{label}</TooltipContent></Tooltip></TooltipProvider>;
}
export function Pagination({ page, total, pageSize, onPage }: { page: number; total: number; pageSize: number; onPage: (p: number) => void }) {
  const pages = Math.max(1, Math.ceil(total / pageSize));
  return <div className="flex items-center justify-between border-t border-border px-3 py-2 text-[11px] text-muted-foreground"><span>{total ? `${(page - 1) * pageSize + 1}–${Math.min(page * pageSize, total)} of ${total}` : "0 records"}</span><div className="flex items-center gap-1"><Button variant="ghost" size="icon" className="h-7 w-7" aria-label="Previous page" disabled={page <= 1} onClick={() => onPage(page - 1)}><ChevronLeft className="h-3.5 w-3.5"/></Button><span className="min-w-12 text-center">{page} / {pages}</span><Button variant="ghost" size="icon" className="h-7 w-7" aria-label="Next page" disabled={page >= pages} onClick={() => onPage(page + 1)}><ChevronRight className="h-3.5 w-3.5"/></Button></div></div>;
}
export function AddButton({ children = "Add new", onClick }: { children?: ReactNode; onClick: () => void }) { return <Button size="sm" className="h-9 rounded-sm text-xs" onClick={onClick}><Plus className="mr-1.5 h-3.5 w-3.5"/>{children}</Button>; }
export function toastSuccess(message: string) { toast.success(message); }
export function toastError(message: string) { toast.error(message); }
export function StatusDot({ status }: { status: RunStatus }) { return <span className={cx("inline-block h-2 w-2 rounded-full", status === "completed" ? "bg-success" : status === "running" ? "animate-pulse bg-info" : status === "failed" ? "bg-destructive" : "bg-muted-foreground/50")}/>; }
export function SaveButton({ children = "Save changes", ...props }: React.ComponentProps<typeof Button>) { return <Button {...props} className={cx("rounded-sm", props.className)}><Check className="mr-1.5 h-3.5 w-3.5"/>{children}</Button>; }
