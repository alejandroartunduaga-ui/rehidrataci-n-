import { useTranslation } from 'react-i18next';
import { IonPage } from '@ionic/react';
import { Header } from '@entropy/index';
import { AssingElectricians } from '@visits/ui/components';
import { TranslationNamespaces } from '@shared/i18n';

export const AssingVisit = () => {
  const { t } = useTranslation(TranslationNamespaces.VISITS);

  return (
    <IonPage id='main-content'>
      <Header
        text={t('electrician_assignment')}
        backButton
      />
      <AssingElectricians />
    </IonPage>
  );
};
