import { storageManager } from '@shared/storage/storageManager';
import { useCallback, useState } from 'react';

interface UseCacheCleanerResult {
  clearCache: () => Promise<void>;
  isClearing: boolean;
  error: string | null;
  clearError: () => void;
}

interface CacheCleanerOptions {
  /**
   * Si debe hacer reload automáticamente después de limpiar
   * @default true
   */
  autoReload?: boolean;
  /**
   * Si debe unregister el Service Worker
   * @default true
   */
  unregisterServiceWorker?: boolean;
  /**
   * Callback que se ejecuta al completar la limpieza exitosamente
   */
  onSuccess?: () => void;
  /**
   * Callback que se ejecuta si hay un error
   */
  onError?: (error: string) => void;
}

/**
 * Hook personalizado para limpiar cache de PWA
 *
 * @example
 * ```tsx
 * const { clearCache, isClearing, error } = useCacheCleaner({
 *   autoReload: true,
 *   onSuccess: () => console.log('Cache limpiado'),
 *   onError: (err) => console.error('Error:', err)
 * });
 *
 * // En tu componente
 * <button onClick={clearCache} disabled={isClearing}>
 *   {isClearing ? 'Limpiando...' : 'Limpiar Cache'}
 * </button>
 * ```
 */
export const useCacheCleaner = (
  options: CacheCleanerOptions = {}
): UseCacheCleanerResult => {
  const {
    autoReload = true,
    unregisterServiceWorker = true,
    onSuccess,
    onError,
  } = options;

  const [isClearing, setIsClearing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const clearCache = useCallback(async () => {
    setIsClearing(true);
    setError(null);

    try {
      // 🗑️ Limpiar todos los caches
      if ('caches' in window) {
        const cacheNames = await caches.keys();

        await Promise.all(
          cacheNames.map((cacheName) => {
            return caches.delete(cacheName);
          })
        );
      }

      // 🔄 Unregister Service Worker (opcional)
      if (unregisterServiceWorker && 'serviceWorker' in navigator) {
        const registrations = await navigator.serviceWorker.getRegistrations();

        await Promise.all(
          registrations.map((registration) => {
            return registration.unregister();
          })
        );
      }

      // 🧹 Limpiar LocalStorage de datos de cache (opcional)
      const cacheKeys = Object.keys(localStorage).filter(
        (key) =>
          key.startsWith('cache-') ||
          key.startsWith('workbox-') ||
          key.startsWith('pwa-')
      );

      if (cacheKeys.length > 0) {
        cacheKeys.forEach((key) => {
          storageManager.removeItem(key);
          localStorage.removeItem(key);
        });
      }

      setIsClearing(false);

      if (onSuccess) {
        onSuccess();
      }

      // 🔄 Auto-reload si está habilitado
      if (autoReload) {
        window.location.reload();
      }
    } catch (err) {
      const errorMessage =
        err instanceof Error
          ? err.message
          : 'Error desconocido al limpiar cache';

      setError(errorMessage);
      setIsClearing(false);

      if (onError) {
        onError(errorMessage);
      }

      // 🔄 Fallback: recarga normal aunque falle
      if (autoReload) {
        window.location.reload();
      }
    }
  }, [autoReload, unregisterServiceWorker, onSuccess, onError]);

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  return {
    clearCache,
    isClearing,
    error,
    clearError,
  };
};

// 🎯 Hook simplificado para casos comunes
export const useQuickCacheClear = () => {
  return useCacheCleaner({
    autoReload: true,
    unregisterServiceWorker: true,
  });
};

// 🔧 Hook para desarrollo (sin reload automático)
export const useDevCacheClear = () => {
  return useCacheCleaner({
    autoReload: false,
    unregisterServiceWorker: false,
  });
};
