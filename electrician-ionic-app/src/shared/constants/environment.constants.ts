export const REMOTE_CONFIG_ACTIVE_STAGING = 'active_staging';

export const STAGING_ACCESS_DENIED_MESSAGE =
  'Acceso denegado: Tu email no está autorizado para acceder a la versión staging';

export const ENVIRONMENT_TYPES = {
  STAGING: 'STAGING',
  DEVELOPMENT: 'DEVELOPMENT',
  PRODUCTION: 'PRODUCTION',
  UNKNOWN: 'UNKNOWN',
} as const;

export const TELEMETRY_POLLING_INTERVAL = 5000; // 5 segundos en milisegundos
