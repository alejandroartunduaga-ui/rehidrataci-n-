import mixpanel from 'mixpanel-browser';
import { IonApp, setupIonicReact } from '@ionic/react';
import {
  isStagingScope,
  useAuthStore,
  useNetworkListener,
  useFirebasePush,
  MixpanelProvider,
} from '@shared/index';
import { Router } from './Router';
import { ToastContainer } from 'react-toastify';
import { useEffect } from 'react';
import '@ionic/react/css/core.css';
import '@ionic/react/css/normalize.css';
import '@ionic/react/css/structure.css';
import '@ionic/react/css/typography.css';
import '@ionic/react/css/padding.css';
import '@ionic/react/css/float-elements.css';
import '@ionic/react/css/text-alignment.css';
import '@ionic/react/css/text-transformation.css';
import '@ionic/react/css/flex-utils.css';
import '@ionic/react/css/display.css';
import '@shared/theme/index.css';

setupIonicReact({
  swipeBackEnabled: false,
  animated: true,
});

const AppContent = () => {
  const initializeAuth = useAuthStore((state) => state.initializeAuth);
  const { state, requestPermissions } = useFirebasePush();

  useEffect(() => {
    initializeAuth();
  }, [initializeAuth]);

  // 🔔 Solicitar permisos de notificaciones al iniciar la app (solo permisos)
  useEffect(() => {
    const setupPushNotifications = async () => {
      try {
        // Solo solicitar permisos, sin obtener token ni suscribir
        await requestPermissions();
      } catch (error) {
        console.warn('⚠️ Error solicitando permisos:', error);
        // No es crítico, la app puede funcionar sin notificaciones
      }
    };

    // Solo ejecutar si no tiene permisos aún
    if (!state.hasPermission && !state.isLoading) {
      // Pequeño delay para que la app termine de cargar
      const timer = setTimeout(setupPushNotifications, 1000);
      return () => clearTimeout(timer);
    }
  }, []);

  return (
    <>
      <Router />
      <ToastContainer
        autoClose={3000}
        position={'top-center'}
        hideProgressBar={true}
        closeButton={false}
      />
    </>
  );
};

const App = () => {
  useNetworkListener();
  useEffect(() => {
    mixpanel.init(import.meta.env.VITE_MIXPANEL_TOKEN, {
      persistence: 'localStorage',
    });
  }, []);

  useEffect(() => {
    if (isStagingScope()) {
      import('@shared/services/remoteConfig.service').then(
        ({ initializeRemoteConfig }) => {
          initializeRemoteConfig();
        }
      );
    }
  }, []);

  return (
    <IonApp>
      <MixpanelProvider>
        <AppContent />
      </MixpanelProvider>
    </IonApp>
  );
};

export default App;
