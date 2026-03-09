import React, { useEffect } from 'react';
import { IonButton, IonGrid, IonModal, useIonRouter } from '@ionic/react';
import { useTranslation } from 'react-i18next';
import { BiaIcon, BiaLoader, BiaText, BiaToast } from '@entropy/index';
import { useDeclineVisit } from '@visits/data/hooks';
import { useVisitStore } from '@visits/store/useVisitStore';
import { TranslationNamespaces } from '@shared/i18n';
import { Card } from '../Card';
import styles from './ModalReject.module.css';

interface ModalRejectProps {
  open: boolean;
  onCloseModal: () => void;
}

export const ModalReject: React.FC<ModalRejectProps> = ({
  open,
  onCloseModal,
}) => {
  const router = useIonRouter();
  const { t } = useTranslation(TranslationNamespaces.VISITS);
  const { patchDeclineVisit } = useDeclineVisit();
  const { visit, loadVisit } = useVisitStore();

  useEffect(() => {
    loadVisit();
  }, []);

  const onDeclineVisit = () => {
    onCloseModal();
    patchDeclineVisit.mutate(visit.activity_id, {
      onSuccess: (data) => {
        if (data.id !== undefined) {
          router.push('/home');
        }
      },
    });
  };

  return (
    <div>
      {patchDeclineVisit.isPending && (
        <BiaLoader
          color='accent'
          className={styles.loader}
        />
      )}

      {open && (
        <IonModal
          isOpen={open}
          backdropDismiss={false}
        >
          <IonGrid className={styles.modalGrid}>
            <IonButton
              className={styles.buttonClose}
              onClick={() => onCloseModal()}
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
              <BiaText
                token='heading-2'
                color='strong'
              >
                {t('refuse_visit')}
              </BiaText>

              <Card
                className={styles.card}
                key={visit.activity_id}
              >
                <div className={styles.tagBlack}>
                  <BiaText
                    token='caption'
                    color='inverse'
                  >
                    {visit.card_information.activity_type}
                  </BiaText>
                </div>

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
                    {visit.card_information.network_operator}
                  </BiaText>
                </div>

                <BiaText token='heading-3'>
                  {visit.card_information.user_name}
                </BiaText>

                <BiaText
                  token='bodyRegular'
                  color='weak'
                >
                  {visit.card_information.address}
                </BiaText>

                <BiaText token='bodyRegular'>
                  {`${visit.card_information.activity_date}  ${visit.card_information.time_slot}`}
                </BiaText>
              </Card>
              <IonButton
                expand='block'
                className={styles.rejectButton}
                onClick={() => {
                  onDeclineVisit();
                }}
              >
                {t('confirm_reject')}
              </IonButton>
            </div>
          </IonGrid>
        </IonModal>
      )}

      {patchDeclineVisit.isError ||
        (patchDeclineVisit.data?.error && (
          <BiaToast
            title={t('error_title')}
            message={t('error_description')}
            theme='error'
          />
        ))}

      {patchDeclineVisit.isSuccess &&
        patchDeclineVisit.data.id !== undefined && (
          <BiaToast
            message={t('decline_visit_success')}
            theme='success'
          />
        )}
    </div>
  );
};
