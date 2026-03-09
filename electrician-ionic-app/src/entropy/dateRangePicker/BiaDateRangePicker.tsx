import React, { useState, useRef, useEffect } from 'react';
import {
  DayPicker,
  DateRange,
  SelectRangeEventHandler,
  DayModifiers,
} from 'react-day-picker';
import { isAfter, addDays, isWithinInterval } from 'date-fns';
import { es } from 'date-fns/locale';
import 'react-day-picker/dist/style.css';
import styles from './BiaDateRangePicker.module.css';

interface BiaDateRangePickerProps {
  value?: DateRange;
  onChange?: (range: DateRange | undefined) => void;
  maxRangeDays?: number;
  disabled?: boolean;
  initialMonths?: Date[];
  onClose?: () => void;
}

export const BiaDateRangePicker: React.FC<BiaDateRangePickerProps> = ({
  value,
  onChange,
  maxRangeDays = 31,
  disabled = false,
  initialMonths,
  onClose,
}) => {
  const [range, setRange] = useState<DateRange | undefined>(value);
  const today = new Date();
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        containerRef.current &&
        !containerRef.current.contains(event.target as Node)
      ) {
        onClose?.();
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [onClose]);

  const handleSelect: SelectRangeEventHandler = (selected) => {
    if (!selected) {
      setRange(undefined);
      return;
    }
    // Validar rango máximo
    if (selected.from && selected.to) {
      const days =
        Math.abs(
          Math.ceil(
            (selected.to.getTime() - selected.from.getTime()) /
              (1000 * 60 * 60 * 24)
          )
        ) + 1;
      if (days > maxRangeDays) {
        // Si el rango es mayor, no actualizar
        return;
      }
    }
    setRange(selected);
  };

  // Deshabilitar días futuros
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const disabledDays = [
    { after: today },
    (date: Date) => {
      if (range?.from && !range.to) {
        // Si ya hay un from, bloquear rangos mayores al máximo
        const maxTo = addDays(range.from, maxRangeDays - 1);
        return isAfter(date, maxTo);
      }
      return false;
    },
  ];

  // Estilos para los días seleccionados y en rango
  const modifiers = {
    start: range?.from,
    end: range?.to,
    inRange: (date: Date) =>
      range?.from &&
      range?.to &&
      isWithinInterval(date, { start: range.from, end: range.to }),
    today,
  };

  const modifiersClassNames = {
    start: styles.rangeStart,
    end: styles.rangeEnd,
    inRange: styles.inRange,
    today: styles.today,
  };

  const handleClear = () => {
    setRange(undefined);
    onChange?.(undefined);
    onClose?.();
  };

  const handleConfirm = () => {
    onChange?.(range);
    onClose?.();
  };

  return (
    <div
      ref={containerRef}
      className={styles.dateRangePickerContainer}
    >
      <DayPicker
        locale={es}
        mode='range'
        selected={range}
        onSelect={handleSelect}
        numberOfMonths={2}
        captionLayout='dropdown-buttons'
        fromYear={2000}
        toYear={(new Date().getFullYear() + 20) as number}
        // disabled={disabledDays}
        modifiers={modifiers as DayModifiers}
        modifiersClassNames={modifiersClassNames}
        defaultMonth={initialMonths?.[0] ?? today}
        showOutsideDays
      />
      <div className={styles.actions}>
        <button
          className={styles.clearBtn}
          onClick={handleClear}
          disabled={disabled}
        >
          Limpiar
        </button>
        <button
          className={styles.confirmBtn}
          onClick={handleConfirm}
          disabled={!range?.from || !range?.to || disabled}
        >
          Confirmar
        </button>
      </div>
    </div>
  );
};
