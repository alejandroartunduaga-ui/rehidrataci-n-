import { Fragment, useEffect, useState } from 'react';
import {
  IonButton,
  IonContent,
  IonFooter,
  IonPage,
  IonSearchbar,
  IonRefresher,
  IonRefresherContent,
  useIonViewWillEnter,
} from '@ionic/react';
import { useTranslation } from 'react-i18next';
import { BiaIcon, BiaLoader, BiaText, BiaToast, Header } from '@entropy/index';
import { TranslationNamespaces } from '@shared/i18n';
import {
  OfflineAlert,
  useAuthStore,
  useConnectivityStore,
  useFirebasePush,
  useTrackEvent,
} from '@shared/index';
import { Menu } from '@shared/components/MenuMobile/MenuMobile';
import { dateExtended, labelDate } from '@shared/utils/date';
import VersionApp from '@shared/components/VersionApp/VersionApp';
import { PanelNotifications } from '@shared/components/PanelNotifications/PanelNotifications';

import { useVisits } from '@visits/data/hooks';
import {
  ActivityStatus,
  CategoryName,
  IVisitNew,
} from '@visits/data/interfaces/visits.interface';
import { Card, Chip, EmptyScreen, ModalReject } from '@visits/ui/components';
import styles from './Visits.module.css';
import { RolesEnum } from '@auth/index';
import { useQueryParams } from '@shared/hooks/useQueryParams';
import { jsonToBase64 } from '@shared/utils/base64Utils';
import { storageManager } from '@shared/storage/storageManager';

export const Visits: React.FC = () => {
  const [openModalReject, setOpenModalReject] = useState(false);
  const [isLoadingCategory, setIsLoadingCategory] = useState(false);
  const [openNotificationsModal, setOpenNotificationsModal] = useState(false);
  const { getQueryParam, cleanQueryParams } = useQueryParams();
  // 🔄 Hook migrado con toda la lógica
  const {
    // Estados
    isLoading,
    filteredVisitsByDate,
    searchTerm,
    localCategoryActive,
    localSortOrder,
    isAnyDownloadActive,
    toastMessage,
    setToastMessage,
    downloadingVisits,
    existingVisitIds,
    categories,
    notifications,
    unreadNotifications,

    // Estados de sincronización
    isLoadingSyncVisit,
    isLoadingMessageSyncVisit,

    // Funciones
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
  } = useVisits();

  const { user } = useAuthStore();
  const isOnline = useConnectivityStore((state) => state.isOnline);
  const { t } = useTranslation(TranslationNamespaces.VISITS);
  const { setReceibingNotification, receibingNotification } = useFirebasePush();
  const trackEvent = useTrackEvent();
  // 🔄 Función de refresh simplificada
  const handleRefresh = (event: CustomEvent) => {
    // window.location.reload();
    event.detail.complete();
  };

  // 🔄 Función para manejar modal de rechazo
  const handleRejectVisit = async (visit: IVisitNew) => {
    const shouldOpenModal = await rejectVisit(visit);
    if (shouldOpenModal) {
      setOpenModalReject(true);
    }
  };

  // 🔄 Función para manejar cambio de categoría con loader
  const handleCategoryChange = async (category: CategoryName) => {
    setIsLoadingCategory(true);
    await handleCategoryClickLocal(category);
    // Simular un pequeño delay para que se vea el loader
    setTimeout(() => {
      setIsLoadingCategory(false);
    }, 300);
  };

  // 🔄 Hook de inicialización simplificado
  useIonViewWillEnter(() => {
    initializePage();
    handleSubscribeToNotifications();
    getNotifications();
  });

  useEffect(() => {
    if (receibingNotification) {
      getNotifications();
      setReceibingNotification(false);
    }
  }, [receibingNotification]);

  useEffect(() => {
    if (getQueryParam('source') === 'notification') {
      trackEvent('OPS_CLICKED_NOTIFICATION', {
        notification_id: getQueryParam('notification_id'),
      });
      setOpenNotificationsModal(true);
      cleanQueryParams();
    }
  }, [getQueryParam('source')]);

  return (
    <>
      <VersionApp />
      <Menu />
      <IonPage id='main-content'>
        <Header
          text={t('header_title')}
          menuIcon
          showNotifications
          notificationCount={unreadNotifications.length}
          onNotificationClick={() => {
            setOpenNotificationsModal(true);
          }}
        />

        <IonContent>
          <IonRefresher
            slot='fixed'
            onIonRefresh={handleRefresh}
          >
            <IonRefresherContent
              pullingText='Pull to refresh'
              refreshingSpinner='circles'
            />
          </IonRefresher>
          {(isLoading || isLoadingSyncVisit || isLoadingCategory) && (
            <BiaLoader
              color='accent'
              className={styles.loader}
              text={
                isLoadingSyncVisit
                  ? isLoadingMessageSyncVisit
                  : isLoadingCategory
                    ? t('loading.category')
                    : undefined
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
          <div className={styles.subHeader}>
            <div className={styles.categoriesWrapper}>
              {user?.user?.role != RolesEnum.CONTRACTOR_MANAGER && (
                <Chip
                  label={t('sync')}
                  active={localCategoryActive === CategoryName.POR_SYNCRONIZAR}
                  onClick={() =>
                    handleCategoryChange(CategoryName.POR_SYNCRONIZAR)
                  }
                />
              )}
              {!isOnline &&
                !categories?.some(
                  (category) => category === CategoryName.PROXIMAS
                ) && (
                  <Chip
                    label={t('assigned')}
                    active={localCategoryActive === CategoryName.PROXIMAS}
                    onClick={() => handleCategoryChange(CategoryName.PROXIMAS)}
                  />
                )}

              {categories?.map((category) => {
                return (
                  <Chip
                    label={category}
                    key={category}
                    active={localCategoryActive === category}
                    onClick={() =>
                      handleCategoryChange(category as CategoryName)
                    }
                  />
                );
              })}
            </div>

            <div className={styles.filtersWrapper}>
              <IonSearchbar
                placeholder={t('placeholder_search')}
                value={searchTerm}
                onIonInput={handleSearchChangeLocal}
                className={styles.search}
              />
              <button
                className={styles.buttonSort}
                onClick={toggleSortOrderLocal}
              >
                <BiaIcon
                  iconName={
                    localSortOrder === 'asc'
                      ? 'faArrowUpWideShort'
                      : 'faArrowDownWideShort'
                  }
                  iconType='solid'
                  color='inverse'
                />
              </button>
            </div>
          </div>

          <div className={styles.visitsWrapper}>
            {!isOnline && <OfflineAlert className={styles.offlineAlert} />}

            {filteredVisitsByDate?.length !== 0 ? (
              filteredVisitsByDate?.map((activity, index) => (
                <Fragment key={activity.date + index}>
                  <BiaText
                    token='caption'
                    color='accent'
                    className={styles.dataActivity}
                  >
                    {labelDate(activity.date)}
                  </BiaText>

                  <div className={styles.cardWrapper}>
                    {activity.visits.map((visit) => {
                      // Obtener la información más actualizada (local si está disponible, servidor si no)
                      const visitInfo = getVisitInfo(visit);

                      return (
                        <Card
                          className={styles.card}
                          key={visit.activity_id}
                        >
                          <div
                            className={styles.badgeStatus}
                            style={{
                              background:
                                visitInfo.card_information.activity_status !==
                                ActivityStatus.PENDING_ASSIGNMENT
                                  ? visitInfo.card_information
                                      .activity_status_color
                                  : 'var(--chart-red02)',
                            }}
                          >
                            <BiaText
                              token='caption'
                              color='inverse'
                            >
                              {visitInfo.card_information.activity_status_title}
                            </BiaText>
                          </div>
                          {user?.user?.role !==
                            RolesEnum.CONTRACTOR_MANAGER && (
                            <button
                              className={styles.iconWrapper}
                              onClick={() => {
                                // Usar la visita original para navegación
                                goDetailVisit(visit);
                              }}
                            >
                              <BiaIcon
                                className={styles.icon}
                                iconName='faChevronRight'
                                iconType='solid'
                              />
                            </button>
                          )}
                          {user?.user?.role !== RolesEnum.CONTRACTOR_MANAGER &&
                            localCategoryActive === CategoryName.PROXIMAS &&
                            (existingVisitIds.includes(visit.activity_id) ? (
                              <BiaIcon
                                iconName='faBadgeCheck'
                                iconType='solid'
                                color='positive'
                                className={styles.iconSuccess}
                              />
                            ) : downloadingVisits[visit.activity_id] ? (
                              <BiaIcon
                                iconName='faLoader'
                                iconType='solid'
                                size='24px'
                                color={'accent'}
                                className={styles.iconRotate}
                              />
                            ) : (
                              <button
                                className={`${styles.buttonDownload} ${
                                  isAnyDownloadActive
                                    ? styles.buttonDisabled
                                    : ''
                                }`}
                                onClick={() => handleSingleDownload(visit)}
                                disabled={isAnyDownloadActive}
                                title={
                                  isAnyDownloadActive
                                    ? 'Descarga no disponible'
                                    : 'Descargar visita'
                                }
                              >
                                <BiaIcon
                                  iconName={
                                    isAnyDownloadActive
                                      ? 'faXmark'
                                      : 'faDownload'
                                  }
                                  iconType='solid'
                                  color={
                                    isAnyDownloadActive ? 'weak' : 'strong'
                                  }
                                  className={styles.iconDownload}
                                />
                              </button>
                            ))}

                          <BiaText token='heading-2'>
                            {visitInfo.card_information.activity_type}
                          </BiaText>

                          {visitInfo.card_information.activity_status ===
                            ActivityStatus.PENDING_ASSIGNMENT && (
                            <div>
                              <BiaText
                                token='caption'
                                color='strong'
                              >
                                {t('or')}
                              </BiaText>
                              <BiaText
                                token='caption'
                                color='weak'
                              >
                                {visitInfo.card_information.network_operator}
                              </BiaText>
                            </div>
                          )}

                          <BiaText
                            token='caption'
                            color='weak'
                          >
                            {visitInfo.card_information.assigned_role}
                          </BiaText>

                          <BiaText token='heading-3'>
                            {visitInfo.card_information.user_name}
                          </BiaText>

                          <BiaText
                            token='bodyRegular'
                            color='weak'
                          >
                            {visitInfo.card_information.work_order}
                          </BiaText>

                          <BiaText
                            token='bodyRegular'
                            color='weak'
                          >
                            {visitInfo.card_information.address}
                          </BiaText>

                          <BiaText
                            token='bodyRegular'
                            color='weak'
                          >
                            {visitInfo.card_information?.internal_bia_code}
                          </BiaText>

                          <BiaText token='bodyRegular'>
                            {`${dateExtended(
                              visitInfo.card_information.activity_date
                            )}  ${visitInfo.card_information.time_slot}`}
                          </BiaText>

                          {user?.user?.role === 'CONTRACTOR_MANAGER' && (
                            <>
                              {visit.typeActivity === 'TO_ASSIGN' && (
                                <div className={styles.containerButtons}>
                                  <IonButton
                                    expand='block'
                                    className={styles.rejectButton}
                                    onClick={() => handleRejectVisit(visit)}
                                  >
                                    {t('reject')}
                                  </IonButton>
                                  <IonButton
                                    expand='block'
                                    onClick={() => assingVisit(visit)}
                                  >
                                    {t('assign')}
                                  </IonButton>
                                </div>
                              )}
                              {visit.typeActivity === 'ASSIGNED' && (
                                <div className={styles.containerButtons}>
                                  <IonButton
                                    expand='block'
                                    onClick={() => assingVisit(visit)}
                                  >
                                    {t('re_assign')}
                                  </IonButton>
                                </div>
                              )}
                            </>
                          )}
                        </Card>
                      );
                    })}
                  </div>
                </Fragment>
              ))
            ) : (
              <EmptyScreen categoryActive={localCategoryActive} />
            )}
          </div>

          <ModalReject
            open={openModalReject}
            onCloseModal={() => setOpenModalReject(false)}
          />

          <PanelNotifications
            isOpen={openNotificationsModal}
            onClose={() => {
              setOpenNotificationsModal(false);
              getNotifications();
            }}
            onRefresh={getNotifications}
            notifications={notifications}
            onVisitNotificationClick={async (visitId: string) => {
              // Buscar la visita por ID
              const allVisits = filteredVisitsByDate.flatMap(
                (group) => group.visits
              );
              const visit = allVisits.find((v) => v.activity_id === visitId);

              if (visit && !existingVisitIds.includes(visitId)) {
                storageManager.setItem(
                  `${visit.activity_id}`,
                  jsonToBase64(visit)
                );
              }
            }}
          />
        </IonContent>

        {filteredVisitsByDate.length > 0 &&
          localCategoryActive === CategoryName.POR_SYNCRONIZAR && (
            <IonFooter>
              <footer className={styles.footerSync}>
                <IonButton
                  className={styles.syncButton}
                  onClick={handleSyncAllVisits}
                  {...(!isOnline || isLoadingSyncVisit
                    ? { disabled: true }
                    : {})}
                >
                  {isLoadingSyncVisit
                    ? isLoadingMessageSyncVisit || 'Sincronizando...'
                    : t('sync_all')}
                </IonButton>
              </footer>
            </IonFooter>
          )}
      </IonPage>
    </>
  );
};
