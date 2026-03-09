import React, { useState, useEffect } from 'react';
import {
  IonModal,
  IonHeader,
  IonContent,
  IonButton,
  IonFooter,
  IonItem,
  IonLabel,
  IonInput,
  IonSelect,
  IonSelectOption,
  IonTextarea,
  IonText,
} from '@ionic/react';
import {
  BiaIcon,
  Header,
  BiaInput,
  BiaSelect,
  BiaTextArea,
  BiaDatePicker,
} from '@entropy/index';
import { IFields } from '@forms-management/data/interfaces/formById.interface';
import styles from '../../pages/Forms.module.css';

interface BuilderModalProps {
  isOpen: boolean;
  onDidDismiss: () => void;
  fields: IFields[];
  onSubmit: (data: Record<string, string>) => void;
  title?: string;
  submitButtonText?: string;
  initialValues?: Record<string, string>;
  onAutoSave?: (data: Record<string, string>) => void;
  autoSaveDelay?: number;
}

export const BuilderModal: React.FC<BuilderModalProps> = ({
  isOpen,
  onDidDismiss,
  fields,
  onSubmit,
  title = 'Formulario',
  submitButtonText = 'Guardar',
  initialValues = {},
  onAutoSave,
  autoSaveDelay = 1000,
}) => {
  const [formValues, setFormValues] = useState<Record<string, string>>({});
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [showErrors, setShowErrors] = useState<boolean>(false);
  const autoSaveTimerRef = React.useRef<NodeJS.Timeout | null>(null);

  // Inicializar valores cuando se abre el modal
  useEffect(() => {
    if (isOpen) {
      const initialFormValues: Record<string, string> = {};
      fields.forEach((field) => {
        initialFormValues[field.code] = initialValues[field.code] || '';
      });
      setFormValues(initialFormValues);
      setErrors({});
      setShowErrors(false);
    }

    // Limpiar el timer cuando se cierra el modal
    return () => {
      if (autoSaveTimerRef.current) {
        clearTimeout(autoSaveTimerRef.current);
        autoSaveTimerRef.current = null;
      }
    };
  }, [isOpen, fields, initialValues]);

  const handleInputChange = (fieldCode: string, value: string) => {
    setFormValues((prev) => {
      const newValues = {
        ...prev,
        [fieldCode]: value,
      };

      // 🔄 AUTO-SAVE: Disparar auto-guardado con debounce
      if (onAutoSave) {
        // Limpiar timer anterior
        if (autoSaveTimerRef.current) {
          clearTimeout(autoSaveTimerRef.current);
        }

        // Programar nuevo auto-guardado
        autoSaveTimerRef.current = setTimeout(() => {
          onAutoSave(newValues);
        }, autoSaveDelay);
      }

      return newValues;
    });

    // Limpiar error del campo si tenía uno
    if (errors[fieldCode]) {
      setErrors((prev) => ({
        ...prev,
        [fieldCode]: '',
      }));
    }
  };

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    fields.forEach((field) => {
      if (
        field.mandatory &&
        (!formValues[field.code] || formValues[field.code].trim() === '')
      ) {
        newErrors[field.code] = `El campo es obligatorio`;
      }
    });

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Función para verificar si el formulario está completo (sin mostrar errores)
  const isFormComplete = React.useMemo((): boolean => {
    let isComplete = true;

    fields.forEach((field) => {
      if (field.mandatory) {
        if (!formValues[field.code] || formValues[field.code].trim() === '') {
          isComplete = false;
        }
      }
    });

    return isComplete;
  }, [formValues, fields]);

  const handleSubmit = () => {
    setShowErrors(true);
    if (validateForm()) {
      onSubmit(formValues);
    }
  };

  const renderField = (field: IFields) => {
    const value = formValues[field.code] || '';
    const error = errors[field.code];
    const hasError = showErrors && !!error;

    // Obtener opciones del campo
    const options = field.items?.map((item) => item.option) || [];

    switch (field.type) {
      case 'TEXT_FIELD':
        return (
          <BiaInput
            key={field.code}
            type={
              field.input_type === 'STRING'
                ? 'text'
                : field.input_type === 'NUMBER'
                  ? 'number'
                  : 'text'
            }
            label={field.title}
            value={value}
            required={field.mandatory}
            error={hasError}
            errorMessage={error}
            readonly={!field.editable}
            onIonChange={(e) => {
              handleInputChange(field.code, e.detail.value || '');
            }}
            disabled={!field.editable}
          />
        );

      case 'TEXT_VIEW':
        return (
          <BiaTextArea
            key={field.code}
            label={field.title}
            required={field.mandatory}
            value={value}
            placeholder={field.title}
            rows={4}
            error={hasError}
            errorMessage={error}
            onIonChange={(e) =>
              handleInputChange(field.code, e.detail.value || '')
            }
            disabled={!field.editable}
          />
        );

      case 'SELECTOR':
        if (
          field.input_type === 'DROPDOWN' ||
          field.input_type === 'RADIO_BUTTON'
        ) {
          return (
            <BiaSelect
              key={field.code}
              options={options}
              label={field.title}
              required={field.mandatory}
              value={value}
              error={hasError}
              errorMessage={error}
              onIonChange={(e) =>
                handleInputChange(field.code, e.detail.value || '')
              }
              disabled={!field.editable}
            />
          );
        }
        if (field.input_type === 'DATE') {
          return (
            <BiaDatePicker
              key={field.code}
              label={field.title}
              required={field.mandatory}
              value={value}
              onChange={(date) => handleInputChange(field.code, date)}
            />
          );
        }
        break;

      default:
        // Fallback para input_type específicos
        switch (field.input_type) {
          case 'STRING':
            return (
              <IonItem
                key={field.code}
                className={hasError ? 'ion-invalid' : ''}
              >
                <IonLabel position='stacked'>{field.title}</IonLabel>
                <IonInput
                  value={value}
                  onIonChange={(e) =>
                    handleInputChange(field.code, String(e.detail.value))
                  }
                  placeholder={`Ingrese ${field.title.toLowerCase()}`}
                  disabled={!field.editable}
                />
                {hasError && (
                  <IonText
                    color='danger'
                    className='ion-padding-start'
                  >
                    {error}
                  </IonText>
                )}
              </IonItem>
            );

          case 'NUMBER':
            return (
              <IonItem
                key={field.code}
                className={hasError ? 'ion-invalid' : ''}
              >
                <IonLabel position='stacked'>{field.title}</IonLabel>
                <IonInput
                  type='number'
                  value={value}
                  onIonChange={(e) =>
                    handleInputChange(field.code, String(e.detail.value))
                  }
                  placeholder={`Ingrese ${field.title.toLowerCase()}`}
                  disabled={!field.editable}
                />
                {hasError && (
                  <IonText
                    color='danger'
                    className='ion-padding-start'
                  >
                    {error}
                  </IonText>
                )}
              </IonItem>
            );

          case 'DROPDOWN':
            return (
              <IonItem
                key={field.code}
                className={hasError ? 'ion-invalid' : ''}
              >
                <IonLabel position='stacked'>{field.title}</IonLabel>
                <IonSelect
                  value={value}
                  onIonChange={(e) =>
                    handleInputChange(field.code, e.detail.value || '')
                  }
                  placeholder={`Seleccione ${field.title.toLowerCase()}`}
                  disabled={!field.editable}
                >
                  {options.map((option: string, index: number) => (
                    <IonSelectOption
                      key={index}
                      value={option}
                    >
                      {option}
                    </IonSelectOption>
                  ))}
                </IonSelect>
                {hasError && (
                  <IonText
                    color='danger'
                    className='ion-padding-start'
                  >
                    {error}
                  </IonText>
                )}
              </IonItem>
            );

          case 'TEXTAREA':
            return (
              <IonItem
                key={field.code}
                className={hasError ? 'ion-invalid' : ''}
              >
                <IonLabel position='stacked'>{field.title}</IonLabel>
                <IonTextarea
                  value={value}
                  onIonChange={(e) =>
                    handleInputChange(field.code, String(e.detail.value))
                  }
                  placeholder={`Ingrese ${field.title.toLowerCase()}`}
                  rows={4}
                  disabled={!field.editable}
                />
                {hasError && (
                  <IonText
                    color='danger'
                    className='ion-padding-start'
                  >
                    {error}
                  </IonText>
                )}
              </IonItem>
            );

          default:
            return (
              <IonItem
                key={field.code}
                className={hasError ? 'ion-invalid' : ''}
              >
                <IonLabel position='stacked'>{field.title}</IonLabel>
                <IonInput
                  value={value}
                  onIonChange={(e) =>
                    handleInputChange(field.code, String(e.detail.value))
                  }
                  placeholder={`Ingrese ${field.title.toLowerCase()}`}
                  disabled={!field.editable}
                />
                {hasError && (
                  <IonText
                    color='danger'
                    className='ion-padding-start'
                  >
                    {error}
                  </IonText>
                )}
              </IonItem>
            );
        }
    }

    return null;
  };

  return (
    <IonModal
      isOpen={isOpen}
      onDidDismiss={onDidDismiss}
      initialBreakpoint={0.9}
      breakpoints={[0, 0.9]}
      backdropDismiss={false}
    >
      <IonHeader className={styles.headerBuilderModal}>
        <Header
          text={title}
          headerModal
        />
        <div className={styles.containerButtonClose}>
          <IonButton
            fill='clear'
            onClick={onDidDismiss}
            className={styles.button_close}
          >
            <BiaIcon
              iconName='faClose'
              iconType='solid'
              color='inverse'
              size='16px'
            />
          </IonButton>
        </div>
      </IonHeader>

      <IonContent className={`ion-padding`}>
        {fields.map(renderField)}
      </IonContent>

      <IonFooter className={styles.footerModal}>
        <div style={{ display: 'flex', gap: '1rem', padding: '1rem' }}>
          <IonButton
            expand='block'
            onClick={handleSubmit}
            className={styles.button}
            {...(!isFormComplete ? { disabled: true } : {})}
            style={{ flex: 1 }}
          >
            {submitButtonText}
          </IonButton>
        </div>
      </IonFooter>
    </IonModal>
  );
};
