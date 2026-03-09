import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { format, parse } from 'date-fns';
import {
  BiaModalDesktop,
  BiaText,
  BiaDropdown,
  BiaLoader,
  BiaToast,
  BiaSearchList,
} from '@entropy/index';
import { BiaDateSelector } from '@entropy/dateSelector/BiaDateSelector';
import {
  IRescheduleRequest,
  IWorkOrder,
} from '@desktop/work-orders/data/interfaces/workOrders.interface';
import { useVisitAsignment, useWorkOrders } from '@desktop/work-orders/data';
import { TranslationNamespaces } from '@shared/i18n';
import { PopUp } from '../PopUp/PopUp';
import styles from './RescheduleModal.module.css';

interface RescheduleModalProps {
  workOrder: IWorkOrder;
  isOpen: boolean;
  onClose: () => void;
  onReload: () => void;
}

export const RescheduleModal: React.FC<RescheduleModalProps> = ({
  workOrder,
  isOpen,
  onClose,
  onReload,
}) => {
  const { t } = useTranslation(TranslationNamespaces.WORK_ORDERS);
  const { getListContractors } = useVisitAsignment();
  const { rescheduleWorkOrderMutation } = useWorkOrders();
  const [contractorOptions, setContractorOptions] = useState<
    { label: string; value: string }[]
  >([]);
  const [originalDate, setOriginalDate] = useState<Date | null>(null);
  const [originalTime, setOriginalTime] = useState<string>('');
  const [selected, setSelected] = useState<string>('');
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [selectedTime, setSelectedTime] = useState<string>('');
  const [showModalConfirm, setShowModalConfirm] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const isLoading =
    getListContractors.isPending || rescheduleWorkOrderMutation.isPending;

  useEffect(() => {
    if (workOrder.contractor) {
      setSelected(workOrder.contractor.code);
    }

    if (workOrder.start_date) {
      const date = parse(workOrder.start_date, 'dd-MM-yyyy', new Date());
      setOriginalDate(date);
      setSelectedDate(date);
    } else {
      setOriginalDate(null);
    }

    if (workOrder.hours) {
      try {
        const timeDate = parse(workOrder.hours, 'hh:mm a', new Date());
        const formattedTime = format(timeDate, 'HH:00');
        setOriginalTime(formattedTime);
        setSelectedTime(formattedTime);
      } catch (error) {
        console.error('Error al parsear la hora:', error);
        setOriginalTime('');
      }
    } else {
      setOriginalTime('');
    }
  }, [workOrder]);

  useEffect(() => {
    getListContractors.mutate(undefined, {
      onSuccess: (data) => {
        const contractors = data.map((contractor) => ({
          label: contractor.name,
          value: contractor.code,
        }));
        setContractorOptions(contractors);
      },
      onError: () => {
        setError(t('assign_contractor.assign_contractor_error'));
      },
    });
  }, []);

  const timeOptions = [
    { value: '00:00', label: '12:00 am' },
    { value: '01:00', label: '01:00 am' },
    { value: '02:00', label: '02:00 am' },
    { value: '03:00', label: '03:00 am' },
    { value: '04:00', label: '04:00 am' },
    { value: '05:00', label: '05:00 am' },
    { value: '06:00', label: '06:00 am' },
    { value: '07:00', label: '07:00 am' },
    { value: '08:00', label: '08:00 am' },
    { value: '09:00', label: '09:00 am' },
    { value: '10:00', label: '10:00 am' },
    { value: '11:00', label: '11:00 am' },
    { value: '12:00', label: '12:00 pm' },
    { value: '13:00', label: '01:00 pm' },
    { value: '14:00', label: '02:00 pm' },
    { value: '15:00', label: '03:00 pm' },
    { value: '16:00', label: '04:00 pm' },
    { value: '17:00', label: '05:00 pm' },
    { value: '18:00', label: '06:00 pm' },
    { value: '19:00', label: '07:00 pm' },
    { value: '20:00', label: '08:00 pm' },
    { value: '21:00', label: '09:00 pm' },
    { value: '22:00', label: '10:00 pm' },
    { value: '23:00', label: '11:00 pm' },
  ];

  const [filteredTimeOptions, setFilteredTimeOptions] = useState(timeOptions);

  useEffect(() => {
    if (!selectedDate) {
      setFilteredTimeOptions(timeOptions);
      return;
    }
    const today = new Date();
    const isToday =
      selectedDate.getDate() === today.getDate() &&
      selectedDate.getMonth() === today.getMonth() &&
      selectedDate.getFullYear() === today.getFullYear();
    if (isToday) {
      const currentHour = today.getHours() + 1;
      setFilteredTimeOptions(
        timeOptions.map((option) => ({
          ...option,
          disabled: parseInt(option.value.split(':')[0], 10) < currentHour,
        }))
      );
      setSelectedTime(
        parseInt(selectedTime.split(':')[0], 10) < currentHour
          ? currentHour.toString().padStart(2, '0') + ':00'
          : selectedTime
      );
    } else {
      setFilteredTimeOptions(timeOptions);
    }
  }, [selectedDate]);

  const hasChanges =
    (selectedDate &&
      originalDate &&
      selectedDate.getTime() !== originalDate.getTime()) ||
    (selectedTime && selectedTime !== originalTime) ||
    (selected && selected !== workOrder.contractor?.code);

  const handleReschedule = () => {
    if (!selectedDate || !selectedTime) return;
    const formattedDate = format(selectedDate, 'yyyy-MM-dd');
    const data: IRescheduleRequest = {
      visit_id: workOrder.id,
      start: `${formattedDate}T${selectedTime}:00`,
    };

    if (selected) {
      data.contractor_id = selected;
      data.contractor_name =
        contractorOptions.find((contractor) => contractor.value === selected)
          ?.label || undefined;
    }

    rescheduleWorkOrderMutation.mutate(data, {
      onSuccess: () => {
        onReload();
      },
      onError: () => {
        setError(t('reschedule.error'));
      },
    });
  };

  return (
    <div style={{ position: 'relative' }}>
      <BiaModalDesktop
        isOpen={isOpen}
        onClose={onClose}
        title={t('reschedule.title')}
        width={414}
        height={600}
        onConfirm={() => setShowModalConfirm(true)}
        confirmText={t('reschedule.confirm')}
        cancelText={t('reschedule.cancel')}
        confirmDisabled={!selectedDate || !selectedTime || !hasChanges}
      >
        <div className={styles.cardOT}>
          <span className={styles.title}>{workOrder.job_code}</span>
          <div className={styles.otInfoRow}>
            <BiaText
              token='caption'
              color='standard'
              className={styles.rowTitle}
            >
              {t('table.service_type')}
            </BiaText>
            <BiaText
              token='caption'
              color='weak'
            >
              {workOrder.service_type?.name}
            </BiaText>
          </div>
          <div className={styles.otInfoRow}>
            <BiaText
              token='caption'
              color='standard'
              className={styles.rowTitle}
            >
              {t('table.city_name')}
            </BiaText>
            <BiaText
              token='caption'
              color='weak'
            >
              {workOrder.city_name}
            </BiaText>
          </div>
        </div>

        <BiaText
          token='caption'
          color='weak'
        >
          {t('reschedule.date_time')}
        </BiaText>

        <div className={styles.dateTimeContainer}>
          <div className={styles.datePickerContainer}>
            <BiaDateSelector
              selected={selectedDate}
              onChange={setSelectedDate}
              minDate={new Date()}
              placeholder={t('reschedule.select_date')}
            />
          </div>

          <BiaDropdown
            icon='faClock'
            options={filteredTimeOptions}
            value={selectedTime}
            onChange={(value) => {
              setSelectedTime(value as string);
            }}
            placeholder={t('reschedule.select_time')}
            searchable
            minWidthMenu='185px'
          />
        </div>

        <BiaText
          token='caption'
          color='weak'
        >
          {t('reschedule.contractor')}
        </BiaText>
        <BiaSearchList
          options={contractorOptions}
          value={selected}
          onChange={setSelected}
          searchPlaceholder='Buscar'
        />
      </BiaModalDesktop>
      {isLoading && <BiaLoader />}

      {showModalConfirm && (
        <PopUp
          open={showModalConfirm}
          icon='faClockRotateLeft'
          title={t('reschedule.confirm')}
          text={t('reschedule.confirm_text')
            .replace('${JOB_CODE}', workOrder.job_code)
            .replace('${DATE}', format(selectedDate!, 'dd-MM-yyyy'))
            .replace(
              '${TIME}',
              filteredTimeOptions.find((time) => time.value === selectedTime)
                ?.label || ''
            )}
          onConfirm={handleReschedule}
          onCancel={() => setShowModalConfirm(false)}
          confirmText={t('reschedule.confirm_button')}
          cancelText={t('reschedule.cancel_text')}
        />
      )}
      {error && (
        <BiaToast
          message={error}
          theme='error'
          onClose={() => setError(null)}
        />
      )}
    </div>
  );
};
