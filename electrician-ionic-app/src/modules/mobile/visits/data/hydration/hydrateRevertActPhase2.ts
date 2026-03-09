export type HydrationPhase2Result = {
    formStatePatch: Record<string, any>;
    meta: {
      hydratedAt: number;
      phase: 2;
    };
  };
  
  /**
   * Fase 2:
   * - completar secciones condicionales
   * - cálculos derivados
   * - expandir builders pesados (listas, transformadores, etc.)
   */
  export const hydrateRevertActPhase2 = (widgetsResponse: any, currentFormState: Record<string, any>): HydrationPhase2Result => {
    const widgets = (widgetsResponse as any)?.widgets ?? (widgetsResponse as any)?.data ?? widgetsResponse;
  
    const patch: Record<string, any> = {};
  
    // Ejemplo: derivar flags o normalizar arrays
    // (ajústalo al shape real)
    // patch['hasTransformers'] = Array.isArray(currentFormState['transformers']) && currentFormState['transformers'].length > 0;
  
    // Si en widgets viene una sección pesada (ej: transformers_found)
    if (Array.isArray(widgets)) {
      const heavy = widgets.find((w) => w?.key === 'transformers_found' || w?.code === 'transformers_found');
      if (heavy && Array.isArray(heavy?.items)) {
        patch['transformers_found'] = heavy.items;
        patch['transformers_found_count'] = heavy.items.length;
      }
    }
  
    return {
      formStatePatch: patch,
      meta: { hydratedAt: Date.now(), phase: 2 },
    };
  };
  