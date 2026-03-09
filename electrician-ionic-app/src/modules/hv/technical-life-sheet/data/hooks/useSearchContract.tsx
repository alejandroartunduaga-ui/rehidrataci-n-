import { useMutation } from '@tanstack/react-query';
import { useState, useEffect } from 'react';
import { httpClient, endpoints } from '@shared/index';
import { technicalLifeSheetEndpoints } from '../endpoints/technicalLifeSheet.endpoints';
import {
  IGetTechnicalLifeDetailsRequest,
  IGetTechnicalLifeDetailsResponse,
  ISearchContractRequest,
  ISearchContractResponse,
  IPostTechnicalLifeDetailsRequest,
  IPostTechnicalLifeDetailsResponse,
  IGetTechnicalLifeDetailsPdfRequest,
  IGetTechnicalLifeDetailsPdfResponse,
} from '../interfaces/searchContract.interface';

interface IS3UploadResponse {
  location: string;
}

const STORAGE_KEY_SEARCH_PARAMS = 'hv_search_params';

export const useSearchContract = () => {
  const [contract, setContract] = useState<ISearchContractResponse | null>(
    null
  );
  const [searchParams, setSearchParams] =
    useState<ISearchContractRequest | null>(() => {
      // Inicializar desde sessionStorage
      const stored = sessionStorage.getItem(STORAGE_KEY_SEARCH_PARAMS);
      return stored ? JSON.parse(stored) : null;
    });

  // Sincronizar searchParams con sessionStorage
  useEffect(() => {
    if (searchParams) {
      sessionStorage.setItem(
        STORAGE_KEY_SEARCH_PARAMS,
        JSON.stringify(searchParams)
      );
    } else {
      sessionStorage.removeItem(STORAGE_KEY_SEARCH_PARAMS);
    }
  }, [searchParams]);

  const searchContractMutation = useMutation({
    mutationFn: async (params: ISearchContractRequest) => {
      const endpoint = { ...technicalLifeSheetEndpoints.searchContract };
      const data = await httpClient.post<ISearchContractResponse>(
        endpoint,
        params
      );

      // Almacenar los parámetros de búsqueda
      setSearchParams(params);

      // Si hay un contrato almacenado y es una página diferente de 0, preservar los datos del contrato
      if (contract && params.page > 0) {
        const updatedContract = {
          ...contract,
          history_cv: data.history_cv,
        };
        setContract(updatedContract);
        return updatedContract;
      }

      // Si es la primera página (page = 0), almacenar el contrato completo
      setContract(data);
      return data;
    },
    onSuccess: (data: ISearchContractResponse) => {
      return data;
    },
    onError: async (error: Error) => {
      return error;
    },
  });

  const getTechnicalLifeDetailsMutation = useMutation({
    mutationFn: async (params: IGetTechnicalLifeDetailsRequest) => {
      const endpoint = {
        ...technicalLifeSheetEndpoints.getTechnicalLifeDetails,
      };
      endpoint.url = endpoint.url.replace('${CONTRACT_ID}', params.contract_id);
      const data =
        await httpClient.get<IGetTechnicalLifeDetailsResponse>(endpoint);
      return data;
    },
    onSuccess: (data: IGetTechnicalLifeDetailsResponse) => {
      return data;
    },
    onError: async (error: Error) => {
      return error;
    },
  });

  const postTechnicalLifeDetailsMutation = useMutation({
    mutationFn: async (params: IPostTechnicalLifeDetailsRequest) => {
      const endpoint = {
        ...technicalLifeSheetEndpoints.postTechnicalLifeDetails,
      };
      const data = await httpClient.post<IPostTechnicalLifeDetailsResponse>(
        endpoint,
        params
      );
      return data;
    },
    onSuccess: (data: IPostTechnicalLifeDetailsResponse) => {
      return data;
    },
    onError: async (error: Error) => {
      return error;
    },
  });

  const getTechnicalLifeDetailsPdfMutation = useMutation({
    mutationFn: async (params: IGetTechnicalLifeDetailsPdfRequest) => {
      const endpoint = {
        ...technicalLifeSheetEndpoints.getTechnicalLifeDetailsPdf,
      };
      endpoint.url = endpoint.url.replace('${CV_ID}', params.cv_id);
      const data =
        await httpClient.get<IGetTechnicalLifeDetailsPdfResponse>(endpoint);
      return data;
    },
    onSuccess: (data: IGetTechnicalLifeDetailsPdfResponse) => {
      return data;
    },
    onError: async (error: Error) => {
      return error;
    },
  });

  const uploadImageS3Mutation = useMutation({
    mutationFn: async ({ file }: { file: File }) => {
      const formData = new FormData();

      const endpoint = {
        ...endpoints.uploadImages,
        url: endpoints.uploadImages.url.replace(
          '${path}',
          `public/technical-life-sheet`
        ),
      };

      formData.append('file', file);
      const response = await httpClient.post<IS3UploadResponse>(
        endpoint,
        formData
      );

      if (!response) {
        throw new Error('Image upload failed: No response from server');
      }

      return response.location;
    },
    onSuccess: (data) => {
      return data;
    },
    onError: (error: Error) => {
      console.error('Error uploading image:', error.message);
    },
  });

  const clearContract = () => {
    setContract(null);
    setSearchParams(null);
  };

  return {
    searchContractMutation,
    getTechnicalLifeDetailsMutation,
    postTechnicalLifeDetailsMutation,
    getTechnicalLifeDetailsPdfMutation,
    uploadImageS3Mutation,
    contract,
    searchParams,
    clearContract,
  };
};
