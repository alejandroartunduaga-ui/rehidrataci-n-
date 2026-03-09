import styles from './History.module.css';
import { BiaIcon, BiaItem, BiaLoader, BiaText } from '@entropy/index';
import { TranslationNamespaces } from '@shared/i18n';
import { useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { IonButton, IonToast, useIonViewWillEnter } from '@ionic/react';
import { useIsFailedVisit } from '@shared/hooks/useQueryParams';
import { OfflineAlert } from '@shared/components/OfflineAlert';
import { useHistory as useHistoryHook } from '@visit-management/data/hooks/useHistory';

interface RouteParams {
  activity_id: string;
}

/**
 * HistoryComponent
 *
 * ✅ IMPORTANTE: Los pasos se marcan como completados ÚNICAMENTE si tienen
 * isComplete: true en la tabla ANSWERS de la base de datos local.
 *
 * - Ya no basta con tener datos guardados (submissions)
 * - Debe estar explícitamente marcado como completo
 * - Esto asegura que solo los formularios realmente finalizados aparezcan como completados
 */
export const HistoryComponent: React.FC = () => {
  const isFailedVisit = useIsFailedVisit();
  const { activity_id } = useParams<RouteParams>();
  const { t } = useTranslation(TranslationNamespaces.VISIT_MANAGEMENT);

  // Hook con toda la lógica de History
  const {
    // estados
    isLoadingHistory,
    newFilteredSteps,
    showCompletedOfflineToast,
    setShowCompletedOfflineToast,
    showOfflineLoad,
    isLoadingMessageHistory,
    allStepsComplete,
    isOnline,
    // pdf
    generatePDF,
    isLoadingPDF,
    pdfToast,
    isLoadingMessage,
    closeToast,
    // acciones
    onClickStep,
    initializePage,
    validateDownloadedVisitAndInternetLoss,
  } = useHistoryHook(activity_id || '', Boolean(isFailedVisit));

  useIonViewWillEnter(() => {
    initializePage();
  });

  useEffect(() => {
    validateDownloadedVisitAndInternetLoss();
  }, [isOnline]);

  if (isLoadingPDF || isLoadingHistory) {
    return (
      <BiaLoader
        color='accent'
        className={styles.loader}
        text={isLoadingPDF ? isLoadingMessage : isLoadingMessageHistory}
      />
    );
  }

  return (
    <div className={styles.container}>
      <div style={{ marginBottom: '15px' }}>
        {!isOnline && showOfflineLoad && (
          <OfflineAlert
            message={t('message_no_network')}
            title={t('title_no_network')}
          />
        )}
      </div>
      <div className={styles.title}>
        <BiaText
          token='bodyRegular'
          color='weak'
        >
          {t('sections')}
        </BiaText>
      </div>

      {newFilteredSteps.length > 0 && (
        <>
          {newFilteredSteps.map((step, index) => (
            <BiaItem
              detail
              key={index}
              text={step?.name}
              slotChildren='start'
              disabled={showOfflineLoad}
              onClick={() => onClickStep(step)}
            >
              <div
                className={`${styles.statusStep} ${
                  step?.isComplete ? styles.completed : styles.inProgress
                }`}
              >
                {step?.isComplete ? (
                  <BiaIcon
                    iconName='faCheck'
                    iconType='solid'
                    size='10px'
                    color='positive'
                  />
                ) : (
                  <BiaText
                    token='bodySemibold'
                    color='accent'
                  >
                    {index + 1}
                  </BiaText>
                )}
              </div>
            </BiaItem>
          ))}
          <div className={styles.containerButtonFloat}>
            <IonButton
              onClick={() => generatePDF(null)}
              className={styles.button}
              {...(!allStepsComplete || !isOnline || isLoadingPDF
                ? { disabled: true }
                : {})}
            >
              {t('generate_pdf')}
            </IonButton>
          </div>

          {/* {isOpenOfflineModal && (
            <OfflineSyncAlert
              isOpen={isOpenOfflineModal}
              onCloseModal={handleCloseModal}
            />
          )} */}
        </>
      )}

      {/* <IonLoading
        isOpen={
          isLoadingCreateMinute &&
          feedbackStatus !== 'done' &&
          feedbackStatus !== 'error'
        }
        message={isLoadingMessage}
        spinner='circles'
      />

      {feedbackStatus === 'uploading' && (
        <div className={styles.progressContainer}>
          <IonProgressBar value={progressValue}></IonProgressBar>
          {uploadProgress && (
            <IonText
              color='medium'
              className={styles.progressText}
            >
              <p>
                Lote {uploadProgress.current} de {uploadProgress.total}
              </p>
            </IonText>
          )}
        </div>
      )} */}

      <IonToast
        isOpen={!!pdfToast}
        message={pdfToast?.message}
        color={pdfToast?.color}
        position='top'
        duration={3000}
        onDidDismiss={() => closeToast()}
      />

      {/* <IonToast
        isOpen={feedbackStatus === 'done'}
        message={t('save_forms_success')}
        color='success'
        position='top'
        duration={3000}
        onDidDismiss={() => router.push('/home')}
      />
      <IonToast
        isOpen={feedbackStatus === 'error'}
        message={`${t('error_general')}: ${errorMessage || 'Detalle no disponible.'}`}
        color='danger'
        position='top'
        duration={5000}
      /> */}

      <IonToast
        isOpen={showCompletedOfflineToast}
        message={t('completed_offline_message')}
        color='success'
        position='top'
        duration={4000}
        onDidDismiss={() => setShowCompletedOfflineToast(false)}
      />
    </div>
  );
};
