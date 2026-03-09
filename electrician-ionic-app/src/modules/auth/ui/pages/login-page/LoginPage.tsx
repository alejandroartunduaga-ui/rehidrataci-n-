import React, { useEffect } from 'react';
import styles from './LoginPage.module.css';
import { BiaLoader, BiaText, BiaToast } from '@entropy/index';
import {
  EnvironmentBadge,
  isStagingAccessError,
  TranslationNamespaces,
} from '@shared/index';
import { LoginForm } from '../../components/login-form/LoginForm';
import { ModalForgotPasswordSuccess } from '@auth/ui/components/modal-forgot-password-success/ModalForgotPasswordSuccess';
import { useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useUser } from '@auth/data/hooks/useUser';
import {
  IonPage,
  IonContent,
  IonImg,
  IonGrid,
  IonRow,
  IonCol,
} from '@ionic/react';

export const LoginPage: React.FC = () => {
  const location = useLocation();
  const queryParams = new URLSearchParams(location.search);
  const resetPasswordSuccess = queryParams.get('resetPassword');

  const { t } = useTranslation(TranslationNamespaces.LOGIN);
  const { authenticateUserMutation, userDetailsMutation } = useUser();

  const handleLogin = (username: string, password: string) => {
    if (authenticateUserMutation.isError) {
      authenticateUserMutation.reset();
    }
    authenticateUserMutation.mutate({ username, password });
  };

  useEffect(() => {
    if (authenticateUserMutation.data !== undefined) {
      userDetailsMutation.mutate();
    }
  }, [authenticateUserMutation.isSuccess, authenticateUserMutation.isError]);

  return (
    <IonPage
      id='main-content'
      className={styles.loginPage}
    >
      <EnvironmentBadge />
      <IonContent className={styles.loginContent}>
        {authenticateUserMutation.isPending ||
          (userDetailsMutation.isPending && (
            <BiaLoader text={t('login_loading')} />
          ))}
        <IonGrid className={styles.loginGrid}>
          <IonRow className={styles.loginRow}>
            <IonCol
              size='12'
              className={styles.logoCol}
            >
              <IonImg src='/assets/img/bia-ops-logo.png' />
              <BiaText
                className={styles.loginText}
                token='heading-3'
                color='inverseOn'
              >
                {t('login_title')}
              </BiaText>
            </IonCol>
          </IonRow>

          <IonRow className={styles.loginRow}>
            <IonCol size='12'>
              <div className={styles.loginBox}>
                <LoginForm
                  onLogin={handleLogin}
                  loading={authenticateUserMutation.isPending}
                />
              </div>
            </IonCol>
          </IonRow>
        </IonGrid>

        {authenticateUserMutation.isError && (
          <BiaToast
            key={`login-error-${authenticateUserMutation.error?.message}-${Date.now()}`}
            id={`login-error-${Date.now()}`}
            title={t('title_error_login')}
            message={
              isStagingAccessError(authenticateUserMutation.error?.message)
                ? authenticateUserMutation.error.message
                : t('description_error_login')
            }
            theme='error'
            duration={5000}
            onClose={() => {
              if (authenticateUserMutation.isError) {
                authenticateUserMutation.reset();
              }
            }}
          />
        )}

        {resetPasswordSuccess && <ModalForgotPasswordSuccess />}
      </IonContent>
    </IonPage>
  );
};
