import React, { useState, useEffect } from 'react';
import { IonButton, IonContent, IonModal } from '@ionic/react';
import { BiaIcon, BiaText, Header } from '@entropy/index';
import { useTranslation } from 'react-i18next';
import { TranslationNamespaces } from '@shared/i18n';
import { useBarcode, BarcodeFormat } from '@shared/hooks/useBarcode';
import { CardEquipmentDetail } from '@mobile/visits/ui/components';
import {
  renderCardEquipmentInBody,
  removeCardEquipmentFromBody,
  type EquipmentInfo,
} from '@shared/utils/renderCardEquipmentDetail';
import styles from './BarCodeScanner.module.css';

interface BarCodeScannerProps {
  /**
   * Si el modal está abierto
   */
  isOpen: boolean;

  /**
   * Callback cuando se cierra el modal
   */
  onClose: () => void;

  /**
   * Callback cuando se escanea un código exitosamente
   */
  onScanSuccess: (result: string) => void;

  /**
   * Callback cuando ocurre un error
   */
  onScanError?: (error: string) => void;

  /**
   * Título del modal
   */
  title?: string;

  /**
   * Información del equipo a mostrar durante el escaneo
   */
  equipmentInfo?: {
    title: string;
    serial: string;
    brand: string;
    expirationDate: string;
  };

  /**
   * Si true, renderiza la tarjeta del equipo directamente en el body
   * Si false, la renderiza dentro del modal (comportamiento por defecto)
   */
  renderEquipmentInBody?: boolean;

  /**
   * Callback cuando el serial escaneado coincide con el equipo
   */
  onSerialMatch?: (scannedSerial: string) => void;

  /**
   * Callback cuando el serial escaneado NO coincide con el equipo
   */
  onSerialMismatch?: (scannedSerial: string, expectedSerial: string) => void;
}

export const BarCodeScanner: React.FC<BarCodeScannerProps> = ({
  isOpen,
  onClose,
  onScanSuccess,
  onScanError,
  title,
  equipmentInfo,
  renderEquipmentInBody = false,
  onSerialMatch,
  onSerialMismatch,
}) => {
  const { t } = useTranslation(TranslationNamespaces.GLOBAL);
  const [hasAutoStarted, setHasAutoStarted] = useState(false);
  const {
    state,
    videoRef,
    checkPermissions,
    startScanning,
    stopScanning,
    resetState,
  } = useBarcode();

  // Verificar permisos al abrir el modal y iniciar scanner automáticamente
  useEffect(() => {
    if (isOpen) {
      checkPermissions();
    }
  }, [isOpen, checkPermissions]);

  // Iniciar scanner automáticamente cuando se tengan permisos (solo una vez)
  useEffect(() => {
    if (
      isOpen &&
      state.hasPermission === true &&
      !state.isScanning &&
      !hasAutoStarted
    ) {
      setHasAutoStarted(true);
      // Pequeño delay para asegurar que el DOM esté listo
      setTimeout(() => {
        handleStartScan();
      }, 100);
    }
  }, [isOpen, state.hasPermission, state.isScanning, hasAutoStarted]);

  // Limpiar al cerrar el modal
  useEffect(() => {
    if (!isOpen && state.isScanning) {
      removeCardEquipmentFromBody();
      stopScanning();
    }
    if (!isOpen) {
      removeCardEquipmentFromBody();
      resetState();
      setHasAutoStarted(false); // Reset para la próxima vez que se abra
    }
  }, [isOpen, state.isScanning, resetState, stopScanning]);

  /**
   * Manejar solicitud de permisos
   */
  const handleRequestPermissions = async () => {
    await checkPermissions();
  };

  /**
   * Manejar el resultado del escaneo con validación de serial
   */
  const handleScanSuccess = (scannedResult: string) => {
    // Si hay información del equipo, comparar seriales
    if (equipmentInfo && equipmentInfo.serial) {
      const expectedSerial = equipmentInfo.serial.trim();
      const scannedSerial = scannedResult.trim();

      if (scannedSerial === expectedSerial) {
        onSerialMatch?.(scannedSerial);
      } else {
        onSerialMismatch?.(scannedSerial, expectedSerial);
      }
    }

    // Ejecutar callback original
    onScanSuccess(scannedResult);
  };

  /**
   * Iniciar escaneo
   */
  const handleStartScan = async () => {
    try {
      // Renderizar tarjeta del equipo en el body si está habilitado
      if (renderEquipmentInBody && equipmentInfo) {
        renderCardEquipmentInBody(equipmentInfo as EquipmentInfo, {
          containerId: 'barcode-scanner-equipment-overlay',
          style: {
            position: 'fixed',
            bottom: '20px',
            left: '20px',
            zIndex: 10000,
            width: 'calc(100% - 40px)',
            backgroundColor: 'rgba(255, 255, 255, 0.95)',
            borderRadius: '16px',
            boxShadow: 'rgba(0, 0, 0, 0.15) 0px 4px 12px',
          },
        });
      }

      // Configurar opciones de escaneo (sin QR - QuaggaJS no lo soporta bien)
      const scanOptions = {
        formats: [
          'code_128',
          'code_39',
          'ean_13',
          'ean_8',
          'codabar',
        ] as BarcodeFormat[],
        facingMode: 'environment' as const, // Cámara trasera
        width: 1280, // HD para mejor calidad de escaneo
        height: 720, // HD para mejor calidad de escaneo
        onDetected: (result: string) => {
          handleScanSuccess(result);
          handleClose();
        },
      };

      // Iniciar escaneo con QuaggaJS
      const success = await startScanning(scanOptions);

      if (!success) {
        onScanError?.(t('barcode_scanner.start_error'));
      }
    } catch (err) {
      console.error('Error starting scan:', err);
      const errorMessage =
        err instanceof Error ? err.message : t('barcode_scanner.scan_error');
      onScanError?.(errorMessage);
    }
  };

  /**
   * Detener escaneo
   */
  const handleStopScan = async () => {
    try {
      // Remover tarjeta del equipo del body si estaba renderizada
      if (renderEquipmentInBody) {
        removeCardEquipmentFromBody();
      }

      await stopScanning();
    } catch (err) {
      console.error('Error stopping scan:', err);
    }
  };

  /**
   * Manejar cierre del modal
   */
  const handleClose = async () => {
    // Remover tarjeta del equipo del body si estaba renderizada
    if (renderEquipmentInBody) {
      removeCardEquipmentFromBody();
    }

    if (state.isScanning) {
      removeCardEquipmentFromBody();
      await handleStopScan();
    }
    onClose();
  };

  return (
    <IonModal
      isOpen={isOpen}
      onDidDismiss={handleClose}
      className={styles.modal}
    >
      <Header
        text={title || t('barcode_scanner.title')}
        backButton
        onIconRightClick={handleClose}
        usModal={true}
      />

      <IonContent className={styles.content}>
        <div className={`${styles.container}`}>
          {/* Estado de carga de permisos */}
          {(state.hasPermission === null || state.isLoading) && (
            <div className={styles.centerContent}>
              <div className={styles.iconContainer}>
                <BiaIcon
                  iconName='faSpinner'
                  iconType='solid'
                  size='32px'
                  color='accent'
                  className={styles.spinningIcon}
                />
              </div>
              <BiaText
                token='heading-2'
                color='standard'
              >
                {t('barcode_scanner.checking_permissions')}
              </BiaText>
            </div>
          )}

          {/* Sin permisos */}
          {state.hasPermission === false && !state.isLoading && (
            <div className={styles.centerContent}>
              <div className={styles.iconContainer}>
                <BiaIcon
                  iconName='faCamera'
                  iconType='solid'
                  size='32px'
                  color='error'
                />
              </div>
              <BiaText
                token='heading-2'
                color='standard'
                className={styles.title}
              >
                {t('barcode_scanner.permission_required_title')}
              </BiaText>
              <BiaText
                token='bodyRegular'
                color='weak'
                className={styles.description}
              >
                {state.error || t('barcode_scanner.permission_description')}
              </BiaText>
              <IonButton
                onClick={handleRequestPermissions}
                className={styles.permissionButton}
                disabled={state.isLoading}
              >
                {state.isLoading
                  ? t('barcode_scanner.checking_permissions')
                  : t('barcode_scanner.grant_permission')}
              </IonButton>
            </div>
          )}

          {/* Escaneando - Vista de cámara con información del equipo */}
          {(state.isScanning || state.hasPermission === true) && (
            <div className={styles.scanningContainer}>
              {/* Contenedor para QuaggaJS - QuaggaJS creará su propio video element aquí */}
              <div
                ref={videoRef}
                className={styles.videoContainer}
                style={{
                  display: state.isScanning ? 'block' : 'none',
                  width: '100%',
                  height: '100%',
                  position: 'relative',
                }}
              />

              {/* Información del equipo si está disponible y NO se renderiza en body */}
              {state.isScanning && equipmentInfo && !renderEquipmentInBody && (
                <div className={styles.equipmentCardContainer}>
                  <CardEquipmentDetail
                    title={equipmentInfo.title}
                    brand={equipmentInfo.brand}
                    serial={equipmentInfo.serial}
                    expirationDate={equipmentInfo.expirationDate}
                  />
                </div>
              )}
            </div>
          )}

          {/* Error */}
          {state.error && !state.isScanning && !state.isLoading && (
            <div className={styles.errorContainer}>
              <BiaIcon
                iconName='faExclamationTriangle'
                iconType='solid'
                color='error'
              />
              <BiaText
                token='bodyRegular'
                color='error'
              >
                {state.error}
              </BiaText>
            </div>
          )}
        </div>
      </IonContent>
    </IonModal>
  );
};
