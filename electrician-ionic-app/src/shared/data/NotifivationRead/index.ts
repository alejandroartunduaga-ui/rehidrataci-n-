import { httpClient } from '@shared/httpClient/httpClient';
import { endpoints } from '@shared/data/endpoints.global';
import { INotificationsReadResponse } from '../interfaces/NotifivationRead.interface';

/**
 * Suscribir dispositivo a notificaciones push
 * @param ids IDs de las notificaciones
 * @returns Promise con la respuesta del servidor
 */
export const fetchNotificationsRead = async (
  ids: string[]
): Promise<INotificationsReadResponse> => {
  try {
    const response: INotificationsReadResponse = await httpClient.post(
      endpoints.readNotification,
      {
        notification_ids: ids,
      }
    );

    return response;
  } catch (error) {
    console.error('Error al marcar como leído:', error);
    throw error;
  }
};
