import { ENVIRONMENT_TYPES } from '@shared/constants/environment.constants';
import type { EnvironmentType } from '@shared/types/environment.types';

export const isStagingScope = (): boolean => {
  return import.meta.env.VITE_SCOPE === ENVIRONMENT_TYPES.STAGING;
};

export const isDevelopmentScope = (): boolean => {
  return import.meta.env.VITE_SCOPE === ENVIRONMENT_TYPES.DEVELOPMENT;
};

export const isProductionEnvironment = (): boolean => {
  return import.meta.env.MODE === 'production';
};

export const isDevelopmentEnvironment = (): boolean => {
  return import.meta.env.MODE === 'development';
};

export const getCurrentEnvironmentType = (): EnvironmentType => {
  if (isStagingScope()) return ENVIRONMENT_TYPES.STAGING;
  if (isDevelopmentEnvironment() || isDevelopmentScope())
    return ENVIRONMENT_TYPES.DEVELOPMENT;
  if (isProductionEnvironment()) return ENVIRONMENT_TYPES.PRODUCTION;
  return ENVIRONMENT_TYPES.UNKNOWN;
};

export const shouldShowEnvironmentBadge = (): boolean => {
  return !isProductionEnvironment() && !!import.meta.env.VITE_SCOPE;
};
