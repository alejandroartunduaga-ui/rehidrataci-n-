import { httpClient, useConnectivityStore } from '@shared/index';
import { formsManagementEndpoints } from '../endpoints/forms-management.endpoints';
import { IS3UploadResponse } from '../interfaces/uploadFileS3.interface';

/**
 * Sube un archivo al servidor S3
 * @param base64File Archivo en formato base64
 * @param fileName Nombre del archivo
 * @param path Ruta donde se almacenará el archivo en S3
 * @returns Promise con la respuesta del servidor
 */
export const uploadFileToServer = async (
  blob: Blob,
  fileName: string,
  field_code: string
): Promise<IS3UploadResponse> => {
  try {
    // Configurar endpoint con el parámetro path
    const endpoint = { ...formsManagementEndpoints.uploadFile };
    endpoint.url = endpoint.url.replace('${path}', 'public/photovisit');

    const formData = new FormData();
    formData.append('file', blob, `${fileName}.png`);

    // Subir el archivo al servidor
    const response: IS3UploadResponse = await httpClient.post(
      endpoint,
      formData
    );

    // Retornar la respuesta
    return {
      location: response.location,
      name: fileName,
      field_code,
    };
  } catch (error) {
    console.error('Error al subir archivo al servidor:', error);
    throw error;
  }
};

/**
 * Maneja la subida de archivo localmente cuando no hay conexión
 * @param base64File Archivo en formato base64
 * @param fileName Nombre del archivo
 * @param path Ruta donde se almacenará el archivo en S3
 * @returns Promise con la respuesta simulada
 */
export const uploadFileToLocal = async (
  blob: Blob,
  fileName: string,
  field_code: string
): Promise<IS3UploadResponse> => {
  try {
    return {
      location: `local://${fileName}_${Date.now()}`,
      name: fileName,
      field_code: field_code,
    };
  } catch (error) {
    console.error('Error al manejar archivo localmente:', error);
    throw error;
  }
};

/**
 * Sube un archivo según el estado de la conexión
 * @param base64File Archivo en formato base64
 * @param fileName Nombre del archivo
 * @param path Ruta donde se almacenará el archivo en S3
 * @returns Promise con la respuesta de la subida
 */
export const fetchUploadFile = async (
  blob: Blob,
  fileName: string,
  field_code: string
): Promise<IS3UploadResponse> => {
  const isOnline = useConnectivityStore.getState().isOnline;

  if (isOnline) {
    return uploadFileToServer(blob, fileName, field_code);
  } else {
    return uploadFileToLocal(blob, fileName, field_code);
  }
};
