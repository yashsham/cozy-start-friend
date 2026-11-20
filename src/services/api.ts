// Typed service contract. Components depend on `HarveyApi`, never on demo data directly.
// Antigravity: implement `createHttpApi` against FastAPI and swap it in services/index.ts.
import { demoInference, demoModels } from "@/demo-data";
import type {
  DiscoveryRequest, InferenceRecord, LocalAIStatus, LocalModel, OutreachDraft, Prospect, ReplyAnalysis, EmailMessage,
} from "@/types";

export class BackendUnavailableError extends Error {
  constructor(msg = "Local backend is not reachable") { super(msg); this.name = "BackendUnavailableError"; }
}

export interface DraftRequest { prospect: Prospect; productName: string; objective: string; tone: string; length: string; cta: string; inputs: string[] }
export interface DiscoveryProgress { stage: string; message: string; found: number; done: boolean; error?: string }

export interface HarveyApi {
  getLocalStatus(endpoint: string): Promise<LocalAIStatus>;
  listModels(): Promise<LocalModel[]>;
  getInferenceHistory(): Promise<InferenceRecord[]>;
  generateDraft(req: DraftRequest): Promise<Pick<OutreachDraft, "subject" | "body">>;
  analyzeReply(messages: EmailMessage[]): Promise<ReplyAnalysis>;
  startDiscovery(req: DiscoveryRequest, onProgress: (p: DiscoveryProgress) => void, signal: AbortSignal): Promise<string[]>;
}

async function ping(url: string, ms = 2500): Promise<boolean> {
  const ctl = new AbortController();
  const t = setTimeout(() => ctl.abort(), ms);
  try { const r = await fetch(url, { signal: ctl.signal }); return r.ok; } catch { return false; } finally { clearTimeout(t); }
}

export function createHttpApi(baseUrl: string): HarveyApi {
  const post = async <T,>(path: string, body: unknown): Promise<T> => {
    let r: Response;
    try { r = await fetch(`${baseUrl}${path}`, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(body) }); }
    catch { throw new BackendUnavailableError(); }
    if (!r.ok) throw new Error(`Request failed (${r.status})`);
    return (await r.json()) as T;
  };
  return {
    async getLocalStatus(endpoint) {
      try {
        const r = await fetch(`${baseUrl}/api/v1/models/status`);
        if (r.ok) {
          const res = await r.json();
          const d = res.data;
          return {
            connected: d.ollama_online ?? false,
            endpoint,
            activeModel: d.model_available ? d.model_name : null,
            embeddingsReady: true,
            embeddingModel: "all-MiniLM-L6-v2",
            hardware: null,
            lastChecked: new Date().toISOString(),
          };
        }
      } catch {
        // Backend unavailable; fallback to direct daemon probe
      }
      const connected = await ping(`${endpoint}/api/tags`);
      return { connected, endpoint, activeModel: null, embeddingsReady: false, embeddingModel: null, hardware: null, lastChecked: new Date().toISOString() };
    },
    async listModels() {
      try {
        const r = await fetch(`${baseUrl}/api/v1/models/status`);
        if (r.ok) {
          const res = await r.json();
          const d = res.data;
          if (d && d.details && Array.isArray(d.details.installed_models)) {
            return d.details.installed_models.map((name: string) => ({
              name,
              size: "4.7 GB",
              family: "Qwen",
              installed: true,
              recommended: name.includes("qwen2.5"),
              contextLength: 8192,
            }));
          }
        }
      } catch {
        /* fallback to demo models */
      }
      return demoModels;
    },
    async getInferenceHistory() { return demoInference; },
    generateDraft: (req) => post("/outreach/draft", req),
    analyzeReply: (messages) => post("/replies/analyze", { messages }),
    async startDiscovery(req, onProgress) {
      onProgress({ stage: "Connecting", message: `Contacting ${baseUrl}`, found: 0, done: false });
      const res = await post<{ prospectIds: string[] }>("/discovery/run", req);
      return res.prospectIds;
    },
  };
}
