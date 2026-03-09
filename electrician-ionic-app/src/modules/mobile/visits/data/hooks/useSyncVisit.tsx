import { fetchChangeActivityStatus } from '../activityStatus';
import { fetchPostArrivalPhotos } from '../arrivalPhotos';
import { fetchUploadFileAIArrivalPhoto } from '../uploadFileS3';
import { getTableDataByQuery } from '@shared/db/databaseService';
import { IArrivalPhoto } from '../interfaces/arrival.interface';
import { useCallback, useEffect, useState } from 'react';
import { useFormsDataStore } from '@shared/store/forms/useFormsDataStore';
import { useGeneratePdf } from '@mobile/visit-management/data/hooks/useGeneratePdf';
import {
  IDataBaseNames,
  IDataBaseTables,
  ITableVisitsSteps,
  ITableArrivalPhotos,
} from '@shared/data/IDatabase';

interface IUseSyncVisitReturn {
  isLoadingSyncVisit: boolean;
  error: string | null;
  syncSteps: (visitId: string) => Promise<void>;
  syncAllVisits: (visitIds: string[]) => Promise<void>;
  clearData: () => void;
  // Estados y funciones del PDF
  isGeneratingPdf: boolean;
  isLoadingMessage: string;
  generatePDF: (type: 'syncSingle' | 'syncAll') => Promise<void>;
  clearToast: () => void;
  // Estados para el componente padre
  syncSuccess: boolean;
  syncError: string | null;
  clearSyncStatus: () => void;
  processArrivalPhotos: (visitId: string) => Promise<void>;
  isLoadingMessageSyncVisit: string;
}

export const useSyncVisit = (visitId?: string): IUseSyncVisitReturn => {
  const [isLoadingSyncVisit, setIsLoadingSyncVisit] = useState<boolean>(false);
  const [isLoadingMessageSyncVisit, setIsLoadingMessageSyncVisit] =
    useState<string>('');
  const [error, setError] = useState<string | null>(null);
  const [syncSuccess, setSyncSuccess] = useState<boolean>(false);
  const [syncError, setSyncError] = useState<string | null>(null);

  const { clearAllSubmissionsForActivity } = useFormsDataStore();

  // Configurar el hook para generar PDF
  const {
    generatePDF,
    isLoading: isGeneratingPdf,
    isLoadingMessage,
    clearToast,
  } = useGeneratePdf({
    activity_id: visitId || '',
    onSuccess: () => {
      console.info('✅ PDF generado exitosamente después de sincronización');
    },
    onError: (pdfError) => {
      console.error(
        '❌ Error al generar PDF después de sincronización:',
        pdfError
      );
      setError(`Error al generar PDF: ${pdfError}`);
      setSyncError(`Error al generar PDF: ${pdfError}`);
    },
  });

  // 🔄 Sincronizar el mensaje de carga del PDF con el mensaje de sincronización
  useEffect(() => {
    if (isGeneratingPdf && isLoadingMessage) {
      setIsLoadingMessageSyncVisit(isLoadingMessage);
    }
  }, [isGeneratingPdf, isLoadingMessage]);

  /**
   * Función para limpiar todas las tablas relacionadas con el visitId
   */
  const clearAllVisitData = useCallback(
    async (visitId: string) => {
      setIsLoadingSyncVisit(true);
      try {
        // 1. Limpiar tabla VISITS_STEPS
        await getTableDataByQuery(
          IDataBaseNames.OPERACIONES,
          IDataBaseTables.VISITS_STEPS,
          async (table) => {
            const recordsToDelete = await table
              .where('visitId')
              .equals(visitId)
              .toArray();
            if (recordsToDelete.length > 0) {
              await table.where('visitId').equals(visitId).delete();
            }
            return [];
          }
        );

        // 2. Limpiar tabla VISITS
        await getTableDataByQuery(
          IDataBaseNames.OPERACIONES,
          IDataBaseTables.VISITS,
          async (table) => {
            const recordsToDelete = await table
              .where('visitId')
              .equals(visitId)
              .toArray();
            if (recordsToDelete.length > 0) {
              await table.where('visitId').equals(visitId).delete();
            }
            return [];
          }
        );

        // 3. Limpiar tabla FORMS (por patrón visitId_pageCode)
        await getTableDataByQuery(
          IDataBaseNames.OPERACIONES,
          IDataBaseTables.FORMS,
          async (table) => {
            const recordsToDelete = await table
              .where('visitId_pageCode')
              .startsWith(visitId)
              .toArray();
            if (recordsToDelete.length > 0) {
              await table
                .where('visitId_pageCode')
                .startsWith(visitId)
                .delete();
            }
            return [];
          }
        );

        // 4. Limpiar tabla ANSWERS usando el store
        await clearAllSubmissionsForActivity(visitId);

        // 5. Limpiar tabla ARRIVAL_PHOTOS
        await getTableDataByQuery(
          IDataBaseNames.OPERACIONES,
          IDataBaseTables.ARRIVAL_PHOTOS,
          async (table) => {
            const recordsToDelete = await table
              .where('visitId')
              .equals(visitId)
              .toArray();
            if (recordsToDelete.length > 0) {
              await table.where('visitId').equals(visitId).delete();
            }
            return [];
          }
        );

        // 5. Limpiar datos adicionales usando clearDatabaseById
        // await clearDatabaseById(visitId);
        setIsLoadingSyncVisit(false);
      } catch (error) {
        console.error(
          `❌ Error al limpiar datos para visita ${visitId}:`,
          error
        );
        setIsLoadingSyncVisit(false);
        throw error;
      }
    },
    [clearAllSubmissionsForActivity]
  );

  /**
   * Función para procesar fotos de arrival de una visita
   * @param visitId ID de la visita
   */
  const processArrivalPhotos = useCallback(
    async (visitId: string, syncAllVisits: boolean = false): Promise<void> => {
      setIsLoadingSyncVisit(true);
      try {
        setIsLoadingMessageSyncVisit(
          'Sincronizando fotos de llegada a sitio...'
        );
        const arrivalPhotosData =
          await getTableDataByQuery<ITableArrivalPhotos>(
            IDataBaseNames.OPERACIONES,
            IDataBaseTables.ARRIVAL_PHOTOS,
            (table) => table.where('visitId').equals(visitId).toArray()
          );

        if (
          arrivalPhotosData.length > 0 &&
          arrivalPhotosData[0].photos.length > 0
        ) {
          const photos = arrivalPhotosData[0].photos;
          const updatedPhotos: IArrivalPhoto[] = [];

          // Procesar fotos secuencialmente con delay de 1 segundo entre cada una
          for (let index = 0; index < photos.length; index++) {
            const photo = photos[index];

            try {
              const response = await fetchUploadFileAIArrivalPhoto(
                photo,
                visitId,
                index
              );
              // Reemplazar el url por el location obtenido de la promesa
              updatedPhotos.push({
                ...photo,
                url: response.location,
              } as IArrivalPhoto);
            } catch (photoError) {
              console.error(
                `❌ Error al subir foto ${index} para visita ${visitId}:`,
                photoError
              );
              // Mantener la foto original si falla la subida
              updatedPhotos.push(photo);
            }

            // Agregar delay de 1 segundo entre fotos (excepto la última)
            if (index < photos.length - 1) {
              await new Promise((resolve) => setTimeout(resolve, 1000));
            }
          }

          // Subir las fotos actualizadas
          const saveResponse = await fetchPostArrivalPhotos(
            visitId,
            updatedPhotos
          );
          if (!syncAllVisits) {
            setIsLoadingSyncVisit(false);
          }
          if (!saveResponse.success) {
            console.warn(
              `⚠️ Error al guardar fotos de arrival para visita ${visitId}:`,
              saveResponse.message
            );
          }
        }
      } catch (arrivalError) {
        console.error(
          `⚠️ Error al procesar fotos de arrival para visita ${visitId}:`,
          arrivalError
        );
        if (!syncAllVisits) {
          // Continuar con el proceso aunque falle la subida de fotos
          setIsLoadingSyncVisit(false);
        }
      }
    },
    []
  );

  const syncSteps = useCallback(
    async (visitId: string) => {
      if (!visitId || visitId.trim() === '') {
        const errorMessage = 'El visitId es requerido para sincronizar';
        setError(errorMessage);
        setSyncError(errorMessage);
        return;
      }

      setIsLoadingSyncVisit(true);
      setIsLoadingMessageSyncVisit('Sincronizando cambios de estado...');
      setError(null);
      setSyncError(null);
      setSyncSuccess(false);

      try {
        // 2. Consultar tabla VISIT_STEPS por visitId y procesar pasos
        const stepsData = await getTableDataByQuery<ITableVisitsSteps>(
          IDataBaseNames.OPERACIONES,
          IDataBaseTables.VISITS_STEPS,
          (table) => {
            return table.where('visitId').equals(visitId).toArray();
          }
        );

        let hasSteps = true;
        if (
          !stepsData[0] ||
          !stepsData[0]?.steps ||
          stepsData[0]?.steps.length === 0
        ) {
          hasSteps = false;
        }
        if (hasSteps) {
          // Crear promesas para cada paso
          const response = await fetchChangeActivityStatus(
            visitId,
            stepsData[0].steps
          );
          if (!response.succes) {
            const errorMessage = 'Error al sincronizar pasos';
            setError(errorMessage);
            setSyncError(errorMessage);
            return;
          }
        }

        // 🎉 Proceder a generar PDF (ya sea con steps sincronizados o sin steps)
        try {
          setIsLoadingMessageSyncVisit('Generando acta...');
          await generatePDF('syncSingle');

          // 🗑️ Limpiar todas las tablas después del éxito completo
          await clearAllVisitData(visitId);

          setSyncSuccess(true);
        } catch (pdfError) {
          console.error('❌ Error al generar PDF:', pdfError);
          const errorMessage = `Error al generar PDF: ${pdfError instanceof Error ? pdfError.message : 'Error desconocido'}`;
          setError(errorMessage);
          setSyncError(errorMessage);
        }
      } catch (error) {
        console.error('Error durante la sincronización de pasos:', error);
        const errorMessage =
          error instanceof Error
            ? error.message
            : 'Error desconocido en sincronización';
        setError(errorMessage);
        setSyncError(errorMessage);
      } finally {
        setIsLoadingSyncVisit(false);
      }
    },
    [generatePDF, clearAllVisitData]
  );

  // Reescribir la función syncAllVisits (alrededor de línea 224)
  const syncAllVisits = useCallback(
    async (visitIds: string[]) => {
      if (!visitIds || visitIds.length === 0) {
        const errorMessage = 'Lista de visitIds requerida para sincronizar';
        setError(errorMessage);
        setSyncError(errorMessage);
        return;
      }

      setIsLoadingSyncVisit(true);
      setIsLoadingMessageSyncVisit('Sincronizando visitas...');
      setError(null);
      setSyncError(null);
      setSyncSuccess(false);

      try {
        const results = [];

        for (let i = 0; i < visitIds.length; i++) {
          const visitId = visitIds[i];

          // 1. Procesar fotos de arrival si existen
          await processArrivalPhotos(visitId, true);

          setIsLoadingMessageSyncVisit('Sincronizando cambios de estado...');
          // 2. Obtener stepsData y procesar pasos
          const stepsData = await getTableDataByQuery<ITableVisitsSteps>(
            IDataBaseNames.OPERACIONES,
            IDataBaseTables.VISITS_STEPS,
            (table) => table.where('visitId').equals(visitId).toArray()
          );

          if (stepsData[0] && stepsData[0]?.steps?.length > 0) {
            try {
              const response = await fetchChangeActivityStatus(
                visitId,
                stepsData[0].steps
              );
              if (response.succes) {
                results.push({ visitId, success: true });
              } else {
                results.push({
                  visitId,
                  success: false,
                  message: response.message || 'Error unknown',
                });
              }
            } catch (error) {
              console.error(
                `❌ Error al sincronizar visita ${visitId}:`,
                error
              );
              results.push({ visitId, success: false, error });
            }
          } else {
            results.push({ visitId, success: true });
          }

          // Pausa entre visitas
          if (i < visitIds.length - 1) {
            await new Promise((resolve) => setTimeout(resolve, 1000));
          }
        }

        // Al final del loop, chequear failures
        const failures = results.filter((r) => !r.success);
        if (failures.length > 0) {
          const errorMessage = `Error al sincronizar ${failures.length} visitas`;
          setError(errorMessage);
          setSyncError(errorMessage);
          setIsLoadingSyncVisit(false);
          return;
        }

        // Todos exitosos, proceder a generar PDF batch
        try {
          // setIsLoadingMessageSyncVisit('Generando acta...');
          await generatePDF('syncAll', visitIds);

          // Limpiar datos de todos los visits
          for (const visitId of visitIds) {
            await clearAllVisitData(visitId);
          }
          setSyncSuccess(true);
        } catch (pdfError) {
          console.error('❌ Error al generar PDF final:', pdfError);
          const errorMessage = `Sincronización exitosa pero error al generar PDF final: ${pdfError instanceof Error ? pdfError.message : 'Error desconocido'}`;
          setError(errorMessage);
          setSyncError(errorMessage);
        }
      } catch (error) {
        console.error('Error durante la sincronización masiva:', error);
        const errorMessage =
          error instanceof Error
            ? error.message
            : 'Error desconocido en sincronización masiva';
        setError(errorMessage);
        setSyncError(errorMessage);
      } finally {
        setIsLoadingSyncVisit(false);
      }
    },
    [generatePDF, clearAllVisitData, processArrivalPhotos]
  );

  const clearData = useCallback(() => {
    setError(null);
    setIsLoadingSyncVisit(false);
  }, []);

  const clearSyncStatus = useCallback(() => {
    setSyncSuccess(false);
    setSyncError(null);
  }, []);

  return {
    isLoadingSyncVisit,
    error,
    syncSteps,
    syncAllVisits,
    clearData,
    // Estados y funciones del PDF
    isGeneratingPdf,
    isLoadingMessage,
    generatePDF,
    clearToast,
    // Estados para el componente padre
    syncSuccess,
    syncError,
    clearSyncStatus,
    processArrivalPhotos,
    isLoadingMessageSyncVisit,
  };
};
