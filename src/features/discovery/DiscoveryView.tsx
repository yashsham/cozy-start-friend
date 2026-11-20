import React, { useState, useRef } from "react";
import { useAppStore } from "@/hooks/use-store";
import { PageHeader, StatusBadge, ScoreIndicator, EmptyState } from "@/components/common";
import { api } from "@/services";
import type { DiscoveryProgress, Prospect } from "@/types";
import {
  Compass,
  Play,
  RotateCcw,
  StopCircle,
  CheckCircle2,
  AlertCircle,
  Building2,
  Globe2,
  ArrowRight,
  Loader2,
  Layers,
  Terminal,
} from "lucide-react";

interface DiscoveryViewProps {
  onNavigateToProspects?: () => void;
  initialProductId?: string;
  initialICPId?: string;
}

export function DiscoveryView({
  onNavigateToProspects,
  initialProductId,
  initialICPId,
}: DiscoveryViewProps) {
  const products = useAppStore((s) => s.products);
  const icps = useAppStore((s) => s.icps);
  const prospects = useAppStore((s) => s.prospects);

  const [productId, setProductId] = useState<string>(initialProductId || products[0]?.id || "");
  const [icpId, setIcpId] = useState<string>(initialICPId || icps[0]?.id || "");
  const [geography, setGeography] = useState("United States");
  const [industry, setIndustry] = useState("Fintech & SaaS");
  const [companySize, setCompanySize] = useState("50-200");
  const [limit, setLimit] = useState(10);

  // Discovery execution state
  const [isRunning, setIsRunning] = useState(false);
  const [progress, setProgress] = useState<DiscoveryProgress | null>(null);
  const [logs, setLogs] = useState<string[]>([]);
  const [discoveredProspects, setDiscoveredProspects] = useState<Prospect[]>([]);
  const abortControllerRef = useRef<AbortController | null>(null);

  const availableICPs = icps.filter((i) => i.productId === productId);
  const selectedProduct = products.find((p) => p.id === productId);
  const selectedICP = icps.find((i) => i.id === icpId);

  const handleStartDiscovery = async () => {
    setIsRunning(true);
    setLogs([]);
    setDiscoveredProspects([]);
    abortControllerRef.current = new AbortController();

    const addLog = (msg: string) => {
      setLogs((prev) => [...prev, `[${new Date().toLocaleTimeString()}] ${msg}`]);
    };

    addLog(`Initiating autonomous discovery pipeline for product: ${selectedProduct?.name}`);
    addLog(`Connecting to zero-cost local research workers (OSM Overpass + Scrapy spiders)...`);

    try {
      const prospectIds = await api.startDiscovery(
        {
          productId,
          icpId,
          geography,
          industry,
          companySize,
          limit,
        },
        (p) => {
          setProgress(p);
          addLog(`${p.stage}: ${p.message} (Found: ${p.found})`);
        },
        abortControllerRef.current.signal
      );

      addLog(`Discovery stage completed successfully. ${prospectIds.length} candidate entities ingested.`);
      // Match discovered prospects from store
      const matches = prospects.filter((p) => prospectIds.includes(p.id) || p.productId === productId);
      setDiscoveredProspects(matches.slice(0, limit));
    } catch (err: any) {
      if (err.name === "AbortError") {
        addLog(`Discovery process cancelled by operator.`);
      } else {
        addLog(`Discovery encountered an error: ${err.message || err}`);
      }
    } finally {
      setIsRunning(false);
    }
  };

  const handleCancel = () => {
    abortControllerRef.current?.abort();
    setIsRunning(false);
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Prospect Discovery Engine"
        description="Launch guided public-web research using OpenStreetMap, public registry crawlers, and local heuristic profiling with zero paid search APIs."
      />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Configuration Form */}
        <div className="rounded-xl border border-border bg-card p-5 space-y-4 text-xs">
          <h3 className="font-bold text-sm text-foreground flex items-center gap-1.5 border-b border-border/60 pb-2">
            <Compass className="h-4 w-4 text-primary" />
            <span>Target Search Criteria</span>
          </h3>

          <div className="space-y-3">
            <div className="space-y-1">
              <label className="font-semibold text-foreground">Product Context</label>
              <select
                value={productId}
                disabled={isRunning}
                onChange={(e) => {
                  setProductId(e.target.value);
                  const related = icps.filter((i) => i.productId === e.target.value);
                  if (related[0]) setIcpId(related[0].id);
                }}
                className="w-full h-8 rounded border border-border bg-background px-2.5 text-xs font-medium text-foreground focus:ring-1 focus:ring-primary"
              >
                {products.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-1">
              <label className="font-semibold text-foreground">Target ICP Rule Set</label>
              <select
                value={icpId}
                disabled={isRunning}
                onChange={(e) => setIcpId(e.target.value)}
                className="w-full h-8 rounded border border-border bg-background px-2.5 text-xs font-medium text-foreground focus:ring-1 focus:ring-primary"
              >
                {availableICPs.length > 0 ? (
                  availableICPs.map((i) => (
                    <option key={i.id} value={i.id}>
                      {i.name} ({i.status})
                    </option>
                  ))
                ) : (
                  <option value="">Default Broad ICP</option>
                )}
              </select>
            </div>

            <div className="space-y-1">
              <label className="font-semibold text-foreground">Geography / Region</label>
              <input
                type="text"
                disabled={isRunning}
                value={geography}
                onChange={(e) => setGeography(e.target.value)}
                className="w-full h-8 rounded border border-border bg-background px-2.5 text-xs focus:ring-1 focus:ring-primary"
              />
            </div>

            <div className="space-y-1">
              <label className="font-semibold text-foreground">Target Industry / Domain</label>
              <input
                type="text"
                disabled={isRunning}
                value={industry}
                onChange={(e) => setIndustry(e.target.value)}
                className="w-full h-8 rounded border border-border bg-background px-2.5 text-xs focus:ring-1 focus:ring-primary"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="font-semibold text-foreground">Company Size</label>
                <input
                  type="text"
                  disabled={isRunning}
                  value={companySize}
                  onChange={(e) => setCompanySize(e.target.value)}
                  className="w-full h-8 rounded border border-border bg-background px-2.5 text-xs focus:ring-1 focus:ring-primary"
                />
              </div>
              <div className="space-y-1">
                <label className="font-semibold text-foreground">Max Results</label>
                <input
                  type="number"
                  min={1}
                  max={50}
                  disabled={isRunning}
                  value={limit}
                  onChange={(e) => setLimit(Number(e.target.value))}
                  className="w-full h-8 rounded border border-border bg-background px-2.5 text-xs focus:ring-1 focus:ring-primary"
                />
              </div>
            </div>

            {/* Criteria summary explanation */}
            <div className="p-3 rounded-lg bg-muted/40 border border-border/60 space-y-1">
              <span className="text-[10px] font-semibold uppercase text-muted-foreground">Scout Methodology</span>
              <p className="text-[11px] text-muted-foreground leading-relaxed">
                Queries OpenStreetMap premises and web directories. Crawls homepages and team pages to extract owner contacts and tech stack markers.
              </p>
            </div>

            {/* Run / Stop Button */}
            <div className="pt-2">
              {!isRunning ? (
                <button
                  onClick={handleStartDiscovery}
                  className="w-full h-9 rounded-lg bg-primary text-primary-foreground font-semibold flex items-center justify-center gap-2 hover:bg-primary/90 transition-colors shadow-xs"
                >
                  <Play className="h-4 w-4" />
                  <span>Execute Discovery</span>
                </button>
              ) : (
                <button
                  onClick={handleCancel}
                  className="w-full h-9 rounded-lg bg-rose-600 text-rose-50 font-semibold flex items-center justify-center gap-2 hover:bg-rose-700 transition-colors shadow-xs"
                >
                  <StopCircle className="h-4 w-4" />
                  <span>Cancel Discovery</span>
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Right Columns (2 cols): Progress & Live Activity */}
        <div className="lg:col-span-2 space-y-5">
          {/* Progress Card */}
          <div className="rounded-xl border border-border bg-card p-5 space-y-3">
            <div className="flex items-center justify-between">
              <h4 className="font-bold text-sm text-foreground flex items-center gap-2">
                {isRunning ? (
                  <Loader2 className="h-4 w-4 text-primary animate-spin" />
                ) : progress?.done ? (
                  <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                ) : (
                  <Compass className="h-4 w-4 text-muted-foreground" />
                )}
                <span>Execution Status: {progress ? progress.stage : "Idle"}</span>
              </h4>
              {progress && (
                <span className="text-xs font-semibold text-primary">
                  {progress.found} Entities Found
                </span>
              )}
            </div>

            {progress && (
              <div className="space-y-1.5">
                <div className="text-xs text-muted-foreground">{progress.message}</div>
                <div className="h-2 w-full rounded-full bg-muted overflow-hidden">
                  <div
                    className={`h-full transition-all duration-300 ${
                      progress.done ? "bg-emerald-500" : "bg-primary"
                    }`}
                    style={{ width: progress.done ? "100%" : `${Math.min(progress.found * 10, 95)}%` }}
                  />
                </div>
              </div>
            )}

            {/* Execution Console Logs */}
            <div className="mt-3 rounded-lg bg-zinc-950 p-3 text-[11px] font-mono text-zinc-300 max-h-48 overflow-y-auto space-y-1 border border-zinc-800">
              <div className="flex items-center gap-1.5 text-zinc-500 text-[10px] pb-1 border-b border-zinc-800">
                <Terminal className="h-3 w-3" />
                <span>Local Discovery Console Output</span>
              </div>
              {logs.length === 0 ? (
                <div className="text-zinc-600 italic">No discovery run active. Press "Execute Discovery" to start.</div>
              ) : (
                logs.map((log, i) => <div key={i}>{log}</div>)
              )}
            </div>
          </div>

          {/* Results Preview */}
          <div className="rounded-xl border border-border bg-card p-5 space-y-3">
            <div className="flex items-center justify-between">
              <h4 className="font-bold text-sm text-foreground">Discovery Results Preview</h4>
              {discoveredProspects.length > 0 && onNavigateToProspects && (
                <button
                  onClick={onNavigateToProspects}
                  className="text-xs text-primary font-medium hover:underline inline-flex items-center gap-1"
                >
                  Manage in CRM <ArrowRight className="h-3 w-3" />
                </button>
              )}
            </div>

            {discoveredProspects.length === 0 ? (
              <p className="text-xs text-muted-foreground italic py-4 text-center">
                Discovered candidate businesses and owners will populate here as the local scraper traverses public sources.
              </p>
            ) : (
              <div className="divide-y divide-border/60">
                {discoveredProspects.map((p) => (
                  <div key={p.id} className="py-2.5 flex items-center justify-between gap-3 text-xs">
                    <div>
                      <span className="font-bold text-foreground block">{p.company}</span>
                      <span className="text-[11px] text-muted-foreground">
                        {p.industry} • {p.location} • {p.website}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <ScoreIndicator score={p.productFit} label="Fit" />
                      <StatusBadge status={p.status} />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
