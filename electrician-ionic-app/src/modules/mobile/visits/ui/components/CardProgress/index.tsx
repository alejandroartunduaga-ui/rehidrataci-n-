import React from 'react';
import { BiaText, BiaTag, BiaProgressBar } from '@entropy/index';
import styles from './CardProgress.module.css';

interface CardProgressProps {
  /**
   * Título del progreso
   */
  title: string;

  /**
   * Valor actual del progreso
   */
  current: number;

  /**
   * Valor total del progreso
   */
  total: number;

  /**
   * Clase CSS adicional
   */
  className?: string;
}

export const CardProgress: React.FC<CardProgressProps> = ({
  title,
  current,
  total,
  className,
}) => {
  // Calcular el porcentaje de progreso
  const progressValue = total > 0 ? current / total : 0;
  const progressText = `${current}/${total}`;

  return (
    <div className={`${styles.card} ${className || ''}`}>
      <div className={styles.content}>
        {/* Encabezado con título y contador */}
        <div className={styles.heading}>
          <div className={styles.infoGroup}>
            <div className={styles.itemGroup}>
              <BiaText
                token='bodySemibold'
                color='standard'
                className={styles.title}
              >
                {title}
              </BiaText>
            </div>
          </div>

          {/* Tag con el contador */}
          <div className={styles.tagContainer}>
            <BiaTag
              text={progressText}
              color='disabled'
              corner='rounded'
              size='small'
            />
          </div>
        </div>

        {/* Barra de progreso */}
        <div className={styles.progressContainer}>
          <BiaProgressBar
            value={progressValue}
            showPercentage={false}
            size='medium'
            className={styles.progressBar}
          />
        </div>
      </div>
    </div>
  );
};
