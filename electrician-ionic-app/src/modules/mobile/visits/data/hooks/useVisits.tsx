import { useEffect, useMemo, useState } from 'react';
import { useHistory } from 'react-router-dom';
import {
  TranslationNamespaces,
  useAuthStore,
  useConnectivityStore,
  useTrackEvent,
} from '@shared/index';
import { useTranslation } from 'react-i18next';
import {
  ActivityStatus,
  CategoryName,
  IActivity,
  IVisit,
  IVisitNew,
  IVisitNewByDate,
} from '../interfaces/visits.interface';
import { RolesEnum } from '@auth/index';
import {
  upsertTableData,
  getTableData,
  checkDatabaseExists,
  createDatabase,
  getTableDataByQuery,
} from '@shared/db/databaseService';
import {
  IDataBaseNames,
  IDataBaseTables,
  ITableVisit,
} from '@shared/data/IDatabase';
import { getActivitiesDescriptions } from '../visitDetail/visitDetail';
import {
  getPagesByActivityId,
  IPagesByActivityIdResponse,
} from '@mobile/visit-management';
import { IVisitDetail } from '../interfaces/visitDetail.interface';
import { getFormById, IFormsMap } from '@mobile/forms-management';
import {
  createMappedFormResults,
  MappedFormResults,
  insertBothMappedFormsTypes,
} from '@visits/index';
import { useVisitStore } from '@visits/store/useVisitStore';
import { jsonToBase64 } from '@shared/utils/base64Utils';
import { fetchVisits } from '@mobile/visits/data/visits';
import { useSyncVisit } from '@visits/data/hooks/useSyncVisit';
import { toast } from 'react-toastify';
import { Toast } from '@entropy/toast';
import { useFirebasePush } from '@shared/hooks/useFirebasePush';
import { fetchNotificationsSubscribe } from '@shared/data/NotificationsSubscribe';
import { fetchNotifications } from '@shared/data/Notifications';
import { INotification } from '@shared/data/interfaces/Notifications.interface';
import {
  getEquipmentCertificates,
  storeEquipmentCertificatesDB,
} from '@mobile/visits/data/equipmentCertificates';
import { storageManager } from '@shared/storage/storageManager';

export const useVisits = () => {
  const { user } = useAuthStore();
  const history = useHistory();
  const { setVisit } = useVisitStore();
  const { t } = useTranslation(TranslationNamespaces.VISITS);
  const isOnline = useConnectivityStore((state) => state.isOnline) ?? false;
  const trackEvent = useTrackEvent();

  // 🔄 Estados migrados del componente
  const [isLoading, setIsLoading] = useState(false);
  const [listVisitsByDate, setListVisitsByDate] = useState<IVisitNewByDate[]>(
    []
  );
  const [filteredVisitsByDate, setFilteredVisitsByDate] = useState<
    IVisitNewByDate[]
  >([]);
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [localCategoryActive, setLocalCategoryActive] = useState<CategoryName>(
    CategoryName.PROXIMAS
  );
  const [localSortOrder, setLocalSortOrder] = useState<'asc' | 'desc'>('asc');
  const [completedVisitIds, setCompletedVisitIds] = useState<string[]>([]);
  const [syncVisitsByDate, setSyncVisitsByDate] = useState<IVisitNewByDate[]>(
    []
  );
  const [downloadedVisitsInfo, setDownloadedVisitsInfo] = useState<
    Record<string, IVisit>
  >({});
  const [isAnyDownloadActive, setIsAnyDownloadActive] = useState(false);
  const [toastMessage, setToastMessage] = useState<{
    title: string;
    message: string;
    theme: 'success' | 'error';
  } | null>(null);
  const [downloadingVisitText, setDownloadingVisitText] = useState<string>('');

  // 🔄 Estados existentes
  const [existingVisitIds, setExistingVisitIds] = useState<string[]>([]);
  const [downloadingVisits, setDownloadingVisits] = useState<
    Record<string, boolean>
  >({});
  const [categoryActive, setCategoryActive] = useState<CategoryName>(
    CategoryName.PROXIMAS
  );
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');
  const [categories, setCategories] = useState<string[]>([]);

  // 🔄 Hook de sincronización
  const {
    syncAllVisits,
    isLoadingSyncVisit,
    syncSuccess,
    syncError,
    isLoadingMessageSyncVisit,
  } = useSyncVisit();

  // 🔔 Hook de notificaciones Firebase
  const { getToken } = useFirebasePush();

  // 🔄 Funciones de base de datos migradas del componente
  const checkAndCreateDatabases = async () => {
    try {
      // Verificar si la base de datos existe
      const visitsExists = await checkDatabaseExists(
        IDataBaseNames.OPERACIONES
      );

      if (!visitsExists) {
        await createDatabase(IDataBaseNames.OPERACIONES);
      }
      //eslint-disable-next-line @typescript-eslint/no-unused-vars
    } catch (error) {
      // En caso de error, intentar crear la base de datos
      await createDatabase(IDataBaseNames.OPERACIONES);
    }
  };

  const getCompletedVisitIds = async () => {
    try {
      const completedVisits = await getTableDataByQuery<ITableVisit>(
        IDataBaseNames.OPERACIONES,
        IDataBaseTables.VISITS,
        (table) => table.filter((visit) => visit.isComplete === true).toArray()
      );

      const completedIds = completedVisits?.map((visit) => visit.visitId) || [];
      setCompletedVisitIds(completedIds);

      // Agrupar visitas para sincronización
      const groupedMap = completedVisits.reduce((acc, tableVisit) => {
        const visit = tableVisit.data;
        if (visit.typeActivity === 'DONE' || visit.typeActivity === 'CANCELLED')
          return acc;

        const date = visit.card_information.activity_date;
        if (!acc.has(date)) {
          acc.set(date, { date, visits: [] });
        }
        acc.get(date)!.visits.push(visit);
        return acc;
      }, new Map<string, IVisitNewByDate>());

      const grouped = Array.from(groupedMap.values());
      setSyncVisitsByDate(grouped);
      //eslint-disable-next-line @typescript-eslint/no-unused-vars
    } catch (error) {
      setCompletedVisitIds([]);
      setSyncVisitsByDate([]);
    }
  };

  const getDownloadedVisitsInfo = async () => {
    try {
      // Obtener todas las visitas descargadas de la BD local
      const allDownloadedVisits = await getTableDataByQuery<ITableVisit>(
        IDataBaseNames.OPERACIONES,
        IDataBaseTables.VISITS,
        (table) => table.toArray()
      );

      // Crear un mapa con la información actualizada de las visitas descargadas
      const downloadedVisitsMap: Record<string, IVisit> = {};

      allDownloadedVisits.forEach((tableVisit) => {
        downloadedVisitsMap[tableVisit.visitId] = tableVisit.data;
      });

      setDownloadedVisitsInfo(downloadedVisitsMap);
      //eslint-disable-next-line @typescript-eslint/no-unused-vars
    } catch (error) {
      setDownloadedVisitsInfo({});
    }
  };

  /**
   * Función para obtener todos los visitId que existen en la tabla VISITS
   * @returns Promise<string[]> - Array de visitId existentes en la base de datos
   */
  const getExistingVisitIds = async () => {
    try {
      // Obtener todos los registros de la tabla VISITS
      const visitsData = await getTableData<ITableVisit>(
        IDataBaseNames.OPERACIONES,
        IDataBaseTables.VISITS
      );

      // Extraer solo los visitId
      const visitIds = visitsData.map((visit) => visit.visitId);

      setExistingVisitIds(visitIds);
    } catch (error: unknown | undefined) {
      console.error('error', error);
      setExistingVisitIds([]);
    }
  };

  // 🔄 Funciones de navegación migradas del componente
  const rejectVisit = async (visit: IVisit) => {
    await setVisit(visit);
    return true; // Indica que el modal debe abrirse
  };

  const assingVisit = async (visit: IVisit) => {
    await setVisit(visit);
    history.push(`/visit/${visit.activity_id}/electrician_assignment`);
  };

  const goDetailVisit = async (visit: IVisit) => {
    storageManager.setItem(`${visit.activity_id}`, jsonToBase64(visit));
    history.push(`/visit/${visit.activity_id}`);
  };

  // 🔄 Función para obtener información actualizada de visitas
  const getVisitInfo = (visit: IVisit): IVisit => {
    const isDownloaded = existingVisitIds.includes(visit.activity_id);
    const localInfo = downloadedVisitsInfo[visit.activity_id];

    if (isDownloaded && localInfo) {
      return localInfo;
    }

    // Si no está descargada o no hay información local, usar la del servidor
    return visit;
  };

  // 📥 Función para manejar descarga controlada (una a la vez)
  const handleSingleDownload = async (visit: IVisitNew) => {
    // ⚠️ Si ya hay una descarga activa, no proceder
    if (isAnyDownloadActive) {
      return;
    }

    // ✅ Si no hay descarga activa, proceder con la descarga
    await downloadOrderDetail(visit);
  };

  const downloadOrderDetail = async (visit: IVisitNew) => {
    try {
      // Marcar visita como en proceso de descarga
      setDownloadingVisits((prev) => ({ ...prev, [visit.activity_id]: true }));
      setDownloadingVisitText('Descargando información de la visita...');

      const dataVisit: ITableVisit = {
        isComplete: false,
        visitId: visit.activity_id,
        data: visit,
        detail: {} as IVisitDetail,
        steps: {
          title: '',
          description: '',
          pages: [],
        },
        stepsFailed: {
          title: '',
          description: '',
          pages: [],
        },
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const data = await Promise.all([
        getActivitiesDescriptions(visit.activity_id),
        getPagesByActivityId(visit.activity_id, false),
        getPagesByActivityId(visit.activity_id, true),
      ]);

      dataVisit.detail = data[0] as IVisitDetail;
      dataVisit.steps = data[1] as IPagesByActivityIdResponse;
      dataVisit.stepsFailed = data[2] as IPagesByActivityIdResponse;

      // 🔧 Validar si es una visita de instalación y descargar equipos
      if (
        visit.card_information.activity_type_id ===
        ActivityStatus.INSTALLATION_VISIT
      ) {
        setDownloadingVisitText('Descargando equipos...');

        try {
          // Obtener equipos del servidor
          const equipmentResponse = await getEquipmentCertificates(
            visit.activity_id
          );

          if (
            equipmentResponse.success &&
            equipmentResponse.data.certificates.length > 0
          ) {
            // Guardar equipos en la base de datos local
            await storeEquipmentCertificatesDB(
              visit.activity_id,
              equipmentResponse.data.certificates
            );
          }
        } catch (equipmentError) {
          console.warn('⚠️ Error descargando equipos:', equipmentError);
          // No interrumpir la descarga de la visita si falla la descarga de equipos
        }
      }

      setDownloadingVisitText('Descargando formularios...');

      const promisesFormsSteps: Promise<IFormsMap>[] = [];
      dataVisit.steps.pages.map((page) => {
        promisesFormsSteps.push(getFormById(visit.activity_id, page.code));
      });
      const promisesFormsStepsFailed: Promise<IFormsMap>[] = [];
      dataVisit.stepsFailed.pages.map((page) => {
        promisesFormsStepsFailed.push(
          getFormById(visit.activity_id, page.code)
        );
      });

      const resultsFormsSteps = await Promise.all(promisesFormsSteps);
      const resultsFormsStepsFailed = await Promise.all(
        promisesFormsStepsFailed
      );

      // Crear objeto que mapea cada resultado con su página correspondiente
      // Esto permite acceder tanto al resultado de la promesa como a la página original
      // Formato: { result: IFormsMap, page: IPage, promise: Promise<IFormsMap> }
      const mappedFormsSteps: MappedFormResults = createMappedFormResults(
        resultsFormsSteps,
        dataVisit.steps.pages,
        promisesFormsSteps
      );

      // Mismo mapeo para las promesas de pasos fallidos
      const mappedFormsStepsFailed: MappedFormResults = createMappedFormResults(
        resultsFormsStepsFailed,
        dataVisit.stepsFailed.pages,
        promisesFormsStepsFailed
      );

      setDownloadingVisitText('Guardando información...');

      const idVisit = await upsertTableData(
        IDataBaseNames.OPERACIONES,
        IDataBaseTables.VISITS,
        dataVisit
      );

      // Insertar ambos tipos de formularios en la tabla FORMS usando la función utilitaria
      const formsInsertResults = await insertBothMappedFormsTypes(
        mappedFormsSteps,
        mappedFormsStepsFailed,
        visit.activity_id,
        upsertTableData,
        {
          database: IDataBaseNames.OPERACIONES,
          table: IDataBaseTables.FORMS,
        }
      );

      if (idVisit && formsInsertResults) {
        toast(
          <Toast
            type='success'
            title={t('toast_success_download_visit_title')}
            message={t('toast_success_download_visit_message')}
          />
        );
      } else {
        toast(
          <Toast
            type='error'
            title={t('toast_error_download_visit_title')}
            message={t('toast_error_download_visit_message')}
          />
        );
      }

      setDownloadingVisits((prev) => {
        const newState = { ...prev };
        delete newState[visit.activity_id];
        return newState;
      });
    } catch (error: unknown | undefined) {
      console.error('error', error);
      toast(
        <Toast
          type='error'
          title={t('toast_error_download_visit_title')}
          message={t('toast_error_download_visit_message')}
        />
      );
    } finally {
      // Resetear el texto del loader
      setDownloadingVisitText('');
      getExistingVisitIds();
      setDownloadingVisits((prev) => {
        const newState = { ...prev };
        delete newState[visit.activity_id];
        return newState;
      });
    }
  };

  // 🔄 Función de sincronización migrada del componente
  const handleSyncAllVisits = async () => {
    try {
      // Obtener todos los visitIds de la tabla VISITS
      const allVisitsFromDB = await getTableDataByQuery<ITableVisit>(
        IDataBaseNames.OPERACIONES,
        IDataBaseTables.VISITS,
        (table) => table.filter((visit) => visit.isComplete === true).toArray()
      );

      const visitIds = allVisitsFromDB?.map((visit) => visit.visitId) || [];

      if (visitIds.length === 0) {
        setToastMessage({
          title: 'Sin visitas',
          message: 'No se encontraron visitas para sincronizar',
          theme: 'error',
        });
        return;
      }

      // Llamar a syncAllVisits con los visitIds obtenidos
      await syncAllVisits(visitIds);
      //eslint-disable-next-line @typescript-eslint/no-unused-vars
    } catch (error) {
      setToastMessage({
        title: 'Error',
        message: 'Error al obtener las visitas de la base de datos',
        theme: 'error',
      });
    }
  };

  // 🔄 Funciones de filtrado migradas del componente
  const filterVisitsByCategory = (
    visits: IVisitNewByDate[],
    category: CategoryName
  ): IVisitNewByDate[] => {
    return visits
      .map((visitsByDate) => {
        const filteredVisits = visitsByDate.visits.filter((visit) => {
          const isVisitDownloaded = existingVisitIds.includes(
            visit.activity_id
          );
          const isVisitCompleted =
            visit.card_information.activity_status ===
              ActivityStatus.COMPLETED ||
            visit.card_information.activity_status === ActivityStatus.CANCELLED;
          const isVisitCompletedDB = completedVisitIds.includes(
            visit.activity_id
          );

          switch (category) {
            case CategoryName.PROXIMAS:
              return (
                (!isVisitDownloaded ||
                  (isVisitDownloaded && !isVisitCompleted)) &&
                !isVisitCompletedDB &&
                visit.typeActivity !== 'DONE' &&
                visit.typeActivity !== 'CANCELLED' &&
                visit.typeActivity !== 'REVERT_ACT'
              );

            case CategoryName.COMPLETADAS:
              return visit.typeActivity === 'DONE';

            case CategoryName.FALLIDAS:
              return visit.typeActivity === 'CANCELLED';

              case CategoryName.DEVUELTAS:
                return (
                  visit.typeActivity === 'REVERT_ACT' ||
                  (visit as any).card_information?.activity_status === 'REVERT_ACT'
                ); 

            default:
              return (
                visit.nameActivity === category &&
                !isVisitCompletedDB &&
                visit.typeActivity !== 'DONE' &&
                visit.typeActivity !== 'CANCELLED' &&
                visit.typeActivity !== 'REVERT_ACT'
              );
          }
        });

        return {
          ...visitsByDate,
          visits: filteredVisits,
        };
      })
      .filter((visitsByDate) => visitsByDate.visits.length > 0);
  };

  const filterVisitsBySearchTerm = (
    visits: IVisitNewByDate[],
    searchTerm: string
  ): IVisitNewByDate[] => {
    if (!searchTerm) {
      return visits;
    }

    const lowerSearchTerm = searchTerm.toLowerCase();

    return visits
      .map((visitsByDate) => {
        const filteredVisits = visitsByDate.visits.filter((visit) => {
          const userName =
            visit.card_information.user_name?.toLowerCase() || '';
          const address = visit.card_information.address?.toLowerCase() || '';
          const biaCode =
            visit.card_information?.internal_bia_code?.toLowerCase() || '';
          const workOrder =
            visit.card_information?.work_order?.toLowerCase() || '';
          return (
            userName.includes(lowerSearchTerm) ||
            address.includes(lowerSearchTerm) ||
            biaCode.includes(lowerSearchTerm) ||
            workOrder.includes(lowerSearchTerm)
          );
        });

        return {
          ...visitsByDate,
          visits: filteredVisits,
        };
      })
      .filter((visitsByDate) => visitsByDate.visits.length > 0);
  };

  const parseDateVisits = (dateString: string): Date => {
    const [day, month, year] = dateString.split('-');
    return new Date(`${year}-${month}-${day}`);
  };

  const sortVisitsByDate = (
    visits: IVisitNewByDate[],
    sortOrder: 'asc' | 'desc'
  ): IVisitNewByDate[] => {
    return [...visits].sort((a, b) => {
      const dateA = parseDateVisits(a.date);
      const dateB = parseDateVisits(b.date);

      if (sortOrder === 'asc') {
        return dateA.getTime() - dateB.getTime();
      } else {
        return dateB.getTime() - dateA.getTime();
      }
    });
  };

  const applyAllFilters = (
    visits: IVisitNewByDate[],
    category: CategoryName,
    searchTerm: string,
    sortOrder: 'asc' | 'desc'
  ): IVisitNewByDate[] => {
    let baseVisits: IVisitNewByDate[];
    if (category === CategoryName.POR_SYNCRONIZAR) {
      baseVisits = syncVisitsByDate;
    } else {
      baseVisits = filterVisitsByCategory(visits, category);
    }

    const filteredBySearch = filterVisitsBySearchTerm(baseVisits, searchTerm);
    const finalFiltered = sortVisitsByDate(filteredBySearch, sortOrder);

    return finalFiltered;
  };

  // 🔄 Funciones de manejo locales
  const handleCategoryClickLocal = (category: CategoryName) => {
    setLocalCategoryActive(category);
  };

  const toggleSortOrderLocal = () => {
    const newOrder = localSortOrder === 'asc' ? 'desc' : 'asc';
    setLocalSortOrder(newOrder);
  };

  const handleSearchChangeLocal = (event: Event) => {
    const searchValue = (event.target as HTMLInputElement).value;
    setSearchTerm(searchValue);
  };

  // 🔄 Funciones existentes (para compatibilidad)
  const handleCategoryClick = (cat: CategoryName) => {
    setCategoryActive(cat);
  };

  const handleSearchChange = (event: Event) => {
    const target = event.target as HTMLIonSearchbarElement;
    setSearchTerm(target.value ?? '');
  };

  const toggleSortOrder = () => {
    setSortOrder((prev) => (prev === 'asc' ? 'desc' : 'asc'));
  };

  const parseDate = (dateString: string) => {
    const [day, month, year] = dateString.split(/[-/]/);
    return new Date(`${year}-${month}-${day}`);
  };

  const activities = useMemo(() => {
    const createActivity = (date: string, visits: IVisit[]): IActivity => ({
      date,
      visits,
    });

    const filteredLocalActivities: IActivity[] = [];

    if (!isOnline) {
      return filteredLocalActivities;
    }

    const activitiesMap = new Map<string, IVisit[]>();
    filteredLocalActivities.forEach((la) => {
      const existingVisits = activitiesMap.get(la.date) || [];
      const newVisits = la.visits.filter(
        (locV) =>
          !existingVisits.some((exV) => exV.activity_id === locV.activity_id)
      );
      activitiesMap.set(la.date, existingVisits.concat(newVisits));
    });

    const finalActivities: IActivity[] = [];
    for (const [date, visits] of activitiesMap.entries()) {
      finalActivities.push(createActivity(date, visits));
    }

    return finalActivities;
  }, [categoryActive, isOnline]);

  const filteredActivities = useMemo(() => {
    let filtered;
    if (searchTerm) {
      const lowerSearchTerm = searchTerm.toLowerCase();
      filtered = activities
        .map((activity) => {
          const filteredVisits = activity.visits.filter((visit) => {
            const userName =
              visit.card_information.user_name?.toLowerCase() || '';
            const address = visit.card_information.address?.toLowerCase() || '';
            const biaCode =
              visit.card_information.internal_bia_code?.toLowerCase() || '';
            return (
              userName.includes(lowerSearchTerm) ||
              address.includes(lowerSearchTerm) ||
              biaCode.includes(lowerSearchTerm)
            );
          });
          return { ...activity, visits: filteredVisits };
        })
        .filter((activity) => activity.visits.length > 0);
    } else {
      filtered = [...activities];
    }

    filtered.sort((a, b) => {
      const dateA = parseDate(a.date).getTime();
      const dateB = parseDate(b.date).getTime();
      return sortOrder === 'asc' ? dateA - dateB : dateB - dateA;
    });

    return filtered;
  }, [activities, searchTerm, sortOrder]);

  // 🔄 Función para obtener visitas migrada del componente
  const getVisits = async () => {
    setIsLoading(true);
    try {
      const visits: IVisitNewByDate[] = await fetchVisits(
        navigator.onLine,
        user?.user.role as RolesEnum
      );
      setListVisitsByDate(visits);
      setCategoryActive(getCategories()[0] as CategoryName);
      setCategories(getCategories());

      // Actualizar también las visitas completadas y descargadas después de obtener las visitas
      await getExistingVisitIds();
      await getCompletedVisitIds();
      await getDownloadedVisitsInfo();
      setIsLoading(false);
      //eslint-disable-next-line @typescript-eslint/no-unused-vars
    } catch (error) {
      setIsLoading(false);
    }
  };

  const getCategories = (): string[] => {
    const categories: string[] = [
      CategoryName.PROXIMAS,
      CategoryName.COMPLETADAS,
      CategoryName.FALLIDAS,
      CategoryName.DEVUELTAS,
    ];
    return [...new Set(categories)];
  };

  // 🔄 Funciones de inicialización migradas del componente
  const executeMainOperations = async () => {
    await Promise.all([
      getVisits(),
      getExistingVisitIds(),
      getCompletedVisitIds(),
      getDownloadedVisitsInfo(),
    ]);
  };

  const initializePage = async () => {
    trackEvent('OPS_VIEW_APP_HOME', {});
    try {
      // 1. Verificar si BD existe, si no existe la crea
      await checkAndCreateDatabases();

      // 2. Ahora que garantizamos que la BD existe, ejecutar las operaciones principales
      await executeMainOperations();
      //eslint-disable-next-line @typescript-eslint/no-unused-vars
    } catch (error) {
      // En caso de error crítico, intentar ejecutar solo lo que no depende de BD
    }
  };

  // 🔔 Función para suscribirse a notificaciones
  const handleSubscribeToNotifications = async () => {
    try {
      const token = await getToken();
      if (token) {
        const response = await fetchNotificationsSubscribe(token);
        if (response.status !== 'subscribed') {
          setToastMessage({
            title: 'Error',
            message: 'No se logró suscribir a notificaciones',
            theme: 'error',
          });
        }
      }
    } catch (error) {
      console.warn('⚠️ Error suscribiendo a notificaciones:', error);
    }
  };

  // 🔔 Estados para notificaciones
  const [notifications, setNotifications] = useState<INotification[]>([]);
  const [unreadNotifications, setUnreadNotifications] = useState<
    INotification[]
  >([]);
  const [isLoadingNotifications, setIsLoadingNotifications] = useState(false);

  // 🔔 Función para obtener notificaciones
  const getNotifications = async () => {
    setIsLoadingNotifications(true);
    try {
      const response = await fetchNotifications(isOnline);
      setNotifications(response);
      setUnreadNotifications(
        response.filter(
          (notification: INotification) =>
            Boolean(notification.is_view) === false
        )
      );
      setIsLoadingNotifications(false);
    } catch (error) {
      setIsLoadingNotifications(false);
      console.warn('⚠️ Error getting notifications:', error);
    }
  };

  // 🌐 Ejecutar operaciones principales cuando se recupere la conexión a internet
  useEffect(() => {
    executeMainOperations();
    getNotifications();
  }, [isOnline]);

  // Efecto para actualizar información de visitas descargadas cuando cambie existingVisitIds
  useEffect(() => {
    if (existingVisitIds.length > 0) {
      getDownloadedVisitsInfo();
    }
  }, [existingVisitIds]);

  // Efecto para manejar el resultado de la sincronización
  useEffect(() => {
    if (syncSuccess) {
      setToastMessage({
        title: 'Éxito',
        message: 'Todas las visitas se sincronizaron correctamente',
        theme: 'success',
      });
      setTimeout(() => {
        window.location.reload();
      }, 3000);
      // Refrescar la página para mostrar los cambios
      getVisits();
      getDownloadedVisitsInfo(); // Actualizar información de visitas descargadas
    }

    if (syncError) {
      setToastMessage({
        title: 'Error de sincronización',
        message: syncError,
        theme: 'error',
      });
    }
  }, [syncSuccess, syncError]);

  // 🔄 Efecto para controlar el estado de descarga activa
  useEffect(() => {
    const hasActiveDownload = Object.values(downloadingVisits).some(Boolean);
    setIsAnyDownloadActive(hasActiveDownload);
  }, [downloadingVisits]);

  // Efecto para filtrar visitas cuando cambie cualquier filtro
  useEffect(() => {
    const filtered = applyAllFilters(
      listVisitsByDate,
      localCategoryActive,
      searchTerm,
      localSortOrder
    );
    setFilteredVisitsByDate(filtered);
  }, [
    listVisitsByDate,
    localCategoryActive,
    searchTerm,
    localSortOrder,
    existingVisitIds,
    completedVisitIds,
    syncVisitsByDate,
    downloadedVisitsInfo,
  ]);

  return {
    // 🔄 Estados migrados del componente
    isLoading,
    listVisitsByDate,
    filteredVisitsByDate,
    searchTerm,
    localCategoryActive,
    localSortOrder,
    completedVisitIds,
    syncVisitsByDate,
    downloadedVisitsInfo,
    isAnyDownloadActive,
    toastMessage,
    setToastMessage,
    downloadingVisitText,
    notifications,
    unreadNotifications,
    isLoadingNotifications,

    // 🔄 Funciones migradas del componente
    rejectVisit,
    assingVisit,
    goDetailVisit,
    getVisitInfo,
    handleSingleDownload,
    handleSyncAllVisits,
    handleCategoryClickLocal,
    toggleSortOrderLocal,
    handleSearchChangeLocal,
    initializePage,
    handleSubscribeToNotifications,
    getNotifications,
    // getVisits,

    // 🔄 Estados de sincronización
    isLoadingSyncVisit,
    syncSuccess,
    syncError,
    isLoadingMessageSyncVisit,

    // 🔄 Estados existentes (para compatibilidad)
    activities: filteredActivities,
    categories,
    categoryActive,
    handleCategoryClick,
    handleSearchChange,
    // isErrorVisits,
    // isLoadingVisits,
    sortOrder,
    toggleSortOrder,
    downloadOrderDetail,
    getExistingVisitIds,
    downloadingVisits,
    existingVisitIds,
  };
};
