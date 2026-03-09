import { httpClient } from '@shared/index';
import { ITelemetryReadResponse } from '@mobile/forms-management/data/interfaces/telemetry.interface';
import { formsManagementEndpoints } from '../endpoints/forms-management.endpoints';

export const getTelemetryReadFromServer = async (
  id: string
): Promise<ITelemetryReadResponse> => {
  const endpoint = { ...formsManagementEndpoints.telemetryRead };
  endpoint.url = endpoint.url.replace('${id}', id);
  const response = await httpClient.get(endpoint);
  return response as ITelemetryReadResponse;
};

export const getTelemetryReadFromDatabase = async (
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  id: string
): Promise<ITelemetryReadResponse> => {
  // Sin almacenamiento local para lecturas aún: retornamos estructura placeholder
  return {
    id: 0,
    status: 'PENDING',
    message: 'Lectura no disponible offline',
    url: '',
    status_details: '',
  } as ITelemetryReadResponse;
};

export const fetchTelemetryRead = async (
  id: string,
  isOnline: boolean
): Promise<ITelemetryReadResponse> => {
  if (isOnline) return getTelemetryReadFromServer(id);
  return getTelemetryReadFromDatabase(id);
};
