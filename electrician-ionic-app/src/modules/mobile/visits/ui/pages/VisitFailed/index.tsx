import {
  BiaCheckbox,
  BiaIcon,
  BiaLoader,
  BiaToast,
  Header,
} from '@entropy/index';
import { IonContent, IonFooter, IonPage } from '@ionic/react';
import { RouteComponentProps, useHistory } from 'react-router-dom';
import styles from './VisitFailed.module.css';
import { useActivityStatus } from '@shared/hooks/useQueryParams';
import { SlideToggle } from '../../components';
import { ActivityStatus } from '@mobile/visits/data/interfaces/visits.interface';
import { useState } from 'react';
import { fetchChangeActivityStatus } from '@mobile/visits/data/activityStatus';
import { IActivityStatus } from '@mobile/visits/data/interfaces/activityStatus.interface';
import { useConnectivityStore } from '@shared/store/offline/useConnectivityStore';
import { useTranslation } from 'react-i18next';
import { TranslationNamespaces } from '@shared/i18n';

type IvisitDetailProps = RouteComponentProps<{
  activity_id?: string;
}>;

export const VisitFailed = ({ match }: IvisitDetailProps) => {
  const activity_id = match.params.activity_id ?? '';
  const { t } = useTranslation(TranslationNamespaces.VISITS);
  const history = useHistory();
  const isOnline = useConnectivityStore((state) => state.isOnline);
  // Obtener el query parameter activity_status usando el hook personalizado
  const activity_status = useActivityStatus();

  const [messageToast, setMessageToast] = useState<{
    title: string;
    message: string;
    theme: 'success' | 'error';
  } | null>(null);
  const [showLoading, setShowLoading] = useState(false);

  const [isCheckedTerm, setIsCheckedTerm] = useState<boolean>(false);

  const goBack = () => {
    history.go(-1);
  };

  const handleFailedVisit = async () => {
    setShowLoading(true);
    const status: IActivityStatus[] = [
      {
        status: activity_status as ActivityStatus,
        created_at_app: new Date().toISOString(),
        is_online: isOnline ?? false,
      },
    ];
    fetchChangeActivityStatus(activity_id, status)
      .then(() => {
        setShowLoading(false);
        history.replace(
          `/visit-managment/history/${activity_id}?isFailedVisit=true&activity_status=${activity_status}`
        );
      })
      .catch(() => {
        setShowLoading(false);
        setMessageToast({
          title: 'Error',
          message: 'Error al cambiar el estado de la actividad',
          theme: 'error',
        });
      });
  };

  const handleCheckboxChange = (checked: boolean) => {
    setIsCheckedTerm(checked);
  };

  const renderHeader = () => {
    switch (activity_status) {
      case ActivityStatus.SITE_ACCESS_FAILED:
        return (
          <Header
            text='No puede ingresar a sitio'
            backButton
          />
        );
      case ActivityStatus.START_ACTIVITY_FAILED:
        return (
          <Header
            text='No puede iniciar actividad'
            backButton
          />
        );
      case ActivityStatus.CONTINUE_ACTIVITY_FAILED:
        return (
          <Header
            text='No puede continuar la actividad'
            backButton
          />
        );
      case ActivityStatus.EQUIPMENT_VERIFICATION_FAILED:
        return (
          <Header
            text='No puede continuar visita'
            backButton
          />
        );
      default:
        return (
          <Header
            text='No puede ingresar a sitio'
            backButton
          />
        );
    }
  };

  const renderTitle = () => {
    switch (activity_status) {
      case ActivityStatus.EQUIPMENT_VERIFICATION_FAILED:
        return t('visit_failed.title_equipment_verification');
      default:
        return t('visit_failed.title');
    }
  };

  const renderDescription = () => {
    switch (activity_status) {
      case ActivityStatus.EQUIPMENT_VERIFICATION_FAILED:
        return t('visit_failed.description_equipment_verification');
      default:
        return t('visit_failed.description');
    }
  };

  const renderButtonBack = () => {
    switch (activity_status) {
      case ActivityStatus.EQUIPMENT_VERIFICATION_FAILED:
        return (
          <button
            className={`${styles.buttonFailedvisit} ${styles.goBack}`}
            onClick={() => goBack()}
          >
            Volver y continuar la verificación
          </button>
        );
      default:
        return (
          <button
            className={`${styles.buttonFailedvisit} ${styles.goBack}`}
            onClick={() => goBack()}
          >
            Volver y continuar la visita
          </button>
        );
    }
  };

  return (
    <IonPage id='main-content'>
      {showLoading && (
        <BiaLoader
          color='accent'
          className={styles.loader}
        />
      )}

      {messageToast && (
        <BiaToast
          title={messageToast?.title}
          message={messageToast?.message}
          theme={messageToast?.theme ?? 'error'}
        />
      )}
      {renderHeader()}
      <IonContent>
        <div className={styles.container}>
          <div className={styles.box_icon}>
            <BiaIcon
              className='icon'
              iconName='faCommentXmark'
              iconType='solid'
              color='accent'
            />
          </div>
          <div className={styles.title}>{renderTitle()}</div>
          <p className={styles.description}>{renderDescription()}</p>
        </div>
        <div className={styles.footer_checkbox}>
          <BiaCheckbox
            message='Confirmo que he notificado al coordinador y se autoriza continuar esta visita como fallida.'
            onCheckedChange={(event) => {
              handleCheckboxChange(event);
            }}
          />
        </div>
      </IonContent>
      <IonFooter>
        <footer className={styles.footer}>
          <SlideToggle
            slideData={{
              CANCELLED: {
                iconName: 'faX',
                label: 'Continuar como visita fallida',
              },
            }}
            activityState={ActivityStatus.CANCELLED}
            onCompleted={handleFailedVisit}
            color='--ink-error'
            disabled={!isCheckedTerm}
          />
          {renderButtonBack()}
        </footer>
      </IonFooter>
    </IonPage>
  );
};
