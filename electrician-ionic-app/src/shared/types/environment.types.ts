import { ENVIRONMENT_TYPES } from '@shared/constants/environment.constants';

export type EnvironmentType =
  (typeof ENVIRONMENT_TYPES)[keyof typeof ENVIRONMENT_TYPES];

export interface EnvironmentConfig {
  scope: string | undefined;
  isDev: boolean;
  isProd: boolean;
  type: EnvironmentType;
}
