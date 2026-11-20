import React, { useState, useEffect } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { AppSidebar, type NavTab } from "@/components/layout/AppSidebar";
import { Topbar } from "@/components/layout/Topbar";
import { useAppStore, hydratePrefs } from "@/hooks/use-store";

// Feature Views
import { OverviewView } from "@/features/overview/OverviewView";
import { ProductsView } from "@/features/products/ProductsView";
import { ProfileView } from "@/features/profile/ProfileView";
import { ICPView } from "@/features/icp/ICPView";
import { DiscoveryView } from "@/features/discovery/DiscoveryView";
import { ProspectsView } from "@/features/prospects/ProspectsView";
import { SignalsView } from "@/features/signals/SignalsView";
import { OutreachView } from "@/features/outreach/OutreachView";
import { RepliesView } from "@/features/replies/RepliesView";
import { AgentsView } from "@/features/agents/AgentsView";
import { LocalAIView } from "@/features/local-ai/LocalAIView";
import { SettingsView } from "@/features/settings/SettingsView";

export const Route = createFileRoute("/")({
  component: Index,
});

function Index() {
  const [currentTab, setCurrentTab] = useState<NavTab>("overview");
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  // Cross-screen contextual state
  const [selectedProductId, setSelectedProductId] = useState<string>("");
  const [selectedICPId, setSelectedICPId] = useState<string>("");
  const [selectedProspectId, setSelectedProspectId] = useState<string>("");

  // Store data for badge counts
  const prospects = useAppStore((s) => s.prospects);
  const products = useAppStore((s) => s.products);
  const signals = useAppStore((s) => s.signals);
  const drafts = useAppStore((s) => s.drafts);

  useEffect(() => {
    hydratePrefs();
  }, []);

  const badgeCounts: Partial<Record<NavTab, number>> = {
    products: products.length,
    prospects: prospects.length,
    signals: signals.filter((s) => s.status === "new").length,
    outreach: drafts.filter((d) => d.reviewState === "draft").length,
  };

  const renderActiveView = () => {
    switch (currentTab) {
      case "overview":
        return <OverviewView onNavigate={setCurrentTab} />;
      case "products":
        return (
          <ProductsView
            onSelectProductForOutreach={(pId) => {
              setSelectedProductId(pId);
              setCurrentTab("outreach");
            }}
            onNavigateToICP={(pId) => {
              setSelectedProductId(pId);
              setCurrentTab("icp");
            }}
          />
        );
      case "profile":
        return <ProfileView />;
      case "icp":
        return (
          <ICPView
            onNavigateToDiscovery={(pId, iId) => {
              setSelectedProductId(pId);
              setSelectedICPId(iId);
              setCurrentTab("discovery");
            }}
          />
        );
      case "discovery":
        return (
          <DiscoveryView
            onNavigateToProspects={() => setCurrentTab("prospects")}
            initialProductId={selectedProductId}
            initialICPId={selectedICPId}
          />
        );
      case "prospects":
        return (
          <ProspectsView
            onNavigateToDiscovery={() => setCurrentTab("discovery")}
            onNavigateToOutreach={(prId) => {
              setSelectedProspectId(prId);
              setCurrentTab("outreach");
            }}
          />
        );
      case "signals":
        return <SignalsView />;
      case "outreach":
        return (
          <OutreachView
            initialProspectId={selectedProspectId}
            initialProductId={selectedProductId}
          />
        );
      case "replies":
        return <RepliesView />;
      case "agents":
        return <AgentsView />;
      case "local-ai":
        return <LocalAIView />;
      case "settings":
        return <SettingsView />;
      default:
        return <OverviewView onNavigate={setCurrentTab} />;
    }
  };

  return (
    <div className="flex h-screen w-full bg-background text-foreground overflow-hidden">
      {/* Persistent Left Sidebar */}
      <AppSidebar
        currentTab={currentTab}
        onSelectTab={setCurrentTab}
        collapsed={sidebarCollapsed}
        onToggleCollapse={() => setSidebarCollapsed(!sidebarCollapsed)}
        badgeCounts={badgeCounts}
      />

      {/* Main Content Area */}
      <div className="flex flex-1 flex-col overflow-hidden min-w-0">
        {/* Top Navigation Bar */}
        <Topbar
          currentTab={currentTab}
          onOpenLocalAI={() => setCurrentTab("local-ai")}
        />

        {/* Scrollable Viewport */}
        <main className="flex-1 overflow-y-auto p-6 md:p-8">
          <div className="max-w-7xl mx-auto">{renderActiveView()}</div>
        </main>
      </div>
    </div>
  );
}
