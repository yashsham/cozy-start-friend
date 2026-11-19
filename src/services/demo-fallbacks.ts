// Clearly-labelled, rule-based fallbacks shown ONLY when the user explicitly asks for a demo
// while the local model is unavailable. These are templates/heuristics, not AI output.
import type { EmailMessage, ReplyAnalysis } from "@/types";
import type { DraftRequest } from "./api";

export function templateDraft(req: DraftRequest) {
  const p = req.prospect;
  const opener = req.inputs[0]?.replace(/^(Signal|Fact): /, "") ?? `your work at ${p.company}`;
  return {
    subject: `${req.productName} for ${p.company}`,
    body: `Hi there,\n\nI came across ${p.company} and noticed: ${opener.toLowerCase()}.\n\n${req.productName} helps ${p.industry.toLowerCase()} teams with exactly this kind of challenge.\n\n${req.cta}?\n\nBest regards,`,
  };
}

export function heuristicReply(messages: EmailMessage[]): ReplyAnalysis {
  const last = messages[messages.length - 1]?.body ?? "";
  const t = last.toLowerCase();
  const optOut = /remove me|unsubscribe|stop/.test(t);
  const later = /not a priority|later|after|next year/.test(t);
  const interested = /interesting|pricing|timeline|call|demo/.test(t);
  const objections = [
    /afford|cost|price|budget/.test(t) && "Cost / budget",
    /implementation|long|time/.test(t) && "Implementation effort",
    later && "Timing",
  ].filter(Boolean) as string[];
  const sentences = last.split(/(?<=[.?!])\s+/).filter((s) => s.length > 12).slice(0, 3);
  return {
    intent: optOut ? "Opt-out" : interested ? "Interested — information request" : later ? "Not now — revisit later" : "Unclear",
    sentiment: optOut ? "negative" : interested ? "positive" : "neutral",
    interest: optOut ? 0 : interested ? 70 : later ? 30 : 40,
    urgency: interested ? "high" : later ? "low" : "medium",
    objections, evidence: sentences,
    nextAction: optOut ? "Remove contact from all sequences." : interested ? "Send pricing and implementation timeline; propose a call." : later ? "Schedule follow-up after stated date." : "Ask a clarifying question.",
    suggestedReply: optOut ? "" : interested ? "Thanks for the reply — happy to share pricing and a typical timeline. Most teams go live in 4–6 weeks without changing existing ERP customisation. Would Thursday work for a short call?" : "Understood — I'll check back after your go-live. Good luck with the migration.",
    analyzedAt: new Date().toISOString(),
  };
}
