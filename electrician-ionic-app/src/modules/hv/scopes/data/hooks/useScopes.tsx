import { useMutation } from '@tanstack/react-query';
import { httpClient } from '@shared/index';
import { scopesEndpoints } from '../endpoints/scopes.endpoints';
import {
  IGetNetworkOperatorRegistryResponse,
  IPostRequirementsSearchRequest,
  IPostRequirementsSearchResponse,
  EStatusScope,
} from '../interfaces/scopes.interface';

export const useScopes = () => {
  const getNetworkOperatorRegistryMutation = useMutation({
    mutationFn: async () => {
      const endpoint = { ...scopesEndpoints.getNetworkOperatorRegistry };
      const data =
        await httpClient.get<IGetNetworkOperatorRegistryResponse>(endpoint);
      return data;
    },
    onSuccess: (data: IGetNetworkOperatorRegistryResponse) => {
      return data;
    },
    onError: async (error: Error) => {
      return error;
    },
  });

  const postRequirementsSearchMutation = useMutation({
    mutationFn: async (params: IPostRequirementsSearchRequest) => {
      const endpoint = { ...scopesEndpoints.postRequirementsSearch };
      const data = await httpClient.post<IPostRequirementsSearchResponse>(
        endpoint,
        params
      );
      return data;
    },
    onSuccess: (data: IPostRequirementsSearchResponse) => {
      return data;
    },
    onError: async (error: Error) => {
      return error;
    },
  });

  const getTotalScopesMutation = useMutation({
    mutationFn: async () => {
      const endpoint = { ...scopesEndpoints.postRequirementsSearch };

      const baseParams: IPostRequirementsSearchRequest = {
        status: '',
        direction: 'DESC',
        bia_code_or_sic_code: null,
        type_scopes: [],
        network_operators: [],
        page: 1,
        size: 1,
      };

      const [documentValidation, scopeDefinition, completed] =
        await Promise.all([
          httpClient.post<IPostRequirementsSearchResponse>(endpoint, {
            ...baseParams,
            status: EStatusScope.DOCUMENT_VALIDATION,
          }),
          httpClient.post<IPostRequirementsSearchResponse>(endpoint, {
            ...baseParams,
            status: EStatusScope.SCOPE_DEFINITION,
          }),
          httpClient.post<IPostRequirementsSearchResponse>(endpoint, {
            ...baseParams,
            status: EStatusScope.COMPLETED,
          }),
        ]);

      return {
        [EStatusScope.DOCUMENT_VALIDATION]: documentValidation.total_records,
        [EStatusScope.SCOPE_DEFINITION]: scopeDefinition.total_records,
        [EStatusScope.COMPLETED]: completed.total_records,
      };
    },
    onSuccess: (data) => {
      return data;
    },
    onError: async (error: Error) => {
      return error;
    },
  });

  return {
    getNetworkOperatorRegistryMutation,
    postRequirementsSearchMutation,
    getTotalScopesMutation,
  };
};
