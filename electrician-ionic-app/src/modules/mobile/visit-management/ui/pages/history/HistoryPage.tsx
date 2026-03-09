import React from 'react';
import { IonPage, IonContent } from '@ionic/react';
import { useTranslation } from 'react-i18next';
import { Header } from '@entropy/index';
import { HistoryComponent } from '@visit-management/ui/components/history/History';
import { TranslationNamespaces } from '@shared/i18n';

export const HistoryPage: React.FC = () => {
  const { t } = useTranslation(TranslationNamespaces.VISIT_MANAGEMENT);

  return (
    <IonPage id='main-content'>
      <Header
        text={t('title')}
        iconLeftType='regular'
        backButton
      />
      <IonContent>
        <HistoryComponent />
      </IonContent>
    </IonPage>
  );
};
