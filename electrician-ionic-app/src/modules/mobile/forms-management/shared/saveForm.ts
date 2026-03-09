import { db } from '@shared/index';
import { IFormData } from '../data/interfaces/forms.interface';
import { addToSyncQueue } from '@shared/db/queue';

// Debes asegurarte de que el endpoint real exista en tu backend.
// Podrías tenerlo en formsManagementEndpoints o un objeto similar.
const FORM_STEP_SYNC_ENDPOINT_TEMPLATE =
  '/api/internal/activities/:activity_id/pages/:page_code/data'; // Ejemplo de endpoint

export const saveData = async (
  activity_id: string,
  page_code: string,
  dataToStore: IFormData
) => {
  try {
    const key = `${activity_id}-${page_code}`;
    const objectToSave = {
      id: key,
      data: dataToStore,
      downloadedAt: new Date(),
    };

    await db.formStepVisits.put(objectToSave);

    // Añadir a la cola de sincronización
    const syncEndpointUrl = FORM_STEP_SYNC_ENDPOINT_TEMPLATE.replace(
      ':activity_id',
      activity_id
    ).replace(':page_code', page_code);

    // El 'body' para la cola será el mismo 'dataToStore' (IFormData)
    // El backend deberá estar preparado para recibir IFormData en este endpoint.
    await addToSyncQueue(
      activity_id,
      syncEndpointUrl,
      dataToStore as unknown as Record<string, unknown> // Conversión de tipo corregida
    );
  } catch (error) {
    console.error(
      `[saveData] Error saving to db.formStepVisits or adding to sync queue for key: ${activity_id}-${page_code}:`,
      error
    );
    throw error;
  }
};
