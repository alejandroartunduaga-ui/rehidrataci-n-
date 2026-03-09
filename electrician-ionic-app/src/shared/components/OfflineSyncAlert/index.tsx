import { useRef } from 'react';
import { IonButton, IonModal } from '@ionic/react';
import { BiaIcon, BiaText } from '@entropy/index';

import { useTranslation } from 'react-i18next';
import { TranslationNamespaces } from '@shared/i18n';
import styles from './OfflineSyncAlert.module.css';

interface OfflineSyncAlertProps {
  isOpen: boolean;
  onCloseModal: () => void;
}

export const OfflineSyncAlert = ({
  isOpen,
  onCloseModal,
}: OfflineSyncAlertProps) => {
  const modal = useRef<HTMLIonModalElement>(null);
  const { t } = useTranslation(TranslationNamespaces.GLOBAL);

  const dismiss = () => {
    modal.current?.dismiss();
    onCloseModal();
  };

  return (
    <IonModal
      ref={modal}
      isOpen={isOpen}
      backdropDismiss={false}
      className={styles.modal}
    >
      <div className={styles.modalBody}>
        <button
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
        </button>

        <div className={styles.iconContainer}>
          <BiaIcon
            iconType='solid'
            iconName='faWifiExclamation'
            color='recommendation'
            size='24px'
            className={styles.offlineIcon}
          />
        </div>

        <BiaText
          token='heading-2'
          color='strong'
          className={styles.title}
        >
          {t('modal_offline_title')}
        </BiaText>

        <BiaText
          token='bodyRegular'
          color='weak'
          className={styles.description}
        >
          {t('modal_offline_description')}
        </BiaText>

        <IonButton
          className={styles.button}
          onClick={() => dismiss()}
        >
          {t('modal_offline_button')}
        </IonButton>
      </div>
    </IonModal>
  );
};
