import { useSyncExternalStore } from "react";
import {
  demoConversations, demoDrafts, demoICPs, demoProducts, demoProfile, demoProspects, demoRuns, demoSignals,
} from "@/demo-data";
import type {
  AgentRun, BusinessProfile, BuyingSignal, Conversation, ICP, OutreachDraft, Preferences, Product, Prospect, SignalStatus,
} from "@/types";

export interface AppState {
  products: Product[]; profile: BusinessProfile; icps: ICP[]; prospects: Prospect[]; signals: BuyingSignal[];
  drafts: OutreachDraft[]; conversations: Conversation[]; runs: AgentRun[]; prefs: Preferences;
}

const PREFS_KEY = "harvey.prefs.v1";
const defaultPrefs: Preferences = { theme: "light", density: "comfortable", backendUrl: "http://localhost:8000", researchDepth: "standard", showDemoData: true };

const withDemo = (prefs: Preferences): AppState => ({
  products: prefs.showDemoData ? demoProducts : [],
  profile: prefs.showDemoData ? demoProfile : { sections: [], updatedAt: "" },
  icps: prefs.showDemoData ? demoICPs : [],
  prospects: prefs.showDemoData ? demoProspects : [],
  signals: prefs.showDemoData ? demoSignals : [],
  drafts: prefs.showDemoData ? demoDrafts : [],
  conversations: prefs.showDemoData ? demoConversations : [],
  runs: prefs.showDemoData ? demoRuns : [],
  prefs,
});

let state: AppState = withDemo(defaultPrefs);
const listeners = new Set<() => void>();
const emit = () => listeners.forEach((l) => l());
export const setState = (fn: (s: AppState) => AppState) => { state = fn(state); emit(); };
export const getState = () => state;

export function hydratePrefs() {
  try {
    const raw = localStorage.getItem(PREFS_KEY);
    if (raw) state = withDemo({ ...defaultPrefs, ...(JSON.parse(raw) as Partial<Preferences>) });
  } catch { /* ignore */ }
  applyTheme(state.prefs.theme);
  emit();
  syncLiveBackend();
}

export async function syncLiveBackend() {
  const url = state.prefs.backendUrl || "http://localhost:8000";
  try {
    const prodRes = await fetch(`${url}/api/v1/products`);
    if (prodRes.ok) {
      const pJson = await prodRes.json();
      const dbProducts = pJson.data || [];
      if (Array.isArray(dbProducts) && dbProducts.length > 0) {
        const mappedProducts: Product[] = dbProducts.map((p: any) => ({
          id: p.id,
          name: p.name,
          slug: p.slug,
          category: p.category || "General",
          valueProposition: p.value_proposition || p.description,
          features: p.key_features || [],
          pricingModel: (p.pricing_tier ? p.pricing_tier.toLowerCase() : "tiered") as any,
          targetVerticals: p.target_industries || [],
          updatedAt: p.updated_at ? p.updated_at.slice(0, 10) : today(),
        }));

        setState((s) => {
          if (s.prefs.showDemoData) {
            const existingIds = new Set(mappedProducts.map((x) => x.id));
            const fallback = demoProducts.filter((x) => !existingIds.has(x.id));
            return { ...s, products: [...mappedProducts, ...fallback] };
          }
          return { ...s, products: mappedProducts };
        });
      }
    }

    const prospRes = await fetch(`${url}/api/v1/prospects?page_size=50`);
    if (prospRes.ok) {
      const prJson = await prospRes.json();
      const dbProspects = prJson.data?.items || [];
      if (Array.isArray(dbProspects) && dbProspects.length > 0) {
        const mappedProspects: Prospect[] = dbProspects.map((p: any) => ({
          id: p.id,
          name: `${p.first_name} ${p.last_name}`.trim(),
          title: p.title || "Leader",
          company: p.company || "Company",
          website: p.domain || (p.company ? `https://${p.company.toLowerCase().replace(/[^a-z0-9]/g, "")}.com` : "https://example.com"),
          domain: p.domain || (p.company ? `${p.company.toLowerCase().replace(/[^a-z0-9]/g, "")}.com` : "example.com"),
          email: p.email,
          industry: p.industry || "Technology",
          size: p.company_size || "50-200",
          location: p.location || "United States",
          productFit: p.score || 75,
          fitScore: p.score || 75,
          icpMatch: 80,
          priority: "high" as const,
          productId: "",
          icpId: "",
          status: (p.status || "new") as any,
          lastResearched: p.updated_at ? p.updated_at.slice(0, 10) : null,
          description: p.personalization_notes || `${p.company} in ${p.industry || "tech"} sector.`,
          research: [],
          criteria: [],
          problems: [
            {
              problem: p.personalization_notes || "Manual sales qualification and deliverability bottlenecks",
              evidence: "Public research",
              confidence: "high" as const,
            },
          ],
          scoring: [],
          evidenceCount: 3,
        }));

        setState((s) => {
          if (s.prefs.showDemoData) {
            const existingIds = new Set(mappedProspects.map((x) => x.id));
            const fallback = demoProspects.filter((x) => !existingIds.has(x.id));
            return { ...s, prospects: [...mappedProspects, ...fallback] };
          }
          return { ...s, prospects: mappedProspects };
        });
      }
    }
  } catch {
    // Offline or backend not yet up; demo data remains available
  }
}

function applyTheme(t: Preferences["theme"]) {
  if (typeof document !== "undefined") document.documentElement.classList.toggle("dark", t === "dark");
}

export function useAppStore<T>(selector: (s: AppState) => T): T {
  return useSyncExternalStore(
    (l) => { listeners.add(l); return () => listeners.delete(l); },
    () => selector(state),
    () => selector(state),
  );
}

const uid = (p: string) => `${p}${Date.now().toString(36)}${Math.random().toString(36).slice(2, 5)}`;
const today = () => new Date().toISOString().slice(0, 10);

export const actions = {
  setPrefs(patch: Partial<Preferences>) {
    const prefs = { ...state.prefs, ...patch };
    localStorage.setItem(PREFS_KEY, JSON.stringify(prefs));
    applyTheme(prefs.theme);
    if (patch.showDemoData !== undefined && patch.showDemoData !== state.prefs.showDemoData) {
      state = withDemo(prefs);
      syncLiveBackend();
    } else {
      state = { ...state, prefs };
    }
    emit();
  },
  saveProduct(p: Omit<Product, "id" | "updatedAt"> & { id?: string }) {
    const rec: Product = { ...p, id: p.id ?? uid("p"), updatedAt: today() };
    setState((s) => ({
      ...s,
      products: p.id ? s.products.map((x) => (x.id === p.id ? rec : x)) : [rec, ...s.products],
    }));

    // Asynchronously push to backend SQLite
    try {
      fetch(`${state.prefs.backendUrl}/api/v1/products`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: rec.name,
          slug: rec.slug || rec.name.toLowerCase().replace(/[^a-z0-9]/g, "-"),
          value_proposition: rec.valueProposition,
          description: rec.valueProposition,
          key_features: rec.features || [],
          target_industries: rec.targetVerticals || [],
          pricing_tier: rec.pricingModel || "tiered",
          is_active: true,
        }),
      }).catch(() => {});
    } catch {
      // offline safe
    }
  },
  deleteProduct(id: string) { setState((s) => ({ ...s, products: s.products.filter((p) => p.id !== id) })); },
  saveProfileSection(id: string, fields: BusinessProfile["sections"][number]["fields"]) {
    setState((s) => ({ ...s, profile: { updatedAt: today(), sections: s.profile.sections.map((x) => (x.id === id ? { ...x, fields } : x)) } }));
  },
  saveICP(icp: Omit<ICP, "id" | "updatedAt"> & { id?: string }) {
    const rec: ICP = { ...icp, id: icp.id ?? uid("i"), updatedAt: today() };
    setState((s) => ({ ...s, icps: icp.id ? s.icps.map((x) => (x.id === icp.id ? rec : x)) : [rec, ...s.icps] }));
    return rec;
  },
  deleteICP(id: string) { setState((s) => ({ ...s, icps: s.icps.filter((i) => i.id !== id) })); },
  setProspectStatus(ids: string[], status: Prospect["status"]) {
    setState((s) => ({ ...s, prospects: s.prospects.map((p) => (ids.includes(p.id) ? { ...p, status } : p)) }));
  },
  deleteProspects(ids: string[]) { setState((s) => ({ ...s, prospects: s.prospects.filter((p) => !ids.includes(p.id)) })); },
  setSignalStatus(id: string, status: SignalStatus) {
    setState((s) => ({ ...s, signals: s.signals.map((x) => (x.id === id ? { ...x, status } : x)) }));
  },
  saveDraft(d: Omit<OutreachDraft, "id" | "createdAt"> & { id?: string }) {
    const rec: OutreachDraft = { ...d, id: d.id ?? uid("d"), createdAt: today() };
    setState((s) => ({ ...s, drafts: d.id ? s.drafts.map((x) => (x.id === d.id ? rec : x)) : [rec, ...s.drafts] }));
    return rec;
  },
  upsertConversation(c: Conversation) {
    setState((s) => ({ ...s, conversations: s.conversations.some((x) => x.id === c.id) ? s.conversations.map((x) => (x.id === c.id ? c : x)) : [c, ...s.conversations] }));
  },
  addRun(r: AgentRun) { setState((s) => ({ ...s, runs: [r, ...s.runs] })); },
  resetAll() { localStorage.removeItem(PREFS_KEY); state = withDemo(defaultPrefs); applyTheme("light"); emit(); },
  uid,
};
