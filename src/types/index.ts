// Shared domain + API types. These mirror the contract the FastAPI backend should implement.
export type ID = string;
export type DataOrigin = "user" | "researched" | "assumption" | "demo";
export type Priority = "high" | "medium" | "low";
export type ProductStatus = "active" | "draft" | "archived";
export type ProspectStatus = "unresearched" | "researched" | "qualified" | "rejected";
export type SignalCategory = "hiring" | "expansion" | "funding" | "technology" | "leadership" | "announcement";
export type SignalStatus = "new" | "reviewed" | "relevant" | "irrelevant" | "acted";
export type RunStatus = "queued" | "running" | "completed" | "failed" | "cancelled";
export type Confidence = "high" | "medium" | "low";

export interface Product {
  id: ID; name: string; description: string; category: string; status: ProductStatus; updatedAt: string;
  features: string[]; valueProposition: string; customerProblem: string; differentiators: string[];
  pricing: string; targetIndustries: string[]; useCases: string[];
}
export interface ProfileField { label: string; value: string; origin: DataOrigin }
export interface BusinessProfile {
  sections: { id: string; title: string; fields: ProfileField[] }[]; updatedAt: string;
}
export interface Persona { title: string; seniority: string; department: string; painPoints: string[] }
export interface ICP {
  id: ID; productId: ID; name: string; status: "draft" | "confirmed"; updatedAt: string;
  industries: string[]; companySize: string; geography: string[]; revenueRange: string;
  characteristics: string[]; personas: Persona[]; triggers: string[];
  positiveCriteria: string[]; exclusionCriteria: string[]; customRequirements: string;
}
export interface Evidence { claim: string; source: string; url: string; capturedAt: string; verified: boolean }
export interface CriterionMatch { criterion: string; matched: boolean; explanation: string }
export interface ScoreFactor { factor: string; weight: number; score: number; explanation: string }
export interface ProblemInsight { problem: string; evidence: string; confidence: Confidence }
export interface Prospect {
  id: ID; company: string; website: string; industry: string; location: string; size: string;
  productId: ID; icpId: ID; productFit: number; icpMatch: number; priority: Priority;
  status: ProspectStatus; lastResearched: string | null; description: string;
  research: Evidence[]; criteria: CriterionMatch[]; problems: ProblemInsight[]; scoring: ScoreFactor[];
}
export interface BuyingSignal {
  id: ID; prospectId: ID; category: SignalCategory; title: string; description: string;
  evidence: string; source: string; url: string; date: string; relevance: number; priority: Priority;
  status: SignalStatus; rationale: string;
}
export interface OutreachDraft {
  id: ID; prospectId: ID; productId: ID; subject: string; body: string; objective: string; tone: string;
  createdAt: string; reviewState: "draft" | "reviewed"; inputs: string[];
}
export interface EmailMessage { from: string; date: string; body: string }
export interface ReplyAnalysis {
  intent: string; sentiment: "positive" | "neutral" | "negative"; interest: number; urgency: Priority;
  objections: string[]; evidence: string[]; nextAction: string; suggestedReply: string; analyzedAt: string;
}
export interface Conversation { id: ID; prospectId: ID; subject: string; messages: EmailMessage[]; isSample: boolean; analysis?: ReplyAnalysis }
export interface WorkflowStepState { name: string; agent: string; status: RunStatus; startedAt?: string; durationMs?: number; log?: string[]; error?: string }
export interface AgentRun {
  id: ID; task: string; productId: ID; prospectId?: ID; status: RunStatus; startedAt: string; durationMs: number;
  result: string; steps: WorkflowStepState[]; retries: number;
}
export interface AgentDefinition { name: string; responsibility: string }
export interface LocalModel { name: string; size: string; family: string; installed: boolean; recommended: boolean; contextLength: number }
export interface HardwareInfo { cpu: string; cores: number; ramGb: number; gpu: string; vramGb: number; freeMemGb: number }
export interface LocalAIStatus {
  connected: boolean; endpoint: string; activeModel: string | null; embeddingsReady: boolean;
  embeddingModel: string | null; hardware: HardwareInfo | null; lastChecked: string;
}
export interface InferenceRecord { id: ID; task: string; model: string; durationMs: number; status: RunStatus; tokens?: number; memGb?: number; at: string }
export interface DiscoveryRequest { productId: ID; icpId: ID; geography: string; industry: string; companySize: string; limit: number }
export interface Preferences { theme: "light" | "dark"; density: "comfortable" | "compact"; backendUrl: string; researchDepth: "quick" | "standard" | "deep"; showDemoData: boolean }
