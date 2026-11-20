import React, { useState } from "react";
import { useAppStore, actions } from "@/hooks/use-store";
import { PageHeader, StatusBadge, PriorityIndicator } from "@/components/common";
import { api } from "@/services";
import type { Conversation, EmailMessage, ReplyAnalysis } from "@/types";
import {
  MessageSquareCode,
  Sparkles,
  ArrowRight,
  CheckCircle2,
  AlertCircle,
  HelpCircle,
  Send,
  CornerDownRight,
  Mail,
  User,
  Clock,
} from "lucide-react";

export function RepliesView() {
  const conversations = useAppStore((s) => s.conversations);
  const prospects = useAppStore((s) => s.prospects);

  const [selectedConvoId, setSelectedConvoId] = useState<string>(
    conversations[0]?.id || ""
  );
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  const currentConvo = conversations.find((c) => c.id === selectedConvoId) || conversations[0];
  const prospect = prospects.find((p) => p.id === currentConvo?.prospectId);

  const handleRunAnalysis = async () => {
    if (!currentConvo) return;
    setIsAnalyzing(true);
    try {
      const analysis = await api.analyzeReply(currentConvo.messages);
      const updated: Conversation = { ...currentConvo, analysis };
      actions.upsertConversation(updated);
    } catch (err) {
      console.error("Reply analysis failed:", err);
    } finally {
      setIsAnalyzing(false);
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Reply Triage & Intelligence"
        description="Autonomous inbound reply intent classification, objection extraction, sentiment analysis, and response recommendation."
      />

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left List of Conversations (4 cols) */}
        <div className="lg:col-span-4 space-y-3">
          <div className="flex items-center justify-between text-xs pb-1 border-b border-border/60">
            <span className="font-semibold text-foreground">Inbound Threads ({conversations.length})</span>
            <span className="text-muted-foreground text-[10px]">Auto-Ingested</span>
          </div>

          <div className="space-y-2">
            {conversations.map((c) => {
              const cp = prospects.find((p) => p.id === c.prospectId);
              const isSelected = c.id === currentConvo?.id;
              const lastMsg = c.messages[c.messages.length - 1];

              return (
                <div
                  key={c.id}
                  onClick={() => setSelectedConvoId(c.id)}
                  className={`p-3.5 rounded-xl border bg-card transition-all cursor-pointer text-xs space-y-1.5 shadow-xs ${
                    isSelected ? "border-primary ring-1 ring-primary/30" : "border-border/80 hover:border-border"
                  }`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <span className="font-bold text-foreground truncate">{cp?.company || "Prospect"}</span>
                    {c.analysis ? (
                      <span className="capitalize text-[10px] font-semibold px-1.5 py-0.2 rounded bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300">
                        {c.analysis.intent.replace("_", " ")}
                      </span>
                    ) : (
                      <span className="text-[10px] text-amber-600 dark:text-amber-400 font-semibold">Pending</span>
                    )}
                  </div>

                  <p className="font-medium text-foreground text-[11px] truncate">{c.subject}</p>
                  <p className="text-[11px] text-muted-foreground line-clamp-1 italic">
                    "{lastMsg?.body || "Empty thread"}"
                  </p>
                </div>
              );
            })}
          </div>
        </div>

        {/* Right Detail Pane: Message History & Structured Analysis (8 cols) */}
        <div className="lg:col-span-8 space-y-5">
          {!currentConvo ? (
            <div className="rounded-xl border border-dashed border-border p-12 text-center text-muted-foreground text-xs">
              Select an email conversation on the left to inspect reply intelligence.
            </div>
          ) : (
            <>
              {/* Thread Box */}
              <div className="rounded-xl border border-border bg-card p-5 space-y-4">
                <div className="flex items-start justify-between border-b border-border/60 pb-3">
                  <div>
                    <h3 className="font-bold text-base text-foreground">{currentConvo.subject}</h3>
                    <span className="text-xs text-muted-foreground">
                      Thread with:{" "}
                      <span className="font-semibold text-foreground">{prospect?.company || "Prospect"}</span> (
                      {currentConvo.messages.length} messages)
                    </span>
                  </div>
                  <button
                    disabled={isAnalyzing}
                    onClick={handleRunAnalysis}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-primary text-primary-foreground text-xs font-semibold hover:bg-primary/90 transition-colors shadow-xs disabled:opacity-50"
                  >
                    <Sparkles className="h-3.5 w-3.5" />
                    <span>{isAnalyzing ? "Analyzing..." : "Re-Analyze Intent"}</span>
                  </button>
                </div>

                {/* Email Messages */}
                <div className="space-y-3">
                  {currentConvo.messages.map((m, idx) => (
                    <div
                      key={idx}
                      className={`p-3.5 rounded-lg border text-xs space-y-1.5 ${
                        m.from.includes("@")
                          ? "bg-muted/30 border-border/70"
                          : "bg-primary/5 border-primary/20"
                      }`}
                    >
                      <div className="flex items-center justify-between text-[11px] text-muted-foreground">
                        <span className="font-semibold text-foreground flex items-center gap-1">
                          <User className="h-3 w-3" /> {m.from}
                        </span>
                        <span className="flex items-center gap-1">
                          <Clock className="h-3 w-3" /> {m.date}
                        </span>
                      </div>
                      <p className="text-foreground leading-relaxed whitespace-pre-wrap">{m.body}</p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Structured AI Reply Analysis Panel */}
              {currentConvo.analysis && (
                <div className="rounded-xl border border-border bg-card p-5 space-y-4 text-xs">
                  <div className="flex items-center justify-between border-b border-border/60 pb-3">
                    <h4 className="font-bold text-sm text-foreground flex items-center gap-2">
                      <Sparkles className="h-4 w-4 text-primary" />
                      <span>Classified Reply Intelligence</span>
                    </h4>
                    <span className="text-[10px] text-muted-foreground">
                      Evaluated: {new Date(currentConvo.analysis.analyzedAt).toLocaleDateString()}
                    </span>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    <div className="p-3 rounded-lg bg-muted/40 border border-border/60">
                      <span className="text-[10px] uppercase font-semibold text-muted-foreground">Intent</span>
                      <div className="font-bold text-foreground text-sm capitalize mt-0.5">
                        {currentConvo.analysis.intent.replace("_", " ")}
                      </div>
                    </div>
                    <div className="p-3 rounded-lg bg-muted/40 border border-border/60">
                      <span className="text-[10px] uppercase font-semibold text-muted-foreground">Sentiment</span>
                      <div className="font-bold text-foreground text-sm capitalize mt-0.5">
                        {currentConvo.analysis.sentiment}
                      </div>
                    </div>
                    <div className="p-3 rounded-lg bg-muted/40 border border-border/60">
                      <span className="text-[10px] uppercase font-semibold text-muted-foreground">Interest Level</span>
                      <div className="font-bold text-foreground text-sm mt-0.5">
                        {currentConvo.analysis.interest}/10
                      </div>
                    </div>
                    <div className="p-3 rounded-lg bg-muted/40 border border-border/60">
                      <span className="text-[10px] uppercase font-semibold text-muted-foreground">Urgency</span>
                      <div className="mt-0.5">
                        <PriorityIndicator priority={currentConvo.analysis.urgency} />
                      </div>
                    </div>
                  </div>

                  {/* Extracted Objections */}
                  {currentConvo.analysis.objections.length > 0 && (
                    <div className="space-y-1">
                      <span className="font-semibold text-foreground">Extracted Objections:</span>
                      <ul className="list-disc pl-4 space-y-0.5 text-muted-foreground">
                        {currentConvo.analysis.objections.map((o, i) => (
                          <li key={i}>{o}</li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {/* Recommended Action */}
                  <div className="p-3.5 rounded-lg bg-primary/5 border border-primary/20 space-y-1.5">
                    <span className="font-bold text-foreground block text-xs">Recommended Next Action</span>
                    <p className="text-muted-foreground leading-relaxed">{currentConvo.analysis.nextAction}</p>
                  </div>

                  {/* Suggested Local AI Reply Draft */}
                  {currentConvo.analysis.suggestedReply && (
                    <div className="space-y-1.5 pt-2">
                      <div className="flex items-center justify-between">
                        <span className="font-semibold text-foreground">Suggested Follow-Up Response</span>
                        <span className="text-[10px] text-muted-foreground font-medium">Human in the loop</span>
                      </div>
                      <div className="p-3.5 rounded-lg bg-muted/30 border border-border/80 text-foreground whitespace-pre-wrap leading-relaxed">
                        {currentConvo.analysis.suggestedReply}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
