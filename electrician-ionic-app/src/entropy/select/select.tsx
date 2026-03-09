import React from 'react';
import { IonSelect, IonSelectOption } from '@ionic/react';
import { BiaText } from '@entropy/index';
import styles from './select.module.css';

interface BiaSelectProps extends React.ComponentProps<typeof IonSelect> {
  label: string;
  options: string[];
  error?: boolean;
  errorMessage?: string;
  required: boolean;
  value?: string;
  interfaceSelect?: 'action-sheet' | 'popover' | 'alert' | 'modal';
}

export const BiaSelect = React.forwardRef<HTMLIonSelectElement, BiaSelectProps>(
  (
    {
      label,
      options,
      error,
      errorMessage,
      className,
      required,
      value,
      interfaceSelect = 'action-sheet',
      ...props
    },
    ref
  ) => {
    return (
      <div className={styles.inputContainer}>
        {/* Label del select */}
        <BiaText
          className={styles.labelText}
          color='error'
          token='bodySemibold'
        >
          {`${required ? '* ' : ''}`}
          <BiaText
            className={styles.label}
            color='weak'
            token='caption'
          >
            {label}
          </BiaText>
        </BiaText>

        {/* Select con estilos personalizados */}
        <div className={styles.inputWrapper}>
          <IonSelect
            justify='end'
            interface={interfaceSelect}
            color='light'
            {...props}
            ref={ref}
            className={`${styles.customInput} ${
              error && styles.error
            } ${className}`}
            value={value}
            label={label}
          >
            {options.map((option) => (
              <IonSelectOption
                key={option}
                value={option}
                className={styles.customOptionsSelect}
              >
                {option}
              </IonSelectOption>
            ))}
          </IonSelect>
        </div>

        {/* Texto de error */}
        {error && errorMessage && (
          <BiaText
            color='error'
            token='label'
          >
            {errorMessage}
          </BiaText>
        )}
      </div>
    );
  }
);
