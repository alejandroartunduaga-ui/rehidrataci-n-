import React, { useState, useEffect } from 'react';
import { IonButton, IonContent, IonFooter, IonPage } from '@ionic/react';
import { RouteComponentProps, useParams, useHistory } from 'react-router-dom';
import {
  BiaLoader,
  Header,
  BiaText,
  BiaIcon,
  BiaPopupMobile,
  BiaToast,
  BiaTag,
  BiaCheckbox,
} from '@entropy/index';
import styles from './TelemetryInstaled.module.css';
import { useTranslation } from 'react-i18next';
import { TranslationNamespaces } from '@shared/i18n';
import { useTelemetryInstaled } from '@mobile/forms-management/data/hooks';
import {
  StatusTelemetry,
  StatusTelemetryResponse,
} from '@mobile/forms-management/data/interfaces/telemetry.interface';
import { fetchSaveTelemetry } from '@mobile/forms-management/data/telemetryReadMeter';
import { useConnectivityStore } from '@shared/store/offline/useConnectivityStore';
import { getTableDataByQuery } from '@shared/db/databaseService';
import {
  IDataBaseNames,
  IDataBaseTables,
  ITableTelemetry,
} from '@shared/data/IDatabase';

type RouteParams = {
  activity_id: string;
  page_code: string;
  name_form: string;
  index: string;
  codeField: string;
};

const TelemetryInstaled: React.FC<RouteComponentProps> = () => {
  const isOnline = useConnectivityStore.getState().isOnline;
  const { activity_id, page_code, codeField } = useParams<RouteParams>();
  const history = useHistory();
  const { t } = useTranslation(TranslationNamespaces.FORMS_MANAGEMENT);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [isOpenPopup, setIsOpenPopup] = useState<boolean>(false);
  const [isOpenPopupFailed, setIsOpenPopupFailed] = useState<boolean>(false);
  const [message, setMessage] = useState<string>('');
  const [toastMessage, setToastMessage] = useState<null | {
    title: string;
    message: string;
    theme: string;
  }>(null);
  const [failedAttempts, setFailedAttempts] = useState<number>(0);
  // Estado para los checkboxes de verificación
  const [checkedItems, setCheckedItems] = useState<Record<number, boolean>>({
    1: false,
    2: false,
    3: false,
    4: false,
    5: false,
  });

  // Variables desde el hook global
  const {
    status,
    serie_del_modem,
    marca_del_modem,
    ip,
    ime_modem,
    fact_modem,
    saveTelemetryToDatabase,
    getTelemetryStatusByCodeField,
    getTelemetryUrlByCodeField,
  } = useTelemetryInstaled();

  // Verificar valores al montar y cuando cambien
  useEffect(() => {
    if (
      !serie_del_modem ||
      !marca_del_modem ||
      !ip ||
      !fact_modem ||
      !activity_id
    ) {
      setToastMessage({
        title: t('telemetry.no.data.title'),
        message: t('telemetry.no.data.message'),
        theme: 'error',
      });
      history.go(-1);
    } else {
      checkTelemetryStatus();
    }
  }, [serie_del_modem, marca_del_modem, ip, fact_modem, activity_id]);

  // Consultar estado de telemedida desde DB por codeField (o fallback a page_code)
  const checkTelemetryStatus = async () => {
    try {
      const key = codeField || page_code;
      if (!key) return;

      // Obtener registro de telemedida para verificar intentos
      const telemetryRecords = await getTableDataByQuery<ITableTelemetry>(
        IDataBaseNames.OPERACIONES,
        IDataBaseTables.TELEMETRY,
        async (table: {
          where: (key: string) => {
            equals: (value: string | string[]) => {
              toArray: () => Promise<ITableTelemetry[]>;
              filter: (predicate: (record: ITableTelemetry) => boolean) => {
                toArray: () => Promise<ITableTelemetry[]>;
              };
            };
          };
        }) =>
          table
            .where('codeField')
            .equals(key)
            .filter((record: ITableTelemetry) => record.visitId === activity_id)
            .toArray()
      );

      setMessage(telemetryRecords[0]?.message || '');

      // Obtener el registro más reciente para este codeField
      const currentRecord = telemetryRecords?.reduce((latest, current) =>
        latest.updatedAt > current.updatedAt ? latest : current
      );

      // Usar el campo intent del registro actual
      const currentAttempts = currentRecord?.intent ?? 0;
      setFailedAttempts(currentAttempts);

      const hasExceededAttempts = currentAttempts >= 3;
      const resp = await getTelemetryStatusByCodeField(key, activity_id);
      const mapToUiStatus = (
        s: StatusTelemetryResponse | null
      ): StatusTelemetry => {
        switch (s) {
          case StatusTelemetryResponse.SUCCESS:
            return StatusTelemetry.SUCCESS;
          case StatusTelemetryResponse.FAILED:
            return StatusTelemetry.FAILED;
          case StatusTelemetryResponse.PROCESS:
            return StatusTelemetry.PROCESS;
          case StatusTelemetryResponse.PENDING:
          default:
            return StatusTelemetry.PENDING; // default requerido por la solicitud
        }
      };

      // Mostrar popup de fallo si excedió intentos o está en estado FAILED
      if (
        hasExceededAttempts &&
        mapToUiStatus(resp) === StatusTelemetry.FAILED
      ) {
        setIsOpenPopupFailed(true);
      }
    } catch (_error) {
      console.error(_error);
    }
  };

  const handleSubmit = async () => {
    try {
      setIsOpenPopup(true);

      // Buscar registro existente para este fieldCode
      const existingRecords = await getTableDataByQuery<ITableTelemetry>(
        IDataBaseNames.OPERACIONES,
        IDataBaseTables.TELEMETRY,
        async (table: {
          where: (key: string) => {
            equals: (value: string | string[]) => {
              toArray: () => Promise<ITableTelemetry[]>;
              filter: (predicate: (record: ITableTelemetry) => boolean) => {
                toArray: () => Promise<ITableTelemetry[]>;
              };
            };
          };
        }) =>
          table
            .where('codeField')
            .equals(codeField)
            .filter((record: ITableTelemetry) => record.visitId === activity_id)
            .toArray()
      );

      const existingRecord = existingRecords?.[0];

      // Hacer la llamada a fetchSaveTelemetry
      const response = await fetchSaveTelemetry(
        {
          brand: marca_del_modem,
          ip: ip,
          serial_number: serie_del_modem,
          //eliminar a futuro
          client_number: '',
          meter_factor: fact_modem,
          visit_id: activity_id,
        },
        isOnline ?? false
      );

      // Siempre usar el nuevo idTelemetry de la respuesta
      await saveTelemetryToDatabase({
        visitId: activity_id,
        codeField: codeField,
        idTelemetry: response.id, // Siempre usamos el nuevo ID de la respuesta
        statusOverride: response.status,
        intent: existingRecord ? existingRecord.intent + 1 : 1,
        message: response.message,
      });

      // Actualizar el estado después de guardar
      await checkTelemetryStatus();

      // Manejar respuesta
      switch (response.status) {
        case StatusTelemetryResponse.SUCCESS:
          break;
        case StatusTelemetryResponse.FAILED:
          setIsOpenPopupFailed(true);
          break;
        case StatusTelemetryResponse.PROCESS:
          break;
        default:
          setToastMessage({
            title: t('telemetry.toast.title'),
            message: t('telemetry.toast.message'),
            theme: 'warning',
          });
          break;
      }
      //eslint-disable-next-line @typescript-eslint/no-unused-vars
    } catch (_error) {
      setIsOpenPopup(false);
      setToastMessage({
        title: t('telemetry.error.title'),
        message: t('telemetry.error.message'),
        theme: 'error',
      });
    }
  };

  const onClickButtonPopup = () => {
    setIsOpenPopup(false);
  };

  const clickPhasor = async () => {
    setIsLoading(true);
    try {
      const url = await getTelemetryUrlByCodeField(codeField, activity_id);
      if (url) {
        setIsLoading(false);
        history.push(`/telemetry-visualizer/${encodeURIComponent(url)}`);
      } else {
        setIsLoading(false);
        setToastMessage({
          title: t('telemetry.error.title'),
          message: 'No se encontró URL de telemetría',
          theme: 'error',
        });
      }
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
    } catch (_error) {
      setIsLoading(false);
      setToastMessage({
        title: t('telemetry.error.title'),
        message: 'Error al obtener URL de telemetría',
        theme: 'error',
      });
    }
  };

  return (
    <IonPage id='main-content'>
      {isLoading && (
        <BiaLoader
          color='accent'
          text={t('telemetry.loading')}
        />
      )}
      <Header
        text={t('telemetry.header.title')}
        iconLeftType='regular'
        backButton
      />
      <IonContent className={styles.content}>
        <div className={styles.container}>
          <div className={styles.tagContainer}>
            <BiaTag
              color={
                status === StatusTelemetry.SUCCESS
                  ? 'success'
                  : status === StatusTelemetry.FAILED
                    ? 'error'
                    : status === StatusTelemetry.PROCESS
                      ? 'magenta'
                      : 'warning'
              }
              corner='rounded'
              text={status || 'Pendiente'}
            />
          </div>

          {status === StatusTelemetry.FAILED && (
            <div className={styles.failedMessage}>
              <div className={styles.failedMessageIcon}>
                <BiaIcon
                  iconName='faCircleXmark'
                  iconType='solid'
                  color='error'
                />
              </div>
              <div className={styles.failedMessageContent}>
                <BiaText
                  token='bodySemibold'
                  color='error'
                  className={styles.failedMessageTitle}
                >
                  {t('telemetry.failed.title')}
                </BiaText>
                <BiaText
                  token='bodyRegular'
                  color='weak'
                  className={styles.failedMessageText}
                >
                  {message}
                </BiaText>
              </div>
            </div>
          )}

          <div className={styles.description}>
            <BiaText
              token='bodyRegular'
              color='weak'
            >
              {t('telemetry.description')}
            </BiaText>
          </div>

          <div className={styles.itemsGroup}>
            <div className={styles.itemRow}>
              <BiaText
                token='caption'
                color='weak'
              >
                {t('telemetry.meter.ip')}
              </BiaText>
              <BiaText
                token='bodyRegular'
                color='strong'
              >
                {ip ?? '—'}
              </BiaText>
            </div>

            <div className={styles.itemRow}>
              <BiaText
                token='caption'
                color='weak'
              >
                {t('telemetry.meter.series')}
              </BiaText>
              <BiaText
                token='bodyRegular'
                color='strong'
              >
                {serie_del_modem ?? '—'}
              </BiaText>
            </div>

            <div className={styles.itemRow}>
              <BiaText
                token='caption'
                color='weak'
              >
                {t('telemetry.meter.brand')}
              </BiaText>
              <BiaText
                token='bodyRegular'
                color='strong'
              >
                {marca_del_modem ?? '—'}
              </BiaText>
            </div>

            <div className={styles.itemRow}>
              <BiaText
                token='caption'
                color='weak'
              >
                {t('telemetry.meter.reference')}
              </BiaText>
              <BiaText
                token='bodyRegular'
                color='strong'
              >
                {ime_modem ?? '—'}
              </BiaText>
            </div>

            <div className={styles.itemRow}>
              <BiaText
                token='caption'
                color='weak'
              >
                {t('telemetry.meter.factor')}
              </BiaText>
              <BiaText
                token='bodyRegular'
                color='strong'
              >
                {fact_modem ?? '—'}
              </BiaText>
            </div>
          </div>

          {/* Toast de advertencia (Figma 2345-34000) */}
          {status === StatusTelemetry.PENDING && (
            <div className={styles.toast}>
              <div className={styles.toastIcon}>
                <BiaIcon
                  iconName='faTriangleExclamation'
                  iconType='solid'
                  color='warning'
                />
              </div>
              <div className={styles.toastText}>
                <BiaText
                  token='bodyRegular'
                  color='standardOn'
                  html={t('telemetry.toast.alert')}
                ></BiaText>
              </div>
            </div>
          )}

          {/* BiaItem: Diagrama fasorial (Figma 2345-34383) */}
          {status === StatusTelemetry.SUCCESS && (
            <div
              className={styles.phasorItem}
              onClick={clickPhasor}
            >
              <div className={styles.phasorIcon}>
                <BiaIcon
                  iconName='faDrawCircle'
                  iconType='solid'
                />
              </div>
              <div className={styles.phasorTitle}>
                <BiaText
                  token='bodySemibold'
                  color='strong'
                >
                  {t('telemetry.phasor.title')}
                </BiaText>
              </div>
              <div className={styles.phasorChevron}>
                <BiaIcon
                  iconName='faChevronRight'
                  iconType='solid'
                />
              </div>
            </div>
          )}
          {status === StatusTelemetry.FAILED && failedAttempts < 3 && (
            <div className={styles.failedDescription}>
              <BiaText
                token='bodyRegular'
                color='weak'
              >
                {t('telemetry.failed.description')}
              </BiaText>
              <div className={styles.failedDescriptionList}>
                <div className={styles.failedDescriptionItem}>
                  <BiaCheckbox
                    iconWeight={4.5}
                    className={styles.failedDescriptionCheckbox}
                    alignment='center'
                    message={t('telemetry.failed.description.list.1')}
                    checked={checkedItems[1]}
                    onCheckedChange={(checked) =>
                      setCheckedItems((prev) => ({ ...prev, 1: checked }))
                    }
                  />
                </div>

                <div className={styles.failedDescriptionItem}>
                  <BiaCheckbox
                    iconWeight={4.5}
                    className={styles.failedDescriptionCheckbox}
                    alignment='center'
                    message={t('telemetry.failed.description.list.2')}
                    checked={checkedItems[2]}
                    onCheckedChange={(checked) =>
                      setCheckedItems((prev) => ({ ...prev, 2: checked }))
                    }
                  />
                </div>

                <div className={styles.failedDescriptionItem}>
                  <BiaCheckbox
                    iconWeight={4.5}
                    className={styles.failedDescriptionCheckbox}
                    alignment='center'
                    message={t('telemetry.failed.description.list.3')}
                    checked={checkedItems[3]}
                    onCheckedChange={(checked) =>
                      setCheckedItems((prev) => ({ ...prev, 3: checked }))
                    }
                  />
                </div>

                <div className={styles.failedDescriptionItem}>
                  <BiaCheckbox
                    iconWeight={4.5}
                    className={styles.failedDescriptionCheckbox}
                    alignment='center'
                    message={t('telemetry.failed.description.list.4')}
                    checked={checkedItems[4]}
                    onCheckedChange={(checked) =>
                      setCheckedItems((prev) => ({ ...prev, 4: checked }))
                    }
                  />
                </div>

                <div className={styles.failedDescriptionItem}>
                  <BiaCheckbox
                    iconWeight={4.5}
                    className={styles.failedDescriptionCheckbox}
                    alignment='center'
                    message={t('telemetry.failed.description.list.5')}
                    checked={checkedItems[5]}
                    onCheckedChange={(checked) =>
                      setCheckedItems((prev) => ({ ...prev, 5: checked }))
                    }
                  />
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Popup de prueba de telemedida */}
        <BiaPopupMobile
          isOpen={isOpenPopup}
          onClose={() => {
            history.go(-1);
            setIsOpenPopup(false);
          }}
          title={t('telemetry.title')}
          message={t('telemetry.message')}
          button={{
            label: t('telemetry.popup.button'),
            onClick: () => {
              history.go(-1);
              onClickButtonPopup();
            },
          }}
          icon={{ name: 'faLoader', type: 'solid' }}
        />

        <BiaPopupMobile
          isOpen={isOpenPopupFailed}
          onClose={() => setIsOpenPopupFailed(false)}
          title={t('telemetry.failed.popup.title')}
          message={t('telemetry.failed.popup.message')}
          button={{
            label: t('telemetry.failed.popup.button'),
            onClick: () => {
              window.open(
                'https://api.whatsapp.com/send/?phone=573229201007&text&type=phone_number&app_absent=0',
                '_blank'
              );
              setIsOpenPopupFailed(false);
            },
          }}
          icon={{
            name: 'faTriangleExclamation',
            type: 'solid',
            colorIcon: 'error',
          }}
        />
      </IonContent>

      {(status === StatusTelemetry.PENDING ||
        status === StatusTelemetry.PROCESS ||
        (status === StatusTelemetry.FAILED && failedAttempts < 3)) && (
        <IonFooter collapse='fade'>
          <footer className={styles.footer}>
            <IonButton
              expand='block'
              onClick={handleSubmit}
              className={`${styles.button}`}
              {...(isLoading ||
              status === StatusTelemetry.PROCESS ||
              (!Object.values(checkedItems).every(Boolean) &&
                status === StatusTelemetry.FAILED)
                ? { disabled: true }
                : {})}
            >
              {isLoading ? (
                <BiaIcon
                  iconName='faSpinner'
                  color='weak'
                  iconType='solid'
                  size='16px'
                />
              ) : (
                t('telemetry.button')
              )}
            </IonButton>
          </footer>
        </IonFooter>
      )}

      {toastMessage && (
        <BiaToast
          title={toastMessage.title}
          message={toastMessage.message}
          theme={toastMessage.theme as 'danger'}
          onClose={() => setToastMessage(null)}
        />
      )}
    </IonPage>
  );
};

export default TelemetryInstaled;
