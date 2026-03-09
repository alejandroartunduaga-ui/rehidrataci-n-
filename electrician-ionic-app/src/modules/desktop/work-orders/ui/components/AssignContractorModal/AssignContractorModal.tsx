import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  BiaLoader,
  BiaModalDesktop,
  BiaSearchList,
  BiaText,
  BiaToast,
} from '@entropy/index';
import { IWorkOrder } from '@desktop/work-orders/data/interfaces/workOrders.interface';
import { useVisitAsignment } from '@desktop/work-orders/data/hooks/useVisitAssignment';
import { TranslationNamespaces } from '@shared/i18n';
import styles from './AssignContractorModal.module.css';

interface AssignElectriciansModalProps {
  workOrder: IWorkOrder;
  onClose: () => void;
  onReload: () => void;
  onError?: () => void;
}

export const AssignContractorModal: React.FC<AssignElectriciansModalProps> = ({
  workOrder,
  onClose,
  onReload,
  onError,
}) => {
  const { t } = useTranslation(TranslationNamespaces.WORK_ORDERS);
  const { getListContractors, assignContractor } = useVisitAsignment();
  const [selected, setSelected] = useState<string>('');
  const [contractorOptions, setContractorOptions] = useState<
    { label: string; value: string }[]
  >([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (workOrder.contractor) {
      setSelected(workOrder.contractor.code);
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

  const handleConfirm = () => {
    setError(null);
    if (!selected) return;
    const contractor = contractorOptions.find((c) => c.value === selected);
    assignContractor.mutate(
      {
        contractor_id: selected,
        contractor_name: contractor?.label || '',
        visit_id: workOrder.id,
      },
      {
        onSuccess: () => {
          onReload();
        },
        onError: () => {
          setError(t('assign_contractor.assign_contractor_error'));
          if (onError) onError();
        },
      }
    );
  };

  const isLoading = getListContractors.isPending || assignContractor.isPending;

  return (
    <div style={{ position: 'relative' }}>
      <BiaModalDesktop
        isOpen={true}
        onClose={onClose}
        title={t('assign_contractor.title')}
        width={414}
        height={500}
        confirmText={t('assign_contractor.confirm')}
        cancelText={t('assign_contractor.cancel')}
        onConfirm={handleConfirm}
        onCancel={onClose}
        confirmDisabled={
          !selected || isLoading || workOrder.contractor?.code === selected
        }
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
              {t('table.start_date')}
            </BiaText>
            <BiaText
              token='caption'
              color='weak'
            >
              {workOrder.start_date} | {workOrder.hours}
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
        <BiaSearchList
          options={contractorOptions}
          value={selected}
          onChange={setSelected}
          searchPlaceholder='Buscar'
        />
      </BiaModalDesktop>
      {isLoading && <BiaLoader />}
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
