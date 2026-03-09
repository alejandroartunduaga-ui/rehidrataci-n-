import { useRef } from 'react';
import { BiaIcon, BiaText } from '@entropy/index';
import { IonButton, IonGrid, IonModal } from '@ionic/react';
import { useTranslation } from 'react-i18next';
import { TranslationNamespaces, useAuthStore } from '@shared/index';
import styles from './RedirectDesktop.module.css';

export const RedirectDesktop = () => {
  const modal = useRef<HTMLIonModalElement>(null);
  const { t } = useTranslation(TranslationNamespaces.GLOBAL);
  const { user } = useAuthStore();
  const { logout } = useAuthStore();

  const dismiss = () => {
    logout();
  };
  return (
    <IonModal
      ref={modal}
      isOpen={true}
      backdropDismiss={false}
      className={styles.modal}
    >
      <IonGrid className={styles.modalGrid}>
        <IonButton
          className={styles.buttonClose}
          onClick={() => dismiss()}
        >
          <BiaIcon
            iconName='faXmark'
            iconType='solid'
            size='16px'
            color='strong'
            className={styles.buttonCloseIcon}
          />
        </IonButton>
        <div className={styles.modalBody}>
          <div className={styles.iconContainer}>
            <BiaIcon
              iconName='faCircleExclamation'
              iconType='solid'
              size='24px'
              color='accent'
            />
          </div>
          <BiaText
            token='heading-2'
            color='strong'
          >
            {t('title_redirect_desktop')}
          </BiaText>
          <BiaText
            token='bodyRegular'
            color='weak'
          >
            {`${t('description_redirect_desktop').replace(
              '${ROLE}',
              user?.user?.role_description || ''
            )} `}
            <BiaText
              token='bodySemibold'
              color='standard'
            >
              {t('bold_redirect_desktop')}
            </BiaText>
          </BiaText>
          <IonButton
            className={styles.buttonSuccess}
            onClick={() => dismiss()}
          >
            {t('modal_offline_button')}
          </IonButton>
        </div>
      </IonGrid>
    </IonModal>
  );
};
