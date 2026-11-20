import React from "react";
import { cn } from "@/lib/utils";
import {
  LayoutDashboard,
  Package,
  Building2,
  Target,
  Compass,
  Users,
  Radio,
  Send,
  MessageSquareCode,
  Activity,
  Cpu,
  Settings,
  ChevronLeft,
  ChevronRight,
  ShieldCheck,
  Bot,
} from "lucide-react";

export type NavTab =
  | "overview"
  | "products"
  | "profile"
  | "icp"
  | "discovery"
  | "prospects"
  | "signals"
  | "outreach"
  | "replies"
  | "agents"
  | "local-ai"
  | "settings";

interface NavItem {
  id: NavTab;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  badge?: string | number;
}

interface NavGroup {
  label: string;
  items: NavItem[];
}

const NAV_GROUPS: NavGroup[] = [
  {
    label: "WORKSPACE",
    items: [
      { id: "overview", label: "Overview", icon: LayoutDashboard },
      { id: "products", label: "Products", icon: Package },
      { id: "profile", label: "Business Profile", icon: Building2 },
      { id: "icp", label: "ICP Builder", icon: Target },
    ],
  },
  {
    label: "SALES INTELLIGENCE",
    items: [
      { id: "discovery", label: "Discover Prospects", icon: Compass },
      { id: "prospects", label: "Prospects", icon: Users },
      { id: "signals", label: "Buying Signals", icon: Radio },
    ],
  },
  {
    label: "ENGAGEMENT",
    items: [
      { id: "outreach", label: "Outreach Studio", icon: Send },
      { id: "replies", label: "Reply Intelligence", icon: MessageSquareCode },
    ],
  },
  {
    label: "SYSTEM",
    items: [
      { id: "agents", label: "Agent Activity", icon: Activity },
      { id: "local-ai", label: "Local AI & Models", icon: Cpu },
      { id: "settings", label: "Settings", icon: Settings },
    ],
  },
];

interface AppSidebarProps {
  currentTab: NavTab;
  onSelectTab: (tab: NavTab) => void;
  collapsed: boolean;
  onToggleCollapse: () => void;
  badgeCounts?: Partial<Record<NavTab, number>>;
  className?: string;
}

export function AppSidebar({
  currentTab,
  onSelectTab,
  collapsed,
  onToggleCollapse,
  badgeCounts = {},
  className,
}: AppSidebarProps) {
  return (
    <aside
      className={cn(
        "flex flex-col border-r border-border bg-sidebar text-sidebar-foreground transition-all duration-200 select-none",
        collapsed ? "w-16" : "w-64",
        className
      )}
    >
      {/* Brand Header */}
      <div className="flex h-16 items-center justify-between px-4 border-b border-border/80">
        <div className="flex items-center gap-3 overflow-hidden">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary text-primary-foreground font-bold shadow-sm">
            <Bot className="h-5 w-5" />
          </div>
          {!collapsed && (
            <div className="flex flex-col truncate">
              <span className="font-bold text-sm tracking-tight text-foreground flex items-center gap-1.5">
                Harvey AI
                <span className="text-[10px] uppercase font-semibold px-1.5 py-0.2 bg-muted text-muted-foreground rounded">
                  Local
                </span>
              </span>
              <span className="text-[11px] text-muted-foreground truncate">Autonomous Sales Agent</span>
            </div>
          )}
        </div>
        <button
          onClick={onToggleCollapse}
          className="hidden md:flex h-7 w-7 items-center justify-center rounded-md text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
          title={collapsed ? "Expand sidebar" : "Collapse sidebar"}
        >
          {collapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
        </button>
      </div>

      {/* Navigation Groups */}
      <div className="flex-1 overflow-y-auto py-4 px-2 space-y-6">
        {NAV_GROUPS.map((group) => (
          <div key={group.label} className="space-y-1">
            {!collapsed ? (
              <h4 className="px-3 text-[10px] font-bold uppercase tracking-wider text-muted-foreground/80 mb-1.5">
                {group.label}
              </h4>
            ) : (
              <div className="h-1 border-t border-border/40 mx-2 my-2" />
            )}
            {group.items.map((item) => {
              const active = currentTab === item.id;
              const Icon = item.icon;
              const count = badgeCounts[item.id];
              return (
                <button
                  key={item.id}
                  onClick={() => onSelectTab(item.id)}
                  title={collapsed ? item.label : undefined}
                  className={cn(
                    "w-full flex items-center gap-3 rounded-lg px-3 py-2 text-xs font-medium transition-colors text-left group relative",
                    active
                      ? "bg-primary text-primary-foreground font-semibold shadow-xs"
                      : "text-muted-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
                  )}
                >
                  <Icon className={cn("h-4 w-4 shrink-0 transition-transform", active ? "text-primary-foreground" : "text-muted-foreground group-hover:text-foreground")} />
                  {!collapsed && <span className="truncate flex-1">{item.label}</span>}
                  {!collapsed && typeof count === "number" && count > 0 && (
                    <span
                      className={cn(
                        "ml-auto text-[10px] font-semibold px-1.5 py-0.5 rounded-full shrink-0",
                        active ? "bg-primary-foreground/20 text-primary-foreground" : "bg-muted text-muted-foreground"
                      )}
                    >
                      {count}
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        ))}
      </div>

      {/* Local Safety Footer */}
      <div className="p-3 border-t border-border/80 bg-sidebar/50">
        {!collapsed ? (
          <div className="rounded-lg border border-border/60 bg-card p-2.5 text-xs space-y-1.5">
            <div className="flex items-center gap-1.5 font-medium text-emerald-600 dark:text-emerald-400 text-[11px]">
              <ShieldCheck className="h-3.5 w-3.5" />
              <span>100% Offline Engine</span>
            </div>
            <p className="text-[10px] text-muted-foreground leading-tight">
              Ollama & SQLite local sandbox. Zero cloud API calls or telemetry.
            </p>
          </div>
        ) : (
          <div className="flex justify-center" title="100% Local Inference & Storage">
            <ShieldCheck className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
          </div>
        )}
      </div>
    </aside>
  );
}
