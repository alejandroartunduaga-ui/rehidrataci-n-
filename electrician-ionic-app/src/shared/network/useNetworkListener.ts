import { useEffect } from 'react';
import { Capacitor } from '@capacitor/core';
import { useConnectivityStore } from '@shared/index';

export const useNetworkListener = () => {
  const setOnlineStatus = useConnectivityStore(
    (state) => state.setOnlineStatus
  );

  useEffect(() => {
    const setupNetworkListeners = async () => {
      const isNative = Capacitor.isNativePlatform();

      if (isNative) {
        // 📱 Usar Capacitor Network API en plataformas nativas
        try {
          const { Network } = await import('@capacitor/network');

          const status = await Network.getStatus();
          setOnlineStatus(status.connected);

          Network.addListener('networkStatusChange', (status) => {
            setOnlineStatus(status.connected);
          });
        } catch (error) {
          console.error('Error setting up network listeners:', error);
          // Fallback a listeners web estándar
          setupWebListeners();
        }
      } else {
        // 🌐 Usar listeners web estándar
        setupWebListeners();
      }
    };

    const setupWebListeners = () => {
      // Set initial status
      setOnlineStatus(navigator.onLine);

      const handleOnline = () => setOnlineStatus(true);
      const handleOffline = () => setOnlineStatus(false);

      window.addEventListener('online', handleOnline);
      window.addEventListener('offline', handleOffline);

      return () => {
        window.removeEventListener('online', handleOnline);
        window.removeEventListener('offline', handleOffline);
      };
    };

    setupNetworkListeners();
  }, [setOnlineStatus]);
};
