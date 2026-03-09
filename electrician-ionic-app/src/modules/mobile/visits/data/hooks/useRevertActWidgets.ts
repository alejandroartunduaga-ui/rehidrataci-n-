import { useEffect, useState } from 'react';
import { getRevertActWidgets, RevertActWidgetsResponse } from '../revertActWidgets';
import { getCachedRevertWidgets, setCachedRevertWidgets } from '../revertWidgetsCache';

const INTERNAL_BASE_URL = 'https://internal.dev.bia.app';
const REVERT_ACT_PAGE_CODE = 'df4bcdd0-1395-4bf9-8f3a-3694e22d1616';

export const useRevertActWidgets = (params: {
  enabled: boolean;
  activityId: string | null | undefined;
  userId: string | null | undefined;
}) => {
  const { enabled, activityId, userId } = params;

  const [data, setData] = useState<RevertActWidgetsResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!enabled) return;
    if (!activityId) return;
    if (!userId) return;

    // 1) cache
    const cached = getCachedRevertWidgets(activityId);
    if (cached) {
      setData(cached as RevertActWidgetsResponse);
      return;
    }

    const controller = new AbortController();

    setLoading(true);
    setError(null);

    (async () => {
      try {
        const resp = await getRevertActWidgets({
          baseUrl: INTERNAL_BASE_URL,
          userId,
          activityId,
          pageCode: REVERT_ACT_PAGE_CODE,
          signal: controller.signal,
        });

        if (controller.signal.aborted) return;

        setCachedRevertWidgets(activityId, resp);
        setData(resp);
      } catch (e: any) {
        if (controller.signal.aborted) return;
        setError(e?.message ?? 'Error cargando widgets');
      } finally {
        if (controller.signal.aborted) return;
        setLoading(false);
      }
    })();

    return () => controller.abort();
  }, [enabled, activityId, userId]);

  return { data, loading, error };
};
