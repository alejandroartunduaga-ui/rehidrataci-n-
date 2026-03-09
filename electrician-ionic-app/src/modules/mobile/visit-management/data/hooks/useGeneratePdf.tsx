import { ActivityStatus } from '@visits/index';
import { fetchSaveForms } from '@mobile/forms-management/data/saveForms';
import { fetchUploadFile } from '@forms-management/index';
import { getTableDataByQuery } from '@shared/db/databaseService';
import { IS3UploadResponse } from '@mobile/forms-management/data/interfaces/uploadFileS3.interface';
import { ISaveFormsRequest } from '@mobile/forms-management/data/interfaces/saveForms.interface';
import { TranslationNamespaces } from '@shared/i18n';
import { useCallback, useState } from 'react';
import { useConnectivityStore } from '@shared/index';
import { useFormsDataStore } from '@shared/store/forms/useFormsDataStore';
import { useIonRouter } from '@ionic/react';
import { useTranslation } from 'react-i18next';
import {
  IDataBaseNames,
  IDataBaseTables,
  ITableVisit,
} from '@shared/data/IDatabase';

interface UseGeneratePdfProps {
  activity_id: string;
  isFailedVisit?: boolean;
  onSuccess?: () => void;
  onError?: (error: string) => void;
}

interface ToastMessage {
  message: string;
  color: string;
}

export const useGeneratePdf = ({
  activity_id,
  isFailedVisit = false,
  onSuccess,
  onError,
}: UseGeneratePdfProps) => {
  const { t } = useTranslation(TranslationNamespaces.VISIT_MANAGEMENT);
  const router = useIonRouter();
  const isOnline = useConnectivityStore((state) => state.isOnline);
  const { getAllSubmissionsForActivity } = useFormsDataStore();

  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingMessage, setIsLoadingMessage] = useState<string>('');
  const [toast, setToast] = useState<ToastMessage | null>(null);

  const clearToast = useCallback(() => {
    setToast(null);
  }, []);

  const getVisitDetailFromDB = async (visitId: string) => {
    try {
      const visitData = await getTableDataByQuery<ITableVisit>(
        IDataBaseNames.OPERACIONES,
        IDataBaseTables.VISITS,
        (table) => {
          return table.where('visitId').equals(visitId).toArray();
        }
      );

      if (visitData.length > 0) {
        return visitData[0];
      }

      return null;
      //eslint-disable-next-line @typescript-eslint/no-unused-vars
    } catch (error) {
      return null;
    }
  };

  const isFailedVisitStatus = (activityStatus: ActivityStatus): boolean => {
    const failedStatuses = [
      ActivityStatus.SITE_ACCESS_FAILED,
      ActivityStatus.START_ACTIVITY_FAILED,
      ActivityStatus.CONTINUE_ACTIVITY_FAILED,
      ActivityStatus.ELECTRICIAN_FAILED_VISIT,
      ActivityStatus.FAILED,
    ];

    return failedStatuses.includes(activityStatus);
  };

  const groupPhotosByFieldCode = (
    photos: IS3UploadResponse[]
  ): ISaveFormsRequest['values'] => {
    const groupedPhotos: Record<string, string[]> = {};

    photos.forEach((photo) => {
      if (!groupedPhotos[photo.field_code]) {
        groupedPhotos[photo.field_code] = [];
      }
      groupedPhotos[photo.field_code].push(photo.location);
    });

    return Object.entries(groupedPhotos).map(([field_code, locations]) => ({
      field_code,
      values: locations,
    }));
  };

  const removeDuplicateFieldCodes = (
    values: ISaveFormsRequest['values']
  ): ISaveFormsRequest['values'] => {
    const uniqueValues: Record<string, string[]> = {};

    values.forEach((item) => {
      uniqueValues[item.field_code] = item.values;
    });

    return Object.entries(uniqueValues).map(([field_code, values]) => ({
      field_code,
      values,
    }));
  };

  const uploadImageWithRetry = async (
    param: { url: string; name: string; code: string; blob?: Blob },
    maxRetries: number = 1
  ): Promise<IS3UploadResponse | null> => {
    for (let attempt = 0; attempt <= maxRetries; attempt++) {
      try {
        let blobToUpload: Blob;
        if (param.blob && param.blob instanceof Blob && param.blob.size > 0) {
          blobToUpload = param.blob;
        } else if (param.url.startsWith('data:')) {
          const response = await fetch(param.url);
          if (!response.ok) {
            throw new Error(`Error en fetch Base64: ${response.statusText}`);
          }
          blobToUpload = await response.blob();
        } else if (param.url.startsWith('blob:')) {
          const response = await fetch(param.url);
          if (!response.ok) {
            throw new Error(`Error en fetch Blob URL: ${response.statusText}`);
          }
          blobToUpload = await response.blob();
        } else if (param.url.startsWith('http')) {
          const response = await fetch(param.url);
          if (!response.ok) {
            throw new Error(`Error en fetch HTTP: ${response.statusText}`);
          }
          blobToUpload = await response.blob();
        } else {
          blobToUpload = new Blob([param.url], { type: 'text/plain' });
        }

        if (!blobToUpload || !(blobToUpload instanceof Blob)) {
          throw new Error(`No se pudo crear un Blob válido para ${param.name}`);
        }

        if (blobToUpload.size === 0) {
          throw new Error(`Blob vacío para ${param.name}`);
        }

        const result = await fetchUploadFile(
          blobToUpload,
          param.name,
          param.code
        );
        return result;
        //eslint-disable-next-line @typescript-eslint/no-unused-vars
      } catch (error) {
        const isLastAttempt = attempt === maxRetries;
        if (isLastAttempt) {
          return null;
        } else {
          await new Promise((resolve) => setTimeout(resolve, 500));
        }
      }
    }
    return null;
  };

  const processImagesInBatches = async (
    uploadParams: Array<{
      url: string;
      name: string;
      code: string;
      blob?: Blob;
    }>,
    batchMessage: string = 'Subiendo imágenes'
  ): Promise<IS3UploadResponse[]> => {
    const batchSize = 6;
    const results: IS3UploadResponse[] = [];
    const totalBatches = Math.ceil(uploadParams.length / batchSize);

    for (let i = 0; i < uploadParams.length; i += batchSize) {
      const currentBatch = Math.floor(i / batchSize) + 1;
      const batch = uploadParams.slice(i, i + batchSize);

      setIsLoadingMessage(
        `${batchMessage} - Lote ${currentBatch} de ${totalBatches}...\nNo te salgas de la pantalla por favor`
      );

      const batchPromises = batch.map((param) => uploadImageWithRetry(param));
      const batchResults = await Promise.all(batchPromises);
      const successfulResults = batchResults.filter(
        (result): result is IS3UploadResponse => result !== null
      );

      results.push(...successfulResults);

      if (i + batchSize < uploadParams.length) {
        await new Promise((resolve) => setTimeout(resolve, 500));
      }
    }

    return results;
  };

  const processBase64Images = async (
    values: ISaveFormsRequest['values']
  ): Promise<ISaveFormsRequest['values']> => {
    const processedValues: ISaveFormsRequest['values'] = [];
    const base64UploadData: {
      url: string;
      name: string;
      code: string;
      field_code: string;
    }[] = [];

    values.forEach((item) => {
      const hasBase64Images = item.values.some(
        (value) =>
          typeof value === 'string' && value.includes('data:image/png;base64')
      );

      if (hasBase64Images) {
        item.values.forEach((value) => {
          if (
            typeof value === 'string' &&
            value.includes('data:image/png;base64')
          ) {
            const imageName = `firma_${activity_id}_${item.field_code}_${Date.now()}`;

            base64UploadData.push({
              url: value,
              name: imageName,
              code: item.field_code,
              field_code: item.field_code,
            });
          }
        });
      } else {
        processedValues.push(item);
      }
    });

    if (base64UploadData.length > 0) {
      try {
        const uploadParams = base64UploadData.map((item) => ({
          url: item.url,
          name: item.name,
          code: item.code,
        }));
        const uploadResults = await processImagesInBatches(
          uploadParams,
          'Subiendo imágenes'
        );

        const groupedUploads: Record<string, string[]> = {};

        uploadResults.forEach((result, index) => {
          const field_code = base64UploadData[index].field_code;
          if (!groupedUploads[field_code]) {
            groupedUploads[field_code] = [];
          }
          groupedUploads[field_code].push(result.location);
        });

        Object.entries(groupedUploads).forEach(([field_code, locations]) => {
          processedValues.push({
            field_code,
            values: locations,
          });
        });
      } catch (error) {
        throw new Error(
          `Error al procesar imágenes base64: ${error instanceof Error ? error.message : 'Error desconocido'}`
        );
      }
    }

    return processedValues;
  };

  const clearFormData = async () => {
    try {
      if (activity_id) {
        const { clearAllSubmissionsForActivity } = useFormsDataStore.getState();
        await clearAllSubmissionsForActivity(activity_id);
        //await storageManager.removeItem(activity_id);
      }
    } catch (error) {
      console.error(error);
    }
  };

  const saveForm = async (
    formData: ISaveFormsRequest,
    manageLoading: boolean = true
  ) => {
    if (manageLoading) {
      setIsLoading(true);
      setIsLoadingMessage(
        'Generando acta...\nNo te salgas de la pantalla porfavor'
      );
    }

    try {
      await fetchSaveForms(formData);

      setToast({ message: t('save_forms_success'), color: 'success' });
      await clearFormData();

      if (manageLoading) {
        setIsLoading(false);
        router.push('/home');
        onSuccess?.();
      }
    } catch (error: unknown | undefined) {
      const errorMessage = t('save_forms_error').concat(
        `: ${error instanceof Error ? error.message : 'Detalle no disponible.'}`.concat(
          `\n${formData.visit_id ? `Visit ID: ${formData.visit_id}` : ''}`
        )
      );

      setToast({
        message: errorMessage,
        color: 'danger',
      });

      if (manageLoading) {
        setIsLoading(false);
      }

      onError?.(errorMessage);
      throw error;
    }
  };

  const generatePDF = async (
    type?: 'syncSingle' | 'syncAll' | null,
    visitIds?: string[]
  ) => {
    if (!isOnline) {
      return;
    }

    try {
      setIsLoading(true);
      setIsLoadingMessage(
        'Procesando...\nNo te salgas de la pantalla porfavor'
      );

      if (type === 'syncAll' && visitIds && visitIds.length > 0) {
        const failedVisits: string[] = [];
        for (let i = 0; i < visitIds.length; i++) {
          const currentVisitId = visitIds[i];
          setIsLoadingMessage(
            `Procesando visita ${i + 1} de ${visitIds.length}...\nNo te salgas de la pantalla porfavor`
          );

          try {
            const activitySubmissions =
              await getAllSubmissionsForActivity(currentVisitId);

            if (activitySubmissions.length === 0) continue;

            const values: ISaveFormsRequest['values'] = [];
            const promisesPhotos: Array<{
              url: string;
              name: string;
              code: string;
              blob?: Blob;
            }> = [];
            const built_widgets: ISaveFormsRequest['built_widgets'] = [];

            activitySubmissions.forEach((submission) => {
              Object.entries(submission.normalFields).forEach(
                ([key, value]) => {
                  values.push({ field_code: key, values: [value] });
                }
              );

              if (submission.photos) {
                Object.entries(submission.photos).forEach(([_, value]) => {
                  const imageUrl =
                    typeof value.url === 'string'
                      ? value.url
                      : value.displayUrl || '';

                  if (imageUrl) {
                    promisesPhotos.push({
                      url: imageUrl,
                      name: value.name,
                      code: value.code,
                      blob: value.blob,
                    });
                  }
                });
              }

              if (submission.builderItems) {
                Object.entries(submission.builderItems).forEach(
                  ([_, value]) => {
                    built_widgets.push({
                      widget_code: value.widget_code || null,
                      fields: value.items.map((field) => ({
                        field_code: field.code,
                        values: [field.value],
                      })),
                    });
                  }
                );
              }
            });

            const photos = await processImagesInBatches(
              promisesPhotos,
              `Subiendo imágenes para visita ${i + 1} de ${visitIds.length}...`
            );
            const groupedPhotos = groupPhotosByFieldCode(photos);
            values.push(...groupedPhotos);

            const uniqueValues = removeDuplicateFieldCodes(values);
            const processedValues = await processBase64Images(uniqueValues);

            const formData: ISaveFormsRequest = {
              visit_id: currentVisitId,
              values: processedValues,
              built_widgets,
            };

            const visitDetail = await getVisitDetailFromDB(currentVisitId);
            if (
              visitDetail &&
              visitDetail.detail &&
              visitDetail.detail.activity_status
            ) {
              const activityStatus = visitDetail.detail.activity_status;
              if (isFailedVisitStatus(activityStatus)) {
                formData.visit_type = ActivityStatus.FAILED;
              }
            }

            await saveForm(formData, false);
            //eslint-disable-next-line @typescript-eslint/no-unused-vars
          } catch (visitError) {
            failedVisits.push(currentVisitId);
          }

          if (i < visitIds.length - 1) {
            await new Promise((resolve) => setTimeout(resolve, 1000));
          }
        }

        if (failedVisits.length > 0) {
          const errorMessage = `Error al generar PDF para ${failedVisits.length} visitas: ${failedVisits.join(', ')}`;
          setToast({
            message: errorMessage,
            color: 'warning',
          });
          if (onError) onError(errorMessage);
        } else {
          setToast({
            message: 'Todas las visitas fueron procesadas correctamente',
            color: 'success',
          });
        }

        setIsLoading(false);
        if (onSuccess) {
          onSuccess();
        } else {
          router.push('/home');
        }
      } else {
        const activitySubmissions =
          await getAllSubmissionsForActivity(activity_id);

        if (activitySubmissions.length > 0) {
          const values: ISaveFormsRequest['values'] = [];
          const promisesPhotos: Array<{
            url: string;
            name: string;
            code: string;
            blob?: Blob;
          }> = [];
          const built_widgets: ISaveFormsRequest['built_widgets'] = [];

          activitySubmissions.forEach((submission) => {
            Object.entries(submission.normalFields).forEach(([key, value]) => {
              values.push({ field_code: key, values: [value] });
            });

            if (submission.photos) {
              Object.entries(submission.photos).forEach(([_, value]) => {
                const imageUrl =
                  typeof value.url === 'string'
                    ? value.url
                    : value.displayUrl || '';

                if (imageUrl) {
                  promisesPhotos.push({
                    url: imageUrl,
                    name: value.name,
                    code: value.code,
                    blob: value.blob,
                  });
                }
              });
            }

            if (submission.builderItems) {
              Object.entries(submission.builderItems).forEach(([_, value]) => {
                built_widgets.push({
                  widget_code: value.widget_code || null,
                  fields: value.items.map((field) => ({
                    field_code: field.code,
                    values: [field.value],
                  })),
                });
              });
            }
          });

          const photos = await processImagesInBatches(
            promisesPhotos,
            'Subiendo imágenes'
          );
          const groupedPhotos = groupPhotosByFieldCode(photos);
          values.push(...groupedPhotos);

          const uniqueValues = removeDuplicateFieldCodes(values);
          const processedValues = await processBase64Images(uniqueValues);

          const formData: ISaveFormsRequest = {
            visit_id: activity_id,
            values: processedValues,
            built_widgets,
          };

          if (isFailedVisit) {
            formData.visit_type = ActivityStatus.FAILED;
          }

          if (type === 'syncSingle' || type === 'syncAll') {
            const visitDetail = await getVisitDetailFromDB(activity_id);
            if (
              visitDetail &&
              visitDetail.detail &&
              visitDetail.detail.activity_status
            ) {
              const activityStatus = visitDetail.detail.activity_status;
              if (isFailedVisitStatus(activityStatus)) {
                formData.visit_type = ActivityStatus.FAILED;
              }
            }
          }
          await saveForm(formData, false);
        }
      }

      setIsLoading(false);
      if (onSuccess) {
        onSuccess();
      } else {
        router.push('/home');
      }
    } catch (err) {
      setIsLoading(false);

      const errorMessage = `Error al generar PDF: ${err instanceof Error ? err.message : 'Error desconocido'}`;
      setToast({
        message: errorMessage,
        color: 'danger',
      });

      if (onError) {
        onError(errorMessage);
      }
    }
  };

  return {
    generatePDF,
    isLoading,
    isLoadingMessage,
    toast,
    clearToast,
    clearFormData,
  };
};
