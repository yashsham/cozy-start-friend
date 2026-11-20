import React, { useState } from "react";
import { useAppStore, actions } from "@/hooks/use-store";
import {
  PageHeader,
  StatusBadge,
  ScoreIndicator,
  PriorityIndicator,
  EmptyState,
} from "@/components/common";
import { ProspectDetailModal } from "./ProspectDetailModal";
import type { Prospect, ProspectStatus } from "@/types";
import {
  Users,
  Search,
  Filter,
  CheckCircle2,
  XCircle,
  Trash2,
  LayoutGrid,
  List,
  ExternalLink,
  ChevronLeft,
  ChevronRight,
  ArrowUpDown,
  Compass,
} from "lucide-react";

interface ProspectsViewProps {
  onNavigateToDiscovery?: () => void;
  onNavigateToOutreach?: (prospectId: string) => void;
}

export function ProspectsView({
  onNavigateToDiscovery,
  onNavigateToOutreach,
}: ProspectsViewProps) {
  const prospects = useAppStore((s) => s.prospects);
  const products = useAppStore((s) => s.products);

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [productFilter, setProductFilter] = useState<string>("all");
  const [viewMode, setViewMode] = useState<"table" | "grid">("table");
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [selectedProspect, setSelectedProspect] = useState<Prospect | null>(null);

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 8;

  // Filter prospects
  const filtered = prospects.filter((p) => {
    const matchesSearch =
      p.company.toLowerCase().includes(search.toLowerCase()) ||
      p.industry.toLowerCase().includes(search.toLowerCase()) ||
      p.location.toLowerCase().includes(search.toLowerCase());
    const matchesStatus = statusFilter === "all" || p.status === statusFilter;
    const matchesProduct = productFilter === "all" || p.productId === productFilter;
    return matchesSearch && matchesStatus && matchesProduct;
  });

  const totalPages = Math.ceil(filtered.length / pageSize) || 1;
  const paginated = filtered.slice((currentPage - 1) * pageSize, currentPage * pageSize);

  // Bulk actions
  const handleSelectAll = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.checked) {
      setSelectedIds(paginated.map((p) => p.id));
    } else {
      setSelectedIds([]);
    }
  };

  const handleToggleSelect = (id: string) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  };

  const handleBulkStatusChange = (status: ProspectStatus) => {
    actions.setProspectStatus(selectedIds, status);
    setSelectedIds([]);
  };

  const handleBulkDelete = () => {
    actions.deleteProspects(selectedIds);
    setSelectedIds([]);
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Prospect Intelligence & CRM"
        description="Filter, qualify, and review prospect accounts discovered from public-web signals and mapped against your product ICPs."
      >
        {onNavigateToDiscovery && (
          <button
            onClick={onNavigateToDiscovery}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-primary text-primary-foreground text-xs font-semibold hover:bg-primary/90 transition-colors shadow-xs"
          >
            <Compass className="h-4 w-4" />
            <span>Discover More</span>
          </button>
        )}
      </PageHeader>

      {/* Control Bar: Search, Filters & View Toggle */}
      <div className="flex flex-col md:flex-row gap-3 items-center justify-between">
        <div className="flex flex-wrap items-center gap-2.5 w-full md:w-auto">
          {/* Search */}
          <div className="relative w-full sm:w-64">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
            <input
              type="text"
              placeholder="Search companies, locations..."
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full h-9 rounded-lg border border-border bg-card pl-9 pr-4 text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary"
            />
          </div>

          {/* Status Filter */}
          <select
            value={statusFilter}
            onChange={(e) => {
              setStatusFilter(e.target.value);
              setCurrentPage(1);
            }}
            className="h-9 rounded-lg border border-border bg-card px-3 text-xs font-medium text-foreground focus:ring-1 focus:ring-primary"
          >
            <option value="all">All Statuses</option>
            <option value="unresearched">Unresearched</option>
            <option value="researched">Researched</option>
            <option value="qualified">Qualified</option>
            <option value="rejected">Rejected</option>
          </select>

          {/* Product Filter */}
          <select
            value={productFilter}
            onChange={(e) => {
              setProductFilter(e.target.value);
              setCurrentPage(1);
            }}
            className="h-9 rounded-lg border border-border bg-card px-3 text-xs font-medium text-foreground focus:ring-1 focus:ring-primary"
          >
            <option value="all">All Products</option>
            {products.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name}
              </option>
            ))}
          </select>
        </div>

        {/* View Mode Toggle */}
        <div className="flex items-center gap-1 bg-muted/60 p-1 rounded-lg border border-border self-end md:self-auto">
          <button
            onClick={() => setViewMode("table")}
            className={`p-1.5 rounded text-xs transition-colors ${
              viewMode === "table" ? "bg-background text-foreground shadow-xs" : "text-muted-foreground"
            }`}
            title="Table View"
          >
            <List className="h-4 w-4" />
          </button>
          <button
            onClick={() => setViewMode("grid")}
            className={`p-1.5 rounded text-xs transition-colors ${
              viewMode === "grid" ? "bg-background text-foreground shadow-xs" : "text-muted-foreground"
            }`}
            title="Card Grid View"
          >
            <LayoutGrid className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* Bulk Action Bar (when rows selected) */}
      {selectedIds.length > 0 && (
        <div className="flex items-center justify-between p-3 rounded-lg border border-primary/30 bg-primary/5 text-xs">
          <span className="font-semibold text-foreground">
            {selectedIds.length} prospect{selectedIds.length > 1 ? "s" : ""} selected
          </span>
          <div className="flex items-center gap-2">
            <button
              onClick={() => handleBulkStatusChange("qualified")}
              className="inline-flex items-center gap-1 px-2.5 py-1 rounded bg-emerald-600 text-emerald-50 text-xs font-semibold hover:bg-emerald-700"
            >
              <CheckCircle2 className="h-3.5 w-3.5" /> Mark Qualified
            </button>
            <button
              onClick={() => handleBulkStatusChange("rejected")}
              className="inline-flex items-center gap-1 px-2.5 py-1 rounded bg-rose-600 text-rose-50 text-xs font-semibold hover:bg-rose-700"
            >
              <XCircle className="h-3.5 w-3.5" /> Mark Rejected
            </button>
            <button
              onClick={handleBulkDelete}
              className="p-1.5 rounded hover:bg-rose-100 text-rose-600 dark:hover:bg-rose-950"
              title="Delete Selected"
            >
              <Trash2 className="h-4 w-4" />
            </button>
          </div>
        </div>
      )}

      {/* Main Content Area: Table or Grid */}
      {paginated.length === 0 ? (
        <EmptyState
          icon={Users}
          title="No Matching Prospects"
          description="Adjust your search filters or launch a new discovery run to discover businesses."
          action={
            onNavigateToDiscovery ? (
              <button
                onClick={onNavigateToDiscovery}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-primary text-primary-foreground text-xs font-semibold"
              >
                <Compass className="h-4 w-4" /> Discover Prospects
              </button>
            ) : undefined
          }
        />
      ) : viewMode === "table" ? (
        /* TABLE VIEW */
        <div className="rounded-xl border border-border bg-card overflow-hidden shadow-xs">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-muted/40 border-b border-border text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">
                <tr>
                  <th className="p-3 w-10">
                    <input
                      type="checkbox"
                      onChange={handleSelectAll}
                      checked={selectedIds.length === paginated.length && paginated.length > 0}
                      className="rounded border-border"
                    />
                  </th>
                  <th className="p-3">Company</th>
                  <th className="p-3">Industry / Size</th>
                  <th className="p-3">Location</th>
                  <th className="p-3">Product Fit</th>
                  <th className="p-3">ICP Match</th>
                  <th className="p-3">Priority</th>
                  <th className="p-3">Status</th>
                  <th className="p-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/60">
                {paginated.map((p) => {
                  const isChecked = selectedIds.includes(p.id);
                  return (
                    <tr
                      key={p.id}
                      className={`hover:bg-muted/30 transition-colors cursor-pointer ${
                        isChecked ? "bg-muted/40" : ""
                      }`}
                      onClick={() => setSelectedProspect(p)}
                    >
                      <td className="p-3" onClick={(e) => e.stopPropagation()}>
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={() => handleToggleSelect(p.id)}
                          className="rounded border-border"
                        />
                      </td>
                      <td className="p-3">
                        <div className="font-bold text-foreground hover:text-primary transition-colors">
                          {p.company}
                        </div>
                        <span className="text-[11px] text-muted-foreground block mt-0.5">{p.website}</span>
                      </td>
                      <td className="p-3 text-muted-foreground">
                        <div>{p.industry}</div>
                        <span className="text-[10px]">{p.size}</span>
                      </td>
                      <td className="p-3 text-muted-foreground">{p.location}</td>
                      <td className="p-3">
                        <ScoreIndicator score={p.productFit} />
                      </td>
                      <td className="p-3">
                        <ScoreIndicator score={p.icpMatch} />
                      </td>
                      <td className="p-3">
                        <PriorityIndicator priority={p.priority} />
                      </td>
                      <td className="p-3">
                        <StatusBadge status={p.status} />
                      </td>
                      <td className="p-3 text-right" onClick={(e) => e.stopPropagation()}>
                        <button
                          onClick={() => setSelectedProspect(p)}
                          className="text-xs text-primary font-medium hover:underline mr-2"
                        >
                          Details
                        </button>
                        {onNavigateToOutreach && (
                          <button
                            onClick={() => onNavigateToOutreach(p.id)}
                            className="text-xs text-foreground font-semibold hover:text-primary"
                          >
                            Outreach &rarr;
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Pagination Controls */}
          <div className="flex items-center justify-between p-3 border-t border-border text-xs text-muted-foreground">
            <span>
              Showing {(currentPage - 1) * pageSize + 1} -{" "}
              {Math.min(currentPage * pageSize, filtered.length)} of {filtered.length} prospects
            </span>
            <div className="flex items-center gap-2">
              <button
                disabled={currentPage <= 1}
                onClick={() => setCurrentPage((p) => Math.max(p - 1, 1))}
                className="p-1 rounded border border-border disabled:opacity-40 hover:bg-muted"
              >
                <ChevronLeft className="h-4 w-4" />
              </button>
              <span className="font-medium text-foreground">
                {currentPage} / {totalPages}
              </span>
              <button
                disabled={currentPage >= totalPages}
                onClick={() => setCurrentPage((p) => Math.min(p + 1, totalPages))}
                className="p-1 rounded border border-border disabled:opacity-40 hover:bg-muted"
              >
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>
          </div>
        </div>
      ) : (
        /* GRID VIEW */
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {paginated.map((p) => (
            <div
              key={p.id}
              onClick={() => setSelectedProspect(p)}
              className="rounded-xl border border-border bg-card p-4 space-y-3 cursor-pointer hover:border-border/80 transition-all shadow-xs"
            >
              <div className="flex items-start justify-between gap-2">
                <div>
                  <h4 className="font-bold text-sm text-foreground">{p.company}</h4>
                  <span className="text-[11px] text-muted-foreground">{p.website}</span>
                </div>
                <StatusBadge status={p.status} />
              </div>

              <div className="text-xs text-muted-foreground line-clamp-2">{p.description}</div>

              <div className="grid grid-cols-2 gap-2 pt-2 border-t border-border/50 text-[11px]">
                <div>
                  <span className="text-muted-foreground block">Product Fit:</span>
                  <ScoreIndicator score={p.productFit} />
                </div>
                <div>
                  <span className="text-muted-foreground block">Priority:</span>
                  <PriorityIndicator priority={p.priority} />
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Prospect Detail Modal */}
      {selectedProspect && (
        <ProspectDetailModal
          prospect={selectedProspect}
          onClose={() => setSelectedProspect(null)}
          onNavigateToOutreach={onNavigateToOutreach}
        />
      )}
    </div>
  );
}
