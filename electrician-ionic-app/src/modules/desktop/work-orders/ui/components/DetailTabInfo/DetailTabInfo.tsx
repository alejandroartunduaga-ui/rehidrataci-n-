import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import dayjs from 'dayjs';
import customParseFormat from 'dayjs/plugin/customParseFormat';
import { BiaTag, BiaIcon, BiaLoader, BiaToast } from '@entropy/index';
import { RolesEnum } from '@auth/index';
import {
  ID_GROUP_STATUS_ENTITY,
  IGroupStatusEntity,
  APPROVAL_STATUS,
} from '@desktop/work-orders/data/interfaces/workOrders.interface';
import { IVisit } from '@desktop/work-orders/data/interfaces/workOrderDetail.interface';
import { useWorkOrders } from '@desktop/work-orders/data/hooks/useWorkOrders';
import { TranslationNamespaces } from '@shared/i18n';
import { useAuthStore } from '@shared/index';
import { AssignContractorModal } from '../AssignContractorModal/AssignContractorModal';
import { AssignElectriciansModal } from '../AssignElectriciansModal/AssignElectriciansModal';
import { PopUp } from '../PopUp/PopUp';
import styles from '../../pages/WorkOrderDetail/WorkOrderDetail.module.css';
dayjs.extend(customParseFormat);

interface WorkOrderInfoTabProps {
  visit?: IVisit;
  handleReload: () => void;
}

export const DetailTabInfo = ({
  visit,
  handleReload,
}: WorkOrderInfoTabProps) => {
  const { t } = useTranslation(TranslationNamespaces.WORK_ORDERS);
  const { user } = useAuthStore();
  const isContractor = user?.user?.role === RolesEnum.CONTRACTOR;
  const [showModalContractor, setShowModalContractor] = useState(false);
  const [showModalContractorError, setShowModalContractorError] =
    useState(false);
  const [showModalElectrician, setShowModalElectrician] = useState(false);
  const [toast, setToast] = useState<{
    type: 'success' | 'error';
    message: string;
  } | null>(null);
  const { confirmRejectOTMutation } = useWorkOrders();
  const [showConfirmRejectOTModal, setShowConfirmRejectOTModal] =
    useState(false);
  const [confirmRejectOTStatus, setConfirmRejectOTStatus] =
    useState<APPROVAL_STATUS | null>(null);

  if (!visit) return <BiaLoader />;

  const isWorkOrderEditable = (workOrder: IVisit): boolean => {
    const finalizedStates = [
      ID_GROUP_STATUS_ENTITY.PEN_CLOS,
      ID_GROUP_STATUS_ENTITY.PEND_PDF,
      ID_GROUP_STATUS_ENTITY.SUCC,
      ID_GROUP_STATUS_ENTITY.FAIL,
      ID_GROUP_STATUS_ENTITY.CAN,
      ID_GROUP_STATUS_ENTITY.PEN_CONF,
      ID_GROUP_STATUS_ENTITY.EXPIRED,
    ];
    return !finalizedStates.includes(workOrder.group_status_entity.id);
  };

  const isEditable = isWorkOrderEditable(visit);

  let canAssign = false;
  let showReassignCopy = false;
  if (isEditable) {
    if (visit.contractor) {
      const isBia = visit.contractor.is_bia;
      if (visit.group_status_entity.id === ID_GROUP_STATUS_ENTITY.REJ_CONT) {
        canAssign = true;
      }
      const executionDate = dayjs(
        `${visit.start_date} ${visit.hours}`,
        'DD-MM-YYYY hh:mm A'
      );
      if (!isBia && executionDate.isValid()) {
        const now = dayjs();
        const diffHours = executionDate.diff(now, 'hour');
        if (diffHours < 24) {
          showReassignCopy = true;
        } else {
          canAssign = true;
        }
      } else {
        canAssign = true;
      }
    } else {
      canAssign = true;
    }
  }

  const getEstadoColor = (groupStatus: IGroupStatusEntity) => {
    switch (groupStatus.id) {
      case ID_GROUP_STATUS_ENTITY.AS_CON:
        return 'warning'; // Por asignar contratista
      case ID_GROUP_STATUS_ENTITY.AS_ELEC:
        return 'info-yellow'; // Por asignar electricista
      case ID_GROUP_STATUS_ENTITY.PEN_CONF:
        return isContractor ? 'warning' : 'purple'; // Pendiente de confirmación
      case ID_GROUP_STATUS_ENTITY.REJ_CONT:
        return 'magenta'; // Rechazada contratista
      case ID_GROUP_STATUS_ENTITY.RED_EXE:
        return 'teal'; // Lista para ejecutar
      case ID_GROUP_STATUS_ENTITY.PEN_CLOS:
        return 'blue'; // Pendiente de cierre
      case ID_GROUP_STATUS_ENTITY.SUCC:
        return 'success'; // Exitosa
      case ID_GROUP_STATUS_ENTITY.FAIL:
        return 'error'; // Fallida
      case ID_GROUP_STATUS_ENTITY.CAN:
        return 'disabled'; // Cancelada
      case ID_GROUP_STATUS_ENTITY.PEND_PDF:
        return 'blue'; // Pendiente de acta
      case ID_GROUP_STATUS_ENTITY.EXPIRED:
        return 'disabled'; // Expirada
      default:
        return 'disabled';
    }
  };

  const canAssignElectrician =
    isEditable &&
    !visit.is_process &&
    visit.contractor &&
    (visit.contractor.bia || isContractor);

  const handleConfirmRejectOT = () => {
    if (visit && confirmRejectOTStatus) {
      confirmRejectOTMutation.mutate(
        {
          visit_id: visit.id,
          params: {
            status: confirmRejectOTStatus,
          },
        },
        {
          onSuccess: () => {
            setShowConfirmRejectOTModal(false);
            setToast({
              type: 'success',
              message:
                confirmRejectOTStatus === APPROVAL_STATUS.APPROVED
                  ? t('confirm_visit.success_confirm').replace(
                      '${JOB_CODE}',
                      visit.job_code
                    )
                  : t('confirm_visit.success_reject').replace(
                      '${JOB_CODE}',
                      visit.job_code
                    ),
            });
            handleReload();
          },
          onError: () => {
            setToast({
              type: 'error',
              message:
                confirmRejectOTStatus === APPROVAL_STATUS.APPROVED
                  ? t('confirm_visit.error_confirm')
                  : t('confirm_visit.error_reject'),
            });
          },
        }
      );
    }
  };

  return (
    <div className={styles.contentContainer}>
      <div className={styles.infoContainer}>
        <div className={styles.infoRow}>
          <span
            className={styles.infoLabel}
            style={{ minWidth: '156px' }}
          >
            {t('table.job_of_code')}
          </span>
          <span className={styles.infoValue}>{visit.job_code || '-'}</span>
        </div>
        <div className={styles.infoRow}>
          <span
            className={styles.infoLabel}
            style={{ minWidth: '156px' }}
          >
            {t('table.service_of_type')}
          </span>
          <span className={styles.infoValue}>
            {visit.service_type?.name || '-'}
          </span>
        </div>
        <div className={styles.infoRow}>
          <span
            className={styles.infoLabel}
            style={{ minWidth: '156px' }}
          >
            {t('table.status')}
          </span>
          <span className={styles.infoValue}>
            <BiaTag
              color={getEstadoColor(visit.group_status_entity)}
              corner='rounded'
              text={visit.group_status_entity?.name}
              size='small'
            />
          </span>
        </div>
        {!isContractor && (
          <div className={styles.infoRow}>
            <span
              className={styles.infoLabel}
              style={{ minWidth: '156px' }}
            >
              {t('table.contractor')}
            </span>
            <span className={styles.infoValue}>
              {visit.contractor?.name || '-'}
            </span>
          </div>
        )}
        <div className={styles.infoRow}>
          <span
            className={styles.infoLabel}
            style={{ minWidth: '156px' }}
          >
            {t('table.electrician')}
          </span>
          <span className={`${styles.infoValue} ${styles.electricianValue}`}>
            {visit.electricians.length > 0
              ? `${visit.electricians.map((e) => e.name).join('\n')}`
              : '-'}
          </span>
        </div>
        <div className={styles.infoRow}>
          <span
            className={styles.infoLabel}
            style={{ minWidth: '156px' }}
          >
            {t('table.internal_bia_code')}
          </span>
          <span className={styles.infoValue}>
            {visit.internal_bia_code || '-'}
          </span>
        </div>
        <div className={styles.infoRow}>
          <span
            className={styles.infoLabel}
            style={{ minWidth: '156px' }}
          >
            {t('table.contract_name')}
          </span>
          <span className={styles.infoValue}>{visit.contract_name || '-'}</span>
        </div>
        <div className={styles.infoRow}>
          <span
            className={styles.infoLabel}
            style={{ minWidth: '156px' }}
          >
            {t('table.start_date')}
          </span>
          <span className={styles.infoValue}>{visit.start_date || '-'}</span>
        </div>
        <div className={styles.infoRow}>
          <span
            className={styles.infoLabel}
            style={{ minWidth: '156px' }}
          >
            {t('table.hours')}
          </span>
          <span className={styles.infoValue}>{visit.hours || '-'}</span>
        </div>
        <div className={styles.infoRow}>
          <span
            className={styles.infoLabel}
            style={{ minWidth: '156px' }}
          >
            {t('table.city_name')}
          </span>
          <span className={styles.infoValue}>{visit.city_name || '-'}</span>
        </div>
        <div className={styles.infoRow}>
          <span
            className={styles.infoLabel}
            style={{ minWidth: '156px' }}
          >
            {t('table.address')}
          </span>
          <span className={styles.infoValue}>{visit.address || '-'}</span>
        </div>
        <div className={styles.infoRow}>
          <span
            className={styles.infoLabel}
            style={{ minWidth: '156px' }}
          >
            {t('table.network_operator_name')}
          </span>
          <span className={styles.infoValue}>
            {visit.network_operator_name || '-'}
          </span>
        </div>
        <div className={styles.infoRow}>
          <span
            className={styles.infoLabel}
            style={{ minWidth: '156px' }}
          >
            {t('table.notes')}
          </span>
          <span className={styles.infoValue}>{visit.notes || '-'}</span>
        </div>
      </div>
      <div className={styles.actionsContainer}>
        {isContractor &&
          visit.group_status_entity.id === ID_GROUP_STATUS_ENTITY.PEN_CONF && (
            <>
              <button
                type='button'
                className={`${styles.actionButton}`}
                onClick={() => {
                  setConfirmRejectOTStatus(APPROVAL_STATUS.APPROVED);
                  setShowConfirmRejectOTModal(true);
                }}
              >
                <BiaIcon
                  iconName='faCircleCheck'
                  iconType='solid'
                  size='16px'
                  color='standard'
                />
                {t('confirm_visit.confirm_ot')}
              </button>
              <button
                type='button'
                className={`${styles.actionButton}`}
                onClick={() => {
                  setConfirmRejectOTStatus(APPROVAL_STATUS.REJECTED);
                  setShowConfirmRejectOTModal(true);
                }}
              >
                <BiaIcon
                  iconName='faCircleXmark'
                  iconType='solid'
                  size='16px'
                  color='standard'
                />
                {t('confirm_visit.reject_ot')}
              </button>
            </>
          )}
        {!isContractor && (
          <button
            type='button'
            className={`${styles.actionButton} ${
              !isEditable ? styles.disabledButton : ''
            }`}
            disabled={!canAssign && !showReassignCopy}
            onClick={() => {
              if (canAssign) {
                setShowModalContractor(true);
              } else if (showReassignCopy) {
                setShowModalContractorError(true);
              }
            }}
          >
            <BiaIcon
              iconName='faBuilding'
              iconType='solid'
              size='16px'
              color={!isEditable ? 'disabled' : 'standard'}
            />
            {visit.contractor
              ? showReassignCopy
                ? t('assign_contractor.reassign_copy')
                : t('assign_contractor.reassign_copy')
              : t('assign_contractor.confirm')}
          </button>
        )}
        {visit.contractor &&
          (visit.contractor.bia || isContractor) &&
          isEditable && (
            <button
              type='button'
              className={`${styles.actionButton} ${
                !canAssignElectrician ? styles.disabledButton : ''
              }`}
              disabled={!canAssignElectrician}
              onClick={() => {
                if (canAssignElectrician) {
                  setShowModalElectrician(true);
                }
              }}
            >
              <BiaIcon
                iconName='faUserHelmetSafety'
                iconType='solid'
                size='16px'
                color={!canAssignElectrician ? 'disabled' : 'standard'}
              />
              {visit.electricians.length > 0
                ? t('assign_electricians.reassign_copy')
                : t('assign_electricians.confirm')}
            </button>
          )}
      </div>
      {showModalContractor && (
        <AssignContractorModal
          workOrder={visit}
          onClose={() => setShowModalContractor(false)}
          onReload={() => {
            setShowModalContractor(false);
            setToast({
              type: 'success',
              message: visit.contractor
                ? t('assign_contractor.reassign_contractor_success').replace(
                    '${JOB_CODE}',
                    visit.job_code
                  )
                : t('assign_contractor.assign_contractor_success').replace(
                    '${JOB_CODE}',
                    visit.job_code
                  ),
            });
            handleReload();
          }}
          onError={() => {
            setToast({
              type: 'error',
              message: visit.contractor
                ? t('assign_contractor.reassign_contractor_error')
                : t('assign_contractor.assign_contractor_error'),
            });
          }}
        />
      )}
      {showModalContractorError && (
        <PopUp
          open={showModalContractorError}
          icon='faTriangleExclamation'
          title={t('assign_contractor.not_possible_title')}
          text={t('assign_contractor.not_possible_message')}
          confirmText={t('assign_contractor.not_possible_confirm')}
          onCancel={() => setShowModalContractorError(false)}
          onConfirm={() => setShowModalContractorError(false)}
        />
      )}
      {showModalElectrician && (
        <AssignElectriciansModal
          workOrder={visit}
          onClose={() => setShowModalElectrician(false)}
          onReload={() => {
            setShowModalElectrician(false);
            setToast({
              type: 'success',
              message: t('assing_visit_success').replace(
                '${JOB_CODE}',
                visit.job_code
              ),
            });
            handleReload();
          }}
          onError={() => {
            setToast({
              type: 'error',
              message: t('assing_visit_error'),
            });
          }}
        />
      )}
      {showConfirmRejectOTModal && visit && confirmRejectOTStatus && (
        <PopUp
          open={showConfirmRejectOTModal}
          icon={
            confirmRejectOTStatus === APPROVAL_STATUS.APPROVED
              ? 'faCircleCheck'
              : 'faCircleXmark'
          }
          backgroundIcon={
            confirmRejectOTStatus === APPROVAL_STATUS.APPROVED
              ? 'var(--chart-green05)'
              : 'var(--chart-red05)'
          }
          colorIcon={
            confirmRejectOTStatus === APPROVAL_STATUS.APPROVED
              ? 'positive'
              : 'error'
          }
          title={
            confirmRejectOTStatus === APPROVAL_STATUS.APPROVED
              ? t('confirm_visit.confirm_ot')
              : t('confirm_visit.reject_ot')
          }
          text={
            confirmRejectOTStatus === APPROVAL_STATUS.APPROVED
              ? t('confirm_visit.confirm_text')
                  .replace('${JOB_CODE}', visit.job_code)
                  .replace('${DATE}', visit.start_date)
                  .replace('${TIME}', visit.hours)
              : t('confirm_visit.reject_text')
                  .replace('${JOB_CODE}', visit.job_code)
                  .replace('${DATE}', visit.start_date)
                  .replace('${TIME}', visit.hours)
          }
          confirmText={
            confirmRejectOTStatus === APPROVAL_STATUS.APPROVED
              ? t('confirm_visit.confirm_button')
              : t('confirm_visit.reject_button')
          }
          cancelText={t('confirm_visit.cancel_button')}
          onCancel={() => {
            setShowConfirmRejectOTModal(false);
            setConfirmRejectOTStatus(null);
          }}
          onConfirm={handleConfirmRejectOT}
        />
      )}
      {toast && (
        <BiaToast
          message={toast.message}
          theme={toast.type}
          onClose={() => setToast(null)}
        />
      )}
    </div>
  );
};
