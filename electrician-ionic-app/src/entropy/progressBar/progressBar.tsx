import React from 'react';
import { IonProgressBar } from '@ionic/react';
import styles from './progressBar.module.css';

/**
 * BiaProgressBar es un componente personalizado que envuelve a IonProgressBar.
 * Acepta todas las propiedades de IonProgressBar y añade opciones de personalización.
 */
interface BiaProgressBarProps
  extends React.ComponentProps<typeof IonProgressBar> {
  /**
   * Etiqueta opcional que se muestra encima de la barra de progreso
   */
  label?: string;

  /**
   * Texto descriptivo opcional que se muestra junto al porcentaje
   */
  progressText?: string;

  /**
   * Si se debe mostrar el porcentaje de progreso
   * @default true
   */
  showPercentage?: boolean;

  /**
   * Tamaño de la barra de progreso
   * @default 'medium'
   */
  size?: 'small' | 'medium' | 'large';

  /**
   * Color del progreso
   * @default 'primary'
   */
  color?: 'primary' | 'success' | 'warning' | 'error';

  /**
   * Clase CSS adicional
   */
  className?: string;

  /**
   * Valor del progreso
   */
  value?: number;
}

export const BiaProgressBar = React.forwardRef<
  HTMLIonProgressBarElement,
  BiaProgressBarProps
>(
  (
    {
      label,
      progressText,
      showPercentage = true,
      size = 'medium',
      color = 'primary',
      className,
      value,
      ...props
    },
    ref
  ) => {
    // Calcular el porcentaje para mostrar
    const percentage = value !== undefined ? Math.round(value * 100) : 0;
    const isIndeterminate = value === undefined;

    return (
      <div className={`${styles.progressBarContainer} ${className || ''}`}>
        {label && <div className={styles.label}>{label}</div>}

        {(progressText || showPercentage) && !isIndeterminate && (
          <div className={styles.progressInfo}>
            {progressText && (
              <span className={styles.progressText}>{progressText}</span>
            )}
            {showPercentage && (
              <span className={styles.progressPercentage}>{percentage}%</span>
            )}
          </div>
        )}

        <IonProgressBar
          ref={ref as React.Ref<HTMLIonProgressBarElement>}
          className={`${styles.customProgressBar} ${styles[size]} ${styles[color]}`}
          value={value}
          {...props}
        />
      </div>
    );
  }
);

BiaProgressBar.displayName = 'BiaProgressBar';
