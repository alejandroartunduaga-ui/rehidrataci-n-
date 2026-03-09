import { useMutation } from '@tanstack/react-query';
import { httpClient, endpoints } from '@shared/index';
import {
  IS3UploadResponse,
  IUploadFileParams,
} from '../interfaces/forms.interface';

function base64ToBlob(base64: string, mimeType: string = 'image/png'): Blob {
  const cleanBase64 = base64.replace(/^data:image\/[a-zA-Z]+;base64,/, '');
  const byteCharacters = atob(cleanBase64);
  const byteNumbers = Array.from(byteCharacters, (char) => char.charCodeAt(0));
  const byteArray = new Uint8Array(byteNumbers);
  return new Blob([byteArray], { type: mimeType });
}

export const useFileUploaderS3 = () => {
  const uploadFileS3Mutation = useMutation({
    mutationFn: async ({ base64File, fileName }: IUploadFileParams) => {
      const copyUploadImages = { ...endpoints.uploadImages };
      const url = copyUploadImages.url.replace('${path}', `public/photovisit`);
      copyUploadImages.url = url;

      const blob = base64ToBlob(base64File);

      const formData = new FormData();
      formData.append('file', blob, `${fileName}.png`);

      const response = await httpClient.post<IS3UploadResponse>(
        copyUploadImages,
        formData
      );

      if (!response) {
        throw new Error('File upload failed: No response from server');
      }

      return response.location;
    },
    onSuccess: (data) => {
      return data;
    },
    onError: (error: Error) => {
      console.error('Error uploading file:', error.message);
    },
  });

  const uploadS3VisitActMutation = useMutation({
    mutationFn: async ({
      file,
      fileName,
    }: {
      file: File;
      fileName: string;
    }) => {
      const formData = new FormData();

      const endpoint = {
        ...endpoints.uploadVisitAct,
        url: endpoints.uploadVisitAct.url
          .replace('${path}', `public/visit/act`)
          .replace('${name}', fileName),
      };

      formData.append('file', file);
      const response = await httpClient.post<IS3UploadResponse>(
        endpoint,
        formData
      );

      if (!response) {
        throw new Error('File acta upload failed: No response from server');
      }

      return response.location;
    },
    onSuccess: (data) => {
      return data;
    },
    onError: (error: Error) => {
      console.error('Error uploading file acta:', error.message);
    },
  });

  const uploadS3ConsumablesPdfMutation = useMutation({
    mutationFn: async ({
      file,
      fileName,
    }: {
      file: File;
      fileName: string;
    }) => {
      const formData = new FormData();

      const endpoint = {
        ...endpoints.uploadVisitAct,
        url: endpoints.uploadVisitAct.url
          .replace('${path}', `public/visit/consumables`)
          .replace('${name}', fileName),
      };

      formData.append('file', file);
      const response = await httpClient.post<IS3UploadResponse>(
        endpoint,
        formData
      );

      if (!response) {
        throw new Error('File acta upload failed: No response from server');
      }

      return response.location;
    },
    onSuccess: (data) => {
      return data;
    },
    onError: (error: Error) => {
      console.error('Error uploading file acta:', error.message);
    },
  });
  return {
    uploadFileS3Mutation,
    uploadS3VisitActMutation,
    uploadS3ConsumablesPdfMutation,
  };
};
