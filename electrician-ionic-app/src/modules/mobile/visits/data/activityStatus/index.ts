import { httpClient, useConnectivityStore } from '@shared/index';
import { visitsEndpoints } from '../endpoints/visits.endpoints';
import {
  getTableDataByQuery,
  upsertTableData,
} from '@shared/db/databaseService';
import {
  IDataBaseNames,
  IDataBaseTables,
  ITableVisitsSteps,
  ITableVisit,
} from '@shared/data/IDatabase';
import {
  ActivityStatus,
  ICTActivityStatus,
} from '../interfaces/visits.interface';
import {
  IActivityStatus,
  IActivityStatusRequest,
  IChangeActivityStatusRequest,
  IChangeActivityStatusResponse,
} from '../interfaces/activityStatus.interface';
import { IDescription, IField } from '../interfaces/visitDetail.interface';

/**
 * Cambia el estado de una actividad desde el servidor
 * Implementa estrategia "cache first": actualiza BD local primero si existe la visita
 * @param activity_id ID de la actividad
 * @param activity_status Nuevo estado de la actividad
 * @returns Promise con la respuesta del servidor
 */
export const changeActivityStatus = async (
  activity_id: string,
  activity_status: IActivityStatus[]
): Promise<IChangeActivityStatusResponse> => {
  try {
    // Verificar si existe la visita en la base de datos local
    const localVisitData = await getTableDataByQuery(
      IDataBaseNames.OPERACIONES,
      IDataBaseTables.VISITS,
      (table) => {
        return table.where('visitId').equals(activity_id).toArray();
      }
    );

    // Si existe en BD local, actualizar primero localmente para respuesta inmediata
    if (localVisitData.length > 0) {
      try {
        await changeActivityStatusDB(activity_id, activity_status);
      } catch (localError) {
        console.warn(
          '⚠️ Error al actualizar BD local, continuando con servidor:',
          localError
        );
      }
    }

    // Hacer petición HTTP al servidor
    const data: IChangeActivityStatusRequest = {
      states: activity_status,
    };
    const endpoint = { ...visitsEndpoints.changeActivityStatus };
    endpoint.url = endpoint.url.replace('${ACTIVITY_ID}', activity_id);
    const response: IActivityStatusRequest[] = await httpClient.post(
      endpoint,
      data
    );

    return {
      succes: true,
      message:
        localVisitData.length > 0
          ? 'Estado actualizado en BD local y servidor'
          : 'Estado actualizado en el servidor',
      data: response,
    };
  } catch (error) {
    console.error('Error al cambiar estado de la actividad:', error);
    throw error;
  }
};

/**
 * Cambia el estado de una actividad desde la base de datos local
 * @param activity_id ID de la actividad
 * @param activity_status Nuevo estado de la actividad
 * @returns Promise con la respuesta simulada
 */
export const changeActivityStatusDB = async (
  activity_id: string,
  activity_status: IActivityStatus[]
): Promise<IChangeActivityStatusResponse> => {
  try {
    const now = new Date();

    // 1. Actualizar la tabla VISITS_STEPS
    const existingStepsData = await getTableDataByQuery(
      IDataBaseNames.OPERACIONES,
      IDataBaseTables.VISITS_STEPS,
      (table) => {
        return table.where('visitId').equals(activity_id).toArray();
      }
    );

    let updatedSteps: IActivityStatus[] = [];

    if (existingStepsData.length > 0) {
      const currentRecord = existingStepsData[0] as ITableVisitsSteps;
      const currentSteps = currentRecord.steps || [];
      const currentStatuses = new Set(currentSteps.map((s) => s.status));
      const newSteps = activity_status.filter(
        (as) => !currentStatuses.has(as.status)
      );
      updatedSteps = [...currentSteps, ...newSteps];
    } else {
      updatedSteps = [...activity_status];
    }

    // Actualizar/crear registro en VISITS_STEPS
    const stepsRecordToUpsert: ITableVisitsSteps = {
      visitId: activity_id,
      steps: updatedSteps.map((step) => ({
        status: step.status,
        created_at_app: step.created_at_app,
        is_online: false,
      })),
      createdAt:
        existingStepsData.length > 0 ? existingStepsData[0].createdAt : now,
      updatedAt: now,
    };

    await upsertTableData(
      IDataBaseNames.OPERACIONES,
      IDataBaseTables.VISITS_STEPS,
      stepsRecordToUpsert
    );

    // 2. Actualizar la tabla VISITS - detail.activity_status
    const existingVisitData = await getTableDataByQuery(
      IDataBaseNames.OPERACIONES,
      IDataBaseTables.VISITS,
      (table) => {
        return table.where('visitId').equals(activity_id).toArray();
      }
    );

    if (existingVisitData.length > 0) {
      const currentVisitRecord = existingVisitData[0] as ITableVisit;

      if (activity_status.length > 0) {
        const lastStatus = activity_status[activity_status.length - 1]
          .status as ActivityStatus;
        await updateStatusDB(currentVisitRecord, lastStatus);
      }
    } else {
      return {
        succes: false,
        message:
          'No se encontró registro en VISITS para visitId: ' + activity_id,
        data: [],
      };
    }

    return {
      succes: true,
      message: 'Estado actualizado localmente en ambas tablas',
      data: updatedSteps.map((step, index) => ({
        ...step,
        is_update_visit: true,
        is_update_steps: index,
      })),
    };
  } catch (error) {
    console.error(
      'Error al cambiar estado de la actividad en la base de datos:',
      error
    );
    throw error;
  }
};

/**
 * Cambia el estado de una actividad según el estado de la conexión
 * @param activity_id ID de la actividad
 * @param activity_status Nuevo estado de la actividad
 * @returns Promise con la respuesta del cambio de estado
 */
export const fetchChangeActivityStatus = async (
  activity_id: string,
  activity_status: IActivityStatus[]
): Promise<IChangeActivityStatusResponse> => {
  const isOnline = useConnectivityStore.getState().isOnline;
  if (isOnline) {
    return changeActivityStatus(activity_id, activity_status);
  } else {
    return changeActivityStatusDB(activity_id, activity_status);
  }
};

export const updateStatusDB = async (
  currentVisitRecord: ITableVisit,
  activity_status: ActivityStatus
) => {
  const updatedDescriptions: IDescription[] =
    currentVisitRecord.detail.descriptions.map((description) => ({
      ...description,
      fields: description.fields.map((field: IField) => {
        if (field.name === 'activity_status_title') {
          return {
            ...field,
            selected_value: [ICTActivityStatus.text[activity_status]],
            color: ICTActivityStatus.color[activity_status],
          };
        }
        return field;
      }),
    }));

  const updatedVisitRecord: ITableVisit = {
    ...currentVisitRecord,
    data: {
      ...currentVisitRecord.data,
      card_information: {
        ...currentVisitRecord.data.card_information,
        activity_status: activity_status,
        activity_status_color: ICTActivityStatus.color[activity_status],
        activity_status_title: ICTActivityStatus.text[activity_status],
      },
    },
    detail: {
      ...currentVisitRecord.detail,
      activity_status: activity_status,
      descriptions: updatedDescriptions,
    },
    updatedAt: new Date(),
  };
  await upsertTableData(
    IDataBaseNames.OPERACIONES,
    IDataBaseTables.VISITS,
    updatedVisitRecord
  );
};
