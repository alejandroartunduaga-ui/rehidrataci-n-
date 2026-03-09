import { useState } from 'react';
import { DayPicker } from 'react-day-picker';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { BiaIcon } from '../icon/Icon';
import 'react-day-picker/dist/style.css';
import styles from './BiaDateSelector.module.css';

interface BiaDateSelectorProps {
  selected: Date | null;
  onChange: (date: Date | null) => void;
  minDate?: Date;
  maxDate?: Date;
  placeholder?: string;
  disabled?: boolean;
  onClose?: () => void;
}

export const BiaDateSelector = ({
  selected,
  onChange,
  minDate,
  maxDate,
  placeholder = 'Seleccionar fecha',
  disabled = false,
  onClose,
}: BiaDateSelectorProps) => {
  const [isOpen, setIsOpen] = useState(false);

  const handleDaySelect = (date: Date | undefined) => {
    onChange(date || null);
    setIsOpen(false);
    onClose?.();
  };

  const today = new Date();
  const disabledDays = minDate ? [{ before: minDate }] : [];

  const modifiers = {
    today,
  };

  const modifiersClassNames = {
    today: styles.today,
  };

  return (
    <div className={styles.container}>
      <button
        type='button'
        className={`${styles.trigger} ${isOpen ? styles.inputActive : ''}`}
        onClick={() => setIsOpen(!isOpen)}
        disabled={disabled}
      >
        <BiaIcon
          iconName='faCalendarDay'
          iconType='solid'
          size='12px'
          color='weak'
        />
        <span className={styles.selectedDate}>
          {selected ? format(selected, 'dd-MM-yyyy') : placeholder}
        </span>
        <BiaIcon
          iconName={isOpen ? 'faChevronUp' : 'faChevronDown'}
          iconType='solid'
          size='12px'
          color='weak'
        />
      </button>

      {isOpen && (
        <div className={styles.calendar}>
          <DayPicker
            captionLayout='dropdown-buttons'
            fromYear={2000}
            toYear={(new Date().getFullYear() + 20) as number}
            mode='single'
            selected={selected || undefined}
            onSelect={handleDaySelect}
            locale={es}
            fromDate={minDate}
            toDate={maxDate}
            disabled={disabledDays}
            modifiers={modifiers}
            modifiersClassNames={modifiersClassNames}
            showOutsideDays
          />
        </div>
      )}
    </div>
  );
};
