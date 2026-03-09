import { useMutation } from '@tanstack/react-query';
import { httpClient } from '@shared/index';
import { visitsEndpoints } from '../endpoints/visits.endpoints';
import { IArrivalPhotosResponse } from '../interfaces/arrival.interface';

export const useArrivalPhotos = () => {
  /* const queryClient = useQueryClient(); */

  const postArrivalPhotos = useMutation({
    mutationFn: async (activity_id: string) => {
      const endpoint = { ...visitsEndpoints.arrivalPhotos };
      endpoint.url = endpoint.url = endpoint.url.replace(
        '${ACTIVITY_ID}',
        activity_id
      );
      const photos: string[] = [];
      const data = await httpClient.post<IArrivalPhotosResponse>(
        endpoint,
        photos
      );
      return data;
    },
    onSuccess: (data: IArrivalPhotosResponse) => {
      return data;
    },
    onError: async (error: Error) => {
      console.error('Error al sincornizar fotos:', error.message);
    },
  });

  return { postArrivalPhotos };
};
