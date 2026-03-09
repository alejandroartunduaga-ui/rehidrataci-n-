import { useEffect, useRef, useState } from 'react';
import { hydrateRevertActPhase1 } from '../hydration/hydrateRevertActPhase1';
import { hydrateRevertActPhase2 } from '../hydration/hydrateRevertActPhase2';

export const useRevertActHydration = (params: {
  enabled: boolean;
  activityId: string | null | undefined;
  widgetsResponse: any;
}) => {
  const { enabled, activityId, widgetsResponse } = params;

  const [formState, setFormState] = useState<Record<string, any>>({});
  const [phase, setPhase] = useState<0 | 1 | 2>(0);

  const lastHydratedKeyRef = useRef<string | null>(null);

  useEffect(() => {
    if (!enabled) return;
    if (!widgetsResponse) return;

    // ✅ stableKey 100% confiable: activityId
    const stableKey = activityId ?? 'unknown_activity';

    // si ya hidratamos esta actividad, no rehidratar
    if (lastHydratedKeyRef.current === stableKey && phase !== 0) return;
    lastHydratedKeyRef.current = stableKey;

    const p1 = hydrateRevertActPhase1(widgetsResponse);
    setFormState(p1.formState);
    setPhase(1);

    const t = setTimeout(() => {
      const p2 = hydrateRevertActPhase2(widgetsResponse, p1.formState);
      setFormState((prev) => ({ ...prev, ...p2.formStatePatch }));
      setPhase(2);
    }, 0);

    return () => clearTimeout(t);
  }, [enabled, activityId, widgetsResponse]); // ✅ activityId ahora manda

  return { formState, phase, setFormState };
};
