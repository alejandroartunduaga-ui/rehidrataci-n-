import { useTranslation } from 'react-i18next';
import {
  BiaDateRangePicker,
  BiaDropdown,
  BiaInput,
  BiaLoader,
  BiaModalDesktop,
  BiaText,
  BiaToast,
} from '@entropy/index';
import { TranslationNamespaces } from '@shared/i18n';
import { useEffect, useMemo, useState } from 'react';
import { DateRange } from 'react-day-picker';
import { es } from 'date-fns/locale';
import { format } from 'date-fns';
import styles from './DownloasCSVModal.module.css';
import { useWorkOrders } from '../../../data/hooks/useWorkOrders';
import { useDownloadCSV } from '../../../data/hooks/useDownloadCSV';

interface DownloasCSVModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
}

export const DownloasCSVModal = ({
  isOpen,
  onClose,
}: DownloasCSVModalProps) => {
  const { t } = useTranslation(TranslationNamespaces.WORK_ORDERS);
  const [showDatePicker, setShowDatePicker] = useState<boolean>(false);
  const [dateRange, setDateRange] = useState<DateRange | undefined>(undefined);
  const [selectedTypes, setSelectedTypes] = useState<string[]>(['__all__']);
  const [selectedStatus, setSelectedStatus] = useState<string[]>(['__all__']);
  const [showToastMessage, setShowToastMessage] = useState<{
    message: string;
    theme: 'error' | 'success';
  }>({
    message: '',
    theme: 'error',
  });

  const { downloadCSV } = useDownloadCSV();
  const { getFiltersMutation } = useWorkOrders();
  const { data: filters } = getFiltersMutation;

  const [prevMonth, today] = useMemo(() => {
    const today = new Date();
    const prevMonth = new Date(today.getFullYear(), today.getMonth() - 1, 1);
    return [prevMonth, today];
  }, []);

  const [windowHeight, setWindowHeight] = useState<number>(window.innerHeight);

  useEffect(() => {
    const handleResize = () => {
      setWindowHeight(window.innerHeight);
    };

    window.addEventListener('resize', handleResize);
    return () => {
      window.removeEventListener('resize', handleResize);
    };
  }, []);

  // Formatea el rango seleccionado para mostrarlo en el input
  const getDateRangeLabel = () => {
    if (!dateRange?.from) return '';
    if (!dateRange.to) return format(dateRange.from, 'MMM. d', { locale: es });
    const from = format(dateRange.from, 'MMM. d', { locale: es });
    const to = format(dateRange.to, 'MMM. d', { locale: es });
    return `${from[0].toUpperCase()}${from.slice(1)} - ${to[0].toUpperCase()}${to.slice(1)}`;
  };

  const handleDownloadCSV = () => {
    // remove _all from selectedTypes
    const selectedTypesWithoutAll = selectedTypes.filter(
      (type) => type !== '__all__'
    );
    const selectedStatusWithoutAll = selectedStatus.filter(
      (status) => status !== '__all__'
    );
    //format date to dd-mm-yyyy
    const startFromDate = dateRange?.from
      ? format(dateRange.from, 'dd-MM-yyyy')
      : '';
    const startToDate = dateRange?.to ? format(dateRange.to, 'dd-MM-yyyy') : '';
    downloadCSV.mutate({
      start_from_date: startFromDate,
      start_to_date: startToDate,
      service_type_ids: selectedTypesWithoutAll,
      group_status: selectedStatusWithoutAll,
    });
  };

  useEffect(() => {
    if (downloadCSV.isSuccess) {
      setDateRange(undefined);
      setSelectedTypes(['']);
      setSelectedStatus(['']);
      setShowToastMessage({
        message: t('modal_download_csv.success_message'),
        theme: 'success',
      });
      window.open(downloadCSV.data.url, '_blank');
      onClose();
    } else if (downloadCSV.isError) {
      setShowToastMessage({
        message: t('modal_download_csv.error_message'),
        theme: 'error',
      });
    }
  }, [downloadCSV.isSuccess, downloadCSV.isError]);

  return (
    <>
      {downloadCSV.isPending && (
        <BiaLoader text={t('modal_download_csv.loading_message')} />
      )}
      {showToastMessage.message && showToastMessage.theme && (
        <BiaToast
          theme={showToastMessage.theme}
          message={showToastMessage.message}
          duration={5000}
          onClose={() => setShowToastMessage({ message: '', theme: 'error' })}
        />
      )}
      <BiaModalDesktop
        isOpen={isOpen}
        onClose={onClose}
        title={t('modal_download_csv.title')}
        confirmText={t('modal_download_csv.confirm')}
        cancelText={t('modal_download_csv.cancel')}
        confirmDisabled={!dateRange?.from || !dateRange?.to}
        onCancel={onClose}
        onConfirm={handleDownloadCSV}
        height={500}
      >
        <div className={styles.container}>
          <BiaText
            className={styles.subtitle}
            token='caption'
            color='weak'
          >
            {t('modal_download_csv.subtitle')}
          </BiaText>
          <BiaText
            className={styles.label}
            token='caption'
            color='weak'
          >
            {t('modal_download_csv.filters.status')}
          </BiaText>
          <BiaDropdown
            options={(filters?.group_status || []).map((t) => ({
              label: t.name,
              value: t.value,
            }))}
            multiple
            value={selectedStatus}
            onChange={(vals) => {
              if (Array.isArray(vals)) {
                setSelectedStatus(vals);
              }
            }}
            searchable
            placeholder={t('filters.search_status', {
              defaultValue: 'Todos los estados',
            })}
            selectAllLabel={t('filters.all_status', {
              defaultValue: 'Todos los estados',
            })}
            className={styles.inputDropdown}
          />
          <BiaText
            className={styles.label}
            token='caption'
            color='weak'
          >
            {t('modal_download_csv.filters.type')}
          </BiaText>
          <BiaDropdown
            options={(filters?.service_types || []).map((t) => ({
              label: t.name,
              value: t.value,
            }))}
            multiple
            value={selectedTypes}
            onChange={(vals) => {
              if (Array.isArray(vals)) {
                setSelectedTypes(vals);
              }
            }}
            searchable
            placeholder={t('filters.search_type', {
              defaultValue: 'Todos los tipos',
            })}
            selectAllLabel={t('filters.all_types', {
              defaultValue: 'Todos los tipos',
            })}
            className={styles.inputDropdown}
          />
          <BiaInput
            label={t('modal_download_csv.filters.date')}
            required
            type='text'
            placeholder={t('filters.select_date')}
            value={getDateRangeLabel()}
            onClick={() => setShowDatePicker(true)}
            className={`${styles.codeInput} ${showDatePicker ? styles.inputActive : ''}`}
            icon='faCalendar'
            clearable={!!dateRange?.from}
            onClear={() => setDateRange(undefined)}
          />
          {showDatePicker && (
            <div
              style={{
                position: 'fixed',
                zIndex: 100,
                ...(windowHeight < 720 && { bottom: '20px' }),
              }}
            >
              <BiaDateRangePicker
                value={dateRange}
                onChange={(range) => setDateRange(range)}
                maxRangeDays={60}
                initialMonths={[prevMonth, today]}
                onClose={() => setShowDatePicker(false)}
              />
            </div>
          )}
        </div>
      </BiaModalDesktop>
    </>
  );
};
