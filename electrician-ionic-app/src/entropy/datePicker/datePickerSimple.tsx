import React, { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { DayPicker } from 'react-day-picker';
import { format, parse, isValid } from 'date-fns';
import { es } from 'date-fns/locale';
import { BiaText } from '@entropy/text/text';
import { BiaIcon } from '@entropy/icon/Icon';
import 'react-day-picker/dist/style.css';
import styles from './datePickerSimple.module.css';

interface BiaDatePickerSimpleProps {
  /**
   * Label del campo
   */
  label?: string;
  /**
   * Valor de la fecha en formato ISO (YYYY-MM-DD)
   */
  value?: string;
  /**
   * Callback cuando cambia la fecha
   */
  onDateChange?: (date: string) => void;
  /**
   * Si el campo es requerido
   */
  required?: boolean;
  /**
   * Si el campo está deshabilitado
   */
  disabled?: boolean;
  /**
   * Clase CSS adicional
   */
  className?: string;
}

export const BiaDatePickerSimple = React.forwardRef<
  HTMLDivElement,
  BiaDatePickerSimpleProps
>(({ label, value, onDateChange, required, disabled, className }, ref) => {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const calendarRef = useRef<HTMLDivElement>(null);
  const [calendarPosition, setCalendarPosition] = useState({ top: 0, left: 0 });

  // Calcular posición del calendario
  useEffect(() => {
    if (isOpen && buttonRef.current) {
      const rect = buttonRef.current.getBoundingClientRect();
      setCalendarPosition({
        top: rect.bottom + window.scrollY + 4,
        left: rect.left + window.scrollX,
      });
    }
  }, [isOpen]);

  // Detectar clics fuera del componente
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        containerRef.current &&
        !containerRef.current.contains(event.target as Node) &&
        calendarRef.current &&
        !calendarRef.current.contains(event.target as Node)
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

  // Cerrar el calendario al hacer scroll
  useEffect(() => {
    const handleScroll = () => {
      if (isOpen) {
        setIsOpen(false);
      }
    };
    if (isOpen) {
      window.addEventListener('scroll', handleScroll, true);
    }
    return () => {
      window.removeEventListener('scroll', handleScroll, true);
    };
  }, [isOpen]);

  // Convertir el valor ISO a Date con validación
  const parseDate = (dateString: string | undefined): Date | undefined => {
    if (!dateString || dateString.trim() === '') {
      return undefined;
    }

    try {
      const parsedDate = parse(dateString, 'yyyy-MM-dd', new Date());
      return isValid(parsedDate) ? parsedDate : undefined;
    } catch (error) {
      console.error('Error parsing date:', error);
      return undefined;
    }
  };

  const selectedDate = parseDate(value);

  const handleDaySelect = (date: Date | undefined) => {
    if (date && onDateChange) {
      const isoDate = format(date, 'yyyy-MM-dd');
      onDateChange(isoDate);
    }
    setIsOpen(false);
  };

  const handleClear = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (onDateChange) {
      onDateChange('');
    }
  };

  const today = new Date();

  const modifiers = {
    today,
  };

  const modifiersClassNames = {
    today: styles.today,
  };

  // Formatear la fecha para mostrar en el botón
  const displayDate =
    selectedDate && isValid(selectedDate)
      ? format(selectedDate, 'dd-MM-yyyy')
      : 'Seleccionar fecha';
  return (
    <>
      <div
        className={`${styles.container} ${className || ''}`}
        ref={(node) => {
          (
            containerRef as React.MutableRefObject<HTMLDivElement | null>
          ).current = node;
          if (typeof ref === 'function') {
            ref(node);
          } else if (ref) {
            (ref as React.MutableRefObject<HTMLDivElement | null>).current =
              node;
          }
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
            className={styles.dateButton}
            onClick={() => !disabled && setIsOpen(!isOpen)}
            disabled={disabled}
          >
            {displayDate}
          </button>
          {selectedDate && !disabled && (
            <button
              type='button'
              className={styles.clearButton}
              onClick={handleClear}
              aria-label='Limpiar fecha'
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
      </div>
      {isOpen &&
        !disabled &&
        createPortal(
          <div
            ref={calendarRef}
            className={styles.calendarContainer}
            style={{
              position: 'fixed',
              top: `${calendarPosition.top}px`,
              left: `${calendarPosition.left}px`,
            }}
          >
            <DayPicker
              mode='single'
              selected={selectedDate}
              onSelect={handleDaySelect}
              captionLayout='dropdown-buttons'
              fromYear={2000}
              toYear={(new Date().getFullYear() + 20) as number}
              locale={es}
              modifiers={modifiers}
              modifiersClassNames={modifiersClassNames}
              showOutsideDays
            />
          </div>,
          document.body
        )}
    </>
  );
});
