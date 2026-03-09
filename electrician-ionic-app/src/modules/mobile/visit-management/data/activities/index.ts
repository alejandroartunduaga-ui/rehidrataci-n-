import { httpClient, useConnectivityStore } from '@shared/index';
import { visitManagementEndpoints } from '../endpoints/visit-management.endpoints';
import { getTableDataByQuery } from '@shared/db/databaseService';
import {
  IDataBaseNames,
  IDataBaseTables,
  ITableVisit,
} from '@shared/data/IDatabase';
import { IPagesByActivityIdResponse } from '../interfaces/history.interface';

/**
 * Obtiene las páginas de una actividad desde el servidor
 * Primero verifica en la base de datos local, si no existe hace petición HTTP
 * @param activityId ID de la actividad
 * @param isFailedVisit Si es true, obtiene stepsFailed; si es false, obtiene steps
 * @returns Promise con los datos de las páginas
 */
export const getPagesByActivityId = async (
  activityId: string,
  isFailedVisit: boolean
): Promise<IPagesByActivityIdResponse> => {
  try {
    // Primero intentar obtener de la base de datos local
    const localData: ITableVisit[] = await getTableDataByQuery(
      IDataBaseNames.OPERACIONES,
      IDataBaseTables.VISITS,
      (table) => {
        return table.where('visitId').equals(activityId).toArray();
      }
    );

    // Si existe en la base de datos local, retornar ese valor
    if (localData.length > 0) {
      const visitData = localData[0];

      // Verificar si tiene los datos requeridos según el tipo de visita
      const hasRequiredData = isFailedVisit
        ? visitData.stepsFailed
        : visitData.steps;

      if (hasRequiredData) {
        return hasRequiredData as IPagesByActivityIdResponse;
      }
    }

    // Si no existe localmente o no tiene los datos requeridos, hacer petición HTTP
    const queryParams: Record<string, string> = {
      activity_id: activityId,
    };
    if (isFailedVisit) {
      queryParams.visit_type = 'FAILED';
    }
    const response: IPagesByActivityIdResponse = await httpClient.get(
      visitManagementEndpoints.pagesByActivityId,
      {
        headers: {
          'x-time-zone': '-5',
        },
        queryParams: queryParams,
      }
    );
    return response;
  } catch (error) {
    console.error('Error al obtener páginas de la actividad:', error);
    throw error;
  }
};

/**
 * Obtiene las páginas de una actividad desde la base de datos local
 * @param activityId ID de la actividad
 * @param isFailedVisit Si es true, obtiene stepsFailed; si es false, obtiene steps
 * @returns Promise con los datos de las páginas
 */
export const getPagesByActivityIdDB = async (
  activityId: string,
  isFailedVisit: boolean
): Promise<IPagesByActivityIdResponse> => {
  try {
    const data: ITableVisit[] = await getTableDataByQuery(
      IDataBaseNames.OPERACIONES,
      IDataBaseTables.VISITS,
      (table) => {
        return table.where('visitId').equals(activityId).toArray();
      }
    );
    if (data.length === 0) {
      throw new Error(
        'No se encontraron páginas de la actividad en la base de datos local'
      );
    }

    const visitData = data[0];

    // Devolver data.steps o data.stepsFailed según el parámetro isFailedVisit
    if (isFailedVisit) {
      if (!visitData.stepsFailed) {
        throw new Error(
          `No se encontraron datos de stepsFailed para la actividad ${activityId}`
        );
      }
      return visitData.stepsFailed as IPagesByActivityIdResponse;
    } else {
      if (!visitData.steps) {
        throw new Error(
          `No se encontraron datos de steps para la actividad ${activityId}`
        );
      }
      return visitData.steps as IPagesByActivityIdResponse;
    }
  } catch (error) {
    console.error(
      'Error al obtener páginas de la actividad de la base de datos:',
      error
    );
    throw error;
  }
};

/**
 * Obtiene las páginas de una actividad según el estado de la conexión
 * @param activityId ID de la actividad
 * @returns Promise con los datos de las páginas
 */
export const fetchActivityPages = async (
  activityId: string,
  isFailedVisit: boolean
): Promise<IPagesByActivityIdResponse> => {
  const isOnline = useConnectivityStore.getState().isOnline;
  if (isOnline) {
    return getPagesByActivityId(activityId, isFailedVisit);
  } else {
    return getPagesByActivityIdDB(activityId, isFailedVisit);
  }
};
