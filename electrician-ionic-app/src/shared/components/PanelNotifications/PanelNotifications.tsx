import {
  IonButton,
  IonButtons,
  IonContent,
  IonHeader,
  IonItem,
  IonModal,
  IonRefresher,
  IonRefresherContent,
  useIonRouter,
} from '@ionic/react';
import {
  INotification,
  NotificationType,
} from '@shared/data/interfaces/Notifications.interface';

import styles from './PanelNotifications.module.css';
import { Chip } from '@visits/ui/components';
import { BiaIcon, BiaText } from '@entropy/index';
import { useTranslation } from 'react-i18next';
import { TranslationNamespaces } from '@shared/i18n';
import { useEffect, useState } from 'react';
import { fetchNotificationsRead } from '@shared/data/NotifivationRead';
import {
  OfflineAlert,
  useConnectivityStore,
  useTrackEvent,
} from '@shared/index';
import { useFirebasePush } from '@shared/hooks/useFirebasePush';

interface PanelNotificationsProps {
  isOpen: boolean;
  onClose: () => void;
  notifications: INotification[];
  onRefresh: () => void;
  onVisitNotificationClick?: (visitId: string) => void; // Callback cuando se hace clic en una notificación de visita
}

enum Filter {
  ALL = 'all',
  UNREAD = 'unread',
}

export const PanelNotifications: React.FC<PanelNotificationsProps> = ({
  isOpen,
  onClose,
  notifications,
  onRefresh,
  onVisitNotificationClick,
}) => {
  const isOnline = useConnectivityStore((state) => state.isOnline);
  const { t } = useTranslation(TranslationNamespaces.GLOBAL);
  const [filter, setFilter] = useState<Filter | null>(Filter.ALL);
  const [showBlockedInstructions, setShowBlockedInstructions] =
    useState<boolean>(false);
  const router = useIonRouter();
  const { state, checkCurrentPermissions, requestPermissions } =
    useFirebasePush();
  const trackEvent = useTrackEvent();

  const handleFilter = (filter: Filter) => {
    if (isOnline) {
      trackEvent('OPS_CLICK_FILTER_NOTIFICATIONS', { filter: filter });
      setFilter(filter);
    }
  };

  const handleReadNotifications = (ids: string[]) => {
    fetchNotificationsRead(ids)
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      .then((response) => {
        for (const id of ids) {
          trackEvent('OPS_MARK_AS_READ_NOTIFICATION', {
            notification_id: id,
          });
        }
      })
      .catch((error) => {
        console.error(error);
      });
  };

  const filteredNotifications = notifications.filter((notification) => {
    if (filter === Filter.UNREAD) {
      return !notification.is_view;
    }
    return notification;
  });

  const handleClickNotification = async (notification: INotification) => {
    switch (notification.type) {
      case NotificationType.VISIT:
        await handleReadNotifications([notification.id]);
        trackEvent('OPS_CLICK_VIEW_NOTIFICATION', {
          notification_id: notification.id,
        });

        // Llamar al callback si está disponible para descargar la visita
        if (onVisitNotificationClick && notification.data.visit_id) {
          onVisitNotificationClick(notification.data.visit_id);
        }

        router.push(`/visit/${notification.data.visit_id}`);
        break;
      default:
        return;
    }
    onClose();
  };

  useEffect(() => {
    if (isOpen) {
      trackEvent('OPS_CLICK_NOTIFICATION_PANEL', {});
      const listIds = notifications
        .filter(
          (notification) =>
            !notification.is_view &&
            notification.type === NotificationType.SIMPLE
        )
        .map((notification) => notification.id);
      if (listIds.length > 0) {
        handleReadNotifications(listIds);
      }
      getPermissionNotifications();
    }
  }, [isOpen]);

  const getPermissionNotifications = async () => {
    await checkCurrentPermissions();
  };

  const handleRequestPermissions = async () => {
    try {
      await requestPermissions();
      // Después de solicitar permisos, verificar el estado actualizado
      await checkCurrentPermissions();
    } catch (error) {
      console.error('Error al solicitar permisos:', error);
      // Si hay un error, también podría indicar que están bloqueados
      if (error instanceof Error && error.message.includes('bloqueados')) {
        setShowBlockedInstructions(true);
      }
    }
  };

  useEffect(() => {
    if (!isOnline) {
      setFilter(null);
    }
  }, [isOnline]);

  useEffect(() => {
    if (state.permissionStatus === 'blocked') {
      setShowBlockedInstructions(true);
    }
  }, [state.permissionStatus]);

  const doRefresh = (event: CustomEvent) => {
    trackEvent('OPS_ON_REFRESH_NOTIFICATIONS', {});
    onRefresh();
    setTimeout(() => {
      event.detail.complete();
    }, 1000);
  };

  return (
    <IonModal
      className={styles.modalFullscreen}
      isOpen={isOpen}
      onDidDismiss={onClose}
      backdropDismiss={false}
    >
      <IonHeader>
        <header className={styles.header}>
          <IonButtons onClick={onClose}>
            <BiaIcon
              iconName='faChevronLeft'
              iconType='solid'
              size='1.25em' // 20px
            />
          </IonButtons>

          <div className={styles.longtext}>
            <BiaText
              token='heading-2'
              color='standard'
              className={styles.longtext}
            >
              {t('notifications.title')}
            </BiaText>
          </div>
          <IonButtons></IonButtons>
        </header>
      </IonHeader>
      <IonContent>
        <IonRefresher
          slot='fixed'
          onIonRefresh={doRefresh}
          pullMin={30}
        >
          <IonRefresherContent></IonRefresherContent>
        </IonRefresher>
        <div className={`ion-padding`}>
          {state.hasPermission && state.permissionStatus === 'granted' && (
            <div className={styles.grantedMessage}>
              <div className={styles.grantedMessageIcon}>
                <BiaIcon
                  iconName='faBell'
                  iconType='solid'
                  color='positive'
                />
              </div>
              <div className={styles.grantedMessageContent}>
                <BiaText
                  token='bodyRegular'
                  color='weak'
                  className={styles.grantedMessageText}
                >
                  {t('notifications.permission.granted')}
                </BiaText>
              </div>
            </div>
          )}
          {showBlockedInstructions && state.permissionStatus === 'blocked' && (
            <div className={styles.blockedMessage}>
              <div className={styles.blockedMessageIcon}>
                <BiaIcon
                  iconName='faBellSlash'
                  iconType='solid'
                  color='warning'
                />
              </div>
              <div className={styles.blockedMessageContent}>
                <BiaText
                  token='bodySemibold'
                  color='warning'
                  className={styles.blockedMessageTitle}
                >
                  {t('notifications.permission.blocked.title')}
                </BiaText>
                <br />
                <BiaText
                  token='bodyRegular'
                  color='weak'
                  className={styles.blockedMessageText}
                >
                  {t('notifications.permission.blocked.description')}
                </BiaText>
              </div>
            </div>
          )}
          {!state.hasPermission &&
            !showBlockedInstructions &&
            state.permissionStatus !== 'blocked' && (
              <div className={styles.requestPermissionsButtonContainer}>
                <BiaText
                  token='bodyRegular'
                  color='weak'
                  className={styles.requestPermissionsButtonText}
                >
                  {t('notifications.permission.denied.title')}
                </BiaText>
                <IonButton
                  onClick={handleRequestPermissions}
                  expand='block'
                  fill='solid'
                  className={styles.requestPermissionsButton}
                >
                  {state.isLoading
                    ? t('notifications.permission.requesting')
                    : t('notifications.permission.requestPermission')}
                </IonButton>
              </div>
            )}
        </div>
        <div
          className={`${styles.containerFitler} ion-padding-bottom ion-padding-horizontal`}
        >
          <Chip
            label={t('notifications.filter.all')}
            active={filter === Filter.ALL}
            onClick={() => handleFilter(Filter.ALL)}
          />
          <Chip
            label={t('notifications.filter.unread')}
            active={filter === Filter.UNREAD}
            onClick={() => handleFilter(Filter.UNREAD)}
          />
        </div>
        {!isOnline && (
          <div className='ion-padding'>
            <OfflineAlert
              className={styles.offlineAlert}
              title={t('notifications.offline_title')}
              message={t('notifications.offline_message')}
            ></OfflineAlert>
          </div>
        )}
        {isOnline && (
          <div className={styles.containerNotifications}>
            {filteredNotifications.length === 0 ? (
              <div className={styles.emptyState}>
                <div className={styles.emptyStateIcon}>
                  <BiaIcon
                    iconName='faBellExclamation'
                    iconType='solid'
                    color='accent'
                    size='24px'
                  />
                </div>
                <BiaText
                  token='heading-2'
                  color='strong'
                >
                  {filter === Filter.UNREAD
                    ? t('notifications.empty.unread')
                    : t('notifications.empty')}
                </BiaText>
                <BiaText
                  token='bodyRegular'
                  color='weak'
                >
                  {filter === Filter.UNREAD
                    ? t('notifications.empty.unread.description')
                    : t('notifications.empty.description')}
                </BiaText>
              </div>
            ) : (
              filteredNotifications.map((notification) => (
                <IonItem
                  button
                  onClick={() => handleClickNotification(notification)}
                  className={`${styles.notificationItem} ${notification.is_view ? '' : styles.unreadNotification}`}
                  key={notification.id}
                  detail={false}
                >
                  <div slot='start'>
                    <div className={styles.iconContainer}>
                      <BiaIcon
                        iconName={notification.icon}
                        iconType='regular'
                        color='accent'
                        size='16px'
                      />
                    </div>
                  </div>
                  <div className={styles.notificationContent}>
                    <div className={styles.captionContainer}>
                      <BiaText
                        token='bodySemibold'
                        color='standard'
                        className={styles.notificationTitle}
                      >
                        {notification.title}:
                      </BiaText>
                      <div
                        className={styles.notificationDescription}
                        dangerouslySetInnerHTML={{
                          __html: notification.message,
                        }}
                      />
                    </div>
                    <div className={styles.actionContainer}>
                      {notification.type !== NotificationType.SIMPLE && (
                        <BiaText
                          token='bodySemibold'
                          color='accent'
                          className={styles.viewButton}
                        >
                          {t('notifications.view')}
                        </BiaText>
                      )}
                      {!notification.is_view && (
                        <div className={styles.unreadIndicator} />
                      )}
                    </div>
                  </div>
                </IonItem>
              ))
            )}
          </div>
        )}
      </IonContent>
    </IonModal>
  );
};
