import React from 'react';
import { CheckboxCustomEvent, IonCheckbox } from '@ionic/react';
import styles from './checkbox.module.css';

/**
 * BiaChackbox es un componente personalizado que envuelve a IonCheckbox.
 * Acepta todas las propiedades de IonCheckbox.
 */
interface BiaCheckboxProps extends React.ComponentProps<typeof IonCheckbox> {
  message?: string;
  labelPlacement?: 'start' | 'end' | 'fixed' | 'stacked';
  alignment?: 'start' | 'center';
  justify?: 'start' | 'end' | 'space-between';
  helperText?: string;
  errorText?: string;
  onCheckedChange: (checked: boolean) => void;
  /** Tamaño del icono (check) del checkbox, e.g. '24px'. Usa la CSS var `--size` de IonCheckbox */
  iconSize?: string;
  /** Grosor del check (icono) del checkbox, e.g. '2px'. Usa la CSS var `--checkmark-width` */
  iconWeight?: string | number;
}

export const BiaCheckbox = React.forwardRef<
  HTMLIonInputElement,
  BiaCheckboxProps
>(
  (
    {
      message,
      className,
      labelPlacement = 'end',
      alignment = 'start',
      justify = 'start',
      helperText,
      errorText,
      onCheckedChange,
      iconSize,
      iconWeight,
      ...props
    },
    ref
  ) => {
    const validateCheckbox = (
      event: CheckboxCustomEvent<{ checked: boolean }>
    ) => {
      onCheckedChange(event.detail.checked);
    };

    const mergedStyle: React.CSSProperties = {
      ...(props.style || {}),
      ...(iconSize
        ? ({ ['--size' as unknown as number]: iconSize } as React.CSSProperties)
        : {}),
      ...(iconWeight !== undefined
        ? ({
            ['--checkmark-width' as unknown as number]:
              typeof iconWeight === 'number' ? `${iconWeight}px` : iconWeight,
          } as React.CSSProperties)
        : {}),
    };

    return (
      <div className={`${styles.container_checkbox} ${className}`}>
        <IonCheckbox
          ref={ref as React.Ref<HTMLIonCheckboxElement>}
          {...props}
          labelPlacement={labelPlacement}
          alignment={alignment}
          justify={justify}
          onIonChange={(event) => validateCheckbox(event)}
          style={mergedStyle}
        >
          {helperText && (
            <span className={styles.helperText}>{helperText}</span>
          )}
          {errorText && <span className={styles.errorText}>{errorText}</span>}
          {message && <span className={styles.message}>{message}</span>}
        </IonCheckbox>
      </div>
    );
  }
);
