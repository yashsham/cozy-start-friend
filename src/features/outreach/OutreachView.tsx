import React, { useState } from "react";
import { useAppStore, actions } from "@/hooks/use-store";
import { PageHeader, StatusBadge, ScoreIndicator, PriorityIndicator } from "@/components/common";
import { api } from "@/services";
import type { OutreachDraft, Prospect, Product } from "@/types";
import {
  Send,
  Sparkles,
  Copy,
  Check,
  RotateCcw,
  Save,
  Building2,
  FileText,
  AlertCircle,
  HelpCircle,
  ShieldCheck,
  CheckCircle2,
} from "lucide-react";

interface OutreachViewProps {
  initialProspectId?: string;
  initialProductId?: string;
}

export function OutreachView({ initialProspectId, initialProductId }: OutreachViewProps) {
  const prospects = useAppStore((s) => s.prospects);
  const products = useAppStore((s) => s.products);
  const drafts = useAppStore((s) => s.drafts);
  const signals = useAppStore((s) => s.signals);

  const [selectedProductId, setSelectedProductId] = useState<string>(
    initialProductId || products[0]?.id || ""
  );
  const [selectedProspectId, setSelectedProspectId] = useState<string>(
    initialProspectId || prospects[0]?.id || ""
  );

  // Generation parameters
  const [objective, setObjective] = useState("Book a 15-min discovery call");
  const [tone, setTone] = useState("Direct & conversational, no AI buzzwords");
  const [length, setLength] = useState("Under 75 words (concise)");
  const [cta, setCta] = useState("Suggest specific times or send low-friction question");

  // Draft generation & editor state
  const [isGenerating, setIsGenerating] = useState(false);
  const [subject, setSubject] = useState("");
  const [body, setBody] = useState("");
  const [copied, setCopied] = useState(false);
  const [savedSuccess, setSavedSuccess] = useState(false);
  const [reviewState, setReviewState] = useState<"draft" | "reviewed">("draft");

  const currentProduct = products.find((p) => p.id === selectedProductId);
  const currentProspect = prospects.find((p) => p.id === selectedProspectId);
  const prospectSignals = signals.filter((s) => s.prospectId === selectedProspectId);

  // Keep selection synced when products/prospects load
  React.useEffect(() => {
    if (!selectedProductId && products.length > 0) {
      setSelectedProductId(initialProductId || products[0].id);
    }
  }, [products, selectedProductId, initialProductId]);

  React.useEffect(() => {
    if (!selectedProspectId && prospects.length > 0) {
      setSelectedProspectId(initialProspectId || prospects[0].id);
    }
  }, [prospects, selectedProspectId, initialProspectId]);

  // Initialize draft if one exists for this prospect & product
  React.useEffect(() => {
    const existing = drafts.find(
      (d) => d.prospectId === selectedProspectId && d.productId === selectedProductId
    );
    if (existing) {
      setSubject(existing.subject);
      setBody(existing.body);
      setReviewState(existing.reviewState);
    } else {
      // Default template placeholder
      setSubject(`Quick observation regarding ${currentProspect?.company || "your team"}`);
      setBody(
        `Hi there,\n\nNoticed ${currentProspect?.company || "your team"} is expanding its ${currentProspect?.industry || "operations"}. Teams solving ${currentProduct?.customerProblem || "this challenge"} often experience significant efficiency bottlenecks.\n\nWe built ${currentProduct?.name || "our solution"} to deliver ${currentProduct?.valueProposition || "measurable ROI"}.\n\nWorth a brief 10-minute exchange this Thursday?\n\nBest,\nSales Team`
      );
      setReviewState("draft");
    }
  }, [selectedProspectId, selectedProductId, drafts, currentProspect, currentProduct]);

  const handleGenerateDraft = async () => {
    if (!currentProspect || !currentProduct) return;
    setIsGenerating(true);
    setSavedSuccess(false);

    try {
      const inputs = [
        `Company: ${currentProspect.company}`,
        `Industry: ${currentProspect.industry}`,
        `Verified Problem: ${currentProspect?.problems?.[0]?.problem || "Scaling bottlenecks"}`,
        `Product Value: ${currentProduct.valueProposition}`,
      ];

      const res = await api.generateDraft({
        prospect: currentProspect,
        productName: currentProduct.name,
        objective,
        tone,
        length,
        cta,
        inputs,
      });

      setSubject(res.subject);
      setBody(res.body);
      setReviewState("draft");
    } catch (err) {
      console.error("Draft generation failed:", err);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(`Subject: ${subject}\n\n${body}`);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleSaveDraft = () => {
    actions.saveDraft({
      prospectId: selectedProspectId,
      productId: selectedProductId,
      subject,
      body,
      objective,
      tone,
      reviewState,
      inputs: [`Product: ${currentProduct?.name}`, `Prospect: ${currentProspect?.company}`],
    });
    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 2500);
  };

  const wordCount = body.trim().split(/\s+/).filter(Boolean).length;
  const charCount = body.length;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Personalised Outreach Studio"
        description="Generate and refine bespoke, zero-fluff cold email sequences rooted in verified company signals and strict writing rules."
      />

      {/* Selectors Bar */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 p-4 rounded-xl border border-border bg-card">
        <div className="space-y-1">
          <label className="text-xs font-semibold text-foreground">Target Product:</label>
          <select
            value={selectedProductId}
            onChange={(e) => setSelectedProductId(e.target.value)}
            className="w-full h-8 rounded-lg border border-border bg-background px-3 text-xs font-medium text-foreground focus:ring-1 focus:ring-primary"
          >
            {products.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name} ({p.category})
              </option>
            ))}
          </select>
        </div>

        <div className="space-y-1">
          <label className="text-xs font-semibold text-foreground">Target Prospect Account:</label>
          <select
            value={selectedProspectId}
            onChange={(e) => setSelectedProspectId(e.target.value)}
            className="w-full h-8 rounded-lg border border-border bg-background px-3 text-xs font-medium text-foreground focus:ring-1 focus:ring-primary"
          >
            {prospects.map((p) => (
              <option key={p.id} value={p.id}>
                {p.company} ({p.location || "Global"}) - Fit: {p.productFit ?? (p as any).fitScore ?? 75}%
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* 2-Column Workspace: Left Context / Controls, Right Email Composer */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column (5 cols): Context & Guardrails */}
        <div className="lg:col-span-5 space-y-4 text-xs">
          {/* Prospect Facts & Inferred Signals */}
          <div className="rounded-xl border border-border bg-card p-5 space-y-3">
            <h4 className="font-bold text-sm text-foreground flex items-center gap-1.5 border-b border-border/60 pb-2">
              <Building2 className="h-4 w-4 text-primary" />
              <span>Context: {currentProspect?.company}</span>
            </h4>

            <div className="space-y-2">
              <div>
                <span className="text-[11px] text-muted-foreground font-medium block">Key Inferred Problem:</span>
                <p className="text-xs text-foreground bg-muted/40 p-2 rounded italic">
                  "{currentProspect?.problems?.[0]?.problem || "Operational scaling challenges"}"
                </p>
              </div>

              {prospectSignals.length > 0 && (
                <div>
                  <span className="text-[11px] text-muted-foreground font-medium block mb-1">
                    Verified Buying Signals:
                  </span>
                  <div className="space-y-1">
                    {prospectSignals.slice(0, 2).map((s) => (
                      <div key={s.id} className="p-2 rounded bg-primary/5 border border-primary/20 text-[11px]">
                        <span className="font-semibold text-foreground">{s.title}:</span> {s.description}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Prompt Tone & Constraints Controls */}
          <div className="rounded-xl border border-border bg-card p-5 space-y-3">
            <h4 className="font-bold text-sm text-foreground border-b border-border/60 pb-2">
              Outreach Instructions
            </h4>

            <div className="space-y-3">
              <div className="space-y-1">
                <label className="font-semibold text-foreground">Objective</label>
                <input
                  type="text"
                  value={objective}
                  onChange={(e) => setObjective(e.target.value)}
                  className="w-full h-8 rounded border border-border bg-background px-2.5 text-xs"
                />
              </div>

              <div className="space-y-1">
                <label className="font-semibold text-foreground">Writing Tone</label>
                <input
                  type="text"
                  value={tone}
                  onChange={(e) => setTone(e.target.value)}
                  className="w-full h-8 rounded border border-border bg-background px-2.5 text-xs"
                />
              </div>

              <div className="space-y-1">
                <label className="font-semibold text-foreground">Length Limit</label>
                <input
                  type="text"
                  value={length}
                  onChange={(e) => setLength(e.target.value)}
                  className="w-full h-8 rounded border border-border bg-background px-2.5 text-xs"
                />
              </div>

              <div className="space-y-1">
                <label className="font-semibold text-foreground">Call to Action (CTA)</label>
                <input
                  type="text"
                  value={cta}
                  onChange={(e) => setCta(e.target.value)}
                  className="w-full h-8 rounded border border-border bg-background px-2.5 text-xs"
                />
              </div>

              <button
                disabled={isGenerating}
                onClick={handleGenerateDraft}
                className="w-full h-9 rounded-lg bg-primary text-primary-foreground font-semibold flex items-center justify-center gap-2 hover:bg-primary/90 transition-colors shadow-xs disabled:opacity-50 mt-2"
              >
                <Sparkles className="h-4 w-4" />
                <span>{isGenerating ? "Synthesizing with Qwen..." : "Generate AI Draft"}</span>
              </button>
            </div>
          </div>
        </div>

        {/* Right Column (7 cols): Email Composer & Review Studio */}
        <div className="lg:col-span-7 rounded-xl border border-border bg-card p-6 shadow-xs flex flex-col justify-between space-y-4">
          <div className="space-y-4">
            <div className="flex items-center justify-between border-b border-border pb-3">
              <div>
                <h3 className="font-bold text-base text-foreground">Email Draft Editor</h3>
                <span className="text-xs text-muted-foreground">
                  Step 1 of 3: Personalized First-Touch Outreach
                </span>
              </div>
              <div className="flex items-center gap-2">
                <span
                  className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded border ${
                    reviewState === "reviewed"
                      ? "bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300"
                      : "bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/40 dark:text-amber-300"
                  }`}
                >
                  {reviewState === "reviewed" ? "Human Reviewed" : "Draft (Pending Review)"}
                </span>
              </div>
            </div>

            {/* Subject Line Input */}
            <div className="space-y-1.5 text-xs">
              <label className="font-semibold text-foreground">Subject Line</label>
              <input
                type="text"
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                className="w-full h-9 rounded-lg border border-border bg-background px-3 text-xs font-semibold text-foreground focus:ring-1 focus:ring-primary"
              />
            </div>

            {/* Email Body Textarea */}
            <div className="space-y-1.5 text-xs">
              <div className="flex items-center justify-between">
                <label className="font-semibold text-foreground">Email Body</label>
                <span className="text-[11px] text-muted-foreground">
                  {wordCount} words • {charCount} chars
                </span>
              </div>
              <textarea
                rows={10}
                value={body}
                onChange={(e) => setBody(e.target.value)}
                className="w-full rounded-lg border border-border bg-background p-3 text-xs leading-relaxed font-sans text-foreground focus:ring-1 focus:ring-primary focus:outline-none"
              />
            </div>

            {/* Deterministic Pre-Send Gate Info */}
            <div className="p-3 rounded-lg bg-muted/40 border border-border/60 text-[11px] text-muted-foreground space-y-1">
              <div className="flex items-center gap-1 font-semibold text-foreground">
                <ShieldCheck className="h-3.5 w-3.5 text-emerald-600 dark:text-emerald-400" />
                <span>Deterministic Pre-Send Safety Gate Active</span>
              </div>
              <p>
                Checks against spam trigger words, unrendered `&#123;&#123;tags&#125;&#125;`, word ceilings (&lt; 220 words), and link limits before dispatch.
              </p>
            </div>
          </div>

          {/* Footer Action Controls */}
          <div className="flex flex-wrap items-center justify-between gap-3 pt-4 border-t border-border text-xs">
            <div className="flex items-center gap-2">
              <button
                onClick={handleCopy}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-border bg-card text-foreground font-medium hover:bg-muted"
              >
                {copied ? <Check className="h-3.5 w-3.5 text-emerald-500" /> : <Copy className="h-3.5 w-3.5" />}
                <span>{copied ? "Copied" : "Copy"}</span>
              </button>
              <button
                onClick={() => setReviewState(reviewState === "draft" ? "reviewed" : "draft")}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-border bg-card text-foreground font-medium hover:bg-muted"
              >
                <CheckCircle2 className="h-3.5 w-3.5" />
                <span>{reviewState === "reviewed" ? "Mark as Draft" : "Mark Reviewed"}</span>
              </button>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={handleSaveDraft}
                className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-lg bg-primary text-primary-foreground font-semibold hover:bg-primary/90 shadow-xs"
              >
                <Save className="h-3.5 w-3.5" />
                <span>{savedSuccess ? "Saved!" : "Save Draft"}</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
