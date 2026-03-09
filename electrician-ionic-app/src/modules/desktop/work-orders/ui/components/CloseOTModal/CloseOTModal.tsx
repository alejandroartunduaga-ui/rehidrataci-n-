import React, { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  BiaDropdown,
  BiaLoader,
  BiaModalDesktop,
  BiaOpenDropdownList,
  BiaRadioGroupDesktop,
  BiaText,
  BiaTextArea,
  BiaToast,
} from '@entropy/index';
import {
  ELECTRICIAN_STATUS,
  ICancelCloseOTRequest,
  IReasonCancelCloseResponse,
  IWorkOrder,
} from '@desktop/work-orders/data/interfaces/workOrders.interface';
import { useWorkOrders } from '@desktop/work-orders/data';
import { TranslationNamespaces } from '@shared/i18n';
import styles from './CloseOTModal.module.css';

interface CloseOTModalProps {
  workOrder: IWorkOrder;
  isOpen: boolean;
  onClose: () => void;
  onReload: () => void;
}

const optionsFinalStatusDefault = [
  {
    label: 'Exitosa',
    value: 'Exitosa',
  },
  {
    label: 'Fallida',
    value: ELECTRICIAN_STATUS.CLOSURE_FAILED,
  },
];

export const CloseOTModal: React.FC<CloseOTModalProps> = ({
  workOrder,
  isOpen,
  onClose,
  onReload,
}) => {
  const { t } = useTranslation(TranslationNamespaces.WORK_ORDERS);
  const { getReasonsCancelCloseMutation, cancelCloseOTMutation } =
    useWorkOrders();
  const [optionsFinalStatus, setOptionsFinalStatus] = useState<
    { label: string; value: string }[]
  >(optionsFinalStatusDefault);
  const [selectedFinalStatus, setSelectedFinalStatus] = useState<string>('');
  const [reasons, setReasons] = useState<IReasonCancelCloseResponse[]>([]);
  const [selectedReason, setSelectedReason] = useState<string[]>([]);
  const [observations, setObservations] = useState<string>('');
  const [error, setError] = useState<string | null>(null);
  const [isClosingOT, setIsClosingOT] = useState(false);

  useEffect(() => {
    setOptionsFinalStatus([]);
    setTimeout(() => {
      let opts = [];
      if (workOrder && workOrder.service_type.id === 'INST') {
        opts = [
          ...optionsFinalStatusDefault,
          {
            label: 'Pendiente',
            value: ELECTRICIAN_STATUS.CLOSURE_SUCCESSFUL,
          },
        ];
      } else {
        opts = optionsFinalStatusDefault;
      }
      setOptionsFinalStatus(opts);
      setSelectedFinalStatus('');
    }, 100);
  }, [workOrder]);

  useEffect(() => {
    getReasonsCancelCloseMutation.mutate();
  }, []);

  useEffect(() => {
    setObservations('');
    setSelectedReason([]);
    let reasons = [];
    switch (selectedFinalStatus) {
      case ELECTRICIAN_STATUS.CLOSURE_FAILED:
        reasons =
          getReasonsCancelCloseMutation.data?.filter((reason) =>
            reason.electrician_status.includes(
              ELECTRICIAN_STATUS.CLOSURE_FAILED
            )
          ) || [];
        setReasons(reasons);
        break;
      case ELECTRICIAN_STATUS.CLOSURE_SUCCESSFUL:
        reasons =
          getReasonsCancelCloseMutation.data?.filter((reason) =>
            reason.electrician_status.includes(
              ELECTRICIAN_STATUS.CLOSURE_SUCCESSFUL
            )
          ) || [];
        setReasons(reasons);
        break;
      default:
        break;
    }
  }, [selectedFinalStatus]);

  const handleCloseOT = () => {
    setIsClosingOT(true);
    const params: ICancelCloseOTRequest = {
      visit_id: workOrder.id,
      params: {
        status:
          selectedFinalStatus === 'Exitosa'
            ? ELECTRICIAN_STATUS.CLOSURE_SUCCESSFUL
            : (selectedFinalStatus as ELECTRICIAN_STATUS),
      },
    };

    if (selectedReason.length > 0) {
      params.params.reason_ids = selectedReason.filter(
        (item) => item !== '__all__'
      );
    }

    if (observations !== '') {
      params.params.observation = observations;
    }

    cancelCloseOTMutation.mutate(params, {
      onSuccess: () => {
        setIsClosingOT(false);
        onReload();
      },
      onError: () => {
        setIsClosingOT(false);
        setError(t('cancel_ot.error'));
      },
    });
  };

  const isLoading = getReasonsCancelCloseMutation.isPending;

  return (
    <div style={{ position: 'relative' }}>
      <BiaModalDesktop
        isOpen={isOpen}
        onClose={onClose}
        title={t('close_ot.title')}
        width={414}
        height={600}
        confirmText={
          isClosingOT ? t('close_ot.closing_ot') : t('close_ot.confirm')
        }
        onConfirm={handleCloseOT}
        confirmDisabled={
          selectedFinalStatus === '' ||
          observations === '' ||
          (selectedFinalStatus === ELECTRICIAN_STATUS.CLOSURE_FAILED &&
            selectedReason.length === 0 &&
            observations === '') ||
          (selectedFinalStatus === ELECTRICIAN_STATUS.CLOSURE_SUCCESSFUL &&
            selectedReason.length === 0 &&
            observations === '') ||
          isClosingOT
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
          <BiaText
            token='caption'
            color='weak'
            className={styles.rowTitle}
          >
            {t('close_ot.final_status')}
          </BiaText>

          {optionsFinalStatus.length > 0 && (
            <BiaRadioGroupDesktop
              options={optionsFinalStatus}
              className={styles.radioGroup}
              value={selectedFinalStatus}
              onCheckedChange={(option) => {
                setSelectedFinalStatus(option);
                setObservations('');
                setSelectedReason([]);
              }}
            />
          )}
          {selectedFinalStatus === ELECTRICIAN_STATUS.CLOSURE_FAILED && (
            <div>
              <BiaText
                token='caption'
                color='weak'
                className={styles.rowTitle}
              >
                {t('close_ot.classification')}
              </BiaText>
              <BiaDropdown
                options={reasons.map((reason) => ({
                  label: reason.title,
                  value: reason.id,
                }))}
                value={selectedReason}
                onChange={(value) => {
                  setSelectedReason([value as string]);
                }}
                searchable
                placeholder=''
                className={styles.classificationDropdown}
                minWidthMenu='inherit'
              />
            </div>
          )}

          {selectedFinalStatus === ELECTRICIAN_STATUS.CLOSURE_SUCCESSFUL && (
            <div>
              <BiaText
                token='caption'
                color='weak'
                className={styles.rowTitle}
              >
                {t('close_ot.pending_description')}
              </BiaText>
              <BiaOpenDropdownList
                showSelectAll={false}
                options={reasons.map((reason) => ({
                  label: reason.title,
                  value: reason.id,
                }))}
                value={selectedReason}
                onChange={(vals) => {
                  setSelectedReason(vals);
                }}
              />
            </div>
          )}

          {selectedFinalStatus !== '' && (
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
                value={observations}
                className={styles.textArea}
                onIonChange={(e) => setObservations(e.detail.value || '')}
              />
            </div>
          )}
        </div>
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
