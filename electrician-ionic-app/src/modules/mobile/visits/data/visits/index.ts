import { httpClient } from '@shared/index';
import { visitsEndpoints } from '../endpoints/visits.endpoints';
import {
  IVisitNew,
  IVisitNewByDate,
  Ivisits,
} from '../interfaces/visits.interface';
import {
  IDataBaseNames,
  IDataBaseTables,
  ITableVisit,
} from '@shared/data/IDatabase';
import { getTableDataByQuery } from '@shared/db/databaseService';
import { RolesEnum } from '@auth/index';

/**
 * Obtiene las páginas de una actividad desde el servidor usando visits endpoint
 * @param activityId ID de la actividad
 * @param isFailedVisit Si es true, obtiene datos de visita fallida
 * @returns Promise con los datos de las páginas
 */
export const getVisits = async (
  roleUser: RolesEnum
): Promise<IVisitNewByDate[]> => {
  try {
    const url =
      roleUser === RolesEnum.CONTRACTOR_MANAGER
        ? visitsEndpoints.getVisitsManager
        : visitsEndpoints.getVisitsTechnical;
    const response: Ivisits = await httpClient.get(url, {
      headers: {
        'x-time-zone': '-5',
      },
    });
    return createActivitiesList(response);
  } catch (error) {
    console.error(
      'Error al obtener páginas de la actividad desde visits:',
      error
    );
    throw error;
  }
};

/**
 * Obtiene las páginas de una actividad desde la base de datos local
 * @param activityId ID de la actividad
 * @param isFailedVisit Si es true, obtiene stepsFailed; si es false, obtiene steps
 * @returns Promise con los datos de las páginas
 */
export const getVisitsDB = async (): Promise<IVisitNewByDate[]> => {
  try {
    const visits: ITableVisit[] = await getTableDataByQuery(
      IDataBaseNames.OPERACIONES,
      IDataBaseTables.VISITS,
      (table) => {
        return table.toArray();
      }
    );
    const listVisits: IVisitNewByDate[] = [];
    visits.forEach((visit) => {
      listVisits.push({
        date: visit.data.date,
        visits: [visit.data],
      });
    });
    return listVisits;
  } catch (error) {
    console.error(
      'Error al obtener páginas de la actividad de la base de datos (desde visits):',
      error
    );
    throw error;
  }
};

/**
 * Obtiene las páginas de una actividad según el estado de la conexión
 * @param activityId ID de la actividad
 * @param isFailedVisit Si es true, obtiene datos de visita fallida
 * @returns Promise con los datos de las páginas
 */
export const fetchVisits = async (
  isOnline: boolean,
  roleUser: RolesEnum
): Promise<IVisitNewByDate[]> => {
  if (isOnline) {
    return getVisits(roleUser);
  } else {
    return getVisitsDB();
  }
};

/**
 * Función auxiliar para convertir fecha DD-MM-YYYY a objeto Date
 * @param dateString Fecha en formato "DD-MM-YYYY"
 * @returns Objeto Date válido
 */
const parseDateVisits = (dateString: string): Date => {
  const [day, month, year] = dateString.split('-');
  // Crear fecha con formato YYYY-MM-DD que Date() entiende correctamente
  return new Date(`${year}-${month}-${day}`);
};

/**
 * Función auxiliar para agrupar visitas por fecha
 * @param visits Array de visitas individuales
 * @returns Array agrupado por fecha según interfaz IVisitNewByDate
 */
const groupVisitsByDate = (visits: IVisitNew[]): IVisitNewByDate[] => {
  // Crear objeto para agrupar por fecha
  const groupedVisits: Record<string, IVisitNew[]> = {};

  // Agrupar visitas por fecha
  visits.forEach((visit) => {
    const dateKey = visit.date;
    if (!groupedVisits[dateKey]) {
      groupedVisits[dateKey] = [];
    }
    groupedVisits[dateKey].push(visit);
  });

  // Convertir a array de IVisitNewByDate y ordenar por fecha (desde la más lejana hasta la más actual)
  const result: IVisitNewByDate[] = Object.entries(groupedVisits)
    .map(([date, visitsForDate]) => ({
      date,
      visits: visitsForDate,
    }))
    .sort((a, b) => {
      const dateA = parseDateVisits(a.date);
      const dateB = parseDateVisits(b.date);
      return dateA.getTime() - dateB.getTime(); // Ordenar de más lejana a más actual
    });

  return result;
};

/**
 * Función para crear listado de actividades agrupado por fecha desde la respuesta de fetchVisits
 * @param visits Respuesta de fetchVisits
 * @returns Listado de actividades agrupado por fecha con interfaz IVisitNewByDate[]
 */
const createActivitiesList = (visits: Ivisits): IVisitNewByDate[] => {
  const activitiesList: IVisitNew[] = [];

  // Recorrer todas las categorías
  visits.categories.forEach((category) => {
    // Agregar todas las actividades de cada categoría
    category.activities.forEach((activity) => {
      // Asegurar que la actividad tenga name y type (ya los tiene por formatVisits)
      activity.visits.forEach((visit) => {
        const formattedVisit: IVisitNew = {
          activity_id: visit.activity_id,
          card_information: visit.card_information,
          nameActivity: category.name,
          typeActivity: category.type,
          date: activity.date,
        };
        activitiesList.push(formattedVisit);
      });
    });
  });

  // Agrupar por fecha
  const groupedByDate = groupVisitsByDate(activitiesList);
  return groupedByDate;
};
