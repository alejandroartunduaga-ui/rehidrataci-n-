import { useMutation } from '@tanstack/react-query';
import { httpClient } from '@shared/index';
import { workOrdersEndpoints } from '../endpoints/wordOrders.endpoints';
import {
  IAssingElectriciansRequest,
  IDeclineOrAssingVisitResponse,
  IElectrician,
  IElectriciansResponse,
} from '../interfaces/assingElectricians';
import { ListElectriciansMapper } from '../mappers/mapToListElectriciansResponse.mapper';
import {
  IAssignContractorRequest,
  IAssignContractorResponse,
  IListContractorsResponse,
} from '../interfaces/assignContractor';

export const useVisitAsignment = () => {
  const getListElectricians = useMutation({
    mutationFn: async (activity_id: string) => {
      const endpoint = { ...workOrdersEndpoints.electricianListAssigned };
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
      const endpoint = { ...workOrdersEndpoints.assingElectricians };
      endpoint.url = endpoint.url.replace('${ACTIVITY_ID}', activity_id);
      const data = await httpClient.patch<IDeclineOrAssingVisitResponse>(
        endpoint,
        body
      );
      return data;
    },
    onSuccess: (data: IDeclineOrAssingVisitResponse) => {
      return data;
    },
    onError: async (error: Error) => {
      console.error('Error al asignar electricistas:', error.message);
    },
  });

  const getListContractors = useMutation({
    mutationFn: async () => {
      const endpoint = { ...workOrdersEndpoints.listContractors };
      const data = await httpClient.get<IListContractorsResponse[]>(endpoint);
      return data;
    },
    onSuccess: (data: IListContractorsResponse[]) => {
      return data;
    },
    onError: async (error: Error) => {
      console.error(
        'Error al consultar la lista de electricistas:',
        error.message
      );
    },
  });

  const assignContractor = useMutation({
    mutationFn: async (params: IAssignContractorRequest) => {
      const endpoint = { ...workOrdersEndpoints.assignContractor };
      const data = await httpClient.post<IAssignContractorResponse>(
        endpoint,
        params
      );
      return data;
    },
    onSuccess: (data: IAssignContractorResponse) => {
      return data;
    },
    onError: async (error: Error) => {
      console.error('Error al asignar contratista:', error.message);
    },
  });

  return {
    getListElectricians,
    patchSaveAssingElectricians,
    getListContractors,
    assignContractor,
  };
};
