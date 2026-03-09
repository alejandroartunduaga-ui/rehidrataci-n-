import { useMutation } from '@tanstack/react-query';
import { httpClient } from '@shared/index';
import { workOrdersEndpoints } from '../endpoints/wordOrders.endpoints';
import {
  IDownloadCSVRequest,
  IDownloadCSVResponse,
} from '../interfaces/downloadCsv.interface';

export const useDownloadCSV = () => {
  const downloadCSV = useMutation({
    mutationFn: async (params: IDownloadCSVRequest) => {
      const endpoint = { ...workOrdersEndpoints.downloadCSV };
      const data = await httpClient.post<IDownloadCSVResponse>(
        endpoint,
        params
      );
      return data;
    },
    onSuccess: (data: IDownloadCSVResponse) => {
      return data;
    },
    onError: async (error: Error) => {
      console.error('Error al descargar el archivo CSV:', error.message);
      return error;
    },
  });

  return {
    downloadCSV,
  };
};
