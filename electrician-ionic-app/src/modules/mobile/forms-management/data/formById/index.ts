import { httpClient, useConnectivityStore } from '@shared/index';
import { formsManagementEndpoints } from '../endpoints/forms-management.endpoints';
import { getTableDataByQuery } from '@shared/db/databaseService';
import {
  IDataBaseNames,
  IDataBaseTables,
  ITableForms,
} from '@shared/data/IDatabase';
import { IFormResponse, IFormsMap } from '../interfaces/formById.interface';

/**
 * Obtiene los datos del formulario desde el servidor
 * @param activityId ID de la actividad
 * @param pageCode Código de la página
 * @returns Promise con los datos del formulario
 */
export const getFormById = async (
  activityId: string,
  pageCode: string,
  type?: 'normal' | 'failed'
): Promise<IFormsMap> => {
  try {
    const endpoint = { ...formsManagementEndpoints.formById };
    // endpoint.url = endpoint.url
    //   .replace('${ACTIVITY_ID}', activityId)
    //   .replace('${PAGE_CODE}', pageCode);
    const queryParams: Record<string, string> = {
      activity_id: activityId,
      page_code: pageCode,
    };
    if (type === 'failed') {
      queryParams.visit_type = 'FAILED';
    }
    const response: IFormResponse[] = await httpClient.get(endpoint, {
      headers: {
        'x-time-zone': '-5',
      },
      queryParams: queryParams,
    });
    const mappedResponse: IFormsMap = {
      dataForms: response,
      addInfo: [],
      photos: [],
    };
    return mappedResponse;
  } catch (error) {
    console.error('Error al obtener datos del formulario:', error);
    throw error;
  }
};

/**
 * Obtiene los datos del formulario desde la base de datos local (tabla FORMS)
 * @param activityId ID de la actividad
 * @param pageCode Código de la página
 * @param type Tipo de formulario ('normal' o 'failed') - opcional
 * @returns Promise con los datos del formulario
 *
 * @description Consulta la tabla FORMS usando visitId_pageCode como clave.
 * Si no se especifica tipo y hay múltiples resultados, prioriza formularios 'normal'.
 * Los datos se obtienen directamente del campo 'data' que contiene el objeto IFormsMap completo.
 */
export const getFormByIdDB = async (
  activityId: string,
  pageCode: string,
  type?: 'normal' | 'failed'
): Promise<IFormsMap> => {
  try {
    const visitId_pageCode = `${activityId}__${pageCode}`;

    const data: ITableForms[] = await getTableDataByQuery(
      IDataBaseNames.OPERACIONES,
      IDataBaseTables.FORMS,
      (table) => {
        const query = table.where('visitId_pageCode').equals(visitId_pageCode);

        return query.toArray();
      }
    );

    if (data.length === 0) {
      throw new Error(
        `No se encontraron datos del formulario en la base de datos local para ${visitId_pageCode}${type ? ` con tipo ${type}` : ''}`
      );
    }

    // Si hay múltiples resultados y no se especificó tipo, tomar el primero (preferiblemente 'normal')
    let selectedForm = data[0];
    if (data.length > 1 && !type) {
      const normalForm = data.find((form) => form.type === 'normal');
      selectedForm = normalForm || data[0];
    }

    // El campo data ya contiene el objeto IFormsMap completo
    const formData = selectedForm.data as IFormsMap;

    return formData;
  } catch (error) {
    console.error(
      'Error al obtener datos del formulario de la base de datos:',
      error
    );
    throw error;
  }
};

/**
 * Obtiene los datos del formulario según el estado de la conexión
 * @param activityId ID de la actividad
 * @param pageCode Código de la página
 * @param type Tipo de formulario ('normal' o 'failed') - opcional, solo para modo offline
 * @returns Promise con los datos del formulario
 */
export const fetchFormData = async (
  activityId: string,
  pageCode: string,
  type?: 'normal' | 'failed'
): Promise<IFormsMap> => {
  const isOnline = useConnectivityStore.getState().isOnline;
  if (isOnline) {
    return getFormById(activityId, pageCode, type);
  } else {
    return getFormByIdDB(activityId, pageCode, type);
  }
};
