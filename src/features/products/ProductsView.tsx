import React, { useState } from "react";
import { useAppStore, actions } from "@/hooks/use-store";
import { PageHeader, StatusBadge, EmptyState } from "@/components/common";
import type { Product, ProductStatus } from "@/types";
import {
  Package,
  Plus,
  Search,
  Edit2,
  Trash2,
  Check,
  X,
  Layers,
  Sparkles,
  Tag,
  DollarSign,
  Briefcase,
  AlertCircle,
} from "lucide-react";

interface ProductsViewProps {
  onSelectProductForOutreach?: (productId: string) => void;
  onNavigateToICP?: (productId: string) => void;
}

export function ProductsView({ onSelectProductForOutreach, onNavigateToICP }: ProductsViewProps) {
  const products = useAppStore((s) => s.products);
  const [search, setSearch] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  // Form State
  const [formData, setFormData] = useState<Partial<Product>>({
    name: "",
    description: "",
    category: "Software",
    status: "active",
    valueProposition: "",
    customerProblem: "",
    pricing: "",
    features: [],
    differentiators: [],
    targetIndustries: [],
    useCases: [],
  });
  const [featureInput, setFeatureInput] = useState("");
  const [diffInput, setDiffInput] = useState("");
  const [industryInput, setIndustryInput] = useState("");

  const categories = ["all", ...Array.from(new Set(products.map((p) => p.category)))];

  const filteredProducts = products.filter((p) => {
    const matchesSearch =
      p.name.toLowerCase().includes(search.toLowerCase()) ||
      p.description.toLowerCase().includes(search.toLowerCase());
    const matchesCat = selectedCategory === "all" || p.category === selectedCategory;
    return matchesSearch && matchesCat;
  });

  const handleOpenEdit = (p: Product) => {
    setEditingProduct(p);
    setFormData({ ...p });
    setIsCreating(false);
  };

  const handleOpenCreate = () => {
    setEditingProduct(null);
    setFormData({
      name: "",
      description: "",
      category: "B2B SaaS",
      status: "active",
      valueProposition: "",
      customerProblem: "",
      pricing: "$499/mo",
      features: ["Local Inference Engine", "Automated Outreach"],
      differentiators: ["100% Offline & Private"],
      targetIndustries: ["SaaS", "Fintech", "Healthcare"],
      useCases: ["Outbound Sales Automation"],
    });
    setIsCreating(true);
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name?.trim()) return;

    actions.saveProduct({
      id: editingProduct?.id,
      name: formData.name || "Untitled Product",
      description: formData.description || "",
      category: formData.category || "General",
      status: (formData.status as ProductStatus) || "active",
      features: formData.features || [],
      valueProposition: formData.valueProposition || "",
      customerProblem: formData.customerProblem || "",
      differentiators: formData.differentiators || [],
      pricing: formData.pricing || "Custom",
      targetIndustries: formData.targetIndustries || [],
      useCases: formData.useCases || [],
    });

    setIsCreating(false);
    setEditingProduct(null);
  };

  const handleDelete = (id: string) => {
    actions.deleteProduct(id);
    setDeletingId(null);
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Product Catalog & Positioning"
        description="Configure multiple products, pricing models, value propositions, and differentiators to drive tailored outreach."
      >
        <button
          onClick={handleOpenCreate}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-primary text-primary-foreground text-xs font-semibold hover:bg-primary/90 transition-colors shadow-xs"
        >
          <Plus className="h-4 w-4" />
          <span>New Product</span>
        </button>
      </PageHeader>

      {/* Filter & Search Bar */}
      <div className="flex flex-col sm:flex-row gap-3 items-center justify-between">
        <div className="relative w-full sm:w-72">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
          <input
            type="text"
            placeholder="Search products..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full h-9 rounded-lg border border-border bg-card pl-9 pr-4 text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary"
          />
        </div>

        <div className="flex items-center gap-2 overflow-x-auto w-full sm:w-auto">
          {categories.map((c) => (
            <button
              key={c}
              onClick={() => setSelectedCategory(c)}
              className={`px-3 py-1 rounded-md text-xs font-medium capitalize whitespace-nowrap transition-colors ${
                selectedCategory === c
                  ? "bg-primary text-primary-foreground font-semibold"
                  : "bg-muted text-muted-foreground hover:bg-accent hover:text-foreground"
              }`}
            >
              {c}
            </button>
          ))}
        </div>
      </div>

      {/* Product Grid */}
      {filteredProducts.length === 0 ? (
        <EmptyState
          icon={Package}
          title="No Products Found"
          description="Create your first product definition to begin profiling prospects and tailoring outbound sales."
          action={
            <button
              onClick={handleOpenCreate}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-primary text-primary-foreground text-xs font-semibold"
            >
              <Plus className="h-4 w-4" /> Add Product
            </button>
          }
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredProducts.map((p) => (
            <div
              key={p.id}
              className="rounded-xl border border-border/80 bg-card p-5 text-card-foreground shadow-xs hover:border-border transition-all flex flex-col justify-between"
            >
              <div className="space-y-3">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <h3 className="font-bold text-base text-foreground leading-snug">{p.name}</h3>
                    <span className="text-[11px] text-muted-foreground font-medium inline-block mt-0.5">
                      {p.category}
                    </span>
                  </div>
                  <StatusBadge status={p.status} />
                </div>

                <p className="text-xs text-muted-foreground line-clamp-2 leading-relaxed">{p.description}</p>

                {/* Key Pillars */}
                <div className="space-y-2 pt-2 border-t border-border/50 text-xs">
                  <div className="flex items-center gap-1.5 text-muted-foreground">
                    <DollarSign className="h-3.5 w-3.5 text-primary shrink-0" />
                    <span className="font-semibold text-foreground">{p.pricing}</span>
                  </div>
                  <div className="space-y-1">
                    <span className="text-[11px] text-muted-foreground font-medium uppercase tracking-wider">
                      Core Value Prop:
                    </span>
                    <p className="text-xs text-foreground bg-muted/40 p-2 rounded-md italic">
                      "{p.valueProposition}"
                    </p>
                  </div>

                  {/* Feature Tags */}
                  <div className="flex flex-wrap gap-1.5 pt-1">
                    {p.features.slice(0, 3).map((f, i) => (
                      <span
                        key={i}
                        className="px-2 py-0.5 rounded text-[10px] font-medium bg-muted text-muted-foreground"
                      >
                        {f}
                      </span>
                    ))}
                    {p.features.length > 3 && (
                      <span className="text-[10px] text-muted-foreground self-center">
                        +{p.features.length - 3} more
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {/* Action Bar */}
              <div className="flex items-center justify-between pt-4 mt-4 border-t border-border/60 text-xs">
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleOpenEdit(p)}
                    className="p-1.5 rounded hover:bg-muted text-muted-foreground hover:text-foreground"
                    title="Edit Product"
                  >
                    <Edit2 className="h-3.5 w-3.5" />
                  </button>
                  <button
                    onClick={() => setDeletingId(p.id)}
                    className="p-1.5 rounded hover:bg-rose-50 hover:text-rose-600 text-muted-foreground"
                    title="Delete Product"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
                {onNavigateToICP && (
                  <button
                    onClick={() => onNavigateToICP(p.id)}
                    className="text-xs text-primary font-medium hover:underline inline-flex items-center gap-1"
                  >
                    Build ICP &rarr;
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Create / Edit Modal */}
      {(isCreating || editingProduct) && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-xs p-4 overflow-y-auto">
          <div className="w-full max-w-2xl rounded-xl border border-border bg-card p-6 shadow-xl space-y-5 my-8">
            <div className="flex items-center justify-between border-b border-border pb-3">
              <h2 className="text-lg font-bold text-foreground">
                {isCreating ? "Create New Product" : `Edit Product: ${editingProduct?.name}`}
              </h2>
              <button
                onClick={() => {
                  setIsCreating(false);
                  setEditingProduct(null);
                }}
                className="rounded p-1 text-muted-foreground hover:bg-muted"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <form onSubmit={handleSave} className="space-y-4 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="font-semibold text-foreground">Product Name *</label>
                  <input
                    type="text"
                    required
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full h-8 rounded border border-border bg-background px-2.5 text-xs focus:ring-1 focus:ring-primary"
                  />
                </div>
                <div className="space-y-1">
                  <label className="font-semibold text-foreground">Category</label>
                  <input
                    type="text"
                    value={formData.category}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                    className="w-full h-8 rounded border border-border bg-background px-2.5 text-xs focus:ring-1 focus:ring-primary"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="font-semibold text-foreground">Description</label>
                <textarea
                  rows={2}
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="w-full rounded border border-border bg-background p-2 text-xs focus:ring-1 focus:ring-primary"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="font-semibold text-foreground">Value Proposition</label>
                  <input
                    type="text"
                    value={formData.valueProposition}
                    onChange={(e) => setFormData({ ...formData, valueProposition: e.target.value })}
                    className="w-full h-8 rounded border border-border bg-background px-2.5 text-xs focus:ring-1 focus:ring-primary"
                  />
                </div>
                <div className="space-y-1">
                  <label className="font-semibold text-foreground">Pricing Structure</label>
                  <input
                    type="text"
                    value={formData.pricing}
                    onChange={(e) => setFormData({ ...formData, pricing: e.target.value })}
                    className="w-full h-8 rounded border border-border bg-background px-2.5 text-xs focus:ring-1 focus:ring-primary"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="font-semibold text-foreground">Core Customer Problem</label>
                <textarea
                  rows={2}
                  value={formData.customerProblem}
                  onChange={(e) => setFormData({ ...formData, customerProblem: e.target.value })}
                  className="w-full rounded border border-border bg-background p-2 text-xs focus:ring-1 focus:ring-primary"
                />
              </div>

              {/* Tag Inputs */}
              <div className="space-y-1">
                <label className="font-semibold text-foreground">Key Features</label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    placeholder="Add feature and press Add..."
                    value={featureInput}
                    onChange={(e) => setFeatureInput(e.target.value)}
                    className="flex-1 h-8 rounded border border-border bg-background px-2.5 text-xs"
                  />
                  <button
                    type="button"
                    onClick={() => {
                      if (!featureInput.trim()) return;
                      setFormData({
                        ...formData,
                        features: [...(formData.features || []), featureInput.trim()],
                      });
                      setFeatureInput("");
                    }}
                    className="px-3 h-8 bg-muted text-foreground rounded font-medium hover:bg-accent"
                  >
                    Add
                  </button>
                </div>
                <div className="flex flex-wrap gap-1.5 pt-1">
                  {formData.features?.map((f, i) => (
                    <span
                      key={i}
                      className="px-2 py-0.5 rounded bg-muted text-foreground flex items-center gap-1 text-[11px]"
                    >
                      {f}
                      <X
                        className="h-3 w-3 cursor-pointer"
                        onClick={() =>
                          setFormData({
                            ...formData,
                            features: formData.features?.filter((_, idx) => idx !== i),
                          })
                        }
                      />
                    </span>
                  ))}
                </div>
              </div>

              <div className="flex justify-end gap-2.5 pt-3 border-t border-border">
                <button
                  type="button"
                  onClick={() => {
                    setIsCreating(false);
                    setEditingProduct(null);
                  }}
                  className="px-3 py-1.5 rounded border border-border text-foreground hover:bg-muted"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 rounded bg-primary text-primary-foreground font-semibold hover:bg-primary/90 shadow-xs"
                >
                  Save Product
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Dialog */}
      {deletingId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-xs p-4">
          <div className="w-full max-w-sm rounded-xl border border-border bg-card p-5 shadow-xl space-y-4">
            <div className="flex items-center gap-2 text-rose-600">
              <AlertCircle className="h-5 w-5" />
              <h3 className="font-bold text-sm">Delete Product Confirmation</h3>
            </div>
            <p className="text-xs text-muted-foreground">
              Are you sure you want to delete this product? All associated ICP mappings and outreach templates will be unlinked.
            </p>
            <div className="flex justify-end gap-2">
              <button
                onClick={() => setDeletingId(null)}
                className="px-3 py-1.5 rounded border border-border text-xs text-foreground hover:bg-muted"
              >
                Cancel
              </button>
              <button
                onClick={() => handleDelete(deletingId)}
                className="px-3 py-1.5 rounded bg-rose-600 text-rose-50 text-xs font-semibold hover:bg-rose-700"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
