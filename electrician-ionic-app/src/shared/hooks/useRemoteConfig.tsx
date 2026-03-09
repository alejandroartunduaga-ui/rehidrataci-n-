import { useEffect, useState } from 'react';
import {
  initializeRemoteConfig,
  getActiveStagingConfig,
  isEmailInActiveStaging,
  refreshRemoteConfig,
  type ActiveStagingConfig,
} from '@shared/services/remoteConfig.service';

export const useRemoteConfig = () => {
  const [isInitialized, setIsInitialized] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const initConfig = async () => {
      try {
        setIsLoading(true);
        setError(null);
        await initializeRemoteConfig();
        setIsInitialized(true);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Error desconocido');
      } finally {
        setIsLoading(false);
      }
    };

    initConfig();
  }, []);

  const refresh = async () => {
    try {
      setIsLoading(true);
      setError(null);
      await refreshRemoteConfig();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al actualizar');
    } finally {
      setIsLoading(false);
    }
  };

  return {
    isInitialized,
    isLoading,
    error,
    refresh,
  };
};

export const useActiveStagingConfig = () => {
  const [config, setConfig] = useState<ActiveStagingConfig>({ emails: [] });
  const { isInitialized, isLoading, error, refresh } = useRemoteConfig();

  useEffect(() => {
    if (isInitialized) {
      const newConfig = getActiveStagingConfig();
      setConfig(newConfig);
    }
  }, [isInitialized]);

  const checkEmail = (email: string): boolean => {
    return isEmailInActiveStaging(email);
  };

  const refreshConfig = async () => {
    await refresh();
    if (isInitialized) {
      const newConfig = getActiveStagingConfig();
      setConfig(newConfig);
    }
  };

  return {
    config,
    isLoading,
    error,
    checkEmail,
    refresh: refreshConfig,
    isInitialized,
  };
};
