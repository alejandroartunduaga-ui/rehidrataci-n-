import React from 'react';
import styles from './InputTelemetry.module.css';
import { BiaIcon, BiaTag, BiaText } from '@entropy/index';
import { StatusTelemetry } from '@mobile/forms-management/data/interfaces/telemetry.interface';

interface InputTelemetryProps {
  disabled: boolean;
  status: StatusTelemetry;
  label?: string;
  onClick?: (status: StatusTelemetry) => void;
}

export const InputTelemetry: React.FC<InputTelemetryProps> = ({
  disabled,
  status,
  label = 'Prueba de Telemedida',
  onClick,
}) => {
  return (
    <div
      className={`${styles.container} ${disabled ? styles.disabled : ''}`}
      aria-disabled={disabled}
      role='button'
      tabIndex={0}
      onClick={disabled ? undefined : () => onClick?.(status)}
      onKeyDown={(e) => {
        if (disabled) return;
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          onClick?.(status);
        }
      }}
    >
      <div className={styles.row}>
        <div className={styles.iconLeft}>
          <BiaIcon
            iconName='faGlobe'
            iconType='solid'
          />
        </div>

        <div className={styles.title}>
          <BiaText
            token='bodySemibold'
            color='strong'
          >
            {label}
          </BiaText>
        </div>
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
        <div className={styles.iconRight}>
          <BiaIcon
            iconName='faChevronRight'
            iconType='solid'
          />
        </div>
      </div>
    </div>
  );
};

export default InputTelemetry;
