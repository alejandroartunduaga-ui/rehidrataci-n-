import { httpClient, useConnectivityStore } from '@shared/index';
import { visitsEndpoints } from '../endpoints/visits.endpoints';

import {
  IArrivalPhoto,
  IArrivalPhotoResponse,
  IArrivalPhotosRequest,
  IArrivalPhotosResponse,
} from '../interfaces/arrival.interface';

/**
 * Postea fotos de llegada al servidor
 * @param activity_id ID de la actividad
 * @param photos Array de base64 strings de fotos
 * @returns Promise con la respuesta del servidor
 */
export const postArrivalPhotos = async (
  activity_id: string,
  photos: IArrivalPhoto[]
): Promise<IArrivalPhotosResponse> => {
  try {
    const endpoint = { ...visitsEndpoints.arrivalPhotos };
    endpoint.url = endpoint.url.replace('${ACTIVITY_ID}', activity_id);
    const data: IArrivalPhotosRequest = { photos };
    const response: IArrivalPhotoResponse[] = await httpClient.post(
      endpoint,
      data
    );
    return {
      success: true,
      message: 'Fotos almacenadas',
      data: { photos: response },
    };
  } catch (error) {
    console.error('Error al postear fotos de llegada:', error);
    return {
      success: false,
      message: 'Error al postear fotos de llegada',
      data: {
        photos: photos.map((photo) => ({
          captured_at: photo.captured_at,
          id: 0,
          url: photo.url ?? '',
          visit_id: activity_id,
        })),
      },
    };
  }
};

/**
 * Almacena fotos de llegada en la base de datos local
 * @param activity_id ID de la actividad
 * @param photos Array de base64 strings de fotos
 * @returns Promise con respuesta simulada
 */
export const postArrivalPhotosDB = async () /* activity_id: string,
  photos: IArrivalPhoto[] */
: Promise<IArrivalPhotosResponse> => {
  try {
    /* const updatedVisit: ITableArrivalPhotos = {
      visitId: activity_id,
      photos: photos,
      createdAt: new Date(),
      updatedAt: new Date(),
    }; */
    return {
      success: true,
      message: 'Fotos almacenadas localmente',
      data: { photos: [] },
    };
  } catch (error) {
    console.error('Error al almacenar fotos en DB:', error);
    throw error;
  }
};

/**
 * Postea o almacena fotos según conectividad
 * @param activity_id ID de la actividad
 * @param photos Array de base64 strings de fotos
 * @returns Promise con la respuesta
 */
export const fetchPostArrivalPhotos = async (
  activity_id: string,
  photos: IArrivalPhoto[]
): Promise<IArrivalPhotosResponse> => {
  const isOnline = useConnectivityStore.getState().isOnline;
  if (isOnline) {
    return postArrivalPhotos(activity_id, photos);
  } else {
    return postArrivalPhotosDB();
    //activity_id, photos
  }
};
