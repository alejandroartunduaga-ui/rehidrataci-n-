import { useMutation, useQueryClient } from '@tanstack/react-query';
import { httpClient, useConnectivityStore } from '@shared/index';
import { visitsEndpoints } from '@visits/data/endpoints/visits.endpoints';
import { IchangeActivityStatusRequest } from '@visits/data/interfaces/visits.interface';
import { addToSyncQueue } from '@shared/db/queue';
import { toast } from 'react-toastify';
import { Toast } from '@entropy/toast';
import {
  activityInfoNext,
  updateActivityStatus,
  updateVisitStatus,
  getVisitById,
} from '@shared/db/visits';

export const useChangeActivityStatus = () => {
  const queryClient = useQueryClient();
  const isOnline = useConnectivityStore((state) => state.isOnline);

  const changeActivityStatusMutation = useMutation({
    mutationFn: async (data: IchangeActivityStatusRequest) => {
      const response = await httpClient.post(
        visitsEndpoints.changeActivityStatus,
        data
      );

      return response;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['getVisits'] });
      queryClient.invalidateQueries({ queryKey: ['visitDetail'] });
    },
  });

  const handleActivityStatusChange = async ({
    activity_id,
    activity_status,
  }: IchangeActivityStatusRequest) => {
    // Update local storage status in visitDetail
    await updateActivityStatus(activity_status, activity_id);

    // Update local storage status in visits list
    await updateVisitStatus(activity_status, activity_id);

    // Only perform mutation if online
    if (isOnline) {
      changeActivityStatusMutation.mutate({
        activity_id,
        activity_status: activityInfoNext.status[activity_status],
      });
    }

    // Add to sync queue and update local storage in all cases
    if (!isOnline) {
      // Check if the visit is downloaded (it is assumed that getVisitById is a function that verifies this)
      const visitDownloaded = await getVisitById(activity_id);

      if (!visitDownloaded) {
        toast(
          <Toast
            type='error'
            title='Visita no descargada'
            message='Por favor, descargue esta visita para gestionar el estado sin conexión a internet.'
          />
        );

        throw new Error(
          'La visita no está descargada. No se puede cambiar el estado.'
        );
      }

      await addToSyncQueue(
        activity_id,
        visitsEndpoints.changeActivityStatus.url,
        {
          activity_id,
          activity_status: activityInfoNext.status[activity_status],
        }
      );
    }
  };

  return {
    handleActivityStatusChange,
    isLoadingChangeActivityStatus: changeActivityStatusMutation.isPending,
    isErrorChangeActivityStatus: changeActivityStatusMutation.isError,
  };
};
