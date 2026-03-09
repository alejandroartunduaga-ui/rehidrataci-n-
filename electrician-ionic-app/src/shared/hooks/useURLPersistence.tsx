import { useEffect } from 'react';
import { useHistory, useLocation } from 'react-router-dom';
import { Capacitor } from '@capacitor/core';
import { storageManager } from '@shared/storage/storageManager';

const URL_STORAGE_KEY = 'lastVisitedURL';
const URL_TIMESTAMP_KEY = 'lastVisitedURLTimestamp';
const MAX_URL_AGE = 24 * 60 * 60 * 1000; // 24 horas en millisegundos

export const useURLPersistence = () => {
  // 🛡️ Validación defensiva para React Router
  let history, location;
  try {
    history = useHistory();
    location = useLocation();
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
  } catch (_error) {
    console.warn('⚠️ useURLPersistence debe ejecutarse dentro de React Router');
    return { saveCurrentURL: () => {}, restoreLastURL: () => false };
  }

  // 💾 Guardar la URL actual en localStorage
  const saveCurrentURL = () => {
    try {
      const currentPath = location.pathname + location.search;
      const timestamp = Date.now();

      // No guardar rutas públicas o de autenticación
      const skipRoutes = ['/login', '/forgot-password', '/redirect-desktop'];
      if (skipRoutes.includes(location.pathname)) {
        return;
      }

      storageManager.setItem(URL_STORAGE_KEY, currentPath);
      storageManager.setItem(URL_TIMESTAMP_KEY, timestamp.toString());
    } catch (error) {
      console.warn('Error guardando URL:', error);
    }
  };

  // 🧹 Borrar claves almacenadas de URL
  const clearStoredURL = () => {
    try {
      storageManager.removeItem(URL_STORAGE_KEY);
      storageManager.removeItem(URL_TIMESTAMP_KEY);
    } catch (error) {
      console.warn('Error limpiando URL:', error);
    }
  };

  // 🔄 Restaurar la URL guardada si es válida
  const restoreLastURL = async () => {
    try {
      const savedURL = await storageManager.getItem(URL_STORAGE_KEY);
      const savedTimestamp = await storageManager.getItem(URL_TIMESTAMP_KEY);

      if (!savedURL || !savedTimestamp) {
        return false;
      }

      const timestamp = parseInt(savedTimestamp ?? '');
      const now = Date.now();

      // Verificar que la URL no sea muy antigua
      if (now - timestamp > MAX_URL_AGE) {
        storageManager.removeItem(URL_STORAGE_KEY);
        storageManager.removeItem(URL_TIMESTAMP_KEY);
        return false;
      }

      // No restaurar si ya estamos en esa URL
      const currentPath = location.pathname + location.search;
      if (currentPath === savedURL) {
        return false;
      }

      // Verificar si debemos restaurar la URL
      const isFromPWA = location.search.includes('source=pwa');
      const isRootPath = location.pathname === '/';
      const isHomePath = location.pathname === '/home';
      const isPublicRoute = ['/login', '/forgot-password'].includes(
        location.pathname
      );

      // Solo restaurar si:
      // 1. Viene desde PWA, O
      // 2. Está en la ruta raíz, O
      // 3. Está en la página home (puede ser un redirect por defecto), O
      // 4. Está en una ruta pública (pero la URL guardada no es pública)
      const shouldRestore =
        isFromPWA ||
        isRootPath ||
        isHomePath ||
        (isPublicRoute &&
          !['/login', '/forgot-password'].includes(savedURL.split('?')[0]));

      if (shouldRestore) {
        history.replace(savedURL);
        return true;
      }

      return false;
    } catch (error) {
      console.warn('Error restaurando URL:', error);
      return false;
    }
  };

  // 🔄 Configurar listeners de Capacitor App (para aplicaciones híbridas)
  useEffect(() => {
    const setupAppListeners = async () => {
      if (Capacitor.isNativePlatform()) {
        try {
          const { App } = await import('@capacitor/app');

          // Guardar URL cuando la app se pone en segundo plano
          const pauseListener = await App.addListener('pause', () => {
            saveCurrentURL();
          });

          // Restaurar URL cuando la app vuelve al primer plano
          const resumeListener = await App.addListener('resume', () => {
            // Pequeño delay para asegurar que la app esté completamente activa
            setTimeout(() => {
              const restored = restoreLastURL();
              if (!restored) {
                console.warn(
                  '🔗 URL ya actualizada o no necesita restauración'
                );
              }
            }, 100);
          });

          return () => {
            pauseListener.remove();
            resumeListener.remove();
          };
        } catch (error) {
          console.warn('Error configurando listeners de App:', error);
        }
      }
    };

    setupAppListeners();
  }, []);

  // 📍 Guardar URL automáticamente cuando cambie la ruta
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      saveCurrentURL();
    }, 500); // Debounce para evitar guardado excesivo

    return () => clearTimeout(timeoutId);
  }, [location.pathname, location.search]);

  // 🚀 Intentar restaurar URL al montar el componente
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      restoreLastURL();
    }, 300); // Delay reducido para restauración más rápida

    return () => clearTimeout(timeoutId);
  }, []);

  // 🌐 Listener para eventos web (PWA)
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.hidden) {
        // Página oculta - guardar URL
        saveCurrentURL();
      } else {
        // Página visible - intentar restaurar URL si es necesario
        setTimeout(() => {
          const restored = restoreLastURL();
          if (!restored) {
            console.warn('🔗 URL ya actualizada o no necesita restauración');
          }
        }, 200);
      }
    };

    // Al cerrar/recargar la pestaña, borrar claves
    const handleBeforeUnload = () => {
      clearStoredURL();
    };
    const handlePageHide = () => {
      clearStoredURL();
    };

    // Solo para web/PWA
    if (!Capacitor.isNativePlatform()) {
      document.addEventListener('visibilitychange', handleVisibilityChange);
      window.addEventListener('beforeunload', handleBeforeUnload);
      window.addEventListener('unload', handleBeforeUnload);
      window.addEventListener('pagehide', handlePageHide);

      return () => {
        document.removeEventListener(
          'visibilitychange',
          handleVisibilityChange
        );
        window.removeEventListener('beforeunload', handleBeforeUnload);
        window.removeEventListener('unload', handleBeforeUnload);
        window.removeEventListener('pagehide', handlePageHide);
      };
    }
  }, []);

  return {
    saveCurrentURL,
    restoreLastURL,
    // Exportar clear por si se necesita manualmente
    clearStoredURL,
  };
};
