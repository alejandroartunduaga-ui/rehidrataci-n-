import styles from './EquipmentsPage.module.css';
import { BiaIcon, BiaLoader, BiaText, BiaToast, Header } from '@entropy/index';
import { fetchVisitDetail } from '@mobile/visits/data/visitDetail/visitDetail';
import { IEquipments } from '@mobile/visits/data/interfaces/visitDetail.interface';
import { IonContent, IonPage } from '@ionic/react';
import { RouteComponentProps } from 'react-router-dom';
import { TranslationNamespaces } from '@shared/i18n';
import { useConnectivityStore } from '@shared/store/offline/useConnectivityStore';
import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';

type IEquipmentsPageProps = RouteComponentProps<{
  id?: string;
}>;

export const EquipmentsPage = ({ match }: IEquipmentsPageProps) => {
  const isOnline = useConnectivityStore((state) => state.isOnline);
  const activity_id = match.params.id ?? '';
  const { t } = useTranslation(TranslationNamespaces.VISITS);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [equipments, setEquipments] = useState<Array<IEquipments[]>>([]);
  const [toastMessage, setToastMessage] = useState<{
    title: string;
    message: string;
    theme: 'success' | 'error';
  } | null>(null);

  const getDescriptionsEquipments = () => {
    setIsLoading(true);
    fetchVisitDetail(activity_id, isOnline ?? false)
      .then((data) => {
        setIsLoading(false);
        const equipments = data.descriptions[0].fields.find(
          (field) => field.type === 'equipments'
        );
        if (equipments?.data && Array.isArray(equipments.data)) {
          setEquipments(equipments.data as Array<IEquipments[]>);
        }
      })
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      .catch((error) => {
        setIsLoading(false);
      });
  };

  const openFile = async (url: string) => {
    setToastMessage({
      title: t('equipments.viewFile.message'),
      message: '',
      theme: 'success',
    });

    try {
      // 📱 Abrir nueva pestaña para descarga
      const newTab = window.open(url, '_blank');

      // ⏱️ Cerrar la pestaña después de un breve delay (permite que inicie la descarga)
      if (newTab) {
        setTimeout(() => {
          newTab.close();
        }, 2000); // 2 segundos para que inicie la descarga
      }
    } catch (error) {
      console.error('Error abriendo archivo:', error);

      // 🔄 Fallback: método tradicional
      const a = document.createElement('a');
      a.href = url;
      a.target = '_blank';
      a.rel = 'noopener';
      a.click();
    }
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
          text={t('equipments.loading')}
        />
      )}

      {toastMessage && (
        <BiaToast
          title={toastMessage.title}
          message={toastMessage.message}
          theme={toastMessage.theme}
          onClose={() => setToastMessage(null)}
        />
      )}

      <Header
        text={t('equipments.title')}
        backButton
      />

      <IonContent>
        <div className={styles.container}>
          {equipments.length === 0 && (
            <BiaText
              token='bodyRegular'
              color='weak'
            >
              {t('equipments.noEquipments')}
            </BiaText>
          )}
          {equipments.map((equipment, index) => {
            const uniqueKey = `equipment-${index}`;
            return (
              <div
                key={uniqueKey}
                id={uniqueKey}
              >
                {equipment.map((equipment, indexChild) => {
                  switch (equipment.type) {
                    case 'file':
                      return (
                        <div
                          onClick={() => {
                            openFile(equipment.value);
                          }}
                          className={
                            styles.filedWrapper + ' ' + styles.iconWrapper
                          }
                          key={`equipment-child-${indexChild}`}
                        >
                          <BiaText
                            token='heading-3'
                            color='standard'
                            className={styles.fieldTitle}
                          >
                            {equipment.label}:{' '}
                          </BiaText>
                          <BiaIcon
                            iconType='regular'
                            iconName='faFileDownload'
                          />
                        </div>
                      );
                    case 'text':
                      return (
                        <div
                          className={styles.filedWrapper}
                          key={`${uniqueKey}-child-${indexChild}`}
                        >
                          <BiaText
                            token='heading-3'
                            color='standard'
                            className={styles.fieldTitle}
                          >
                            {equipment.label}:{' '}
                          </BiaText>

                          <BiaText
                            token='bodyRegular'
                            color='weak'
                          >
                            {equipment.value ? equipment.value : '-'}
                          </BiaText>
                        </div>
                      );
                    default:
                      return (
                        <div
                          className={styles.filedWrapper}
                          key={`${uniqueKey}-child-${indexChild}`}
                        >
                          <BiaText
                            token='heading-3'
                            color='standard'
                            className={styles.fieldTitle}
                          >
                            {equipment.label}:{' '}
                          </BiaText>

                          <BiaText
                            token='bodyRegular'
                            color='weak'
                          >
                            {equipment.value ? equipment.value : '-'}
                          </BiaText>
                        </div>
                      );
                  }
                })}
              </div>
            );
          })}
        </div>
      </IonContent>
    </IonPage>
  );
};
