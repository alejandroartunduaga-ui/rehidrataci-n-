import { BiaLoader, BiaText, Header } from '@entropy/index';
import { IonContent, IonPage } from '@ionic/react';
import { RouteComponentProps } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { TranslationNamespaces } from '@shared/i18n';
import styles from './ScopePage.module.css';
import { useConnectivityStore } from '@shared/store/offline/useConnectivityStore';
import { IScopes } from '@mobile/visits/data/interfaces/visitDetail.interface';
import { fetchVisitDetail } from '@mobile/visits/data/visitDetail/visitDetail';

type IScopePageProps = RouteComponentProps<{
  id?: string;
}>;

export const ScopePage = ({ match }: IScopePageProps) => {
  const isOnline = useConnectivityStore((state) => state.isOnline);
  const activity_id = match.params.id ?? '';
  const { t } = useTranslation(TranslationNamespaces.VISITS);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [scopes, setScopes] = useState<IScopes[]>([]);

  const getDescriptionsEquipments = () => {
    setIsLoading(true);
    fetchVisitDetail(activity_id, isOnline ?? false)
      .then((data) => {
        setIsLoading(false);
        const scopes = data.descriptions[0].fields.find(
          (field) => field.type === 'scope'
        );
        setScopes(scopes?.data as IScopes[]);
      })
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      .catch((error) => {
        setIsLoading(false);
      });
  };

  useEffect(() => {
    getDescriptionsEquipments();
  }, []);

  return (
    <IonPage id='main-content'>
      {isLoading && (
        <BiaLoader
          color='accent'
          className={styles.loader}
          text={t('scope.loading')}
        />
      )}

      <Header
        text={t('scope.title')}
        backButton
      />

      <IonContent>
        <div className={styles.container}>
          {scopes.map((scope, index) => {
            const uniqueKey = `${scope.label}-${index}`;
            return (
              <div
                key={`${scope.label}-${index}`}
                className={styles.filedWrapper}
                id={uniqueKey}
              >
                <BiaText
                  token='heading-3'
                  color='standard'
                  className={styles.fieldTitle}
                >
                  {scope.label}:{' '}
                </BiaText>

                <BiaText
                  token='bodyRegular'
                  color='weak'
                >
                  {scope.value ? scope.value : '-'}
                </BiaText>
              </div>
            );
          })}
        </div>
      </IonContent>
    </IonPage>
  );
};
