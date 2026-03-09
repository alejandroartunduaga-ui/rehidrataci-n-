import { httpClient } from '@shared/httpClient/httpClient';
import { endpoints } from '@shared/data/endpoints.global';
import { INotification } from '../interfaces/Notifications.interface';

export const fetchNotificationsServer = async (): Promise<INotification[]> => {
  try {
    const response: INotification[] = await httpClient.post(
      endpoints.getNotifications,
      {}
    );
    return response;
  } catch (error) {
    console.error('Error al obtener notificaciones:', error);
    throw error;
  }
};

export const fetchNotificationsLocal = async (): Promise<INotification[]> => {
  return [];
};

/**
 * Suscribir dispositivo a notificaciones push
 * @param subscriptionData Datos de suscripción del dispositivo
 * @returns Promise con la respuesta del servidor
 */
export const fetchNotifications = async (
  isOnline: boolean
): Promise<INotification[]> => {
  if (isOnline) {
    return fetchNotificationsServer();
  } else {
    return fetchNotificationsLocal();
  }
};
