import { useCallback, useEffect, useMemo, useState } from 'react';
import { useHistory as useRouterHistory } from 'react-router-dom';
import { useIonRouter } from '@ionic/react';
import { useConnectivityStore } from '@shared/index';
import { useTranslation } from 'react-i18next';
import { TranslationNamespaces } from '@shared/i18n';
import { useGeneratePdf } from '@visit-management/data/hooks/useGeneratePdf';
import { IPage } from '@visit-management/data/interfaces/history.interface';
import { fetchActivityPages } from '@mobile/visit-management/data/activities';
import { ActivityStatus } from '@visits/index';
import { updateStatusDB } from '@mobile/visits/data/activityStatus';
import {
  getTableDataByQuery,
  upsertTableData,
} from '@shared/db/databaseService';
import {
  IDataBaseNames,
  IDataBaseTables,
  ITableAnswers,
  ITableVisit,
} from '@shared/data/IDatabase';

export const useHistory = (activity_id: string, isFailedVisit?: boolean) => {
  const router = useIonRouter();
  const history = useRouterHistory();
  const isOnline = useConnectivityStore((state) => state.isOnline);
  const { t } = useTranslation(TranslationNamespaces.VISIT_MANAGEMENT);

  // Estados
  const [isLoadingHistory, setIsLoadingHistory] = useState<boolean>(false);
  const [newFilteredSteps, setNewFilteredSteps] = useState<IPage[]>([]);
  const [isCompletedOffline, setIsCompletedOffline] = useState<boolean>(false);
  const [showCompletedOfflineToast, setShowCompletedOfflineToast] =
    useState<boolean>(false);
  const [showOfflineLoad, setShowOfflineLoad] = useState<boolean>(false);
  const [isLoadingMessageHistory, setIsLoadingMessageHistory] =
    useState<string>('');

  // Hook PDF
  const {
    generatePDF,
    isLoading: isLoadingPDF,
    toast: pdfToast,
    clearToast,
    isLoadingMessage,
  } = useGeneratePdf({
    activity_id: activity_id || '',
    isFailedVisit: Boolean(isFailedVisit),
    onSuccess: () => {
      clearToast();
      router.push('/home');
      setTimeout(() => {
        window.location.reload();
      }, 2000);
    },
  });

  const allStepsComplete = useMemo(
    () => newFilteredSteps.every((step) => step?.isComplete),
    [newFilteredSteps]
  );

  const getActivityPages = async () => {
    setIsLoadingHistory(true);
    setIsLoadingMessageHistory(t('loading_pages'));
    try {
      const data = await fetchActivityPages(
        activity_id,
        Boolean(isFailedVisit)
      );

      // Obtener steps completos desde BD local (solo isComplete: true)
      const completedAnswers = await getTableDataByQuery<ITableAnswers>(
        IDataBaseNames.OPERACIONES,
        IDataBaseTables.ANSWERS,
        (table) =>
          table
            .where('visitId_pageCode')
            .startsWith(`${activity_id}__`)
            .filter((record) => record.isComplete === true)
            .toArray()
      );

      const completedPageCodes = new Set(
        completedAnswers.map((record) => {
          const page_code = record.visitId_pageCode
            .split('__')
            .slice(1)
            .join('__');
          return page_code;
        })
      );

      const updatedPages = data.pages.map((step) => {
        const isCompleteInDB = completedPageCodes.has(step.code);
        return {
          ...step,
          isComplete: isCompleteInDB || step.isComplete || false,
        };
      });

      setNewFilteredSteps(updatedPages);
      setIsLoadingHistory(false);
    } catch (err) {
      console.error('Error caught in getActivityPages:', err);
      setNewFilteredSteps([]);
      setIsLoadingHistory(false);
      setTimeout(() => {
        getActivityPages();
      }, 1000);
    }
  };

  const onClickStep = (step: IPage) => {
    if (showOfflineLoad) {
      return;
    }
    const currentParams = new URLSearchParams(location.search);
    const queryString = currentParams.toString();
    const basePath = `/forms-managment/${activity_id}/${step.code}/${encodeURIComponent(step.name)}/${step.index}`;
    const finalPath = queryString ? `${basePath}?${queryString}` : basePath;
    history.push(finalPath);
  };

  const isFailedVisitStatus = (activityStatus: ActivityStatus): boolean => {
    const failedStatuses = [
      ActivityStatus.SITE_ACCESS_FAILED,
      ActivityStatus.START_ACTIVITY_FAILED,
      ActivityStatus.CONTINUE_ACTIVITY_FAILED,
    ];
    return failedStatuses.includes(activityStatus);
  };

  const markVisitAsCompletedOffline = useCallback(async () => {
    setIsLoadingHistory(true);
    if (!activity_id) {
      setIsLoadingHistory(false);
      console.warn(
        '❌ No se puede marcar como completado: activity_id no disponible'
      );
      return;
    }

    try {
      const existingVisits = await getTableDataByQuery<ITableVisit>(
        IDataBaseNames.OPERACIONES,
        IDataBaseTables.VISITS,
        (table) => {
          return table.where('visitId').equals(activity_id).toArray();
        }
      );

      if (existingVisits.length === 0) {
        console.warn(
          `⚠️ No se encontró registro para la visita ${activity_id} en la base de datos`
        );
        setIsLoadingHistory(false);
        return;
      }

      const visitRecord = existingVisits[0];

      const updatedVisit: ITableVisit = {
        ...visitRecord,
        isComplete: true,
        updatedAt: new Date(),
        detail: {
          ...visitRecord.detail,
        },
        data: {
          ...visitRecord.data,
          card_information: {
            ...visitRecord.data.card_information,
            activity_status: ActivityStatus.COMPLETED,
          },
        },
      };

      const visitId = await upsertTableData(
        IDataBaseNames.OPERACIONES,
        IDataBaseTables.VISITS,
        updatedVisit
      );

      if (visitId) {
        setIsCompletedOffline(true);
        setShowCompletedOfflineToast(true);
        if (isFailedVisitStatus(visitRecord.detail.activity_status)) {
          await updateStatusDB(
            updatedVisit,
            ActivityStatus.ELECTRICIAN_FAILED_VISIT
          );
        } else {
          await updateStatusDB(updatedVisit, ActivityStatus.COMPLETED);
        }
      } else {
        console.error(
          `❌ Error al actualizar visita ${activity_id} como completada offline`
        );
      }
      setIsLoadingHistory(false);
    } catch (error) {
      setIsLoadingHistory(false);
      console.error(
        `❌ Error al actualizar base de datos para visita ${activity_id}:`,
        error
      );
    }
  }, [activity_id]);

  const checkIfAlreadyCompletedOffline =
    useCallback(async (): Promise<boolean> => {
      if (!activity_id) return false;
      try {
        const existingVisits = await getTableDataByQuery<ITableVisit>(
          IDataBaseNames.OPERACIONES,
          IDataBaseTables.VISITS,
          (table) => {
            return table.where('visitId').equals(activity_id).toArray();
          }
        );

        if (existingVisits.length > 0) {
          const visitRecord = existingVisits[0];
          const isAlreadyCompleted =
            visitRecord.detail &&
            typeof visitRecord.detail === 'object' &&
            'isCompletedOffline' in visitRecord.detail;

          if (isAlreadyCompleted) {
            setIsCompletedOffline(true);
          }

          return isAlreadyCompleted;
        }
      } catch (error) {
        console.error('Error verificando completitud offline:', error);
      }
      return false;
    }, [activity_id]);

  /**
   * Valida si la visita está descargada en BD y si no hay internet.
   * Si ambas condiciones se cumplen, muestra un toast de pérdida de internet.
   */
  const validateDownloadedVisitAndInternetLoss =
    useCallback(async (): Promise<boolean> => {
      if (!activity_id) return false;
      if (isOnline) {
        setShowOfflineLoad(false);
        return false;
      }

      try {
        const existingVisits = await getTableDataByQuery<ITableVisit>(
          IDataBaseNames.OPERACIONES,
          IDataBaseTables.VISITS,
          (table) => table.where('visitId').equals(activity_id).toArray()
        );
        const exists = existingVisits.length > 0;
        if (!exists && !isOnline) {
          setShowOfflineLoad(true);
        }
        return exists;
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
      } catch (error) {
        return false;
      }
    }, [isOnline]);

  // Efecto: marcar completado offline cuando se cumplan condiciones
  useEffect(() => {
    const handleOfflineCompletion = async () => {
      if (isCompletedOffline) return;
      if (
        allStepsComplete &&
        !isOnline &&
        activity_id &&
        newFilteredSteps.length > 0
      ) {
        const alreadyCompleted = await checkIfAlreadyCompletedOffline();
        if (!alreadyCompleted) {
          markVisitAsCompletedOffline();
        }
      }
    };
    handleOfflineCompletion();
  }, [
    allStepsComplete,
    isOnline,
    activity_id,
    newFilteredSteps.length,
    isCompletedOffline,
    checkIfAlreadyCompletedOffline,
    markVisitAsCompletedOffline,
  ]);

  const closeToast = () => {
    clearToast();
    router.push('/home');
  };

  const initializePage = () => {
    getActivityPages();
    checkIfAlreadyCompletedOffline();
  };

  return {
    // Estados
    isLoadingHistory,
    newFilteredSteps,
    isCompletedOffline,
    showCompletedOfflineToast,
    setShowCompletedOfflineToast,
    showOfflineLoad,
    setShowOfflineLoad,
    isLoadingMessageHistory,
    allStepsComplete,
    isOnline,

    // PDF
    generatePDF,
    isLoadingPDF,
    pdfToast,
    clearToast,
    isLoadingMessage,
    closeToast,

    // Funciones
    getActivityPages,
    onClickStep,
    markVisitAsCompletedOffline,
    checkIfAlreadyCompletedOffline,
    initializePage,
    validateDownloadedVisitAndInternetLoss,
  };
};
