import React from 'react';
import { IonButton } from '@ionic/react';
import { BiaTag, BiaText } from '@entropy/index';
import { EEquipmentCertificateStatus } from '@mobile/visits/data/interfaces/equipmentCertificates.interface';
import styles from './CardEquipment.module.css';

interface CardEquipmentProps {
  /**
   * Nombre del equipo
   */
  name: string;

  /**
   * Número de serie del equipo
   */
  serial: string;

  /**
   * ID del equipo
   */
  id: string;

  /**
   * Marca del equipo
   */
  brand: string;

  /**
   * Fecha de vencimiento
   */
  expirationDate: string;

  /**
   * Estado del equipo
   */
  status: EEquipmentCertificateStatus;

  /**
   * Callback cuando se presiona el botón escanear
   */
  onScan?: (id: string, serial: string) => void;

  /**
   * Callback cuando se presiona el botón "No encontrado"
   */
  onNotFound?: (id: string, serial: string) => void;

  /**
   * Si el componente está deshabilitado
   */
  disabled?: boolean;

  /**
   * Texto del botón de escanear
   */
  buttonScanText?: string;

  /**
   * Texto del botón de no encontrado
   */
  buttonNotFoundText?: string;
}

export const CardEquipment: React.FC<CardEquipmentProps> = ({
  name,
  serial,
  brand,
  expirationDate,
  status,
  id,
  onScan,
  onNotFound,
  disabled = false,
  buttonScanText = 'Escanear',
  buttonNotFoundText = 'No encontrado',
}) => {
  return (
    <div className={styles.card}>
      {/* Estado del equipo */}
      <div className={styles.statusTag}>
        <BiaTag
          className={styles.tag}
          text={status}
          color={
            status === EEquipmentCertificateStatus.VERIFIED
              ? 'success'
              : status === EEquipmentCertificateStatus.WRONG
                ? 'error'
                : status === EEquipmentCertificateStatus.PENDING
                  ? 'warning'
                  : status === EEquipmentCertificateStatus.NOT_FOUND
                    ? 'error'
                    : 'disabled'
          }
          corner='corner'
          size='medium'
        />
      </div>

      {/* Contenido principal */}
      <div className={styles.content}>
        {/* Información del equipo */}
        <div className={styles.infoGroup}>
          {/* Título */}
          <div className={styles.cardHeader}>
            <BiaText
              token='heading-2'
              className={styles.title}
            >
              {name}
            </BiaText>
          </div>

          {/* Detalles */}
          <div className={styles.itemGroup}>
            <div className={styles.detailItem}>
              <BiaText
                token='bodySemibold'
                className={styles.detailLabel}
              >
                Serial:{' '}
              </BiaText>
              <BiaText
                token='bodyRegular'
                className={styles.detailValue}
              >
                {serial}{' '}
              </BiaText>
            </div>
            <div className={styles.detailItem}>
              <BiaText
                token='bodySemibold'
                className={styles.detailLabel}
              >
                Marca del equipo:{' '}
              </BiaText>
              <BiaText
                token='bodyRegular'
                className={styles.detailValue}
              >
                {brand}{' '}
              </BiaText>
            </div>
            <div className={styles.detailItem}>
              <BiaText
                token='bodySemibold'
                className={styles.detailLabel}
              >
                Vencimiento:{' '}
              </BiaText>
              <BiaText
                token='bodyRegular'
                className={styles.detailValue}
              >
                {expirationDate}{' '}
              </BiaText>
            </div>
          </div>
        </div>

        {/* Botones de acción */}
        {status === EEquipmentCertificateStatus.NOT_FOUND && (
          <div className={styles.buttonGroup}>
            <IonButton
              expand='block'
              fill='solid'
              onClick={() => onScan?.(id, serial)}
              disabled={disabled}
              className={styles.scanButton}
            >
              {buttonScanText}
            </IonButton>
          </div>
        )}
        {status !== EEquipmentCertificateStatus.VERIFIED &&
          status !== EEquipmentCertificateStatus.NOT_FOUND && (
            <div className={styles.buttonGroup}>
              <IonButton
                onClick={() => onScan?.(id, serial)}
                disabled={disabled}
                className={styles.scanButton}
              >
                {buttonScanText}
              </IonButton>

              <IonButton
                onClick={() => onNotFound?.(id, serial)}
                disabled={disabled}
                className={styles.notFoundButton}
              >
                {buttonNotFoundText}
              </IonButton>
            </div>
          )}
      </div>
    </div>
  );
};
