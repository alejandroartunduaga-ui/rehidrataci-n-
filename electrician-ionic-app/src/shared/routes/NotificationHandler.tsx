import { useEffect } from 'react';
import { useNotificationCapture } from '@shared/hooks/useNotificationCapture';

export const NotificationHandler: React.FC = () => {
  // 🔔 Capturar data de notificaciones cuando se abre desde Service Worker
  const { capturedNotification } = useNotificationCapture();

  // 🔔 Procesar notificación capturada
  useEffect(() => {
    if (capturedNotification) {
      // Aquí puedes agregar lógica adicional si necesitas procesar la notificación
      // Por ejemplo: mostrar un toast, actualizar estado global, etc.
    }
  }, [capturedNotification]);

  // Este componente no renderiza nada, solo maneja la lógica de notificaciones
  return null;
};
