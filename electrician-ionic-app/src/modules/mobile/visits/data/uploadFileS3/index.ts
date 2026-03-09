import { endpoints, httpClient, useConnectivityStore } from '@shared/index';
import { IS3UploadResponse } from '@mobile/forms-management/data/interfaces/uploadFileS3.interface';
import { IArrivalPhoto } from '@mobile/visits';
import {
  upsertTableData,
  getTableDataByQuery,
} from '@shared/db/databaseService';
import {
  IDataBaseNames,
  IDataBaseTables,
  ITableArrivalPhotos,
} from '@shared/data/IDatabase';

/**
 * Sube un archivo al servidor S3
 * @param photo Foto con blob comprimido
 * @param activity_id ID de la actividad
 * @param index Índice de la foto
 * @returns Promise con la respuesta del servidor
 */
export const uploadFileToServer = async (
  photo: IArrivalPhoto,
  activity_id: string,
  index: number
): Promise<IS3UploadResponse> => {
  try {
    // Configurar endpoint con el parámetro path
    const endpoint = { ...endpoints.uploadVisitAct };
    endpoint.url = endpoint.url.replace(
      '${path}',
      'public/visit/photo/visitArrival'
    );
    endpoint.url = endpoint.url.replace(
      '${name}',
      `Arrival_${activity_id}_${photo.captured_at}_${index}.png`
    );

    // Usar siempre el blob
    const formData = new FormData();
    formData.append(
      'file',
      photo.blob,
      `Arrival_${activity_id}_${photo.captured_at}_${index}.png`
    );

    // Subir el archivo al servidor
    const response: IS3UploadResponse = await httpClient.post(
      endpoint,
      formData
    );

    // Retornar la respuesta
    return {
      location: response.location,
      name: `Arrival_${activity_id}_${photo.captured_at}_${index}.png`,
      field_code: 'arrival',
    };
  } catch (error) {
    console.error('Error al subir archivo al servidor:', error);
    throw error;
  }
};

/**
 * Maneja la subida de archivo localmente cuando no hay conexión
 * @param photo Foto de llegada con blob
 * @param activity_id ID de la actividad
 * @param index Índice de la foto
 * @returns Promise con la respuesta simulada
 */
export const uploadFileToLocal = async (
  photo: IArrivalPhoto,
  activity_id: string,
  index: number
): Promise<IS3UploadResponse> => {
  try {
    const fileName = `Arrival_${activity_id}_${photo.captured_at}_${index}.png`;
    const localLocation = `local://${fileName}`;

    // Convertir blob a Data URL para almacenamiento en BD
    const urlForStorage = await blobToDataUrl(photo.blob);

    // Crear la foto con la URL local (sin blob para almacenamiento)
    const photoWithLocalUrl = {
      captured_at: photo.captured_at,
      url: urlForStorage,
      name: fileName,
    };

    // Obtener las fotos existentes o crear nuevo registro
    const existingRecords = await getTableDataByQuery<ITableArrivalPhotos>(
      IDataBaseNames.OPERACIONES,
      IDataBaseTables.ARRIVAL_PHOTOS,
      (table) => table.where('visitId').equals(activity_id).toArray()
    );

    const existingRecord =
      existingRecords.length > 0 ? existingRecords[0] : null;

    // Para almacenamiento temporal usamos cualquier tipo ya que la tabla guarda URLs
    const photoData = {
      visitId: activity_id,
      photos: existingRecord
        ? [...existingRecord.photos, photoWithLocalUrl]
        : [photoWithLocalUrl],
      createdAt: existingRecord?.createdAt || new Date(),
      updatedAt: new Date(),
    } as ITableArrivalPhotos;

    // Guardar en la tabla arrival_photos
    await upsertTableData(
      IDataBaseNames.OPERACIONES,
      IDataBaseTables.ARRIVAL_PHOTOS,
      photoData
    );

    return {
      location: localLocation,
      name: fileName,
      field_code: 'arrival',
    };
  } catch (error) {
    console.error('Error al manejar archivo localmente:', error);
    throw error;
  }
};

/**
 * Convierte un blob a Data URL
 * @param blob Blob a convertir
 * @returns Promise con el Data URL
 */
function blobToDataUrl(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
}

/**
 * Sube un archivo según el estado de la conexión
 * @param photo Foto de llegada con blob
 * @param activity_id ID de la actividad
 * @param index Índice de la foto
 * @returns Promise con la respuesta de la subida
 */
export const fetchUploadFileAIArrivalPhoto = async (
  photo: IArrivalPhoto,
  activity_id: string,
  index: number
): Promise<IS3UploadResponse> => {
  const isOnline = useConnectivityStore.getState().isOnline;

  if (isOnline) {
    return uploadFileToServer(photo, activity_id, index);
  } else {
    return uploadFileToLocal(photo, activity_id, index);
  }
};
