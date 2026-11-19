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
    if (patch.showDemoData !== undefined && patch.showDemoData !== state.prefs.showDemoData) state = withDemo(prefs);
    else state = { ...state, prefs };
    emit();
  },
  saveProduct(p: Omit<Product, "id" | "updatedAt"> & { id?: string }) {
    setState((s) => {
      const rec: Product = { ...p, id: p.id ?? uid("p"), updatedAt: today() };
      return { ...s, products: p.id ? s.products.map((x) => (x.id === p.id ? rec : x)) : [rec, ...s.products] };
    });
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
