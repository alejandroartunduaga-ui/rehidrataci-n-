import React, { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  BiaDropdown,
  BiaLoader,
  BiaModalDesktop,
  BiaText,
  BiaTextArea,
  BiaToast,
} from '@entropy/index';
import { useWorkOrders } from '@desktop/work-orders/data';
import {
  ELECTRICIAN_STATUS,
  ICancelCloseOTRequest,
  IReasonCancelCloseResponse,
  IWorkOrder,
} from '@desktop/work-orders/data/interfaces/workOrders.interface';
import { TranslationNamespaces } from '@shared/i18n';
import { PopUp } from '../PopUp/PopUp';
import styles from './CancelOTModal.module.css';

interface CancelOTModalProps {
  workOrder: IWorkOrder;
  isOpen: boolean;
  onClose: () => void;
  onReload: () => void;
}

export const CancelOTModal: React.FC<CancelOTModalProps> = ({
  workOrder,
  isOpen,
  onClose,
  onReload,
}) => {
  const { t } = useTranslation(TranslationNamespaces.WORK_ORDERS);
  const { getReasonsCancelCloseMutation, cancelCloseOTMutation } =
    useWorkOrders();
  const [reasons, setReasons] = useState<IReasonCancelCloseResponse[]>([]);
  const [selectedReason, setSelectedReason] = useState<string[]>([]);
  const [observations, setObservations] = useState<string>('');
  const [showModalConfirm, setShowModalConfirm] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    getReasonsCancelCloseMutation.mutate();
  }, []);

  useEffect(() => {
    if (getReasonsCancelCloseMutation.data) {
      setReasons(
        getReasonsCancelCloseMutation.data.filter((reason) =>
          reason.electrician_status.includes(
            ELECTRICIAN_STATUS.CLOSURE_CANCELED
          )
        )
      );
    }
  }, [getReasonsCancelCloseMutation.data]);

  const handleCancelOT = () => {
    const params: ICancelCloseOTRequest = {
      visit_id: workOrder.id,
      params: {
        status: ELECTRICIAN_STATUS.CLOSURE_CANCELED,
        reason_ids: selectedReason,
        observation: observations,
      },
    };

    cancelCloseOTMutation.mutate(params, {
      onSuccess: () => {
        onReload();
      },
      onError: () => {
        setError(t('cancel_ot.error'));
      },
    });
  };

  const isLoading =
    getReasonsCancelCloseMutation.isPending || cancelCloseOTMutation.isPending;

  return (
    <div style={{ position: 'relative' }}>
      <BiaModalDesktop
        isOpen={isOpen}
        onClose={onClose}
        title={t('cancel_ot.title')}
        width={414}
        height={600}
        confirmText={t('cancel_ot.confirm')}
        onConfirm={() => setShowModalConfirm(true)}
        confirmDisabled={
          selectedReason.length === 0 || observations.length === 0
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
              {workOrder.start_date} {workOrder.hours}
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
        <div>
          <div>
            <BiaText
              token='caption'
              color='weak'
              className={styles.rowTitle}
            >
              {t('cancel_ot.reason')}
            </BiaText>
            <BiaDropdown
              options={reasons.map((reason) => ({
                label: reason.title,
                value: reason.id,
              }))}
              value={selectedReason}
              onChange={(value) => setSelectedReason([value as string])}
              searchable
              placeholder=''
              className={styles.classificationDropdown}
              minWidthMenu='inherit'
            />
          </div>
          <div>
            <BiaText
              token='caption'
              color='weak'
              className={styles.rowTitle}
            >
              {t('close_ot.observations')}
            </BiaText>
            <BiaTextArea
              placeholder=''
              className={styles.textArea}
              onIonChange={(e) => setObservations(e.detail.value || '')}
            />
          </div>
        </div>
      </BiaModalDesktop>
      {showModalConfirm && (
        <PopUp
          open={showModalConfirm}
          icon='faBan'
          title={t('cancel_ot.confirm')}
          text={t('cancel_ot.confirm_text').replace(
            '${JOB_CODE}',
            workOrder.job_code
          )}
          onConfirm={handleCancelOT}
          onCancel={() => setShowModalConfirm(false)}
          confirmText={t('cancel_ot.confirm_button')}
          cancelText={t('cancel_ot.cancel_text')}
        />
      )}
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
