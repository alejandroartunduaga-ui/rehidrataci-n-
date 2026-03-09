import React, { useState, useEffect } from 'react';
import { IonDatetime, IonModal } from '@ionic/react';
import { BiaInput } from '@entropy/input/input';

interface BiaDatePickerProps {
  label: string;
  required: boolean;
  value?: string;
  onChange?: (date: string) => void;
}
export const BiaDatePicker: React.FC<BiaDatePickerProps> = ({
  label,
  required,
  value,
  onChange,
}) => {
  const [selectedDate, setSelectedDate] = useState<string | undefined>(value);
  const [showPicker, setShowPicker] = useState(false);

  useEffect(() => {
    if (value) {
      // Asumir que value viene en YYYY-MM-DD o DD-MM-YYYY, normalizar a DD-MM-YYYY
      const parts = value.split(/[-/]/);
      if (parts.length === 3) {
        const [y, m, d] =
          parts[0].length === 4 ? parts : [parts[2], parts[1], parts[0]];
        const formatted = `${String(d).padStart(2, '0')}-${String(m).padStart(2, '0')}-${y}`;
        setSelectedDate(formatted);
      } else {
        setSelectedDate(value);
      }
    } else {
      setSelectedDate(undefined);
    }
  }, [value]);

  const handleDateChange = (event: CustomEvent) => {
    const isoDate = event.detail.value;
    if (isoDate) {
      const date = new Date(isoDate);
      const day = String(date.getDate()).padStart(2, '0');
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const year = date.getFullYear();
      const formattedDate = `${day}-${month}-${year}`;
      setSelectedDate(formattedDate);
      if (onChange) {
        onChange(formattedDate);
      }
    } else {
      setSelectedDate('');
      if (onChange) {
        onChange('');
      }
    }
    setShowPicker(false);
  };

  return (
    <div>
      <BiaInput
        type='text'
        label={label}
        value={selectedDate || ''}
        required={required}
        onClick={() => setShowPicker(true)}
        readonly
      />

      <IonModal
        isOpen={showPicker}
        onDidDismiss={() => setShowPicker(false)}
        initialBreakpoint={0.45}
        breakpoints={[0, 0.25, 0.5, 0.75]}
        backdropDismiss={false}
      >
        <IonDatetime
          size='cover'
          presentation='date'
          preferWheel={true}
          onIonChange={handleDateChange}
          value={selectedDate}
          showDefaultButtons
          doneText='Hecho'
          cancelText='Cancelar'
        />
      </IonModal>
    </div>
  );
};
