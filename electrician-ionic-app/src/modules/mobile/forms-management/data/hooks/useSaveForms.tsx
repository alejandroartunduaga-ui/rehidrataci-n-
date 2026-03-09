import { useMutation, useQueryClient } from '@tanstack/react-query';
import { httpClient } from '@shared/index';
import { formsManagementEndpoints } from '../endpoints/forms-management.endpoints';
import { ITransformedDataRequest } from '../interfaces/forms.interface';

export const useSaveForms = () => {
  const queryClient = useQueryClient();

  const postSaveFormsMutation = useMutation({
    mutationFn: async (body: ITransformedDataRequest) => {
      const data = await httpClient.post(
        formsManagementEndpoints.saveForms,
        body
      );

      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['getVisits'] });
      return data;
    },
    onError: async (error) => {
      console.error('Error al guardar el acta:', error);
    },
  });
  return { postSaveFormsMutation };
};
