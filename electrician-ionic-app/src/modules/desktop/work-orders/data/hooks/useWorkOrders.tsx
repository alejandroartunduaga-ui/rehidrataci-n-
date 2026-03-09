import { httpClient, useAuthStore } from '@shared/index';
import { IFiltersResponse } from '../interfaces/filtersOrders.interface';
import { IWorkOrderDetailResponse } from '../interfaces/workOrderDetail.interface';
import { RolesEnum } from '@auth/index';
import { useMutation, useQuery } from '@tanstack/react-query';
import { workOrdersEndpoints } from '../endpoints/wordOrders.endpoints';
import {
  ICancelCloseOTRequest,
  IConfirmRejectOTRequest,
  IConfirmRejectOTResponse,
  IReasonCancelCloseResponse,
  IRescheduleRequest,
  IRescheduleResponse,
  IWorkOrderResponse,
  IWorkOrdersRequest,
} from '../interfaces/workOrders.interface';
import {
  IUploadActaRequest,
  IUploadActaResponse,
} from '../interfaces/uploadActa';
import {
  IResetVisitResponse,
  IResetVisitRequest,
} from '../interfaces/workOrders.interface';

export const useWorkOrders = () => {
  const { user } = useAuthStore();

  const postWorkOrdersMutation = useMutation({
    mutationFn: async (
      data: IWorkOrdersRequest
    ): Promise<IWorkOrderResponse> => {
      const response = await httpClient.post(
        workOrdersEndpoints.getWorkOrders,
        data
      );

      return response as IWorkOrderResponse;
    },
    onSuccess: (data: IWorkOrderResponse) => {
      return data;
    },
    onError: async (error) => {
      console.error('Error al consultar las OTs:', error);
    },
  });

  const getFiltersMutation = useQuery({
    queryKey: ['filters'],
    queryFn: async () => {
      let endpoint = workOrdersEndpoints.getFilters;
      if (user?.user?.role === RolesEnum.CONTRACTOR) {
        endpoint = {
          ...endpoint,
          url: `${endpoint.url}?contractor_id=${user.user.electrician_id}`,
        };
      }
      const response = await httpClient.get(endpoint);
      return response as IFiltersResponse;
    },
  });

  const getWorkOrderDetailMutation = useMutation({
    mutationFn: async (
      activityId: string
    ): Promise<IWorkOrderDetailResponse> => {
      const endpoint = {
        ...workOrdersEndpoints.getWorkOrderDetail,
        url: workOrdersEndpoints.getWorkOrderDetail.url.replace(
          '${ACTIVITY_ID}',
          activityId
        ),
      };
      const response = await httpClient.get(endpoint);

      return response as IWorkOrderDetailResponse;
    },
    onSuccess: (data: IWorkOrderDetailResponse) => {
      return data;
    },
    onError: async (error) => {
      console.error('Error al consultar detalle de la OT:', error);
    },
  });

  const uploadActaMutation = useMutation({
    mutationFn: async (data: IUploadActaRequest) => {
      const response = await httpClient.post(
        workOrdersEndpoints.uploadActa,
        data
      );
      return response as IUploadActaResponse;
    },
    onSuccess: (data: IUploadActaResponse) => {
      return data;
    },
    onError: async (error) => {
      console.error('Error al cargar el acta:', error);
    },
  });

  const resetVisitMutation = useMutation({
    mutationFn: async (data: IResetVisitRequest) => {
      const endpoint = {
        ...workOrdersEndpoints.resetVisit,
        url: workOrdersEndpoints.resetVisit.url.replace(
          '${VISIT_ID}',
          data.visit_id
        ),
      };
      const response = await httpClient.post<IResetVisitResponse>(endpoint, {});
      return response;
    },
    onSuccess: (data: IResetVisitResponse) => {
      return data;
    },
    onError: async (error) => {
      console.error('Error al resetear la visita:', error);
    },
  });

  const rescheduleWorkOrderMutation = useMutation({
    mutationFn: async (data: IRescheduleRequest) => {
      const response = await httpClient.post<IRescheduleResponse>(
        workOrdersEndpoints.reschedule,
        data
      );
      return response;
    },
    onSuccess: (data: IRescheduleResponse) => {
      return data;
    },
    onError: async (error) => {
      console.error('Error al reprogramar la OT:', error);
    },
  });

  const getReasonsCancelCloseMutation = useMutation({
    mutationFn: async () => {
      const response = await httpClient.get<IReasonCancelCloseResponse[]>(
        workOrdersEndpoints.reasonsCancelClose
      );
      return response;
    },
    onSuccess: (data: IReasonCancelCloseResponse[]) => {
      return data;
    },
    onError: async (error) => {
      console.error('Error al consultar los motivos de cancelación:', error);
    },
  });

  const cancelCloseOTMutation = useMutation({
    mutationFn: async (data: ICancelCloseOTRequest) => {
      const endpoint = {
        ...workOrdersEndpoints.cancelCloseOT,
        url: workOrdersEndpoints.cancelCloseOT.url.replace(
          '${VISIT_ID}',
          data.visit_id
        ),
      };
      const response = await httpClient.post<IRescheduleResponse>(
        endpoint,
        data.params
      );
      return response;
    },
    onSuccess: (data: IRescheduleResponse) => {
      return data;
    },
    onError: async (error) => {
      console.error('Error al cancelar o cerrar la OT:', error);
    },
  });

  const confirmRejectOTMutation = useMutation({
    mutationFn: async (data: IConfirmRejectOTRequest) => {
      const endpoint = {
        ...workOrdersEndpoints.confirmRejectOT,
        url: workOrdersEndpoints.confirmRejectOT.url.replace(
          '${VISIT_ID}',
          data.visit_id
        ),
      };
      const response = await httpClient.post<IConfirmRejectOTResponse>(
        endpoint,
        data.params
      );
      return response;
    },
    onSuccess: (data: IConfirmRejectOTResponse) => {
      return data;
    },
    onError: async (error) => {
      console.error('Error al confirmar o rechazar la OT:', error);
    },
  });

  return {
    postWorkOrdersMutation,
    getFiltersMutation,
    getWorkOrderDetailMutation,
    uploadActaMutation,
    rescheduleWorkOrderMutation,
    getReasonsCancelCloseMutation,
    cancelCloseOTMutation,
    confirmRejectOTMutation,
    resetVisitMutation,
  };
};
