import { httpClient } from '@shared/index';
import { visitsEndpoints } from '../endpoints/visits.endpoints';
import { IVisitDetail } from '../interfaces/visitDetail.interface';
import { getTableDataByQuery } from '@shared/db/databaseService';

import {
  IDataBaseNames,
  IDataBaseTables,
  ITableVisit,
} from '@shared/data/IDatabase';

/**
 * Obtiene las descripciones de las actividades
 * Primero verifica en la base de datos local, si no existe hace petición HTTP
 * @param activityId ID de la actividad (opcional)
 * @returns Promise con los datos de las descripciones
 */
export const getActivitiesDescriptions = async (
  activityId: string
): Promise<IVisitDetail> => {
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
    if (localData.length > 0 && localData[0].detail) {
      return localData[0].detail;
    }

    // Si no existe localmente, hacer petición HTTP
    const response: IVisitDetail = await httpClient.get(
      visitsEndpoints.getActivitiesDescriptions,
      {
        headers: {
          'x-time-zone': '-5',
        },
        queryParams: {
          activity_id: activityId,
        },
      }
    );
    return response;
  } catch (error) {
    console.error('Error al obtener descripciones de actividades:', error);
    throw error;
  }
};

export const getActivitiesDescriptionsDB = async (
  activityId: string
): Promise<IVisitDetail> => {
  try {
    // Implementación de la función para obtener datos de la base de datos local
    const data: ITableVisit[] = await getTableDataByQuery(
      IDataBaseNames.OPERACIONES,
      IDataBaseTables.VISITS,
      (table) => {
        return table.where('visitId').equals(activityId).toArray();
      }
    );
    return data[0].detail;
  } catch (error) {
    console.error('Error al obtener descripciones de la base de datos:', error);
    throw error;
  }
};

/**
 * Obtiene las descripciones de las actividades según el estado de la conexión
 * @param activityId ID de la actividad
 * @returns Promise con los datos de las descripciones
 */
export const fetchVisitDetail = async (
  activityId: string,
  isOnline: boolean
): Promise<IVisitDetail> => {
  if (isOnline) {
    return getActivitiesDescriptions(activityId);
  } else {
    return getActivitiesDescriptionsDB(activityId);
  }
};