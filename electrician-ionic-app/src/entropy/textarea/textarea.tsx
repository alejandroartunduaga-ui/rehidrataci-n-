import React, { useState } from 'react';
import { IonTextarea } from '@ionic/react';
import { BiaText } from '@entropy/index';
import styles from './textarea.module.css';

/**
 * BiaTextArea es un componente personalizado que envuelve a IonTextarea.
 * Acepta todas las propiedades de IonTextarea y puede manejar errores visuales.
 */
interface BiaTextAreaProps extends React.ComponentProps<typeof IonTextarea> {
  error?: boolean;
  errorMessage?: string;
}

export const BiaTextArea = React.forwardRef<
  HTMLIonTextareaElement,
  BiaTextAreaProps
>(({ error, errorMessage, className, label, ...props }, ref) => {
  const [focused, setFocused] = useState(false);

  return (
    <div className={styles.textAreaContainer}>
      {/* Label del textarea */}
      <BiaText
        className={styles.labelText}
        color='error'
        token='bodySemibold'
      >
        {`${props.required ? '* ' : ''}`}
        <BiaText
          className={styles.label}
          color='weak'
          token='caption'
        >
          {label}
        </BiaText>
      </BiaText>

      {/* Textarea con estilos personalizados */}
      <div className={styles.textAreaWrapper}>
        <IonTextarea
          {...props}
          ref={ref}
          onIonFocus={() => setFocused(true)}
          onIonBlur={() => setFocused(false)}
          className={`${styles.customTextArea} ${focused && styles.focused} ${
            error && styles.error
          } ${className}`}
        />
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
});
