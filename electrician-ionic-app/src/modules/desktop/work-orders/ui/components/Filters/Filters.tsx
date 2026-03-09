import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import {
  BiaInput,
  BiaDateRangePicker,
  BiaDropdown,
  DropdownOption,
  BiaIcon,
} from '@entropy/index';
import {
  useWorkOrders,
  useWorkOrdersFiltersStore,
} from '@desktop/work-orders/data';
import { TranslationNamespaces } from '@shared/i18n';
import { AdvancedFiltersModal } from '../AdvancedFiltersModal/AdvancedFiltersModal';
import { ConfirmClearModal } from '../ConfirmClearModal/ConfirmClearModal';
import styles from './Filters.module.css';

export const Filters = () => {
  // Usar el store global para los filtros
  const {
    code,
    dateRange,
    types,
    status,
    contractor,
    electrician,
    city,
    networkOperator,
    acta,
    setCode,
    setDateRange,
    setTypes,
    setStatus,
    clearFilters,
  } = useWorkOrdersFiltersStore();
  const { t } = useTranslation(TranslationNamespaces.WORK_ORDERS);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [typeOptions, setTypeOptions] = useState<DropdownOption[]>([]);
  const [statusOptions, setStatusOptions] = useState<DropdownOption[]>([]);
  const { getFiltersMutation } = useWorkOrders();
  const { data: filters } = getFiltersMutation;
  const [showConfirm, setShowConfirm] = useState(false);
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);

  // Formatea el rango seleccionado para mostrarlo en el input
  const getDateRangeLabel = () => {
    if (!dateRange?.from) return '';
    if (!dateRange.to) return format(dateRange.from, 'MMM. d', { locale: es });
    const from = format(dateRange.from, 'MMM. d', { locale: es });
    const to = format(dateRange.to, 'MMM. d', { locale: es });
    return `${from[0].toUpperCase()}${from.slice(1)} - ${to[0].toUpperCase()}${to.slice(1)}`;
  };

  // Mes actual y anterior
  const today = new Date();
  const prevMonth = new Date(today.getFullYear(), today.getMonth() - 1, 1);

  useEffect(() => {
    if (filters) {
      setTypeOptions(
        filters.service_types.map((type) => ({
          label: type.name,
          value: type.value,
        }))
      );
      setStatusOptions(
        filters.group_status.map((status) => ({
          label: status.name,
          value: status.value,
        }))
      );
    }
  }, [filters]);

  // Calcula la cantidad de filtros activos (sin contar '__all__')
  const getActiveFilters = (arr: string[]) => {
    return arr.length > 0 && !arr.every((item) => item === '__all__')
      ? arr.filter((item) => item !== '__all__')
      : [];
  };

  const activeFilters = [
    code && code.trim(),
    dateRange?.from,
    ...getActiveFilters(types),
    ...getActiveFilters(status),
    ...getActiveFilters(contractor || []),
    ...getActiveFilters(electrician),
    ...getActiveFilters(city),
    ...getActiveFilters(networkOperator),
    ...getActiveFilters(acta),
  ].filter(Boolean).length;

  return (
    <div>
      <div className={styles.filtersContainer}>
        <BiaInput
          type='text'
          placeholder={t('code_placeholder')}
          value={code}
          onIonInput={(e) => setCode(e.detail.value!.trim())}
          onClear={() => setCode('')}
          clearable
          className={styles.codeInput}
          icon='faSearch'
        />
        <div style={{ position: 'relative', display: 'inline-block' }}>
          <BiaInput
            type='text'
            placeholder={t('date_placeholder')}
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
                position: 'absolute',
                zIndex: 100,
                top: '48px',
                left: 0,
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
        <BiaDropdown
          options={typeOptions}
          value={types}
          onChange={(vals) => {
            if (Array.isArray(vals)) {
              setTypes(vals);
            }
          }}
          multiple
          placeholder={t('table.all_types', {
            defaultValue: 'Todos los tipos',
          })}
          selectAllLabel={t('table.all_types', {
            defaultValue: 'Todos los tipos',
          })}
          searchable
          className={styles.codeInput}
        />
        <BiaDropdown
          options={statusOptions}
          value={status}
          onChange={(vals) => {
            if (Array.isArray(vals)) {
              setStatus(vals);
            }
          }}
          multiple
          placeholder={t('table.all_status', {
            defaultValue: 'Todos los estados',
          })}
          selectAllLabel={t('table.all_status', {
            defaultValue: 'Todos los estados',
          })}
          searchable
          className={styles.codeInput}
        />
        <button
          type='button'
          className={styles.filtersCount}
          onClick={() => setShowAdvancedFilters(true)}
        >
          <BiaIcon
            iconName='faBarsFilter'
            iconType='solid'
            size='12px'
          />
          <span>{activeFilters}</span>
        </button>
        <button
          type='button'
          className={styles.filtersClear}
          onClick={() => setShowConfirm(true)}
          disabled={activeFilters === 0}
        >
          <BiaIcon
            iconName='faBroomWide'
            iconType='solid'
            size='12px'
            color={activeFilters === 0 ? 'disabled' : 'standard'}
          />
        </button>
      </div>
      <ConfirmClearModal
        open={showConfirm}
        onCancel={() => setShowConfirm(false)}
        onConfirm={() => {
          clearFilters();
          setShowConfirm(false);
        }}
      />
      <AdvancedFiltersModal
        open={showAdvancedFilters}
        onClose={() => setShowAdvancedFilters(false)}
      />
    </div>
  );
};
