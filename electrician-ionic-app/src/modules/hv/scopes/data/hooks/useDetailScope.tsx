import { useMutation } from '@tanstack/react-query';
import { httpClient } from '@shared/index';
import { scopesEndpoints } from '../endpoints/scopes.endpoints';
import {
  IGetRequirementDetailRequest,
  IGetRequirementDetailResponse,
  IHistoryScopeItem,
  ISaveScopeDefinitionRequest,
  ISaveScopeDefinitionResponse,
  ISku,
} from '../interfaces/detailScopes.interface';

export const useDetailScope = () => {
  const getRequirementDetailMutation = useMutation({
    mutationFn: async (params: IGetRequirementDetailRequest) => {
      const endpoint = { ...scopesEndpoints.getRequirementDetail };
      endpoint.url = endpoint.url.replace('${SCOPE_ID}', params.scope_id);
      const data =
        await httpClient.get<IGetRequirementDetailResponse>(endpoint);
      return data;
    },
    onSuccess: (data: IGetRequirementDetailResponse) => {
      return data;
    },
    onError: async (error: Error) => {
      return error;
    },
  });

  const getHistoryScopeMutation = useMutation({
    mutationFn: async (params: IGetRequirementDetailRequest) => {
      const endpoint = { ...scopesEndpoints.getHistoryScope };
      endpoint.url = endpoint.url.replace('${SCOPE_ID}', params.scope_id);
      const data = await httpClient.get<IHistoryScopeItem[]>(endpoint);
      return data;
    },
    onSuccess: (data: IHistoryScopeItem[]) => {
      return data;
    },
    onError: async (error: Error) => {
      return error;
    },
  });

  const getSkusMutation = useMutation({
    mutationFn: async () => {
      const endpoint = { ...scopesEndpoints.getSkus };
      const data = await httpClient.get<ISku[]>(endpoint);
      return data;
    },
    onSuccess: (data: ISku[]) => {
      return data;
    },
    onError: async (error: Error) => {
      return error;
    },
  });

  const saveScopeDefinitionMutation = useMutation({
    mutationFn: async (params: ISaveScopeDefinitionRequest) => {
      const endpoint = { ...scopesEndpoints.saveScopeDefinition };
      endpoint.url = endpoint.url.replace('${SCOPE_ID}', params.scope_id);

      const { ...body } = params;

      const data = await httpClient.put<ISaveScopeDefinitionResponse>(
        endpoint,
        body
      );
      return data;
    },
    onSuccess: (data: ISaveScopeDefinitionResponse) => {
      return data;
    },
    onError: async (error: Error) => {
      return error;
    },
  });

  return {
    getRequirementDetailMutation,
    getHistoryScopeMutation,
    getSkusMutation,
    saveScopeDefinitionMutation,
  };
};
