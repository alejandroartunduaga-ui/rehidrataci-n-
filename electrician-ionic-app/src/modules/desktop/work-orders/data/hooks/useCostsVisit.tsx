import { useMutation } from '@tanstack/react-query';
import { httpClient } from '@shared/index';
import { workOrdersEndpoints } from '../endpoints/wordOrders.endpoints';
import {
  ICostsVisitGetResponse,
  ICostsVisitGetRequest,
  ICostsVisitPostResponse,
  ICostsVisitPostRequest,
} from '../interfaces/costsVisit.interface';

export const useCostsVisit = () => {
  const getCostsVisitMutation = useMutation({
    mutationFn: async (params: ICostsVisitGetRequest) => {
      const endpoint = { ...workOrdersEndpoints.costsVisit };
      // Reemplazar el placeholder VISIT_ID con el visit_id real
      endpoint.url = endpoint.url.replace('${VISIT_ID}', params.visit_id);

      const data = await httpClient.get<ICostsVisitGetResponse>(endpoint);
      return data;
    },
    onSuccess: (data: ICostsVisitGetResponse) => {
      return data;
    },
    onError: async (error: Error) => {
      return error;
    },
  });

  const postCostsVisitMutation = useMutation({
    mutationFn: async (params: ICostsVisitPostRequest) => {
      const endpoint = { ...workOrdersEndpoints.costsVisitPost };
      const data = await httpClient.post<ICostsVisitPostResponse>(
        endpoint,
        params
      );
      return data;
    },
    onSuccess: (data: ICostsVisitPostResponse) => {
      return data;
    },
    onError: async (error: Error) => {
      return error;
    },
  });

  return {
    getCostsVisitMutation,
    postCostsVisitMutation,
  };
};
