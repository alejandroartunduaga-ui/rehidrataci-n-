export enum EnumFeatureFlag {
  TELEMETRY = 'telemetry',
  CHECKING_EQUIPMENT = 'checking_equipment',
  RESET_VISIT = 'reset_visit',
}

/**
 * Hook para verificar un feature flag en storageManager.
 * Recibe el nombre de la clave y retorna booleano.
 * - null/undefined => false
 * - strings "false", "0", "off", "no", "" => false
 * - cualquier otro valor => true
 */
export const useFeatureFlag = (flagName: EnumFeatureFlag): boolean => {
  const readFlag = () => {
    try {
      const raw = localStorage.getItem('auth-storage');
      if (raw == null) {
        return false;
      }
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      let parsed: any;
      try {
        parsed = JSON.parse(raw);
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
      } catch (_error) {
        // Si no es JSON válido, no hay flags utilizables
        return false;
      }

      // Buscar config_flag en posibles rutas conocidas
      const configFlag = parsed?.user?.config_flag ?? null;

      if (!configFlag || typeof configFlag !== 'object') {
        return false;
      }

      const flagValue = (configFlag as Record<string, unknown>)[flagName];
      if (typeof flagValue === 'boolean') return flagValue;
      if (typeof flagValue === 'number') return flagValue !== 0;
      const normalized = String(flagValue ?? '')
        .trim()
        .toLowerCase();
      const falsyValues = ['', 'false', '0', 'off', 'no', 'null', 'undefined'];
      const truthyValues = ['true', '1', 'on', 'yes'];
      if (truthyValues.includes(normalized)) return true;
      if (falsyValues.includes(normalized)) return false;
      return normalized.length > 0;
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
    } catch (_error) {
      return false;
    }
  };

  return readFlag();
};
