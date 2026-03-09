import { useMutation, useQueryClient } from '@tanstack/react-query';
import { httpClient } from '@shared/index';
import { visitsEndpoints } from '../endpoints/visits.endpoints';
import {
  IElectrician,
  IAssingElectriciansRequest,
  IElectriciansResponse,
  IDeclineOrAssingVisitResponse,
} from '../interfaces/visits.interface';
import { ListElectriciansMapper } from '../mappers/mapToListElectriciansResponse.mapper';

export const useVisitAsignment = () => {
  const queryClient = useQueryClient();

  const getListElectricians = useMutation({
    mutationFn: async (activity_id: string) => {
      const endpoint = { ...visitsEndpoints.electricianListAssigned };
      endpoint.url = endpoint.url = endpoint.url.replace(
        '${ACTIVITY_ID}',
        activity_id
      );
      const data = await httpClient.get<IElectriciansResponse[]>(endpoint);
      return ListElectriciansMapper.toArrayMapper(data);
    },
    onSuccess: (data: IElectrician[]) => {
      return data;
    },
    onError: async (error: Error) => {
      console.error(
        'Error al consultar la lista de electricistas:',
        error.message
      );
    },
  });

  const patchSaveAssingElectricians = useMutation({
    mutationFn: async ({ activity_id, body }: IAssingElectriciansRequest) => {
      const endpoint = { ...visitsEndpoints.assingElectricians };
      endpoint.url = endpoint.url.replace('${ACTIVITY_ID}', activity_id);
      const data = await httpClient.patch<IDeclineOrAssingVisitResponse>(
        endpoint,
        body
      );
      return data;
    },
    onSuccess: (data: IDeclineOrAssingVisitResponse) => {
      queryClient.invalidateQueries({ queryKey: ['getVisits'] });
      return data;
    },
    onError: async (error: Error) => {
      console.error('Error al asignar electricistas:', error.message);
    },
  });

  return { getListElectricians, patchSaveAssingElectricians };
};
