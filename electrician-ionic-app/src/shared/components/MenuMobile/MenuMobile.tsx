import styles from './MenuMobile.module.css';
import { BiaIcon, BiaItem, BiaText } from '@entropy/index';
import { getCurrentEnvironmentType } from '@shared/utils/environment.utils';
import { TranslationNamespaces } from '@shared/i18n';
import { useAuthStore } from '@shared/store/auth/useAuthStore';
import { useConnectivityStore } from '@shared/store/offline/useConnectivityStore';
import { useQuickCacheClear } from '@shared/hooks/useCacheCleaner';
import { useFirebasePush } from '@shared/hooks/useFirebasePush';
import { fetchNotificationsUnsubscribe } from '@shared/data/NotificationsUnsubscribe';
import { useTranslation } from 'react-i18next';
import { VERSION } from '@shared/data/version.global';

import {
  IonAvatar,
  IonContent,
  IonImg,
  IonMenu,
  IonMenuToggle,
  IonToolbar,
} from '@ionic/react';
import { signOut } from 'firebase/auth';
import { authFirebase } from '@shared/firebase/webFirebaseConfig';

export const Menu = () => {
  const { t } = useTranslation(TranslationNamespaces.GLOBAL);
  const { user, logout } = useAuthStore();
  const { clearCache, isClearing } = useQuickCacheClear();
  const { isOnline } = useConnectivityStore();
  const { state, getToken } = useFirebasePush();
  const environmentType = getCurrentEnvironmentType();

  const handleLogout = async () => {
    try {
      // Intentar obtener token si no está en estado
      let tokenToUnsubscribe = state.token;

      if (!tokenToUnsubscribe) {
        tokenToUnsubscribe = await getToken();
      }

      // Desuscribir de notificaciones si hay token
      if (tokenToUnsubscribe) {
        await fetchNotificationsUnsubscribe(tokenToUnsubscribe);
      }
    } catch (error) {
      console.error('Error al desuscribir de notificaciones:', error);
    } finally {
      await signOut(authFirebase);
      // Hacer logout independientemente del resultado de la desuscripción
      logout();
    }
  };

  // 🌐 Mostrar botón solo cuando hay internet
  const shouldShowRefreshButton = isOnline === true || isOnline === null;

  return (
    <IonMenu
      contentId='main-content'
      className={styles.menu}
      swipeGesture={false}
    >
      <IonToolbar className={styles.toolbar_menu}>
        <div className={styles.info_user}>
          <IonAvatar
            aria-hidden='true'
            slot='start'
            className={styles.avatar}
          >
            <IonImg
              src={user?.user?.image_url || '/assets/img/bia-avatar.svg'}
            />
          </IonAvatar>
          <div className={styles.name}>
            <BiaText
              token='heading-2'
              color='strong'
            >
              {`${user?.user?.name} ${user?.user?.last_name}`}
            </BiaText>
            <BiaText
              token='caption'
              color='weak'
            >
              {user?.user?.email}
            </BiaText>
          </div>
          <IonMenuToggle>
            <div className={styles.close}>
              <BiaIcon
                iconName='faClose'
                iconType='solid'
                size='16px'
                color='strong'
              />
            </div>
          </IonMenuToggle>
        </div>
      </IonToolbar>
      <IonContent>
        <div className={styles.container_items}>
          <BiaItem
            text={t('close_session')}
            onClick={handleLogout}
            slot='start'
          >
            <BiaIcon
              iconName='faArrowRightFromBracket'
              iconType='regular'
              size='16px'
              color='strong'
            />
          </BiaItem>
        </div>
        {/* 🌐 Botón de refresh - Solo aparece con internet */}
        {shouldShowRefreshButton && (
          <div className={styles.container_items}>
            <BiaItem
              text={isClearing ? t('cleaning_cache') : t('refresh_app')}
              onClick={clearCache}
              slot='start'
            >
              <BiaIcon
                iconName={isClearing ? 'faSpinner' : 'faRefresh'}
                iconType={isClearing ? 'solid' : 'regular'}
                size='16px'
                color='strong'
                className={isClearing ? styles.iconRotate : ''}
              />
            </BiaItem>
          </div>
        )}

        {/* 🌐 Indicador de estado de conexión */}
        <div className={styles.container_items}>
          <div style={{ padding: '0 16px', opacity: 0.7 }}>
            <BiaText
              token='caption'
              color='weak'
            >
              {isOnline === true && `🌐 ${t('status_online')}`}
              {isOnline === false && `📱 ${t('status_offline')}`}
              {isOnline === null && `❓ ${t('status_checking')}`}
            </BiaText>
          </div>
        </div>
        <div className={styles.version}>
          <div>
            <BiaText
              token='caption'
              color='weak'
            >
              {t('app_version')} {VERSION}
            </BiaText>
          </div>
          <div>
            <BiaText
              token='caption'
              color='weak'
            >
              {environmentType}
            </BiaText>
          </div>
        </div>
      </IonContent>
    </IonMenu>
  );
};
