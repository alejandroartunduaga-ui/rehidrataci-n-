import { httpClient, useConnectivityStore } from '@shared/index';
import { formsManagementEndpoints } from '../endpoints/forms-management.endpoints';
import { upsertTableData } from '@shared/db/databaseService';
import { IDataBaseNames, IDataBaseTables } from '@shared/data/IDatabase';
import {
  ISaveFormsRequest,
  ISaveFormsResponse,
} from '../interfaces/saveForms.interface';

/**
 * Guarda los formularios en el servidor
 * @param formData Datos del formulario a guardar
 * @returns Promise con la respuesta del servidor
 */
export const saveFormsToServer = async (
  formData: ISaveFormsRequest
): Promise<ISaveFormsResponse> => {
  try {
    const response: ISaveFormsResponse = await httpClient.post(
      formsManagementEndpoints.saveForms,
      formData
    );
    return response;
  } catch (error) {
    console.error('Error al guardar formularios en el servidor:', error);
    throw error;
  }
};

/**
 * Guarda los formularios en la base de datos local
 * @param formData Datos del formulario a guardar
 * @returns Promise con la respuesta local
 */
export const saveFormsToDatabase = async (
  formData: ISaveFormsRequest
): Promise<ISaveFormsResponse> => {
  try {
    // Estructura para guardar en la base de datos local
    const dbData = {
      visitId: formData.visit_id,
      data: formData,
      savedAt: new Date(),
      synced: false, // Indica que no se ha sincronizado con el servidor
    };

    await upsertTableData(
      IDataBaseNames.OPERACIONES,
      IDataBaseTables.VISITS,
      dbData
    );

    return {
      success: true,
      message: 'Formularios guardados localmente',
    };
  } catch (error) {
    console.error(
      'Error al guardar formularios en la base de datos local:',
      error
    );
    throw error;
  }
};

/**
 * Guarda los formularios según el estado de la conexión
 * @param formData Datos del formulario a guardar
 * @returns Promise con la respuesta
 */
export const fetchSaveForms = async (
  formData: ISaveFormsRequest
): Promise<ISaveFormsResponse> => {
  const isOnline = useConnectivityStore.getState().isOnline;

  if (isOnline) {
    return saveFormsToServer(formData);
  } else {
    return saveFormsToDatabase(formData);
  }
};
