import { useMutation } from '@tanstack/react-query';
import { httpClient } from '@shared/index';
import { workOrdersEndpoints } from '../endpoints/wordOrders.endpoints';
import {
  IHistory,
  IHistoryVisitRequest,
} from '../interfaces/workOrderDetail.interface';

export const useHistoryVisit = () => {
  const getHistoryVisitMutation = useMutation({
    mutationFn: async (params: IHistoryVisitRequest) => {
      const endpoint = { ...workOrdersEndpoints.historyVisit };
      // Reemplazar el placeholder VISIT_ID con el visit_id real
      endpoint.url = endpoint.url.replace('${VISIT_ID}', params.visit_id);

      const data = await httpClient.get<IHistory[]>(endpoint);
      return data;
    },
    onSuccess: (data: IHistory[]) => {
      return data;
    },
    onError: async (error: Error) => {
      console.error(
        'Error al obtener el historial de la visita:',
        error.message
      );
      return error;
    },
  });

  return {
    getHistoryVisitMutation,
  };
};
