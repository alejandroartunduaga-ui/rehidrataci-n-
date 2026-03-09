import React, { useRef, useState, useEffect } from 'react';
import SignatureCanvas from 'react-signature-canvas';
import { IonButton } from '@ionic/react';
import { BiaText } from '@entropy/text/text';
import styles from './signature.module.css';

interface BiaSignatureProps {
  onSave: (signatureDataUrl: string) => void;
  onClear?: () => void;
  label?: string;
  initialSignatureDataUrl?: string;
}

export const BiaSignaturePad: React.FC<BiaSignatureProps> = ({
  onSave,
  onClear: onClearProp,
  label,
  initialSignatureDataUrl,
}) => {
  const signatureRef = useRef<SignatureCanvas | null>(null);
  const [isEmpty, setIsEmpty] = useState(!initialSignatureDataUrl);
  const justSavedInternallyRef = useRef(false);

  useEffect(() => {
    if (justSavedInternallyRef.current) {
      justSavedInternallyRef.current = false;
      return;
    }

    if (signatureRef.current) {
      signatureRef.current.clear();

      if (initialSignatureDataUrl) {
        try {
          signatureRef.current.fromDataURL(initialSignatureDataUrl);
          setIsEmpty(false);
        } catch (error) {
          console.error(
            'BiaSignaturePad: Error loading signature from data URL',
            error
          );
          setIsEmpty(true);
        }
      } else {
        setIsEmpty(true);
      }
    }
  }, [initialSignatureDataUrl]);

  const handleClear = () => {
    if (signatureRef.current) {
      signatureRef.current.clear();
    }
    setIsEmpty(true);
    if (onClearProp) onClearProp();
    onSave('');
  };

  const handleSave = () => {
    if (signatureRef.current) {
      if (!signatureRef.current.isEmpty()) {
        const signatureDataUrl = signatureRef.current.toDataURL();
        justSavedInternallyRef.current = true;
        onSave(signatureDataUrl);
        setIsEmpty(false);
      } else {
        setIsEmpty(true);
      }
    }
  };

  const handleEnd = () => {
    if (signatureRef.current) {
      const currentlyEmpty = signatureRef.current.isEmpty();
      if (!currentlyEmpty) {
        handleSave();
      } else {
        setIsEmpty(true);
      }
    }
  };

  return (
    <div className={styles.signatureContainer}>
      {label && (
        <BiaText
          className={styles.labelText}
          color='error'
          token='bodySemibold'
        >
          *
          <BiaText
            className={styles.label}
            color='weak'
            token='caption'
          >
            {label}
          </BiaText>
        </BiaText>
      )}

      <SignatureCanvas
        ref={signatureRef}
        penColor='black'
        canvasProps={{
          width: 350,
          height: 200,
          className: styles.signatureCanvas,
        }}
        onEnd={handleEnd}
      />

      <div className={styles.buttonGroup}>
        <IonButton
          className={styles.button}
          {...(isEmpty ? { disabled: true } : {})}
          onClick={handleClear}
        >
          Limpiar
        </IonButton>
      </div>
    </div>
  );
};
