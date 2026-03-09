import { httpClient } from '@shared/index';
import {
  ITelemetryRequest,
  ITelemetryResponse,
  StatusTelemetryResponse,
} from '@mobile/forms-management/data/interfaces/telemetry.interface';
import { formsManagementEndpoints } from '../endpoints/forms-management.endpoints';

export const saveTelemetryToServer = async (
  data: ITelemetryRequest
): Promise<ITelemetryResponse> => {
  const response = await httpClient.post(
    { ...formsManagementEndpoints.telemetryReadMeter },
    data
  );
  return response as ITelemetryResponse;
};

export const saveTelemetryToDatabase = async (
  //eslint-disable-next-line @typescript-eslint/no-unused-vars
  data: ITelemetryRequest
): Promise<ITelemetryResponse> => {
  return {
    id: 0,
    status: StatusTelemetryResponse.PENDING,
    message: 'Telemetría guardada localmente',
    url: '',
    status_details: '',
  };
};

export const fetchSaveTelemetry = async (
  data: ITelemetryRequest,
  isOnline: boolean
): Promise<ITelemetryResponse> => {
  if (isOnline) return saveTelemetryToServer(data);
  return saveTelemetryToDatabase(data);
};
