import { useEffect, useState, useCallback } from 'react';
import { RouteComponentProps, useHistory, useLocation } from 'react-router-dom';
import { 
  IonButton,
  IonContent,
  IonFooter,
  IonPage,
  useIonRouter,
  useIonViewWillEnter,
} from '@ionic/react';
import { useTranslation } from 'react-i18next';
import {
  BiaIcon,
  BiaLoader,
  BiaText,
  BiaToast,
  Header,
  Toast,
} from '@entropy/index';
import { toast } from 'react-toastify';
import { TranslationNamespaces } from '@shared/i18n';
import {
  OfflineAlert,
  storageManager,
  useAuthStore,
  useConnectivityStore,
  useTrackEvent,
} from '@shared/index';
import { EnumFeatureFlag, useFeatureFlag } from '@shared/hooks/useFeatureFlag';
import { getTableDataByQuery } from '@shared/db/databaseService';
import {
  IDataBaseNames,
  IDataBaseTables,
  ITableVisit,
} from '@shared/data/IDatabase';
import {
  ActivityStatus,
  IVisit,
} from '@visits/data/interfaces/visits.interface';
import {
  IField,
  IVisitDetail,
} from '@visits/data/interfaces/visitDetail.interface';
import { ModalReject, RenderField, SlideToggle } from '@visits/ui/components';
import styles from './VisitDetail.module.css';
import { fetchVisitDetail } from '@mobile/visits/data/visitDetail/visitDetail';
import { fetchChangeActivityStatus } from '@mobile/visits/data/activityStatus';
import { useSyncVisit } from '@mobile/visits/data/hooks';
import { IActivityStatus } from '@mobile/visits/data/interfaces/activityStatus.interface';
import { base64ToJson } from '@shared/utils/base64Utils';
import {
  fetchEquipmentCertificates,
  getEquipmentCertificatesDB,
} from '@mobile/visits/data/equipmentCertificates';
import {
  EEquipmentCertificateStatus,
  IEquipmentCertificate,
} from '@mobile/visits/data/interfaces/equipmentCertificates.interface';


enum FieldType {
  SCOPE = 'scope',
  EQUIPMENTS = 'equipments',
}



type IvisitDetailProps = RouteComponentProps<{
  id?: string;
}>;

export const VisitDetail = ({ match }: IvisitDetailProps) => {
  const [openModalReject, setOpenModalReject] = useState(false);
  const [toastMessage, setToastMessage] = useState<{
    title: string;
    message: string;
    theme: 'success' | 'error';
  } | null>(null);
  const [revertWidgets, setRevertWidgets] = useState<any>(null);
  const [revertWidgetsLoading, setRevertWidgetsLoading] = useState(false);
  const [revertWidgetsError, setRevertWidgetsError] = useState<string | null>(null);
  const [showLoading, setShowLoading] = useState(false);
  const [visitIsCompleteDB, setVisitIsCompleteDB] = useState<boolean>(false);
  const [copied, setCopied] = useState<boolean>(false);
  const [activityType, setActivityType] = useState<string>('');
  const [activityTypeName, setActivityTypeName] = useState<string>('');
  const [equipmentCertificates, setEquipmentCertificates] = useState<
    IEquipmentCertificate[]
  >([]); 
  const noEllipsis = true;
  const router = useIonRouter();
  const location = useLocation();
  const isOnline = useConnectivityStore((state) => state.isOnline);
  const { t } = useTranslation(TranslationNamespaces.VISITS);
  const trackEvent = useTrackEvent();
  // Feature flag para verificación de equipos
  const isCheckingEquipmentEnabled = useFeatureFlag(
    EnumFeatureFlag.CHECKING_EQUIPMENT
  );

  const activity_id = match.params.id ?? '';

  // Función para cargar certificados de equipos
  const loadEquipmentCertificates = useCallback(async () => {
    try {
      const response = await getEquipmentCertificatesDB(activity_id);
      if (response.success) {
        setEquipmentCertificates(response.data.certificates);
      } else {
        setEquipmentCertificates([]);
      }
    } catch (error) {
      console.error('❌ Error al cargar certificados de equipos:', error);
      setEquipmentCertificates([]);
    }
  }, [activity_id]);
  // Verificar si todos los equipos están verificados
  const areAllEquipmentVerified = () => {
    const allVerified =
      equipmentCertificates.length > 0 &&
      equipmentCertificates.every(
        (certificate) =>
          certificate.status === EEquipmentCertificateStatus.VERIFIED
      );

    return allVerified;
  };

  // Hook de sincronización
  const {
    syncSteps,
    isLoadingSyncVisit,
    isGeneratingPdf,
    syncSuccess,
    syncError,
    clearSyncStatus,
    processArrivalPhotos,
    isLoadingMessageSyncVisit,
  } = useSyncVisit(activity_id);

  // Función para verificar si la visita existe en la base de datos
  const checkVisitExistsInDB = useCallback(async () => {
    try {
      const visitData = await getTableDataByQuery<ITableVisit>(
        IDataBaseNames.OPERACIONES,
        IDataBaseTables.VISITS,
        (table) => {
          return table.where('visitId').equals(activity_id).toArray();
        }
      );

      const exists = visitData.length > 0;
      const isComplete = exists ? visitData[0].isComplete === true : false;

      setVisitIsCompleteDB(isComplete);

      return { exists, isComplete };
    } catch (error) {
      console.error(
        'Error al verificar la existencia de la visita en la BD:',
        error
      );
      setVisitIsCompleteDB(false);
      return { exists: false, isComplete: false };
    }
  }, [activity_id]);

  // Función para validar acceso offline
  const validateOfflineAccess = async () => {
    if (!isOnline) {
      const { exists, isComplete } = await checkVisitExistsInDB();

      if (!exists) {
        return false;
      }

      if (isComplete) {
        setToastMessage({
          title: 'Visita completada',
          message:
            'Esta visita ya ha sido completada y está lista para sincronizar.',
          theme: 'success',
        });
      }
    }
    return true;
  };

  // Función para validar si la visita está completa
  const validateVisitNotComplete = async () => {
    const { exists, isComplete } = await checkVisitExistsInDB();

    if (exists && isComplete) {
      setToastMessage({
        title: 'Visita completada',
        message: 'No puedes modificar una visita que ya ha sido completada.',
        theme: 'error',
      });
      return false;
    }

    return true;
  };

  // Función para mantener query params en navegación
  const navigateWithQueryParams = (
    path: string,
    additionalParams?: Record<string, string>
  ) => {
    const currentParams = new URLSearchParams(location.search);

    if (additionalParams) {
      Object.entries(additionalParams).forEach(([key, value]) => {
        currentParams.set(key, value);
      });
    }

    const queryString = currentParams.toString();
    const finalPath = queryString ? `${path}?${queryString}` : path;
    return finalPath;
  };

  // Función para sincronizar visita
  const handelSyncVisit = async () => {
    // Validar acceso offline antes de sincronizar
    const isValid = await validateOfflineAccess();
    if (!isValid) {
      return;
    }

    // Verificar que la visita esté disponible para sincronizar
    const { exists } = await checkVisitExistsInDB();
    if (!exists) {
      setToastMessage({
        title: 'Error',
        message: 'La visita no existe en la base de datos local.',
        theme: 'error',
      });
      return;
    }

    try {
      await processArrivalPhotos(activity_id);
      // Sincronizar pasos y generar PDF
      await syncSteps(activity_id);
    } catch (error) {
      console.error('Error en proceso de sincronización:', error);
      setToastMessage({
        title: t('toast_error_title'),
        message: t('toast_error_message'),
        theme: 'error',
      });
    }
  };

  // Efecto para manejar resultados de sincronización
  useEffect(() => {
    if (syncSuccess) {
      toast(
        <Toast
          type='success'
          title={t('toast_success_title')}
          message={t('toast_success_message')}
        />
      );

      // Limpiar estado de sincronización
      clearSyncStatus();

      // Redirigir a home después del éxito
      setTimeout(() => {
        router.push('/home');
        setTimeout(() => {
          window.location.reload();
        }, 1000);
      }, 2000);
    }
  }, [syncSuccess, t, router, clearSyncStatus]);


  // Efecto para manejar errores de sincronización
  useEffect(() => {
    if (syncError) {
      toast(
        <Toast
          type='error'
          title={t('toast_error_title')}
          message={t('toast_error_message')}
        />
      );

      // Limpiar estado de error
      clearSyncStatus();
    }
  }, [syncError, t, clearSyncStatus]);

  const history = useHistory();

  const goToVisitFailed = (activity_status: ActivityStatus) => {
    history.push(
      navigateWithQueryParams(`/visit/${activity_id}/failed-visit`, {
        activity_status,
      })
    );
  };

  // refactorizacion
  const [visitDetail, setVisitDetail] = useState<IVisitDetail | null>(null);
  const INTERNAL_BASE_URL = 'https://internal.dev.bia.app';
  const REVERT_ACT_PAGE_CODE = 'df4bcdd0-1395-4bf9-8f3a-3694e22d1616';
  const userId = useAuthStore((s) => s.user?.user?.electrician_id); 


  const getVisitDetail = useCallback(async () => {
    setShowLoading(true);
    try {
      // Primero verificar en base de datos local
      const visitData = await getTableDataByQuery<ITableVisit>(
        IDataBaseNames.OPERACIONES,
        IDataBaseTables.VISITS,
        (table) => table.where('visitId').equals(activity_id).toArray()
      );
      const dataLocal = await storageManager.getItem(activity_id);
      const dataLocalVisit: IVisit | null = base64ToJson(dataLocal ?? '');
      setActivityType(dataLocalVisit?.card_information.activity_type_id ?? '');
      setActivityTypeName(dataLocalVisit?.card_information.activity_type ?? '');

      if (visitData.length > 0) {
        // Usar datos locales
        const localDetail = visitData[0].detail;
        const history = visitData[0].detail.descriptions.find(
          (item) => item.title === 'Histórico de la visita'
        );

        const statusToLocalIcon = {
          'completed-2': '/assets/images/completed-2.png',
          canceled: '/assets/images/canceled.png',
          'in_route-2': '/assets/images/in_route-2.png',
          'in_address-2': '/assets/images/in_address-2.png',
          'init_form-2': '/assets/images/init_form-2.png',
          failed_continue: '/assets/images/failed_continue.png',
        };

        if (history) {
          const updatedFields = history.fields.map((field) => {
            if (
              field.type === 'MULTIPLE_LINE_LABEL_WITH_ICON' &&
              field.icon_url
            ) {
              const filenameWithExt = field.icon_url.split('/').pop() || '';
              const filename = filenameWithExt.replace(/\.png$/, '');
              if (filename in statusToLocalIcon) {
                return {
                  ...field,
                  icon_url:
                    statusToLocalIcon[
                      filename as keyof typeof statusToLocalIcon
                    ],
                };
              }
            }
            return field;
          });

          const updatedHistory = { ...history, fields: updatedFields };

          const updatedDescriptions = localDetail.descriptions.map((desc) =>
            desc.title === 'Histórico de la visita' ? updatedHistory : desc
          );

          const modifiedDetail = {
            ...localDetail,
            descriptions: updatedDescriptions,
          };
          setVisitDetail(modifiedDetail);
        } else {
          setVisitDetail(localDetail);
        }
        setVisitIsCompleteDB(visitData[0].isComplete === true);
      } else {
        // No existe localmente, intentar fetch si online
        if (!isOnline) {
          return;
        }

        // Fetch desde API
        const data = await fetchVisitDetail(activity_id, isOnline ?? false);
        setVisitDetail(data);
        // Opcional: guardar en DB local después de fetch
        await checkVisitExistsInDB();
      }
    } catch (error) {
      console.error('Error al obtener detalle de visita:', error);
      setToastMessage({
        title: 'Error',
        message: 'No se pudo cargar el detalle de la visita',
        theme: 'error',
      });
      router.goBack();
    } finally {
      setShowLoading(false);

      // Cargar certificados SIEMPRE (con o sin internet)
      try {
        await loadEquipmentCertificates();
      } catch (error) {
        console.error('Error al cargar certificados en finally:', error);
      }
    }
  }, [
    activity_id,
    isOnline,
    checkVisitExistsInDB,
    activityType,
    loadEquipmentCertificates,
  ]);

  useIonViewWillEnter(() => {
    getVisitDetail();
    // Cargar certificados siempre al entrar a la pantalla (con o sin internet)
    loadEquipmentCertificates();
  });

  useEffect(() => {
    getVisitDetail();
    // Cargar certificados también en el useEffect principal
    loadEquipmentCertificates();
  }, [getVisitDetail, loadEquipmentCertificates]);

  // Cargar certificados cuando cambie el tipo de actividad
  useEffect(() => {
    loadEquipmentCertificates();
  }, [loadEquipmentCertificates]);

  
  const handleGetEquipmentCertificates = async () => {
    setShowLoading(true);
    const response = await fetchEquipmentCertificates({ activity_id });
    if (response.success && response.data.certificates.length > 0) {
      // Recargar certificados después de obtenerlos
      await loadEquipmentCertificates();
      setTimeout(() => {
        setShowLoading(false);
        history.push(`/visit/${activity_id}/checking-equipment`);
      }, 500);  
    } else {
      setShowLoading(false);
      setToastMessage({
        title: t('error_get_equipment_certificates'),
        message: '',
        theme: 'error',
      });
    }
  };

  const handleChangeActivityStatus = async (
    activity_status: ActivityStatus
  ) => {
    if (activity_status === ActivityStatus.IN_ADDRESS) {
      history.push(`/visit/arrival/${activity_id}`);
      return;
    }
    // Validar acceso offline antes de cambiar el estado
    const isValid = await validateOfflineAccess();
    if (!isValid) {
      return;
    }

    // Validar que la visita no esté completa antes de cambiar el estado
    const isNotComplete = await validateVisitNotComplete();
    if (!isNotComplete) {
      return;
    }

    trackEvent('OPS_EXECUTE_WORK_ORDER', {
      work_order_id: activity_id,
      step: activity_status,
    });

    const status: IActivityStatus[] = [
      {
        status: activity_status,
        created_at_app: new Date().toISOString(),
        is_online: isOnline ?? false,
      },
    ];

    setShowLoading(true);
    fetchChangeActivityStatus(activity_id, status)
      .then(() => {
        getVisitDetail();
        setShowLoading(false);
        if (activity_status === ActivityStatus.CHECKING_EQUIPMENT) {
          handleGetEquipmentCertificates();
        }
      })
      .catch(() => {
        setToastMessage({
          title: 'Error',
          message: 'Error al cambiar el estado de la actividad',
          theme: 'error',
        });
        setShowLoading(false);
      });
  };

  const renderFooter = (detail: IVisitDetail) => {
    // Si la visita está completa localmente, mostrar botón de sincronización
    if (visitIsCompleteDB) {
      return (
        <IonFooter id='footer-visit-detail'>
          <footer className={styles.footer}>
            <IonButton
              id='button-sync-visit'
              className={styles.footerButton}
              onClick={handelSyncVisit}
              {...(!isOnline || isLoadingSyncVisit || isGeneratingPdf
                ? { disabled: true }
                : {})}
            >
              {isLoadingSyncVisit
                ? 'Sincronizando...'
                : isGeneratingPdf
                  ? 'Generando PDF...'
                  : 'Sincronizar visita'}
            </IonButton>
          </footer>
        </IonFooter>
      );
    }

    if (
      !isOnline &&
      (detail.activity_status === ActivityStatus.COMPLETED ||
        detail.activity_status === ActivityStatus.CANCELLED)
    ) {
      return (
        <IonFooter id='footer-visit-detail'>
          <footer className={styles.footer}>
            <IonButton
              id='button-sync-visit'
              className={styles.footerButton}
              onClick={handelSyncVisit}
              disabled={!isOnline || isLoadingSyncVisit || isGeneratingPdf}
            >
              {isLoadingSyncVisit
                ? 'Sincronizando...'
                : isGeneratingPdf
                  ? 'Generando PDF...'
                  : 'Sincronizar'}
            </IonButton>
          </footer>
        </IonFooter>
      );
    }

    if (
      detail.activity_status !== ActivityStatus.COMPLETED &&
      detail.activity_status !== ActivityStatus.CANCELLED &&
      detail.activity_status !== ActivityStatus.ELECTRICIAN_FAILED_VISIT
    ) {
      return (
        <IonFooter id='footer-visit-detail'>
          <footer className={styles.footer}>
            {/* 📋 Estados iniciales - ASSIGNED/REASSIGNED */}
            {(detail.activity_status === ActivityStatus.ASSIGNED ||
              detail.activity_status === ActivityStatus.REASSIGNED) && (
              <>
                {/* 🔧 Verificar equipos - Solo para INSTALLATION_VISIT y si el feature flag está habilitado */}
                {activityType === ActivityStatus.INSTALLATION_VISIT &&
                isCheckingEquipmentEnabled ? (
                  <SlideToggle
                    id='slide-toggle-verify-equipment'
                    slideData={{
                      [detail.activity_status]: {
                        iconName: 'faQrcode',
                        label: 'Verificar equipos',
                      },
                    }}
                    activityState={detail.activity_status}
                    onCompleted={() =>
                      handleChangeActivityStatus(
                        ActivityStatus.CHECKING_EQUIPMENT
                      )
                    }
                  />
                ) : (
                  /* 🚗 Iniciar traslado - Para otros tipos de actividad o cuando feature flag está deshabilitado */
                  <SlideToggle
                    id='slide-toggle-start-travel'
                    slideData={{
                      [detail.activity_status]: {
                        iconName: 'faCarSide',
                        label: 'Iniciar traslado',
                      },
                    }}
                    activityState={detail.activity_status}
                    onCompleted={() =>
                      handleChangeActivityStatus(ActivityStatus.IN_ROUTE)
                    }
                  />
                )}
              </>
            )}

            {/* 🔍 Estado CHECKING_EQUIPMENT - Solo para INSTALLATION_VISIT */}
            {detail.activity_status === ActivityStatus.CHECKING_EQUIPMENT && (
              <>
                {/* Mostrar SlideToggle si todos los equipos están verificados */}
                {areAllEquipmentVerified() ? (
                  <SlideToggle
                    id='slide-toggle-complete-verification'
                    slideData={{
                      CHECKING_EQUIPMENT: {
                        iconName: 'faCheckCircle',
                        label: 'Completar verificación de equipos',
                      },
                    }}
                    activityState={detail.activity_status}
                    onCompleted={() =>
                      handleChangeActivityStatus(
                        ActivityStatus.COMPLETED_EQUIPMENT
                      )
                    }
                  />
                ) : (
                  <>
                    <IonButton
                      id='button-continue-history'
                      className={styles.footerButton}
                      onClick={() => {
                        handleGetEquipmentCertificates();
                      }}
                    >
                      {t('continue_equipments_verification')}
                    </IonButton>

                    <button
                      id='button-failed-visit'
                      className={styles.buttonFailedvisit}
                      onClick={() =>
                        goToVisitFailed(
                          ActivityStatus.EQUIPMENT_VERIFICATION_FAILED
                        )
                      }
                    >
                      {t('continue_equipments_verification_failed')}
                    </button>
                  </>
                )}
              </>
            )}

            {/* ✅ Estado COMPLETED_EQUIPMENT - Solo para INSTALLATION_VISIT */}
            {detail.activity_status === ActivityStatus.COMPLETED_EQUIPMENT && (
              <>
                <SlideToggle
                  id='slide-toggle-completed-equipment'
                  slideData={{
                    COMPLETED_EQUIPMENT: {
                      iconName: 'faCarSide',
                      label: 'Iniciar traslado',
                    },
                  }}
                  activityState={detail.activity_status}
                  onCompleted={() =>
                    handleChangeActivityStatus(ActivityStatus.IN_ROUTE)
                  }
                />
              </>
            )}
            {detail.activity_status === ActivityStatus.IN_ROUTE && (
              <>
                <SlideToggle
                  id='slide-toggle-in-route'
                  slideData={{
                    IN_ROUTE: {
                      iconName: 'faLocationDot',
                      label: 'Llegada al sitio',
                    },
                  }}
                  activityState={detail.activity_status}
                  onCompleted={() =>
                    handleChangeActivityStatus(ActivityStatus.IN_ADDRESS)
                  }
                />
              </>
            )}
            {detail.activity_status === ActivityStatus.IN_ADDRESS && (
              <>
                <SlideToggle
                  id='slide-toggle-in-address'
                  slideData={{
                    IN_ADDRESS: {
                      iconName: 'faBuilding',
                      label: 'Ingreso a sitio',
                    },
                  }}
                  activityState={detail.activity_status}
                  onCompleted={() =>
                    handleChangeActivityStatus(ActivityStatus.ACTIVITY_STARTED)
                  }
                />
                <button
                  className={styles.buttonFailedvisit}
                  onClick={() =>
                    goToVisitFailed(ActivityStatus.SITE_ACCESS_FAILED)
                  }
                >
                  No puede ingresar a sitio
                </button>
              </>
            )}
            {detail.activity_status === ActivityStatus.ACTIVITY_STARTED && (
              <>
                <SlideToggle
                  id='slide-toggle-activity-started'
                  slideData={{
                    ACTIVITY_STARTED: {
                      iconName: 'faPlay',
                      label: 'Iniciar actividad',
                    },
                  }}
                  activityState={detail.activity_status}
                  onCompleted={() =>
                    handleChangeActivityStatus(ActivityStatus.INIT_FORM)
                  }
                />
                <button
                  className={styles.buttonFailedvisit}
                  onClick={() =>
                    goToVisitFailed(ActivityStatus.START_ACTIVITY_FAILED)
                  }
                >
                  No puede iniciar actividad
                </button>
              </>
            )}
           
           {(detail.activity_status === ActivityStatus.INIT_FORM ||
            (detail.activity_status as any) === 'REVERT_ACT') && (
            <>
              <IonButton
                id='button-continue-history'
                className={styles.footerButton}
                onClick={() =>
                  history.push(
                    navigateWithQueryParams(
                      `/visit-managment/history/${activity_id}`
                    )
                  )
                }
              >
                {t('continue_history')}
              </IonButton>

              <button
                id='button-failed-visit'
                className={styles.buttonFailedvisit}
                onClick={() =>
                  goToVisitFailed(ActivityStatus.CONTINUE_ACTIVITY_FAILED)
                }
              >
                No puede continuar la actividad
              </button>
            </>
          )}
            {(detail.activity_status ===
              ActivityStatus.CONTINUE_ACTIVITY_FAILED ||
              detail.activity_status === ActivityStatus.SITE_ACCESS_FAILED ||
              detail.activity_status === ActivityStatus.START_ACTIVITY_FAILED ||
              detail.activity_status ===
                ActivityStatus.EQUIPMENT_VERIFICATION_FAILED) && (
              <>
                <IonButton
                  id='button-continue-history'
                  className={styles.footerButton}
                  onClick={() =>
                    //goToVisitFailed(detail.activity_status)
                    history.push(
                      navigateWithQueryParams(
                        `/visit-managment/history/${activity_id}`,
                        {
                          isFailedVisit: 'true',
                          activity_status: detail.activity_status,
                        }
                      )
                    )
                  }
                >
                  {t('continue_history')}
                </IonButton>
              </>
            )}
          </footer>
        </IonFooter>
      );
    }

    return null;
  };

  const actionField = (field: IField) => {
    switch (field.type) {
      case FieldType.SCOPE:
        history.push(`/visit/${activity_id}/scope`);
        break;
      case FieldType.EQUIPMENTS:
        history.push(`/visit/${activity_id}/equipments`);
        break;
      default:
        break;
    }
  };

  return (
    <IonPage id='main-content'>
      {(showLoading || isLoadingSyncVisit || isGeneratingPdf) && (
        <BiaLoader
          color='accent'
          className={styles.loader}
          text={
            isLoadingSyncVisit
              ? isLoadingMessageSyncVisit
              : isGeneratingPdf
                ? 'Generando PDF...'
                : ''
          }
        />
      )}

      {toastMessage && (
        <BiaToast
          title={toastMessage.title}
          message={toastMessage.message}
          theme={toastMessage.theme}
          onClose={() => setToastMessage(null)}
        />
      )}

      <Header
        text={activityTypeName}
        iconLeftType='regular'
        backButton
      />

      <IonContent>
        {!isOnline && <OfflineAlert className={styles.offlineAlert} />}

        <div className={styles.mainContent}>
          {visitDetail?.descriptions.map((section, index) => (
            <div
              key={`${section.title}-${index}`}
              className={styles.section}
            >
              <BiaText
                token='bodyRegular'
                color='weak'
                className={styles.sectionTitle}
              >
                {section.title}
              </BiaText>

              {section.fields.map((field, indexField) => {
                const uniqueKey = `${field.code}-${field.name}-${indexField}`;

                if (field.name === 'work_order') {
                  return (
                    <div
                      id={uniqueKey}
                      key={uniqueKey}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px',
                        justifyContent: 'space-between',
                        borderBottom: '1px solid var(--border-standard)',
                        overflowWrap: 'anywhere',
                      }}
                    >
                      <RenderField field={field} />
                      <button
                        className={noEllipsis ? undefined : styles.ellipsisText}
                        style={{
                          background: 'transparent',
                          padding: '10px',
                        }}
                        onClick={(e) => {
                          e.stopPropagation();
                          navigator.clipboard.writeText(
                            field.selected_value[0]
                          );
                          setCopied(true);
                          setTimeout(() => setCopied(false), 3000);
                        }}
                        onMouseLeave={() => setCopied(false)}
                        tabIndex={0}
                      >
                        <BiaIcon
                          iconName={copied ? 'faCheck' : 'faCopy'}
                          iconType='solid'
                          size='12px'
                          color='weak'
                        />
                      </button>
                    </div>
                  );
                } else {
                  return (
                    <RenderField
                      id={uniqueKey}
                      key={uniqueKey}
                      field={field}
                      onClick={() => {
                        actionField(field);
                      }}
                    />
                  );
                }
              })}
            </div>
          ))}
        </div>

        {copied && (
          <BiaToast
            title='El código de la OT ha sido copiado al portapapeles'
            theme='success'
          />
        )}

        <ModalReject
          open={openModalReject}
          onCloseModal={() => setOpenModalReject(false)}
        />
      </IonContent>   
      {visitDetail && renderFooter(visitDetail)}
    </IonPage>
  );
};