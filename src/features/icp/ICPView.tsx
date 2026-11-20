import React, { useState } from "react";
import { useAppStore, actions } from "@/hooks/use-store";
import { PageHeader, StatusBadge, EmptyState } from "@/components/common";
import type { ICP, Persona } from "@/types";
import {
  Target,
  Plus,
  Trash2,
  CheckCircle2,
  XCircle,
  Building,
  Globe2,
  UserCheck,
  Zap,
  ArrowRight,
  Sparkles,
} from "lucide-react";

interface ICPViewProps {
  onNavigateToDiscovery?: (productId: string, icpId: string) => void;
}

export function ICPView({ onNavigateToDiscovery }: ICPViewProps) {
  const products = useAppStore((s) => s.products);
  const icps = useAppStore((s) => s.icps);

  const [selectedProductId, setSelectedProductId] = useState<string>(products[0]?.id || "");
  const [activeICPId, setActiveICPId] = useState<string>(icps[0]?.id || "");
  const [isCreating, setIsCreating] = useState(false);

  // Filter ICPs for current product
  const productICPs = icps.filter((i) => i.productId === selectedProductId);
  const currentICP = productICPs.find((i) => i.id === activeICPId) || productICPs[0];

  // Form State for creating a new ICP
  const [newICP, setNewICP] = useState<Partial<ICP>>({
    name: "Enterprise ICP",
    status: "draft",
    industries: ["Fintech", "Enterprise Software"],
    companySize: "100-500 employees",
    geography: ["United States", "United Kingdom", "Canada"],
    revenueRange: "$10M - $50M ARR",
    characteristics: ["Series B+", "Modern tech stack", "Fast hiring velocity"],
    positiveCriteria: ["Public customer case studies", "SOC2 or ISO27001 compliance badge"],
    exclusionCriteria: ["Agencies / Consultancies", "Early pre-revenue / stealth"],
    customRequirements: "Must have verified head of sales or VP engineering listed on team page.",
    personas: [
      {
        title: "VP of Sales / CRO",
        seniority: "VP+",
        department: "Sales",
        painPoints: ["Outbound rep ramp time too high", "Manual prospecting burnout"],
      },
    ],
  });

  const handleCreateICP = (e: React.FormEvent) => {
    e.preventDefault();
    const created = actions.saveICP({
      productId: selectedProductId,
      name: newICP.name || "Default ICP",
      status: "confirmed",
      industries: newICP.industries || [],
      companySize: newICP.companySize || "10-50",
      geography: newICP.geography || ["US"],
      revenueRange: newICP.revenueRange || "$1M-$5M",
      characteristics: newICP.characteristics || [],
      positiveCriteria: newICP.positiveCriteria || [],
      exclusionCriteria: newICP.exclusionCriteria || [],
      customRequirements: newICP.customRequirements || "",
      personas: newICP.personas || [],
    });
    setActiveICPId(created.id);
    setIsCreating(false);
  };

  const handleToggleConfirmStatus = (icp: ICP) => {
    actions.saveICP({
      ...icp,
      status: icp.status === "confirmed" ? "draft" : "confirmed",
    });
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Ideal Customer Profile (ICP) Builder"
        description="Define precise qualification rules, target firmographics, buyer personas, and hard exclusions mapped to each product."
      >
        <button
          onClick={() => setIsCreating(true)}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-primary text-primary-foreground text-xs font-semibold hover:bg-primary/90 transition-colors shadow-xs"
        >
          <Plus className="h-4 w-4" />
          <span>New ICP</span>
        </button>
      </PageHeader>

      {/* Product Selector Bar */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 p-4 rounded-xl border border-border bg-card">
        <div className="flex items-center gap-2">
          <span className="text-xs font-semibold text-foreground">Target Product:</span>
          <select
            value={selectedProductId}
            onChange={(e) => setSelectedProductId(e.target.value)}
            className="h-8 rounded-lg border border-border bg-background px-3 text-xs font-medium text-foreground focus:ring-1 focus:ring-primary"
          >
            {products.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name} ({p.category})
              </option>
            ))}
          </select>
        </div>

        {/* Existing ICP Tabs for this product */}
        <div className="flex items-center gap-2 overflow-x-auto w-full sm:w-auto">
          {productICPs.map((icp) => (
            <button
              key={icp.id}
              onClick={() => setActiveICPId(icp.id)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                currentICP?.id === icp.id
                  ? "bg-primary text-primary-foreground font-semibold shadow-xs"
                  : "bg-muted text-muted-foreground hover:bg-accent hover:text-foreground"
              }`}
            >
              {icp.name}
            </button>
          ))}
        </div>
      </div>

      {/* Main ICP View or Empty */}
      {!currentICP && !isCreating ? (
        <EmptyState
          icon={Target}
          title="No ICP Configured for this Product"
          description="Create your first Ideal Customer Profile to instruct autonomous agents who to scout and qualify."
          action={
            <button
              onClick={() => setIsCreating(true)}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-primary text-primary-foreground text-xs font-semibold"
            >
              <Plus className="h-4 w-4" /> Create ICP
            </button>
          }
        />
      ) : isCreating ? (
        /* Create ICP Form */
        <div className="rounded-xl border border-border bg-card p-6 shadow-sm space-y-5">
          <div className="flex items-center justify-between border-b border-border pb-3">
            <h3 className="font-bold text-base text-foreground">Create ICP Configuration</h3>
            <button
              onClick={() => setIsCreating(false)}
              className="text-xs text-muted-foreground hover:underline"
            >
              Cancel
            </button>
          </div>

          <form onSubmit={handleCreateICP} className="space-y-4 text-xs">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="font-semibold text-foreground">ICP Name *</label>
                <input
                  type="text"
                  required
                  value={newICP.name}
                  onChange={(e) => setNewICP({ ...newICP, name: e.target.value })}
                  className="w-full h-8 rounded border border-border bg-background px-2.5 text-xs focus:ring-1 focus:ring-primary"
                />
              </div>
              <div className="space-y-1">
                <label className="font-semibold text-foreground">Target Company Size</label>
                <input
                  type="text"
                  value={newICP.companySize}
                  onChange={(e) => setNewICP({ ...newICP, companySize: e.target.value })}
                  className="w-full h-8 rounded border border-border bg-background px-2.5 text-xs focus:ring-1 focus:ring-primary"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="font-semibold text-foreground">Target Industries (comma separated)</label>
                <input
                  type="text"
                  value={newICP.industries?.join(", ")}
                  onChange={(e) =>
                    setNewICP({
                      ...newICP,
                      industries: e.target.value.split(",").map((s) => s.trim()),
                    })
                  }
                  className="w-full h-8 rounded border border-border bg-background px-2.5 text-xs focus:ring-1 focus:ring-primary"
                />
              </div>
              <div className="space-y-1">
                <label className="font-semibold text-foreground">Target Geographies (comma separated)</label>
                <input
                  type="text"
                  value={newICP.geography?.join(", ")}
                  onChange={(e) =>
                    setNewICP({
                      ...newICP,
                      geography: e.target.value.split(",").map((s) => s.trim()),
                    })
                  }
                  className="w-full h-8 rounded border border-border bg-background px-2.5 text-xs focus:ring-1 focus:ring-primary"
                />
              </div>
            </div>

            <div className="space-y-1">
              <label className="font-semibold text-foreground">Positive Signals & Qualification Criteria</label>
              <textarea
                rows={2}
                value={newICP.positiveCriteria?.join("\n")}
                onChange={(e) =>
                  setNewICP({
                    ...newICP,
                    positiveCriteria: e.target.value.split("\n").filter((s) => s.trim()),
                  })
                }
                placeholder="One criterion per line..."
                className="w-full rounded border border-border bg-background p-2 text-xs focus:ring-1 focus:ring-primary"
              />
            </div>

            <div className="space-y-1">
              <label className="font-semibold text-foreground">Hard Exclusion Criteria (Disqualifiers)</label>
              <textarea
                rows={2}
                value={newICP.exclusionCriteria?.join("\n")}
                onChange={(e) =>
                  setNewICP({
                    ...newICP,
                    exclusionCriteria: e.target.value.split("\n").filter((s) => s.trim()),
                  })
                }
                placeholder="One disqualifier per line..."
                className="w-full rounded border border-border bg-background p-2 text-xs focus:ring-1 focus:ring-primary"
              />
            </div>

            <div className="flex justify-end gap-2.5 pt-3 border-t border-border">
              <button
                type="button"
                onClick={() => setIsCreating(false)}
                className="px-3 py-1.5 rounded border border-border text-foreground hover:bg-muted"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-1.5 rounded bg-primary text-primary-foreground font-semibold hover:bg-primary/90"
              >
                Save & Confirm ICP
              </button>
            </div>
          </form>
        </div>
      ) : (
        /* Structured ICP Details View */
        <div className="space-y-6">
          {/* Header Card */}
          <div className="p-5 rounded-xl border border-border bg-card flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <h3 className="font-bold text-lg text-foreground">{currentICP.name}</h3>
                <StatusBadge status={currentICP.status} />
              </div>
              <p className="text-xs text-muted-foreground">
                Mapped to product:{" "}
                <span className="font-semibold text-foreground">
                  {products.find((p) => p.id === currentICP.productId)?.name || "Current Product"}
                </span>{" "}
                • Updated: {currentICP.updatedAt}
              </p>
            </div>

            <div className="flex items-center gap-2.5">
              <button
                onClick={() => handleToggleConfirmStatus(currentICP)}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition-colors ${
                  currentICP.status === "confirmed"
                    ? "border-emerald-200 bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300"
                    : "border-border bg-muted text-foreground"
                }`}
              >
                {currentICP.status === "confirmed" ? "Status: Confirmed" : "Review & Confirm"}
              </button>
              {onNavigateToDiscovery && (
                <button
                  onClick={() => onNavigateToDiscovery(currentICP.productId, currentICP.id)}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-primary text-primary-foreground text-xs font-semibold hover:bg-primary/90 shadow-xs"
                >
                  <span>Launch Discovery</span>
                  <ArrowRight className="h-3.5 w-3.5" />
                </button>
              )}
            </div>
          </div>

          {/* ICP Details 3-Column Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Column 1: Firmographics */}
            <div className="rounded-xl border border-border bg-card p-5 space-y-4 text-xs">
              <h4 className="font-bold text-sm text-foreground flex items-center gap-1.5 border-b border-border/60 pb-2">
                <Building className="h-4 w-4 text-primary" />
                <span>Firmographics</span>
              </h4>
              <div className="space-y-3">
                <div>
                  <span className="text-[11px] text-muted-foreground font-medium block">Target Industries:</span>
                  <div className="flex flex-wrap gap-1 mt-1">
                    {currentICP.industries.map((ind, i) => (
                      <span key={i} className="px-2 py-0.5 rounded bg-muted text-foreground text-[11px] font-medium">
                        {ind}
                      </span>
                    ))}
                  </div>
                </div>
                <div>
                  <span className="text-[11px] text-muted-foreground font-medium block">Company Headcount:</span>
                  <span className="font-semibold text-foreground text-xs">{currentICP.companySize}</span>
                </div>
                <div>
                  <span className="text-[11px] text-muted-foreground font-medium block">Geography:</span>
                  <div className="flex flex-wrap gap-1 mt-1">
                    {currentICP.geography.map((geo, i) => (
                      <span key={i} className="px-2 py-0.5 rounded bg-muted text-foreground text-[11px] font-medium">
                        {geo}
                      </span>
                    ))}
                  </div>
                </div>
                <div>
                  <span className="text-[11px] text-muted-foreground font-medium block">Revenue Bracket:</span>
                  <span className="font-semibold text-foreground text-xs">{currentICP.revenueRange}</span>
                </div>
              </div>
            </div>

            {/* Column 2: Buyer Personas */}
            <div className="rounded-xl border border-border bg-card p-5 space-y-4 text-xs">
              <h4 className="font-bold text-sm text-foreground flex items-center gap-1.5 border-b border-border/60 pb-2">
                <UserCheck className="h-4 w-4 text-primary" />
                <span>Buyer Personas</span>
              </h4>
              <div className="space-y-3">
                {currentICP.personas.map((persona, idx) => (
                  <div key={idx} className="p-3 rounded-lg bg-muted/30 border border-border/60 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-foreground text-xs">{persona.title}</span>
                      <span className="text-[10px] font-medium px-1.5 py-0.5 rounded bg-muted text-muted-foreground">
                        {persona.seniority}
                      </span>
                    </div>
                    <div className="space-y-1">
                      <span className="text-[10px] uppercase font-semibold text-muted-foreground">Pain Points:</span>
                      <ul className="list-disc pl-4 space-y-0.5 text-[11px] text-muted-foreground">
                        {persona.painPoints.map((pp, i) => (
                          <li key={i}>{pp}</li>
                        ))}
                      </ul>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Column 3: Rules & Exclusions */}
            <div className="rounded-xl border border-border bg-card p-5 space-y-4 text-xs">
              <h4 className="font-bold text-sm text-foreground flex items-center gap-1.5 border-b border-border/60 pb-2">
                <Zap className="h-4 w-4 text-primary" />
                <span>Scoring Rules & Exclusions</span>
              </h4>
              <div className="space-y-3">
                <div>
                  <span className="text-[11px] text-emerald-600 dark:text-emerald-400 font-semibold block mb-1">
                    Must Match (Positive Criteria):
                  </span>
                  <ul className="space-y-1">
                    {currentICP.positiveCriteria.map((c, i) => (
                      <li key={i} className="flex items-start gap-1.5 text-[11px] text-foreground">
                        <CheckCircle2 className="h-3 w-3 text-emerald-500 shrink-0 mt-0.5" />
                        <span>{c}</span>
                      </li>
                    ))}
                  </ul>
                </div>
                <div className="pt-2 border-t border-border/50">
                  <span className="text-[11px] text-rose-600 dark:text-rose-400 font-semibold block mb-1">
                    Hard Exclusions (Auto-Reject):
                  </span>
                  <ul className="space-y-1">
                    {currentICP.exclusionCriteria.map((c, i) => (
                      <li key={i} className="flex items-start gap-1.5 text-[11px] text-muted-foreground">
                        <XCircle className="h-3 w-3 text-rose-500 shrink-0 mt-0.5" />
                        <span>{c}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
