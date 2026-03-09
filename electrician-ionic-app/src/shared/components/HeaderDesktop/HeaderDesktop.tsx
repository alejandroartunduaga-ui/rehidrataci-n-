import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { IonHeader, IonImg } from '@ionic/react';
import { BiaIcon } from '@entropy/index';
import { useAuthStore } from '@shared/store/auth/useAuthStore';
import { TranslationNamespaces } from '@shared/i18n';
import styles from './HeaderDesktop.module.css';

export const HeaderDesktop = () => {
  const { t } = useTranslation(TranslationNamespaces.GLOBAL);
  const { user, logout } = useAuthStore();
  const [viewMenu, setViewMenu] = useState(false);

  const handleLogout = () => {
    logout();
  };

  return (
    <>
      <IonHeader className={styles.headerContainer}>
        <IonImg
          className={styles.logo}
          src='/assets/img/isotype-bia.svg'
        />
        <div className={styles.profileContainer}>
          <IonImg
            className={styles.logo}
            src={
              !viewMenu
                ? '/assets/img/bia-avatar.svg'
                : '/assets/img/bia-avatar-active.svg'
            }
            onClick={() => {
              setViewMenu(!viewMenu);
            }}
          />
        </div>
      </IonHeader>

      {viewMenu && (
        <div className={styles.menuContainer}>
          <div className={styles.infoProfile}>
            <span className={styles.name}>
              <div className={styles.online}></div>{' '}
              {`${user?.user.name} ${user?.user.last_name}`}
            </span>
            <span className={styles.email}>{user?.user.email}</span>
            <span className={styles.role}>{user?.user.role_description}</span>
          </div>
          <button
            className={styles.logoutButton}
            onClick={handleLogout}
          >
            <BiaIcon
              iconName='faArrowRightFromBracket'
              iconType='regular'
              size='16px'
              className={styles.iconLogout}
            />
            <span>{t('close_session')}</span>
          </button>
        </div>
      )}
    </>
  );
};
