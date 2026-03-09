import { httpClient } from '@shared/httpClient/httpClient';
import { endpoints } from '@shared/data/endpoints.global';
import { INotificationsSubscribeResponse } from '../interfaces/NotificationsSubscribe.interface';

/**
 * Suscribir dispositivo a notificaciones push
 * @param subscriptionData Datos de suscripción del dispositivo
 * @returns Promise con la respuesta del servidor
 */
export const fetchNotificationsSubscribe = async (
  token: string
): Promise<INotificationsSubscribeResponse> => {
  try {
    const response: INotificationsSubscribeResponse = await httpClient.post(
      endpoints.subscribeToNotifications,
      {
        token_firebase: token,
      }
    );

    return response;
  } catch (error) {
    console.error('Error al suscribir dispositivo a notificaciones:', error);
    throw error;
  }
};
