import { getState } from "@/hooks/use-store";
import { createHttpApi, type HarveyApi } from "./api";
export * from "./api";
export * from "./demo-fallbacks";

const getClient = (): HarveyApi => {
  const url = getState()?.prefs?.backendUrl || "http://localhost:8000";
  return createHttpApi(url);
};

export const api: HarveyApi & (() => HarveyApi) = new Proxy((() => getClient()) as any, {
  get(_target, prop) {
    const client = getClient() as any;
    const val = client[prop];
    if (typeof val === "function") {
      return val.bind(client);
    }
    return val;
  },
  apply() {
    return getClient();
  },
});

export const OLLAMA_ENDPOINT = "http://localhost:11434";
