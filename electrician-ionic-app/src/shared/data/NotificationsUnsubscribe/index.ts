import { httpClient } from '@shared/httpClient/httpClient';
import { endpoints } from '@shared/data/endpoints.global';
import { INotificationsUnsubscribeResponse } from '../interfaces/NotificationsUnsubscribe.interface';

/**
 * Suscribir dispositivo a notificaciones push
 * @param subscriptionData Datos de suscripción del dispositivo
 * @returns Promise con la respuesta del servidor
 */
export const fetchNotificationsUnsubscribe = async (
  token: string
): Promise<INotificationsUnsubscribeResponse> => {
  try {
    const response: INotificationsUnsubscribeResponse = await httpClient.delete(
      endpoints.unsubscribeFromNotifications,
      {
        token_firebase: token,
      }
    );

    return response;
  } catch (error) {
    console.error('Error al desuscribir de notificaciones:', error);
    throw error;
  }
};
