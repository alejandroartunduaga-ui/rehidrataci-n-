import { useMutation, useQueryClient } from '@tanstack/react-query';
import { httpClient } from '@shared/index';
import { visitsEndpoints } from '../endpoints/visits.endpoints';
import { IDeclineOrAssingVisitResponse } from '../interfaces/visits.interface';

export const useDeclineVisit = () => {
  const queryClient = useQueryClient();

  const patchDeclineVisit = useMutation({
    mutationFn: async (activity_id: string) => {
      const endpoint = { ...visitsEndpoints.declineVisit };
      endpoint.url = endpoint.url = endpoint.url.replace(
        '${ACTIVITY_ID}',
        activity_id
      );
      const data =
        await httpClient.patch<IDeclineOrAssingVisitResponse>(endpoint);
      return data;
    },
    onSuccess: (data: IDeclineOrAssingVisitResponse) => {
      queryClient.invalidateQueries({ queryKey: ['getVisits'] });
      return data;
    },
    onError: async (error: Error) => {
      console.error('Error al rechazar la visita:', error.message);
    },
  });

  return { patchDeclineVisit };
};
