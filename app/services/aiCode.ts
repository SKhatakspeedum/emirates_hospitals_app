import suggestusClientConfig from "../config/suggestus_client_config";
import { fetchDataFromLocalStorage } from "../suggestus_plugin/util/util_functions";

/**
 * Resolves the app's org "AI code" — persisted under sg_AICODE once a
 * session/location is established, falling back to the static default
 * (same resolution order already used in dashboardApi.ts/suggestusClient.js)
 * when nothing is persisted yet.
 */
export async function getStoredAiCode(): Promise<string> {
  return (
    (await fetchDataFromLocalStorage("sg_AICODE")) ||
    suggestusClientConfig.SUGGESTUS_AI_CODE
  );
}
