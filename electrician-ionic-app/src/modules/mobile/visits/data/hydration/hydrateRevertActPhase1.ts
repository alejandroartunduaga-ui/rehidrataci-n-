// src/modules/mobile/visits/data/hydration/hydrateRevertActPhase1.ts

export type HydrationPhase1Result = {
    // estado que necesita la UI para renderizar
    formState: Record<string, any>;
    meta: {
      hydratedAt: number;
      phase: 1;
    };
  };
  
  
  export const hydrateRevertActPhase1 = (widgetsResponse: any): HydrationPhase1Result => {
    // Ajusta esta extracción según el shape real del response.
    // La idea: tomar "values/draft/defaults" que ya vengan y mapearlos a tu formState.
    const widgets = (widgetsResponse as any)?.widgets ?? (widgetsResponse as any)?.data ?? widgetsResponse;
  
    const formState: Record<string, any> = {};
  
    // Ejemplo genérico: si el widget trae un "key" y un "value/default"
    if (Array.isArray(widgets)) {
      for (const w of widgets) {
        const key = w?.key ?? w?.code ?? w?.name;
        if (!key) continue;
  
        const value = w?.value ?? w?.default ?? w?.initialValue ?? null;
        formState[key] = value;
      }
    }
  
    return {
      formState,
      meta: { hydratedAt: Date.now(), phase: 1 },
    };
  };
    