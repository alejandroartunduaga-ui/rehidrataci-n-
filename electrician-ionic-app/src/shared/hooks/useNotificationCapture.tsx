import { useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';

interface NotificationData {
  source?: string;
  notificationTitle?: string;
  notificationBody?: string;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  notificationData?: any;
  visit_id?: string;
}

export const useNotificationCapture = () => {
  const location = useLocation();
  const [capturedNotification, setCapturedNotification] =
    useState<NotificationData | null>(null);

  useEffect(() => {
    // Obtener parámetros de la URL
    const searchParams = new URLSearchParams(location.search);

    // Verificar si viene de una notificación
    if (searchParams.get('source') === 'notification') {
      const notificationInfo: NotificationData = {
        source: searchParams.get('source') || undefined,
        notificationTitle: searchParams.get('notificationTitle') || undefined,
        notificationBody: searchParams.get('notificationBody') || undefined,
        visit_id: searchParams.get('visit_id') || undefined,
      };

      // Obtener data adicional de la notificación
      const notificationDataStr = searchParams.get('notificationData');
      if (notificationDataStr) {
        try {
          notificationInfo.notificationData = JSON.parse(notificationDataStr);
        } catch (error) {
          console.error('❌ Error parseando notificationData:', error);
        }
      }

      // Guardar en estado
      setCapturedNotification(notificationInfo);

      // Limpiar URL después de capturar (opcional)
      // window.history.replaceState({}, document.title, location.pathname);
    }
  }, [location.search]);

  return {
    capturedNotification,
    clearCapturedNotification: () => setCapturedNotification(null),
  };
};
