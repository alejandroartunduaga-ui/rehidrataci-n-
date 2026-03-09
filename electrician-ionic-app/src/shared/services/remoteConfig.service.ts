import { fetchAndActivate, getValue } from 'firebase/remote-config';
import { REMOTE_CONFIG_ACTIVE_STAGING } from '@shared/constants/environment.constants';
import { remoteConfig } from '@shared/firebase/webFirebaseConfig';

const DEFAULT_CONFIG = {
  [REMOTE_CONFIG_ACTIVE_STAGING]: '{"emails": []}',
};

const setupRemoteConfig = () => {
  remoteConfig.defaultConfig = DEFAULT_CONFIG;

  remoteConfig.settings = {
    minimumFetchIntervalMillis:
      import.meta.env.MODE === 'development' ? 0 : 12 * 60 * 60 * 1000,
    fetchTimeoutMillis: 60000,
  };
};

export const initializeRemoteConfig = async (): Promise<void> => {
  try {
    setupRemoteConfig();
    await fetchAndActivate(remoteConfig);
  } catch (error) {
    console.error('Error initializing Remote Config:', error);
  }
};

export const getRemoteConfigValue = (key: string): string => {
  try {
    const value = getValue(remoteConfig, key);
    return value.asString();
  } catch (error) {
    console.error('Error getting Remote Config value:', error);
    return DEFAULT_CONFIG[key as keyof typeof DEFAULT_CONFIG] || '';
  }
};

export interface ActiveStagingConfig {
  emails: string[];
}

export const getActiveStagingConfig = (): ActiveStagingConfig => {
  try {
    const configString = getRemoteConfigValue(REMOTE_CONFIG_ACTIVE_STAGING);
    const config = JSON.parse(configString) as ActiveStagingConfig;

    if (!config || !Array.isArray(config.emails)) {
      return { emails: [] };
    }

    return config;
  } catch (error) {
    console.error('Error parsing active staging config:', error);
    return { emails: [] };
  }
};

export const isEmailInActiveStaging = (email: string): boolean => {
  try {
    const config = getActiveStagingConfig();
    return config.emails.includes(email.toLowerCase());
  } catch (error) {
    console.error('Error checking email in active staging:', error);
    return true;
  }
};

export const refreshRemoteConfig = async (): Promise<void> => {
  try {
    await fetchAndActivate(remoteConfig);
  } catch (error) {
    console.error('Error refreshing Remote Config:', error);
  }
};
