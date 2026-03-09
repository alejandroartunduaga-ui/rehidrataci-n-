import React from 'react';
import styles from './CardEquipmentDetail.module.css';
import { BiaText } from '@entropy/index';

interface CardEquipmentDetailProps {
  title: string;
  serial: string;
  brand: string;
  expirationDate: string;
}

export const CardEquipmentDetail: React.FC<CardEquipmentDetailProps> = ({
  title,
  serial,
  brand,
  expirationDate,
}) => {
  return (
    <>
      <div className={styles.backgroundCamera}>
        <div className={styles.pointCamera1}></div>
        <div className={styles.pointCamera2}></div>
        <div className={styles.pointCamera3}></div>
        <div className={styles.pointCamera4}></div>
      </div>
      <div className={styles.card}>
        {/* Contenido principal */}
        <div className={styles.infoGroup}>
          {/* Header con título */}
          <BiaText
            token='heading-2'
            className={styles.title}
          >
            {title}
          </BiaText>

          {/* Información del equipo */}
          <div className={styles.itemGroup}>
            <div className={styles.serialInfo}>
              <BiaText
                token='bodySemibold'
                className={styles.label}
              >
                Serial:
              </BiaText>
              <BiaText
                token='caption'
                className={styles.value}
              >
                {serial}
              </BiaText>
            </div>
            <div className={styles.brandInfo}>
              <BiaText
                token='bodySemibold'
                className={styles.label}
              >
                Marca:
              </BiaText>
              <BiaText
                token='caption'
                className={styles.value}
              >
                {brand}
              </BiaText>
            </div>
            <div className={styles.expirationInfo}>
              <BiaText
                token='bodySemibold'
                className={styles.label}
              >
                Vencimiento:
              </BiaText>
              <BiaText
                token='caption'
                className={styles.value}
              >
                {expirationDate}
              </BiaText>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};
