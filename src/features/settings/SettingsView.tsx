import React, { useState } from "react";
import { useAppStore, actions } from "@/hooks/use-store";
import { PageHeader, OfflineIndicator } from "@/components/common";
import {
  Settings as SettingsIcon,
  Moon,
  Sun,
  ShieldCheck,
  Download,
  Upload,
  RotateCcw,
  Server,
  AlertTriangle,
  Info,
  CheckCircle2,
  HardDrive,
} from "lucide-react";

export function SettingsView() {
  const prefs = useAppStore((s) => s.prefs);
  const products = useAppStore((s) => s.products);
  const prospects = useAppStore((s) => s.prospects);
  const signals = useAppStore((s) => s.signals);

  const [confirmReset, setConfirmReset] = useState(false);
  const [exportNotice, setExportNotice] = useState(false);

  const handleExportData = () => {
    const data = {
      exportedAt: new Date().toISOString(),
      prefs,
      products,
      prospects,
      signals,
    };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `harvey-sales-export-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
    setExportNotice(true);
    setTimeout(() => setExportNotice(false), 3000);
  };

  const handleResetData = () => {
    actions.resetAll();
    setConfirmReset(false);
  };

  return (
    <div className="space-y-6 max-w-4xl">
      <PageHeader
        title="System Preferences & Configuration"
        description="Local environment parameters, research depth calibration, appearance, and air-gapped data exports."
        badge={<OfflineIndicator />}
      />

      {/* Preferences Grid */}
      <div className="space-y-5 text-xs">
        {/* Appearance & Interface */}
        <div className="rounded-xl border border-border bg-card p-5 space-y-4">
          <h3 className="font-bold text-sm text-foreground flex items-center gap-2 border-b border-border/60 pb-2">
            <SettingsIcon className="h-4 w-4 text-primary" />
            <span>Interface & Appearance</span>
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="font-semibold text-foreground">Color Theme</label>
              <div className="flex gap-2">
                <button
                  onClick={() => actions.setPrefs({ theme: "light" })}
                  className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg border text-xs font-semibold transition-all ${
                    prefs.theme === "light"
                      ? "border-primary bg-primary/10 text-primary"
                      : "border-border bg-muted/40 text-muted-foreground hover:bg-muted"
                  }`}
                >
                  <Sun className="h-4 w-4" /> Light
                </button>
                <button
                  onClick={() => actions.setPrefs({ theme: "dark" })}
                  className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg border text-xs font-semibold transition-all ${
                    prefs.theme === "dark"
                      ? "border-primary bg-primary/10 text-primary"
                      : "border-border bg-muted/40 text-muted-foreground hover:bg-muted"
                  }`}
                >
                  <Moon className="h-4 w-4" /> Dark
                </button>
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="font-semibold text-foreground">Table Display Density</label>
              <div className="flex gap-2">
                <button
                  onClick={() => actions.setPrefs({ density: "comfortable" })}
                  className={`flex-1 py-2 rounded-lg border text-xs font-semibold transition-all ${
                    prefs.density === "comfortable"
                      ? "border-primary bg-primary/10 text-primary"
                      : "border-border bg-muted/40 text-muted-foreground hover:bg-muted"
                  }`}
                >
                  Comfortable
                </button>
                <button
                  onClick={() => actions.setPrefs({ density: "compact" })}
                  className={`flex-1 py-2 rounded-lg border text-xs font-semibold transition-all ${
                    prefs.density === "compact"
                      ? "border-primary bg-primary/10 text-primary"
                      : "border-border bg-muted/40 text-muted-foreground hover:bg-muted"
                  }`}
                >
                  Compact
                </button>
              </div>
            </div>
          </div>

          <div className="space-y-1.5 pt-2 border-t border-border/50">
            <div className="flex items-center justify-between">
              <div>
                <span className="font-semibold text-foreground block">Demo Dataset Scaffolding</span>
                <span className="text-[11px] text-muted-foreground">
                  Populate mock products, prospects, and buying signals for local exploration and testing.
                </span>
              </div>
              <input
                type="checkbox"
                checked={prefs.showDemoData}
                onChange={(e) => actions.setPrefs({ showDemoData: e.target.checked })}
                className="h-4 w-4 rounded border-border text-primary focus:ring-primary"
              />
            </div>
          </div>
        </div>

        {/* Backend & Local Networking */}
        <div className="rounded-xl border border-border bg-card p-5 space-y-4">
          <h3 className="font-bold text-sm text-foreground flex items-center gap-2 border-b border-border/60 pb-2">
            <Server className="h-4 w-4 text-primary" />
            <span>Local Backend Connectivity</span>
          </h3>

          <div className="space-y-3">
            <div className="space-y-1">
              <label className="font-semibold text-foreground">FastAPI Daemon URL</label>
              <input
                type="text"
                value={prefs.backendUrl}
                onChange={(e) => actions.setPrefs({ backendUrl: e.target.value })}
                className="w-full h-8 rounded border border-border bg-background px-3 text-xs font-mono text-foreground focus:ring-1 focus:ring-primary"
              />
              <p className="text-[11px] text-muted-foreground">
                Default: <code>http://localhost:8000</code>. Antigravity serves the LangGraph and Ollama inference coordinator here.
              </p>
            </div>

            <div className="space-y-1">
              <label className="font-semibold text-foreground">Public-Web Research Depth</label>
              <select
                value={prefs.researchDepth}
                onChange={(e) => actions.setPrefs({ researchDepth: e.target.value as any })}
                className="w-full h-8 rounded border border-border bg-background px-3 text-xs font-medium text-foreground focus:ring-1 focus:ring-primary"
              >
                <option value="quick">Quick (Homepage + Team page only)</option>
                <option value="standard">Standard (Homepage, About, Team, Contact, ATS feeds)</option>
                <option value="deep">Deep (Full DOM tree, news releases, deep JS crawling via Playwright)</option>
              </select>
            </div>
          </div>
        </div>

        {/* Local Storage & Data Management */}
        <div className="rounded-xl border border-border bg-card p-5 space-y-4">
          <h3 className="font-bold text-sm text-foreground flex items-center gap-2 border-b border-border/60 pb-2">
            <HardDrive className="h-4 w-4 text-primary" />
            <span>Local Data & Privacy Management</span>
          </h3>

          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="space-y-0.5">
              <span className="font-semibold text-foreground block">Export Offline JSON Backup</span>
              <span className="text-[11px] text-muted-foreground">
                Export all local products, prospects, buying signals, and preferences to a portable JSON file.
              </span>
            </div>
            <button
              onClick={handleExportData}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-border bg-card text-foreground font-semibold hover:bg-muted shrink-0"
            >
              <Download className="h-3.5 w-3.5" />
              <span>{exportNotice ? "Exported!" : "Export JSON"}</span>
            </button>
          </div>

          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pt-3 border-t border-border/50">
            <div className="space-y-0.5">
              <span className="font-semibold text-rose-600 dark:text-rose-400 block">Reset Local State</span>
              <span className="text-[11px] text-muted-foreground">
                Clears all custom products, drafts, and resets local browser storage back to initial demo defaults.
              </span>
            </div>
            <button
              onClick={() => setConfirmReset(true)}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-rose-50 border border-rose-200 text-rose-700 dark:bg-rose-950/40 dark:text-rose-300 dark:border-rose-800 text-xs font-semibold hover:bg-rose-100 shrink-0"
            >
              <RotateCcw className="h-3.5 w-3.5" />
              <span>Reset State</span>
            </button>
          </div>
        </div>

        {/* System Information */}
        <div className="rounded-xl border border-border bg-card p-5 space-y-3 text-muted-foreground">
          <h4 className="font-bold text-foreground text-xs uppercase tracking-wider">System Information</h4>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-[11px]">
            <div>
              <span className="block text-muted-foreground">Application:</span>
              <span className="font-semibold text-foreground">Harvey AI (Sellbird)</span>
            </div>
            <div>
              <span className="block text-muted-foreground">Frontend Stack:</span>
              <span className="font-semibold text-foreground">React 18 + Vite + TS</span>
            </div>
            <div>
              <span className="block text-muted-foreground">License:</span>
              <span className="font-semibold text-foreground">GNU AGPL-3.0</span>
            </div>
            <div>
              <span className="block text-muted-foreground">Offline Engine:</span>
              <span className="font-semibold text-foreground">Ollama + SQLite WAL</span>
            </div>
          </div>
        </div>
      </div>

      {/* Confirmation Dialog */}
      {confirmReset && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-xs p-4">
          <div className="w-full max-w-sm rounded-xl border border-border bg-card p-5 shadow-xl space-y-4 text-xs">
            <div className="flex items-center gap-2 text-rose-600 font-bold">
              <AlertTriangle className="h-5 w-5" />
              <span>Confirm Local State Reset</span>
            </div>
            <p className="text-muted-foreground leading-relaxed">
              This will reset all your saved products, modified ICPs, and local drafts to the initial defaults. This action cannot be undone.
            </p>
            <div className="flex justify-end gap-2 pt-2">
              <button
                onClick={() => setConfirmReset(false)}
                className="px-3 py-1.5 rounded border border-border text-foreground hover:bg-muted"
              >
                Cancel
              </button>
              <button
                onClick={handleResetData}
                className="px-3 py-1.5 rounded bg-rose-600 text-rose-50 font-semibold hover:bg-rose-700"
              >
                Reset All
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
