import React, { useState, useEffect, useRef } from 'react';
import { IonDatetime } from '@ionic/react';
import { BiaText } from '@entropy/text/text';
import { BiaIcon } from '@entropy/icon/Icon';
import styles from './BiaTimerPicker.module.css';
import { createPortal } from 'react-dom';

interface BiaTimerPickerProps {
  label?: string;
  value?: string;
  onTimeChange?: (time: string | null) => void;
  required?: boolean;
  disabled?: boolean;
  className?: string;
  hourCycle?: 'h12' | 'h23';
  showSeconds?: boolean;
  placeholder?: string;
  hasDate?: boolean; // Indica si hay una fecha seleccionada
}

export const BiaTimerPicker = React.forwardRef<
  HTMLDivElement,
  BiaTimerPickerProps
>(
  (
    {
      label,
      value,
      onTimeChange,
      required,
      disabled,
      className,
      hourCycle = 'h23',
      showSeconds = false,
      placeholder = 'Seleccionar hora',
      hasDate = true, // Por defecto true para mantener compatibilidad
    },
    ref
  ) => {
    const [isOpen, setIsOpen] = useState(false);
    const containerRef = useRef<HTMLDivElement>(null);
    const buttonRef = useRef<HTMLButtonElement>(null);
    const datetimeRef = useRef<HTMLIonDatetimeElement>(null);
    const [pickerPosition, setPickerPosition] = useState({ top: 0, left: 0 });

    // Calcular posición del picker debajo del botón (coordenadas absolutas para portal)
    useEffect(() => {
      if (isOpen && buttonRef.current) {
        const rect = buttonRef.current.getBoundingClientRect();
        setPickerPosition({
          top: rect.bottom + window.scrollY + 4,
          left: rect.left + window.scrollX,
        });
      }
    }, [isOpen]);

    // Detectar clics fuera del componente
    useEffect(() => {
      const handleClickOutside = (event: MouseEvent) => {
        const target = event.target as Node;
        if (
          containerRef.current &&
          !containerRef.current.contains(target) &&
          datetimeRef.current &&
          !datetimeRef.current.contains(target)
        ) {
          setIsOpen(false);
        }
      };

      if (isOpen) {
        document.addEventListener('mousedown', handleClickOutside);
      }

      return () => {
        document.removeEventListener('mousedown', handleClickOutside);
      };
    }, [isOpen]);

    // Cerrar el picker al hacer scroll
    useEffect(() => {
      const handleScroll = (event: Event) => {
        if (!isOpen) return;
        // Si el scroll viene del picker, NO cerrar
        if (
          datetimeRef.current &&
          datetimeRef.current.contains(event.target as Node)
        ) {
          return;
        }
        // Si el scroll viene de otra parte de la página, cerrar
        setIsOpen(false);
      };

      if (isOpen) {
        window.addEventListener('scroll', handleScroll, true);
      }

      return () => {
        window.removeEventListener('scroll', handleScroll, true);
      };
    }, [isOpen]);

    const handleTimeChange = (e: CustomEvent) => {
      const newValue = e.detail.value as string | undefined;
      onTimeChange?.(newValue || '');
      if (newValue && onTimeChange) {
        // Formatear el valor para que sea solo tiempo (HH:mm o HH:mm:ss)
        const timeMatch = newValue.match(/T(\d{2}):(\d{2})(:(\d{2}))?/);
        if (timeMatch) {
          const hours = timeMatch[1];
          const minutes = timeMatch[2];
          const seconds = timeMatch[4];
          const formattedTime =
            showSeconds && seconds
              ? `${hours}:${minutes}:${seconds}`
              : `${hours}:${minutes}`;
          onTimeChange(formattedTime);
        } else {
          onTimeChange(newValue);
        }
      }
      setIsOpen(false);
    };

    const handleClear = (e: React.MouseEvent) => {
      e.stopPropagation();
      if (onTimeChange) {
        onTimeChange(null);
      }
      setIsOpen(false);
    };

    const handleCancel = () => {
      setIsOpen(false);
    };

    return (
      <div
        className={`${styles.container} ${className || ''}`}
        ref={(node) => {
          (
            containerRef as React.MutableRefObject<HTMLDivElement | null>
          ).current = node;
          if (typeof ref === 'function') ref(node);
          else if (ref)
            (ref as React.MutableRefObject<HTMLDivElement | null>).current =
              node;
        }}
      >
        {label && (
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
        )}
        <div className={styles.buttonWrapper}>
          <button
            ref={buttonRef}
            type='button'
            className={styles.timeButton}
            onClick={() => !disabled && hasDate && setIsOpen(!isOpen)}
            disabled={disabled || !hasDate}
          >
            {value || placeholder}
          </button>
          {value && !disabled && hasDate && (
            <button
              type='button'
              className={styles.clearButton}
              onClick={handleClear}
              aria-label='Limpiar hora'
            >
              <BiaIcon
                iconName='faXmark'
                iconType='solid'
                size='10px'
                color='inverse'
              />
            </button>
          )}
        </div>
        {isOpen &&
          !disabled &&
          hasDate &&
          createPortal(
            <IonDatetime
              className={styles.pickerDatetime}
              style={{
                top: `${pickerPosition.top}px`,
                left: `${pickerPosition.left}px`,
              }}
              ref={datetimeRef}
              presentation='time'
              value={value || undefined}
              onIonChange={handleTimeChange}
              onIonCancel={handleCancel}
              showDefaultButtons={true}
              doneText='Aceptar'
              cancelText='Cancelar'
              hourCycle={hourCycle}
              preferWheel={true}
            />,
            document.body
          )}
      </div>
    );
  }
);

BiaTimerPicker.displayName = 'BiaTimerPicker';
