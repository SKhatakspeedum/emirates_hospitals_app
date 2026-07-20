import { useEffect, useState } from "react";
import { callSuggestusAPI } from "../suggestus_plugin/suggestusClient";
import { SectionConfig } from "../config/sectionConfig";

/**
 * Fetches data for every occurrence of one widget key (e.g. all "providers"
 * instances) independently, using each instance's backend-supplied processId /
 * defaultParams — falling back to fallbackProcessId when the backend omits one.
 * Dynamic runtime params always win over defaultParams on key conflicts.
 *
 * @param instances - Section instances already filtered to one widget key, in order
 * @param fallbackProcessId - Used when an instance has no backend-supplied processId
 * @param getDynamicParams - Runtime values (patient id, org id, etc.) merged over defaultParams
 * @param mapResponse - Maps a successful response's returnData into this instance's data shape
 * @param fallbackData - Used for an instance when its call fails or returns nothing
 * @param extraDepsKey - Optional extra value (e.g. patient id, a focus counter) that
 * forces a refetch of every instance when it changes, even if the instance list didn't
 */
export function useSectionInstanceData<T>(
  instances: SectionConfig[],
  fallbackProcessId: string,
  getDynamicParams: () => Promise<Record<string, any>>,
  mapResponse: (returnData: any[]) => T,
  fallbackData: T,
  extraDepsKey?: string,
): {
  dataByInstance: Record<string, T>;
  loadingByInstance: Record<string, boolean>;
} {
  const [dataByInstance, setDataByInstance] = useState<Record<string, T>>({});
  const [loadingByInstance, setLoadingByInstance] = useState<
    Record<string, boolean>
  >({});

  const instanceKey = instances.map((i) => i.instanceId).join(",");

  useEffect(() => {
    if (instances.length === 0) return;
    let cancelled = false;

    const run = async () => {
      const dynamicParams = await getDynamicParams();

      await Promise.all(
        instances.map(async (instance) => {
          const id = instance.instanceId!;
          setLoadingByInstance((prev) => ({ ...prev, [id]: true }));
          try {
            const mergedParams = { ...instance.defaultParams, ...dynamicParams };
            const response = await callSuggestusAPI(
              instance.processId || fallbackProcessId,
              mergedParams,
            );
            if (cancelled) return;
            if (response?.returnCode === true && response.returnData?.length > 0) {
              setDataByInstance((prev) => ({
                ...prev,
                [id]: mapResponse(response.returnData),
              }));
            } else {
              setDataByInstance((prev) => ({ ...prev, [id]: fallbackData }));
            }
          } catch (e) {
            console.error(
              `Error fetching section instance data (${id}):`,
              e,
            );
            if (!cancelled) {
              setDataByInstance((prev) => ({ ...prev, [id]: fallbackData }));
            }
          } finally {
            if (!cancelled) {
              setLoadingByInstance((prev) => ({ ...prev, [id]: false }));
            }
          }
        }),
      );
    };

    run();
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [instanceKey, extraDepsKey]);

  return { dataByInstance, loadingByInstance };
}
