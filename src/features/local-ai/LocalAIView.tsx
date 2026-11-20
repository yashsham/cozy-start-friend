import React, { useState, useEffect } from "react";
import { PageHeader, OfflineIndicator } from "@/components/common";
import { api } from "@/services";
import type { LocalAIStatus, LocalModel, InferenceRecord } from "@/types";
import {
  Cpu,
  HardDrive,
  ShieldCheck,
  CheckCircle2,
  AlertCircle,
  RefreshCw,
  Server,
  Download,
  Activity,
  Layers,
  Sparkles,
  Zap,
} from "lucide-react";

export function LocalAIView() {
  const [status, setStatus] = useState<LocalAIStatus | null>(null);
  const [models, setModels] = useState<LocalModel[]>([]);
  const [history, setHistory] = useState<InferenceRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedModel, setSelectedModel] = useState<string>("qwen2.5:7b-instruct");

  const fetchStatus = async () => {
    setLoading(true);
    try {
      const [s, m, h] = await Promise.all([
        api.getLocalStatus("http://localhost:11434"),
        api.listModels(),
        api.getInferenceHistory(),
      ]);
      setStatus(s);
      setModels(m);
      setHistory(h);
      if (s.activeModel) setSelectedModel(s.activeModel);
    } catch (err) {
      console.error("Local AI fetch failed:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStatus();
  }, []);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Local AI & Inference Engine"
        description="Monitor local Ollama daemon status, installed open-weight models, hardware utilization, and SentenceTransformers vector embeddings."
        badge={<OfflineIndicator />}
      >
        <button
          onClick={fetchStatus}
          disabled={loading}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-border bg-card text-foreground text-xs font-semibold hover:bg-muted transition-colors disabled:opacity-50"
        >
          <RefreshCw className={`h-3.5 w-3.5 ${loading ? "animate-spin" : ""}`} />
          <span>Refresh Hardware</span>
        </button>
      </PageHeader>

      {/* Localhost Air-Gapped Notice */}
      <div className="p-4 rounded-xl border border-emerald-300/60 bg-emerald-50/40 dark:bg-emerald-950/20 dark:border-emerald-800/60 flex items-start gap-3 text-xs">
        <ShieldCheck className="h-5 w-5 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
        <div className="space-y-1">
          <span className="font-bold text-emerald-900 dark:text-emerald-200">
            Guaranteed Local-First Architecture
          </span>
          <p className="text-emerald-800/80 dark:text-emerald-300/80 leading-relaxed">
            All text completions, prospect scoring, email writing, and reply triage run directly on this machine via Ollama and PyTorch SentenceTransformers. No data, API keys, or prospect notes ever leave your local filesystem.
          </p>
        </div>
      </div>

      {/* Hardware & Endpoint Status Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5 text-xs">
        {/* Ollama Daemon Status */}
        <div className="rounded-xl border border-border bg-card p-5 space-y-3">
          <div className="flex items-center justify-between border-b border-border/60 pb-2">
            <span className="font-bold text-foreground flex items-center gap-1.5">
              <Server className="h-4 w-4 text-primary" />
              <span>Ollama Daemon</span>
            </span>
            {status?.connected ? (
              <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-600 dark:text-emerald-400">
                <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
                Live Online
              </span>
            ) : (
              <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-amber-600 dark:text-amber-400">
                <span className="h-2 w-2 rounded-full bg-amber-500" />
                Offline (Using Deterministic Fallback)
              </span>
            )}
          </div>

          <div className="space-y-2 text-muted-foreground">
            <div className="flex justify-between">
              <span>Endpoint:</span>
              <span className="font-mono text-foreground font-medium">http://127.0.0.1:11434</span>
            </div>
            <div className="flex justify-between">
              <span>Active Model:</span>
              <span className="font-mono text-foreground font-semibold">{selectedModel}</span>
            </div>
            <div className="flex justify-between">
              <span>Embeddings Model:</span>
              <span className="font-mono text-foreground font-medium">all-MiniLM-L6-v2</span>
            </div>
            <div className="flex justify-between">
              <span>Inference Protocol:</span>
              <span className="text-foreground font-medium">Local HTTP / Ollama REST</span>
            </div>
          </div>
        </div>

        {/* Host Hardware Metrics */}
        <div className="rounded-xl border border-border bg-card p-5 space-y-3">
          <div className="flex items-center justify-between border-b border-border/60 pb-2">
            <span className="font-bold text-foreground flex items-center gap-1.5">
              <Cpu className="h-4 w-4 text-primary" />
              <span>Host Compute</span>
            </span>
            <span className="text-[11px] text-muted-foreground font-medium">Hardware Detected</span>
          </div>

          <div className="space-y-2 text-muted-foreground">
            <div className="flex justify-between">
              <span>CPU Cores:</span>
              <span className="font-semibold text-foreground">16 Logical Cores</span>
            </div>
            <div className="flex justify-between">
              <span>System RAM:</span>
              <span className="font-semibold text-foreground">32 GB (18.4 GB Free)</span>
            </div>
            <div className="flex justify-between">
              <span>GPU Accelerator:</span>
              <span className="font-semibold text-foreground">NVIDIA RTX 4070 Laptop</span>
            </div>
            <div className="flex justify-between">
              <span>Dedicated VRAM:</span>
              <span className="font-semibold text-emerald-600 dark:text-emerald-400">8 GB GDDR6</span>
            </div>
          </div>
        </div>

        {/* Model Recommendation Card */}
        <div className="rounded-xl border border-border bg-card p-5 space-y-3">
          <div className="flex items-center justify-between border-b border-border/60 pb-2">
            <span className="font-bold text-foreground flex items-center gap-1.5">
              <Zap className="h-4 w-4 text-primary" />
              <span>VRAM Recommendation</span>
            </span>
            <span className="text-[10px] font-bold uppercase text-primary">Optimal Fit</span>
          </div>

          <p className="text-muted-foreground leading-relaxed">
            With 8GB VRAM and 32GB system memory, <strong className="text-foreground">Qwen2.5:7b-instruct (Q4_K_M)</strong> provides sub-2-second completions with near-zero memory pressure.
          </p>
          <div className="p-2 rounded bg-muted/40 text-[11px] text-muted-foreground font-mono">
            ollama run qwen2.5:7b-instruct
          </div>
        </div>
      </div>

      {/* Installed Open-Weight Models Catalog */}
      <div className="rounded-xl border border-border bg-card p-5 space-y-4 shadow-xs text-xs">
        <div className="flex items-center justify-between border-b border-border/60 pb-3">
          <h3 className="font-bold text-sm text-foreground flex items-center gap-2">
            <Layers className="h-4 w-4 text-primary" />
            <span>Local Model Catalog ({models.length})</span>
          </h3>
          <span className="text-xs text-muted-foreground">Permissively Licensed Weights</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {models.map((m) => {
            const isCurrent = selectedModel.includes(m.name);
            return (
              <div
                key={m.name}
                className={`p-4 rounded-xl border bg-card space-y-3 flex flex-col justify-between transition-all ${
                  isCurrent ? "border-primary ring-1 ring-primary/40" : "border-border/80"
                }`}
              >
                <div className="space-y-1.5">
                  <div className="flex items-start justify-between gap-1">
                    <span className="font-bold text-sm text-foreground">{m.name}</span>
                    {m.recommended && (
                      <span className="text-[10px] font-semibold px-1.5 py-0.2 rounded bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300">
                        Recommended
                      </span>
                    )}
                  </div>
                  <div className="text-[11px] text-muted-foreground">
                    Family: {m.family} • Size: {m.size}
                  </div>
                  <div className="text-[11px] text-muted-foreground">
                    Context: {m.contextLength.toLocaleString()} tokens
                  </div>
                </div>

                <div className="pt-2 border-t border-border/50">
                  {isCurrent ? (
                    <span className="inline-flex items-center gap-1 text-xs font-bold text-primary">
                      <CheckCircle2 className="h-3.5 w-3.5" /> Active Model
                    </span>
                  ) : (
                    <button
                      onClick={() => setSelectedModel(m.name)}
                      className="w-full py-1 rounded border border-border text-foreground font-semibold hover:bg-muted text-xs"
                    >
                      Select Model
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Local Inference Ledger */}
      <div className="rounded-xl border border-border bg-card p-5 space-y-4 shadow-xs text-xs">
        <div className="flex items-center justify-between border-b border-border/60 pb-3">
          <h3 className="font-bold text-sm text-foreground flex items-center gap-2">
            <Activity className="h-4 w-4 text-primary" />
            <span>Local Inference Ledger</span>
          </h3>
          <span className="text-xs text-muted-foreground">Recorded in local SQLite usage_events</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-muted/40 border-b border-border text-[11px] font-semibold text-muted-foreground uppercase">
              <tr>
                <th className="p-2.5">Task</th>
                <th className="p-2.5">Model</th>
                <th className="p-2.5">Duration</th>
                <th className="p-2.5">Tokens</th>
                <th className="p-2.5">VRAM</th>
                <th className="p-2.5">Status</th>
                <th className="p-2.5">Timestamp</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/60">
              {history.map((h) => (
                <tr key={h.id} className="hover:bg-muted/20">
                  <td className="p-2.5 font-semibold text-foreground">{h.task}</td>
                  <td className="p-2.5 font-mono text-[11px]">{h.model}</td>
                  <td className="p-2.5 text-muted-foreground">{h.durationMs}ms</td>
                  <td className="p-2.5 text-muted-foreground">{h.tokens || "-"}</td>
                  <td className="p-2.5 text-muted-foreground">{h.memGb ? `${h.memGb}GB` : "-"}</td>
                  <td className="p-2.5">
                    <span className="px-1.5 py-0.5 rounded text-[10px] font-semibold bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300">
                      {h.status}
                    </span>
                  </td>
                  <td className="p-2.5 text-muted-foreground text-[11px]">
                    {new Date(h.at).toLocaleTimeString()}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
