import React, { useRef } from 'react';
import { IonButton, IonGrid, IonImg, IonModal } from '@ionic/react';
import { useHistory, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { BiaIcon, BiaText } from '@entropy/index';
import { TranslationNamespaces } from '@shared/index';
import styles from './ModalForgotPasswordSuccess.module.css';

export const ModalForgotPasswordSuccess: React.FC = () => {
  const location = useLocation();
  const history = useHistory();
  const queryParams = new URLSearchParams(location.search);
  const email = queryParams.get('email');
  const modal = useRef<HTMLIonModalElement>(null);
  const { t } = useTranslation(TranslationNamespaces.LOGIN);

  const dismiss = () => {
    modal.current?.dismiss();
    history.replace({
      pathname: location.pathname,
      search: '',
    });
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
          <IonImg
            className={styles.image}
            src='/assets/img/bia-message-success.svg'
          />
          <BiaText
            token='heading-2'
            color='strong'
          >
            {t('modal_forgot_text')}
          </BiaText>
          <BiaText
            token='bodyRegular'
            color='weak'
          >
            {t('check_in')}
            {email}
          </BiaText>

          <IonButton
            className={styles.buttonSuccess}
            onClick={() => dismiss()}
          >
            {t('understood')}
          </IonButton>
        </div>
      </IonGrid>
    </IonModal>
  );
};
