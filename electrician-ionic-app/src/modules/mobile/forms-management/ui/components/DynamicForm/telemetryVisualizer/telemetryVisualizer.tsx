import { useParams } from 'react-router-dom';
import { IonPage, IonContent } from '@ionic/react';
import { useTranslation } from 'react-i18next';
import { TranslationNamespaces } from '@shared/i18n';
import styles from './telemetryVisualizer.module.css';
import { Header } from '@entropy/index';

export const TelemetryVisualizer = () => {
  const { t } = useTranslation(TranslationNamespaces.FORMS_MANAGEMENT);
  const { url } = useParams<{ url: string }>();

  return (
    <IonPage id='main-content'>
      <Header
        text={t('telemetryVisualizer.header.title')}
        iconLeftType='regular'
        backButton
      />

      <IonContent className={styles.content}>
        <div>
          <img
            src={decodeURIComponent(url)}
            alt='Telemetry Visualizer'
          />
        </div>
      </IonContent>
    </IonPage>
  );
};
