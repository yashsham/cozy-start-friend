import React, { useState, useEffect } from "react";
import { cn } from "@/lib/utils";
import { useAppStore, actions } from "@/hooks/use-store";
import { api } from "@/services";
import {
  Search,
  Moon,
  Sun,
  ShieldCheck,
  AlertTriangle,
  RefreshCw,
  Bell,
  Cpu,
  Layers,
} from "lucide-react";

interface TopbarProps {
  currentTab: string;
  onSearch?: (query: string) => void;
  onOpenLocalAI?: () => void;
  className?: string;
}

const TAB_TITLES: Record<string, { title: string; category: string }> = {
  overview: { title: "Executive Overview", category: "Workspace" },
  products: { title: "Product Catalog", category: "Workspace" },
  profile: { title: "Business Profile & Knowledge", category: "Workspace" },
  icp: { title: "ICP & Persona Builder", category: "Workspace" },
  discovery: { title: "Prospect Discovery", category: "Sales Intelligence" },
  prospects: { title: "Prospect Database & CRM", category: "Sales Intelligence" },
  signals: { title: "Buying Signal Intelligence", category: "Sales Intelligence" },
  outreach: { title: "Personalised Outreach Studio", category: "Engagement" },
  replies: { title: "Reply Triage & Intelligence", category: "Engagement" },
  agents: { title: "Autonomous Agent Execution", category: "System" },
  "local-ai": { title: "Local AI & Ollama Control", category: "System" },
  settings: { title: "System Preferences", category: "System" },
};

export function Topbar({ currentTab, onSearch, onOpenLocalAI, className }: TopbarProps) {
  const prefs = useAppStore((s) => s.prefs);
  const products = useAppStore((s) => s.products);
  const [searchVal, setSearchVal] = React.useState("");
  const [ollamaOnline, setOllamaOnline] = useState<boolean | null>(null);

  useEffect(() => {
    let mounted = true;
    const checkStatus = async () => {
      try {
        const s = await api.getLocalStatus(prefs.ollamaEndpoint || "http://localhost:11434");
        if (mounted) setOllamaOnline(s.connected);
      } catch {
        if (mounted) setOllamaOnline(false);
      }
    };
    checkStatus();
    const interval = setInterval(checkStatus, 15000);
    return () => {
      mounted = false;
      clearInterval(interval);
    };
  }, [prefs.ollamaEndpoint]);

  const tabInfo = TAB_TITLES[currentTab] || { title: "Harvey AI", category: "Workspace" };

  const handleToggleTheme = () => {
    actions.setPrefs({ theme: prefs.theme === "dark" ? "light" : "dark" });
  };

  return (
    <header className={cn("flex h-16 items-center justify-between gap-4 border-b border-border bg-card/80 backdrop-blur px-6 z-10", className)}>
      {/* Breadcrumb / Title */}
      <div className="flex items-center gap-2 text-xs">
        <span className="text-muted-foreground font-medium">{tabInfo.category}</span>
        <span className="text-muted-foreground/60">/</span>
        <span className="font-semibold text-foreground">{tabInfo.title}</span>
      </div>

      {/* Center Search */}
      <div className="hidden md:flex flex-1 max-w-md items-center relative">
        <Search className="absolute left-3 h-4 w-4 text-muted-foreground" />
        <input
          type="text"
          placeholder="Search products, companies, signals, or drafts..."
          value={searchVal}
          onChange={(e) => {
            setSearchVal(e.target.value);
            onSearch?.(e.target.value);
          }}
          className="w-full h-9 rounded-lg border border-border bg-muted/40 pl-9 pr-4 text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary focus:bg-background transition-all"
        />
      </div>

      {/* Right Actions */}
      <div className="flex items-center gap-3">
        {/* Active Product Count */}
        <div className="hidden lg:flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-muted/60 border border-border text-[11px] font-medium text-muted-foreground">
          <Layers className="h-3.5 w-3.5 text-primary" />
          <span>{products.length} Products</span>
        </div>

        {/* Local AI Status Pill */}
        <button
          onClick={onOpenLocalAI}
          className={cn(
            "flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[11px] font-medium transition-colors border",
            ollamaOnline
              ? "bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-800 hover:bg-emerald-100"
              : "bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/40 dark:text-amber-300 dark:border-amber-800 hover:bg-amber-100"
          )}
          title="Click to view Local AI status & Ollama models"
        >
          <Cpu className="h-3.5 w-3.5" />
          <span className="hidden sm:inline">
            {ollamaOnline === null
              ? "Ollama: Checking..."
              : ollamaOnline
              ? "Ollama: Online"
              : "Ollama: Offline (Fallback Mode)"}
          </span>
        </button>

        {/* Demo Data Mode Pill */}
        {prefs.showDemoData && (
          <span className="hidden xl:inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-semibold bg-amber-50 text-amber-700 border border-amber-200 dark:bg-amber-950/40 dark:text-amber-300 dark:border-amber-800">
            Demo Mode Active
          </span>
        )}

        {/* Theme Toggle */}
        <button
          onClick={handleToggleTheme}
          className="h-8 w-8 rounded-lg border border-border bg-card flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-accent transition-colors"
          title={`Switch to ${prefs.theme === "dark" ? "light" : "dark"} mode`}
        >
          {prefs.theme === "dark" ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
        </button>

        {/* User / Operator */}
        <div className="flex items-center gap-2 pl-2 border-l border-border">
          <div className="h-7 w-7 rounded-full bg-primary/10 text-primary font-bold text-xs flex items-center justify-center border border-primary/20">
            OP
          </div>
          <div className="hidden sm:flex flex-col text-left">
            <span className="text-xs font-semibold text-foreground leading-none">Operator</span>
            <span className="text-[10px] text-muted-foreground leading-none mt-0.5">Admin</span>
          </div>
        </div>
      </div>
    </header>
  );
}
