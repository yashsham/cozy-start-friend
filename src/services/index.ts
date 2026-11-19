import { getState } from "@/hooks/use-store";
import { createHttpApi, type HarveyApi } from "./api";
export * from "./api";
export * from "./demo-fallbacks";
export const api = (): HarveyApi => createHttpApi(getState().prefs.backendUrl);
export const OLLAMA_ENDPOINT = "http://localhost:11434";
