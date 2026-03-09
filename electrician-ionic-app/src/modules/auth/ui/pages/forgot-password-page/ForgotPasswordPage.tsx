import React, { useEffect, useState } from 'react';
import {
  IonPage,
  IonContent,
  IonImg,
  IonGrid,
  IonRow,
  IonCol,
  IonButton,
  useIonRouter,
} from '@ionic/react';
import { useTranslation } from 'react-i18next';

import { useForgotPasswordUser } from '@auth/data/hooks/useForgotPasswordUser';
import { BiaIcon, BiaLoader, BiaText, BiaToast } from '@entropy/index';
import { TranslationNamespaces } from '@shared/index';
import { ForgotPassForm } from '../../components/forgot-password-form/ForgotPasswordForm';
import styles from './ForgotPasswordPage.module.css';

export const ForgotPasswordPage: React.FC = () => {
  const router = useIonRouter();
  const [emailReset, setEmailReset] = useState<string>('');
  const { t } = useTranslation(TranslationNamespaces.LOGIN);
  const { forgotPasswordUserMutation } = useForgotPasswordUser();

  const resetPassword = (email: string) => {
    setEmailReset(email);
    forgotPasswordUserMutation.mutate({ email });
  };

  useEffect(() => {
    if (forgotPasswordUserMutation.isSuccess) {
      router.push(`/login?resetPassword=success&email=${emailReset}`);
    }
  }, [forgotPasswordUserMutation.isSuccess]);

  return (
    <IonPage
      id='main-content'
      className={styles.forgotPage}
    >
      <IonContent
        fullscreen
        className={`${styles.forgotContent}`}
      >
        {forgotPasswordUserMutation.isPending && (
          <BiaLoader text={t('loader_forgot')} />
        )}
        <IonButton
          className={styles.buttonBack}
          onClick={() => router.goBack()}
        >
          <BiaIcon
            iconName='faChevronLeft'
            iconType='solid'
            size='16px'
            color='strong'
            className={styles.buttonBackIcon}
          />
        </IonButton>
        <IonGrid className={styles.forgotGrid}>
          <IonRow className={styles.forgotRow}>
            <IonCol
              size='12'
              className={styles.logoCol}
            >
              <IonImg src='/assets/img/bia-ops-logo.png' />
              <BiaText
                className={styles.forgotText}
                token='heading-3'
                color='inverseOn'
              >
                {t('forgot_password')}
              </BiaText>
            </IonCol>
          </IonRow>

          <IonRow className={styles.forgotRow}>
            <IonCol size='12'>
              <div className={styles.forgotBox}>
                <ForgotPassForm
                  onResetPassword={resetPassword}
                  loading={false}
                />
              </div>
            </IonCol>
          </IonRow>
        </IonGrid>

        {forgotPasswordUserMutation.isError && (
          <BiaToast
            title={t('title_error')}
            message={
              forgotPasswordUserMutation.error?.message == 'EMAIL_NOT_FOUND' ||
              forgotPasswordUserMutation.error?.message.includes(
                'auth/user-not-found'
              )
                ? t('mail_not_found')
                : t('description_error')
            }
            theme='error'
          />
        )}
      </IonContent>
    </IonPage>
  );
};
