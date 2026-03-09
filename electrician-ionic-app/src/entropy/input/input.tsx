import React, { useState, useEffect } from 'react';
import { IonInput } from '@ionic/react';
import { BiaText, BiaIcon } from '@entropy/index';
import styles from './input.module.css';

/**
 * BiaInput es un componente personalizado que envuelve a IonInput.
 * Acepta todas las propiedades de IonInput y puede manejar errores visuales.
 */
interface BiaInputProps extends React.ComponentProps<typeof IonInput> {
  error?: boolean;
  errorMessage?: string;
  icon?: string;
  iconType?: 'solid' | 'regular';
  clearable?: boolean;
  labelInput?: string;
  pattern?: string;
  readonly?: boolean;
  onClear?: () => void;
  containerClassName?: string;
  helperMessage?: string;
}

export const BiaInput = React.forwardRef<HTMLIonInputElement, BiaInputProps>(
  (
    {
      error,
      errorMessage,
      className,
      containerClassName = '',
      label,
      labelInput,
      labelPlacement = 'start',
      type = 'text',
      icon,
      iconType = 'regular',
      clearable,
      onClear,
      value,
      pattern = undefined,
      readonly = false,
      disabled = false,
      helperMessage,
      ...props
    },
    ref
  ) => {
    const [showPassword, setShowPassword] = useState(false);
    const [focused, setFocused] = useState(false);
    const isControlled = value !== undefined;
    const [internalValue, setInternalValue] = useState(value ?? '');
    useEffect(() => {
      if (isControlled) {
        setInternalValue(value ?? '');
      }
    }, [value, isControlled]);
    const handleClear = () => {
      if (!isControlled) {
        setInternalValue('');
      }
      onClear?.();
      if (props.onIonInput) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        props.onIonInput({ detail: { value: '' } } as any);
      }
    };
    const toggleShowPassword = () => {
      setShowPassword(!showPassword);
    };

    return (
      <div className={`${styles.inputContainer} ${containerClassName}`}>
        {/* Label del input */}
        {label && (
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
        )}

        {/* Input con estilos personalizados */}
        <div
          className={`${styles.inputWrapper} ${readonly || disabled ? styles.disabledWrapper : ''}`}
        >
          <IonInput
            {...props}
            shape='round'
            label={labelInput || undefined}
            labelPlacement={labelInput ? labelPlacement : undefined}
            ref={ref}
            type={type === 'password' && showPassword ? 'text' : type}
            value={isControlled ? value : internalValue}
            onIonInput={(e) => {
              if (!isControlled) {
                setInternalValue(e.detail.value ?? '');
              }
              props.onIonInput?.(e);
            }}
            onIonFocus={() => setFocused(true)}
            onIonBlur={() => setFocused(false)}
            className={`${styles.customInput} ${focused && styles.focused} ${
              error && styles.error
            } ${className}`}
            pattern={pattern || undefined}
            readonly={readonly}
          >
            {icon && (
              <div
                slot='start'
                aria-hidden='true'
                className={styles.icon}
              >
                <BiaIcon
                  iconName={icon}
                  iconType={iconType}
                  size='12px'
                  color='weak'
                />
              </div>
            )}
          </IonInput>

          {/* Botón de limpiar */}
          {clearable && (isControlled ? value : internalValue) && (
            <button
              type='button'
              className={styles.clearButton}
              onClick={handleClear}
              tabIndex={-1}
            >
              <BiaIcon
                iconName='faXmark'
                iconType='solid'
                size='10px'
                color='inverse'
              />
            </button>
          )}

          {/* Icono para mostrar/ocultar contraseña si el tipo es password */}
          {type === 'password' && (
            <button
              type='button'
              className={styles.passwordToggleBtn}
              onClick={toggleShowPassword}
              aria-label={
                showPassword ? 'Ocultar contraseña' : 'Mostrar contraseña'
              }
            >
              <BiaIcon
                iconName={showPassword ? 'faEyeSlash' : 'faEye'}
                iconType='regular'
                size='16px'
                color='strong'
                className={styles.passwordIcon}
              />
            </button>
          )}
        </div>

        {/* Texto de ayuda (helper) */}
        {helperMessage && !error && (
          <BiaText
            color='weak'
            token='caption'
            className={styles.helperText}
          >
            {helperMessage}
          </BiaText>
        )}

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
