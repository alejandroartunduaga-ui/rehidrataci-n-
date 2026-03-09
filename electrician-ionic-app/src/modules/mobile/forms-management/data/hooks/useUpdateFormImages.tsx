import { useState } from 'react';
import { useFileUploaderS3 } from './useFileUploaderS3';
import {
  RootObject,
  IFormField,
  IPhotosAdd,
} from '../../data/interfaces/forms.interface';

// --- Helper para dividir en lotes ---

function chunkArray<T>(array: T[], size: number): T[][] {
  const result: T[][] = [];
  for (let i = 0; i < array.length; i += size) {
    result.push(array.slice(i, i + size));
  }
  return result;
}
// ---------------------------------

// --- Tipo para el callback de progreso ---
interface ProgressInfo {
  current: number;
  total: number;
}
type ProgressCallback = (info: ProgressInfo) => void;
// -----------------------------------------

export const useUpdateFormImages = () => {
  const { uploadFileS3Mutation } = useFileUploaderS3();
  const [isUpdating, setIsUpdating] = useState(false);
  const [errorUpdatingImages, setError] = useState<string | null>(null);

  // --- Tipo para los items a subir (Corregido) ---
  interface UploadItem {
    key: string;
    type: 'field' | 'photo';
    originalObject: IFormField | IPhotosAdd;
    base64File: string | null;
    fileName: string;
  }
  // ------------------------------------------

  const updateImagesInForms = async (
    formsData: RootObject,
    onProgress?: ProgressCallback
  ) => {
    setIsUpdating(true);
    setError(null);

    // 1. Recolectar todas las imágenes a subir
    const itemsToUpload: UploadItem[] = [];
    for (const key in formsData) {
      const formEntry = formsData[key];

      formEntry.dataForms?.forEach((form) => {
        form.fields?.forEach((field) => {
          if (
            (field.type === 'FILE' || field.type === 'SIGN') &&
            typeof field.selected_value === 'string' &&
            field.selected_value.startsWith('data:image')
          ) {
            itemsToUpload.push({
              key,
              type: 'field',
              originalObject: field,
              base64File: field.selected_value,
              fileName: `${form.code}_${field.code}_${key}_${crypto.randomUUID()}`,
            });
          }
        });
      });

      formEntry.photos?.forEach((photo) => {
        if (
          photo.url &&
          typeof photo.url === 'string' &&
          photo.url.startsWith('data:image')
        ) {
          itemsToUpload.push({
            key,
            type: 'photo',
            originalObject: photo,
            base64File: photo.url as string,
            fileName: `photo_${key}_${photo.code || 'nocode'}_${crypto.randomUUID()}`,
          });
        }
      });
    }

    if (itemsToUpload.length === 0) {
      setIsUpdating(false);
      return formsData; // No hay nada que hacer
    }

    // 2. Dividir en lotes
    const batchSize = 10;
    const batches = chunkArray(itemsToUpload, batchSize);
    const totalBatches = batches.length;

    try {
      // 3. Procesar lotes secuencialmente
      for (let i = 0; i < totalBatches; i++) {
        const batch = batches[i];
        const currentBatchNumber = i + 1;

        // Notificar progreso antes de iniciar el lote
        onProgress?.({ current: currentBatchNumber, total: totalBatches });

        // 4. Subir imágenes del lote en paralelo
        const uploadPromises = batch.map(async (item) => {
          try {
            const uploadedUrl = await uploadFileS3Mutation.mutateAsync({
              base64File: item.base64File as string,
              fileName: item.fileName,
            });
            // 5. Actualizar el objeto original directamente (con type check/cast)
            if (item.type === 'field') {
              (item.originalObject as IFormField).selected_value = uploadedUrl;
            } else if (item.type === 'photo') {
              (item.originalObject as IPhotosAdd).url = uploadedUrl;
            }
          } catch (uploadError: unknown) {
            console.error(`Failed to upload ${item.fileName}:`, uploadError);
            // Acceso seguro al mensaje
            const errorMessage =
              uploadError instanceof Error
                ? uploadError.message
                : String(uploadError);
            throw new Error(
              `Failed to upload ${item.fileName}: ${errorMessage}`
            );
          }
        });

        // Esperar a que todas las promesas del lote se completen
        await Promise.all(uploadPromises);
      }

      // Devolver la estructura formsData actualizada
      return formsData;
    } catch (err: unknown) {
      console.error('Error during batch image update:', err);
      // Acceso seguro al mensaje
      const errorMessage = err instanceof Error ? err.message : String(err);
      setError(`Error al actualizar imágenes en lote: ${errorMessage}`);
      throw err;
    } finally {
      setIsUpdating(false);
    }
  };

  return {
    isUpdating,
    errorUpdatingImages,
    updateImagesInForms,
  };
};
