import { Capacitor } from '@capacitor/core';
import { messagingFirebase } from '@shared/firebase/webFirebaseConfig';
import { useCallback, useEffect, useState } from 'react';
import { useTrackEvent } from '@shared/index';
import {
  getToken as getFirebaseToken,
  MessagePayload,
  onMessage,
} from 'firebase/messaging';

// Tipos mínimos para evitar any en listeners de Capacitor
type PushRegistrationToken = { value: string };
type PushRegistrationError = { error: string };
type PushNotification = {
  title?: string;
  body?: string;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  data?: Record<string, any>;
};
type PushActionPerformed = {
  actionId: string;
  inputValue?: string;
  notification: PushNotification & { id?: string };
};
type LocalNotificationAction = {
  actionId: string;
  notification: { id: string };
};

// 🧹 Función para limpiar etiquetas HTML usando regex
const stripHtmlTags = (html: string): string => {
  if (!html) return '';

  // Eliminar todas las etiquetas HTML (todo lo que esté entre < >)
  let cleanText = html.replace(/<[^>]*>/g, '');

  // Decodificar entidades HTML comunes
  cleanText = cleanText
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&apos;/g, "'");

  // Limpiar espacios extra, saltos de línea y tabs
  return cleanText.replace(/\s+/g, ' ').trim();
};

interface FirebasePushState {
  token: string | null;
  hasPermission: boolean;
  isRegistered: boolean;
  isLoading: boolean;
  error: string | null;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  lastNotification: any | null;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  clickedNotification: any | null;
  permissionStatus: 'default' | 'granted' | 'denied' | 'blocked' | null;
}

interface UseFirebasePushReturn {
  state: FirebasePushState;
  requestPermissions: () => Promise<void>;
  getToken: () => Promise<string | null>;
  clearError: () => void;
  checkCurrentPermissions: () => Promise<boolean>;
  clearClickedNotification: () => void;
  setReceibingNotification: (value: boolean) => void;
  receibingNotification: boolean;
}

export const useFirebasePush = (): UseFirebasePushReturn => {
  // Cargar plugins nativos solo cuando se ejecuta en plataforma nativa
  const loadNativePlugins = async () => {
    // vite-ignore evita que Vite intente resolver estos módulos en web
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore
    const pn = '@capacitor/push-notifications';
    const { PushNotifications } = await import(/* @vite-ignore */ pn);
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore
    const ln = '@capacitor/local-notifications';
    const { LocalNotifications } = await import(/* @vite-ignore */ ln);
    return { PushNotifications, LocalNotifications };
  };

  const [state, setState] = useState<FirebasePushState>({
    token: null,
    hasPermission: false,
    isRegistered: false,
    isLoading: false,
    error: null,
    lastNotification: null,
    clickedNotification: null,
    permissionStatus: null,
  });

  const isNative = Capacitor.isNativePlatform();
  const trackEvent = useTrackEvent();
  const [receibingNotification, setReceibingNotification] =
    useState<boolean>(false);
  // 🔍 Verificar permisos actuales
  const checkCurrentPermissions = useCallback(async () => {
    try {
      if (isNative) {
        const { PushNotifications } = await loadNativePlugins();
        const permissions = await PushNotifications.checkPermissions();
        const hasPermission = permissions.receive === 'granted';
        if (hasPermission) {
          trackEvent('push_permission_granted', {});
        } else {
          trackEvent('push_permission_denied', {});
        }
        setState((prev) => ({
          ...prev,
          hasPermission,
          permissionStatus: permissions.receive as
            | 'default'
            | 'granted'
            | 'denied',
        }));
        return hasPermission;
      } else {
        const permission = Notification.permission;
        const hasPermission = permission === 'granted';

        // Detectar si los permisos están bloqueados
        let permissionStatus: 'default' | 'granted' | 'denied' | 'blocked' =
          permission as 'default' | 'granted' | 'denied';

        // En web, si permission es 'denied' y no podemos solicitar permisos, está bloqueado
        if (permission === 'denied') {
          // Intentar detectar si está bloqueado verificando si podemos solicitar permisos
          try {
            // Esta es una forma indirecta de detectar si está bloqueado
            // Si el navegador no permite solicitar permisos, generalmente significa que está bloqueado
            const testPermission = await navigator.permissions?.query({
              name: 'notifications' as PermissionName,
            });
            if (testPermission?.state === 'denied') {
              permissionStatus = 'blocked';
            }
            // eslint-disable-next-line @typescript-eslint/no-unused-vars
          } catch (error) {
            // Si no podemos verificar, asumimos que está bloqueado si es 'denied'
            permissionStatus = 'blocked';
          }
        }

        setState((prev) => ({
          ...prev,
          hasPermission,
          permissionStatus,
        }));
        return hasPermission;
      }
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
    } catch (error) {
      setState((prev) => ({
        ...prev,
        hasPermission: false,
        permissionStatus: 'denied',
      }));
      return false;
    }
  }, [isNative]);

  // 🔑 Solicitar permisos
  const requestPermissions = useCallback(async () => {
    try {
      setState((prev) => ({ ...prev, isLoading: true, error: null }));

      // Primero verificar si ya tiene permisos
      const currentPermissions = await checkCurrentPermissions();
      if (currentPermissions) {
        setState((prev) => ({ ...prev, isLoading: false }));
        return;
      }

      // Verificar si los permisos están bloqueados (solo en web)
      if (!isNative && state.permissionStatus === 'blocked') {
        throw new Error(
          'Los permisos de notificaciones están bloqueados. Por favor, restablécelos manualmente en la configuración del navegador.'
        );
      }

      if (isNative) {
        // 📱 Plataformas nativas (iOS/Android)
        const { PushNotifications } = await loadNativePlugins();
        const permissions = await PushNotifications.requestPermissions();
        const hasPermission = permissions.receive === 'granted';

        setState((prev) => ({ ...prev, hasPermission, isLoading: false }));

        if (hasPermission) {
          await PushNotifications.register();
          trackEvent('push_permission_granted', {});
        } else {
          trackEvent('push_permission_denied', {});
        }
      } else {
        // 🌐 Web
        // Verificar si los permisos están bloqueados antes de solicitar
        if (Notification.permission === 'denied') {
          // Intentar solicitar permisos para ver si están realmente bloqueados
          const permission = await Notification.requestPermission();
          if (permission === 'denied') {
            // Si sigue siendo 'denied' después de la solicitud, probablemente está bloqueado
            setState((prev) => ({
              ...prev,
              hasPermission: false,
              isLoading: false,
              permissionStatus: 'blocked',
            }));
            throw new Error(
              'Los permisos de notificaciones están bloqueados. Por favor, restablécelos manualmente en la configuración del navegador.'
            );
          }
          setState((prev) => ({
            ...prev,
            hasPermission: permission === 'granted',
            isLoading: false,
            permissionStatus: permission as 'default' | 'granted' | 'denied',
          }));
        } else {
          const permission = await Notification.requestPermission();
          const hasPermission = permission === 'granted';
          setState((prev) => ({
            ...prev,
            hasPermission,
            isLoading: false,
            permissionStatus: permission as 'default' | 'granted' | 'denied',
          }));
        }
      }
      trackEvent('OPS_REQUEST_PERMISSIONS', {
        hasPermission: Notification.permission === 'granted' ? true : false,
        permissionStatus: Notification.permission,
      });
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : 'Error al solicitar permisos';
      setState((prev) => ({ ...prev, error: errorMessage, isLoading: false }));
    }
  }, [isNative, checkCurrentPermissions]);

  // 🎫 Obtener token de Firebase
  const getToken = useCallback(async (): Promise<string | null> => {
    try {
      setState((prev) => ({ ...prev, isLoading: true, error: null }));

      // Verificar permisos primero
      const hasPermissions = await checkCurrentPermissions();
      if (!hasPermissions) {
        throw new Error('No hay permisos de notificaciones');
      }

      if (isNative) {
        // 📱 En nativo, el token se obtiene via listeners
        if (state.token) {
          setState((prev) => ({ ...prev, isLoading: false }));
          return state.token;
        }

        // Forzar registro si no está registrado
        try {
          const { PushNotifications } = await loadNativePlugins();
          await PushNotifications.register();
        } catch (regError) {
          console.error('❌ Error al registrar push notifications:', regError);
        }

        // Si no hay token, esperar a que llegue via listener
        return new Promise((resolve) => {
          const timeout = setTimeout(() => {
            setState((prev) => ({ ...prev, isLoading: false }));
            resolve(null);
          }, 15000); // Aumenté a 15 segundos

          const checkToken = () => {
            if (state.token) {
              clearTimeout(timeout);
              setState((prev) => ({ ...prev, isLoading: false }));
              resolve(state.token);
            } else {
              setTimeout(checkToken, 500); // Aumenté el intervalo a 500ms
            }
          };

          // Empezar a verificar después de un pequeño delay
          setTimeout(checkToken, 1000);
        });
      } else {
        // 🌐 Web - Firebase messaging
        const vapidKey = import.meta.env.VITE_FIREBASE_VAPID_KEY;
        if (!vapidKey) {
          throw new Error('VAPID key no configurada en variables de entorno');
        }

        // Validar formato básico de VAPID key (debe ser base64url de 65 caracteres)
        if (vapidKey.length !== 88 && vapidKey.length !== 87) {
          throw new Error(
            `VAPID key tiene longitud incorrecta: ${vapidKey.length}. Debe tener 87-88 caracteres.`
          );
        }

        // 🔔 Registrar Firebase Service Worker si no está registrado
        if ('serviceWorker' in navigator) {
          let registration = await navigator.serviceWorker.getRegistration();

          if (!registration || !registration.scope.includes('firebase')) {
            registration = await navigator.serviceWorker.register(
              '/firebase-messaging-sw.js',
              {
                scope: '/', // Scope amplio para capturar todas las notificaciones
              }
            );
          }
        }

        const token = await getFirebaseToken(messagingFirebase, { vapidKey });

        if (!token) {
          throw new Error('No se pudo obtener el token de Firebase');
        }

        setState((prev) => ({
          ...prev,
          token,
          isRegistered: true,
          isLoading: false,
        }));

        return token;
      }
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : 'Error al obtener token';
      console.error('❌ Error obteniendo token:', errorMessage);
      setState((prev) => ({ ...prev, error: errorMessage, isLoading: false }));
      return null;
    }
  }, [isNative, state.token, checkCurrentPermissions]);

  // 🧹 Limpiar error
  const clearError = useCallback(() => {
    setState((prev) => ({ ...prev, error: null }));
  }, []);

  // 🧹 Limpiar notificación clickeada
  const clearClickedNotification = useCallback(() => {
    setState((prev) => ({ ...prev, clickedNotification: null }));
  }, []);

  // ⚙️ Configurar listeners (solo una vez)
  useEffect(() => {
    if (isNative) {
      // 📱 Listeners nativos
      const setupNativeListeners = async () => {
        const { PushNotifications, LocalNotifications } =
          await loadNativePlugins();
        // Token registration
        const registrationListener = await PushNotifications.addListener(
          'registration',
          (token: PushRegistrationToken) => {
            setState((prev) => {
              const newState = {
                ...prev,
                token: token.value,
                isRegistered: true,
                isLoading: false,
                error: null,
              };
              return newState;
            });
          }
        );

        // Registration error
        const errorListener = await PushNotifications.addListener(
          'registrationError',
          (error: PushRegistrationError) => {
            console.error('❌ Error de registro nativo:', error);
            setState((prev) => ({ ...prev, error: error.error }));
          }
        );

        // Notificación recibida
        const notificationListener = await PushNotifications.addListener(
          'pushNotificationReceived',
          (notification: PushNotification) => {
            // Mostrar notificación local cuando la app está en foreground
            LocalNotifications.schedule({
              notifications: [
                {
                  title: stripHtmlTags(
                    notification.title || 'Nueva notificación'
                  ),
                  body: stripHtmlTags(notification.body || ''),
                  id: Date.now(),
                  schedule: { at: new Date(Date.now() + 1000) }, // Mostrar en 1 segundo
                  sound: 'default',
                  attachments: [],
                  actionTypeId: '',
                  extra: {
                    ...notification.data,
                    visit_id: notification.data?.visit_id,
                  },
                },
              ],
            }).catch((err: unknown) => {
              console.error('❌ Error mostrando notificación local:', err);
            });

            setState((prev) => ({
              ...prev,
              lastNotification: notification,
            }));
          }
        );

        // Notificación tocada
        const actionListener = await PushNotifications.addListener(
          'pushNotificationActionPerformed',
          (action: PushActionPerformed) => {
            // Siempre redirigir a /home?source=notification
            const notificationId =
              (
                action.notification?.data as
                  | { notification_id?: string }
                  | undefined
              )?.notification_id ?? 'unknown';
            window.location.href =
              '/home?source=notification&notification_id=' + notificationId;

            setState((prev) => ({
              ...prev,
              lastNotification: action.notification,
              clickedNotification: {
                ...action.notification,
                actionId: action.actionId,
                inputValue: action.inputValue,
                timestamp: new Date().toISOString(),
                source: 'push',
              },
            }));
          }
        );

        // Listener para notificaciones locales clickeadas
        const localActionListener = await LocalNotifications.addListener(
          'localNotificationActionPerformed',
          (action: LocalNotificationAction) => {
            // Siempre redirigir a /home?source=notification
            window.location.href =
              '/home?source=notification&notification_id=' +
              action.notification.id;

            setState((prev) => ({
              ...prev,
              clickedNotification: {
                ...action.notification,
                actionId: action.actionId,
                timestamp: new Date().toISOString(),
                source: 'local',
              },
            }));
          }
        );

        // Cleanup
        return () => {
          registrationListener.remove();
          errorListener.remove();
          notificationListener.remove();
          actionListener.remove();
          localActionListener.remove();
        };
      };

      setupNativeListeners();
    } else {
      // 🌐 Listener web (foreground) - Maneja notificaciones directamente
      // NOTA: El Service Worker solo maneja notificaciones en background
      const unsubscribe = onMessage(
        messagingFirebase,
        (payload: MessagePayload) => {
          trackEvent('OPS_RECEIVED_NOTIFICATION', {
            notification_id: payload.messageId,
          });

          // 🧹 Limpiar HTML de la notificación para logs y procesamiento
          const originalTitle =
            payload.data?.title ||
            payload.notification?.title ||
            'Nueva notificación';
          const originalBody =
            payload.data?.body || payload.notification?.body || '';
          const cleanTitle = stripHtmlTags(originalTitle);
          const cleanBody = stripHtmlTags(originalBody);

          // 🔄 Ejecutar callback si está configurado
          setReceibingNotification(true);

          // 🔔 En foreground, mostrar notificación usando Service Worker Registration
          if (Notification.permission === 'granted') {
            const notificationTitle = stripHtmlTags(
              cleanTitle || 'Nueva notificación'
            );
            const notificationBody = stripHtmlTags(cleanBody || '');
            const tag =
              payload.data?.notification_id ||
              'msg-' +
                Date.now() +
                '-' +
                Math.random().toString(36).slice(2, 15);
            const notificationOptions = {
              body: notificationBody,
              icon: payload.data?.icon || '/icons/icon-512.png', // Icono pequeño (badge)
              badge: '/icons/icon.svg',
              tag: tag,
              requireInteraction: true,
              silent: false,
              data: {
                ...payload,
                messageId: payload.messageId, // 🔔 Asegurar que messageId esté disponible
              },
            };

            try {
              // ✅ Usar Service Worker Registration para mostrar notificación
              if ('serviceWorker' in navigator) {
                navigator.serviceWorker
                  .getRegistration()

                  .then((registration) => {
                    if (registration) {
                      registration.showNotification(
                        notificationTitle,
                        notificationOptions
                      );
                      // ✅ El click se maneja automáticamente en el Service Worker
                    } else {
                      console.warn(
                        '⚠️ No hay SW Registration, intentando new Notification()'
                      );
                      // Fallback para casos sin SW
                      const notification = new Notification(
                        notificationTitle,
                        notificationOptions
                      );

                      notification.onclick = () => {
                        window.open(
                          '/home?source=notification&notification_id=' +
                            payload.messageId,
                          '_blank'
                        );
                        notification.close();
                      };

                      setTimeout(() => notification.close(), 5000);
                    }
                  });
              } else {
                console.warn(
                  '⚠️ Service Worker no soportado, usando new Notification()'
                );
                // Fallback para navegadores sin SW
                const notification = new Notification(
                  notificationTitle,
                  notificationOptions
                );

                notification.onclick = () => {
                  window.open(
                    '/home?source=notification&notification_id=' +
                      payload.messageId,
                    '_blank'
                  );
                  notification.close();
                };

                setTimeout(() => notification.close(), 5000);
              }
            } catch (error) {
              console.error('❌ Error creando notificación desde hook:', error);
            }
          }

          setState((prev) => ({
            ...prev,
            lastNotification: payload,
          }));
        }
      );

      return unsubscribe;
    }
  }, [isNative]);

  // 🚀 Verificar permisos al inicializar el hook
  useEffect(() => {
    checkCurrentPermissions();
  }, [checkCurrentPermissions]);

  return {
    state,
    requestPermissions,
    getToken,
    clearError,
    checkCurrentPermissions,
    clearClickedNotification,
    receibingNotification,
    setReceibingNotification,
  };
};
