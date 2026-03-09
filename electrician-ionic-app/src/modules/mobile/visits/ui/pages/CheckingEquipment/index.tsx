import { IonContent, IonPage, useIonViewDidLeave } from '@ionic/react';
import { useEffect, useState } from 'react';
import { BiaLoader, BiaPopupMobile, BiaToast, Header } from '@entropy/index';
import { useTranslation } from 'react-i18next';
import { TranslationNamespaces } from '@shared/i18n';
import { CardEquipment, CardProgress } from '@visits/ui/components';
import {
  getEquipmentCertificates,
  getEquipmentCertificatesDB,
  storeEquipmentCertificatesDB,
  updateEquipmentCertificateStatus,
} from '@mobile/visits/data/equipmentCertificates';
import {
  EEquipmentCertificateStatus,
  IEquipmentCertificate,
} from '@mobile/visits/data/interfaces/equipmentCertificates.interface';
import styles from './CheckingEquipment.module.css';
import {
  BarCodeScanner,
  removeCardEquipmentFromBody,
  useConnectivityStore,
  useTrackEvent,
} from '@shared/index';
import { RouteComponentProps } from 'react-router-dom';

type ICheckingEquipmentPageProps = RouteComponentProps<{
  id?: string;
}>;
export const CheckingEquipmentPage = ({
  match,
}: ICheckingEquipmentPageProps) => {
  const { t } = useTranslation(TranslationNamespaces.VISITS);
  const [certificates, setCertificates] = useState<IEquipmentCertificate[]>([]);
  const [isOpenPopupNotFound, setIsOpenPopupNotFound] =
    useState<boolean>(false);
  const [equipmentSelected, setEquipmentSelected] =
    useState<IEquipmentCertificate | null>(null);
  const [isOpenBarCodeScanner, setIsOpenBarCodeScanner] =
    useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [scannedCode, setScannedCode] = useState<string>('');
  // const [textLoading, setTextLoading] = useState<string>('');
  const [toastMessage, setToastMessage] = useState<{
    title: string;
    message: string;
    theme:
      | 'error'
      | 'success'
      | 'warning'
      | 'danger'
      | 'primary'
      | 'secondary'
      | 'tertiary'
      | 'light'
      | 'medium'
      | 'dark';
  } | null>(null);
  const isOnline = useConnectivityStore((state) => state.isOnline);
  const activity_id = match.params.id ?? '';
  const trackEvent = useTrackEvent();

  const updateEquipmentSelected = async (
    equipment: IEquipmentCertificate | null,
    status: EEquipmentCertificateStatus
  ) => {
    if (!equipment) return;

    try {
      setIsLoading(true);
      // Actualizar el status en la base de datos local
      const response = await updateEquipmentCertificateStatus(
        activity_id,
        equipment.equipment_id,
        status
      );

      if (response.success) {
        // Actualizar el estado local con los certificados actualizados
        setCertificates(response.data.certificates);
      } else {
        console.error('❌ Error al actualizar equipo:', response.message);
      }
    } catch (error) {
      console.error('❌ Error al actualizar equipo:', error);
    } finally {
      setIsLoading(false);
    }

    setEquipmentSelected(equipment);
  };

  const fetchCertificates = async () => {
    const response = await getEquipmentCertificatesDB(activity_id);
    if (response.success && response.data.certificates.length > 0) {
      setCertificates(response.data.certificates);
    } else {
      setToastMessage({
        title: t('error_get_equipment_certificates'),
        message: '',
        theme: 'error',
      });
    }
  };

  const getServerCertificates = async () => {
    setIsLoading(true);
    const response = await getEquipmentCertificates(activity_id);
    setIsLoading(false);

    if (response.success && response.data.certificates.length > 0) {
      // Obtener seriales actuales de la lista local
      const currentSerials = certificates.map((cert) => cert.serial).sort();

      // Obtener seriales del servidor
      const serverSerials = response.data.certificates
        .map((cert) => cert.serial)
        .sort();

      // Comparar si las listas son iguales
      const areListsEqual =
        currentSerials.length === serverSerials.length &&
        currentSerials.every(
          (serial, index) => serial === serverSerials[index]
        );

      if (areListsEqual) {
        // Las listas son iguales, no guardar y mostrar mensaje
        setToastMessage({
          title: 'No se encontraron cambios.',
          message: '',
          theme: 'warning',
        });
      } else {
        // Las listas son diferentes, guardar la data
        await storeEquipmentCertificatesDB(
          activity_id,
          response.data.certificates
        );
        setCertificates(response.data.certificates);
        setToastMessage({
          title: t('equipments.refresh_equipments'),
          message: '',
          theme: 'success',
        });
      }
    } else {
      setToastMessage({
        title: t('error_get_equipment_certificates'),
        message: '',
        theme: 'error',
      });
    }
  };

  const handleScan = (certificate: IEquipmentCertificate) => {
    setEquipmentSelected(certificate);
    setIsOpenBarCodeScanner(true);
  };

  const handleScanSuccess = (result: string) => {
    // Mostrar toast con el código escaneado
    setScannedCode(result);
    setIsOpenBarCodeScanner(false);
  };

  const handleSerialMatch = async () => {
    if (equipmentSelected) {
      await updateEquipmentSelected(
        equipmentSelected,
        EEquipmentCertificateStatus.VERIFIED
      );
      setToastMessage({
        title: t('equipment.scan_success.title'),
        message: '',
        theme: 'success',
      });
    }
  };

  const handleSerialMismatch = async () => {
    if (equipmentSelected) {
      await updateEquipmentSelected(
        equipmentSelected,
        EEquipmentCertificateStatus.WRONG
      );
      setToastMessage({
        title: t('equipment.scan_error.title'),
        message: t('equipment.scan_error.message'),
        theme: 'error',
      });
    }
  };

  useEffect(() => {
    trackEvent('OPS_CLICK_VERIFY_EQUIPMENT', {
      date: new Date().toISOString(),
    });
    fetchCertificates();
  }, []);

  useIonViewDidLeave(() => {
    removeCardEquipmentFromBody();
  }, []);

  return (
    <IonPage id='main-content'>
      {isLoading && <BiaLoader />}
      {toastMessage && (
        <BiaToast
          title={toastMessage.title}
          message={toastMessage.message}
          theme={toastMessage.theme}
          onClose={() => setToastMessage(null)}
        />
      )}
      {scannedCode && (
        <BiaToast
          title='Código escaneado'
          message={scannedCode}
          theme='warning'
          position='bottom'
          onClose={() => setScannedCode('')}
        />
      )}

      <Header
        text={t('checking_equipment.title')}
        backButton
        iconLeft={isOnline ? 'faRotate' : ''}
        onIconLeftClick={() => {
          getServerCertificates();
        }}
      />
      <IonContent className={styles.content + ' ion-padding'}>
        <div className={styles.container}>
          <div className={styles.cardProgressBar}>
            <CardProgress
              title='Progreso de verificación'
              current={
                certificates.filter(
                  (certificate) =>
                    certificate.status === EEquipmentCertificateStatus.VERIFIED
                ).length
              }
              total={certificates.length}
            />
          </div>
          {certificates.map((certificate, index) => (
            <CardEquipment
              key={index}
              id={certificate.equipment_id.toString()}
              name={certificate.equipment_type}
              serial={certificate.serial}
              brand={certificate.brand}
              expirationDate={
                new Date(certificate.end_date).toISOString().split('T')[0]
              }
              status={certificate.status || EEquipmentCertificateStatus.PENDING}
              onScan={() => {
                handleScan(certificate);
              }}
              onNotFound={() => {
                setEquipmentSelected(certificate);
                setIsOpenPopupNotFound(true);
              }}
            />
          ))}
        </div>
      </IonContent>

      {/* Popup de equipo no encontrado */}
      <BiaPopupMobile
        isOpen={isOpenPopupNotFound}
        onClose={() => {
          setIsOpenPopupNotFound(false);
        }}
        title={t('equipment.not_found.title')}
        message={t('equipment.not_found.message')}
        button={{
          label: t('equipment.not_found.popup.button.primary'),
          onClick: () => {
            updateEquipmentSelected(
              equipmentSelected,
              EEquipmentCertificateStatus.NOT_FOUND
            );
            setIsOpenPopupNotFound(false);
          },
        }}
        buttonSecondary={{
          label: t('equipment.not_found.popup.button.secondary'),
          onClick: () => {
            setEquipmentSelected(null);
            setIsOpenPopupNotFound(false);
          },
        }}
        icon={{ name: 'faCircleQuestion', type: 'solid', colorIcon: 'warning' }}
      />

      <BarCodeScanner
        isOpen={isOpenBarCodeScanner}
        onClose={() => setIsOpenBarCodeScanner(false)}
        onScanSuccess={handleScanSuccess}
        onScanError={(error) => {
          console.error('Error al escanear código:', error);
        }}
        onSerialMatch={handleSerialMatch}
        onSerialMismatch={handleSerialMismatch}
        title={t('equipment.barcode_scanner.title')}
        equipmentInfo={{
          title: equipmentSelected?.equipment_type || '',
          serial: equipmentSelected?.serial || '',
          brand: equipmentSelected?.brand || '',
          expirationDate:
            new Date(equipmentSelected?.end_date || new Date())
              .toISOString()
              .split('T')[0] || '',
        }}
        renderEquipmentInBody={true}
      />
    </IonPage>
  );
};
