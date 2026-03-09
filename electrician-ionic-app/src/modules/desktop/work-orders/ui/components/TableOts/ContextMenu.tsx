import { useTranslation } from 'react-i18next';
import { RolesEnum } from '@auth/index';
import { APPROVAL_STATUS } from '@desktop/work-orders/data';
import { TranslationNamespaces } from '@shared/i18n';
import { useAuthStore } from '@shared/index';
import styles from './TableOts.module.css';

interface ContextMenuProps {
  onClose: () => void;
  onViewDetail: () => void;
  onCancel: () => void;
  onReschedule: () => void;
  onBlockedReschedule: () => void;
  onCloseOT: () => void;
  onConfirmRejectOT: (status: APPROVAL_STATUS) => void;
  isEditable: boolean;
  canReschedule: boolean;
  isPendingClose?: boolean;
  isPendingConfirm?: boolean;
  isClosingOT?: boolean; // Estado para deshabilitar el botón mientras se cierra la OT
}

export const ContextMenu: React.FC<ContextMenuProps> = ({
  onClose,
  onViewDetail,
  onCancel,
  onReschedule,
  onBlockedReschedule,
  onCloseOT,
  onConfirmRejectOT,
  isEditable,
  canReschedule,
  isPendingClose = false,
  isPendingConfirm = false,
  isClosingOT = false,
}) => {
  const { t } = useTranslation(TranslationNamespaces.WORK_ORDERS);
  const { user } = useAuthStore();
  const isContractor = user?.user?.role === RolesEnum.CONTRACTOR;

  return (
    <div
      role='menu'
      tabIndex={0}
      className={styles.contextMenuOverlay}
      onClick={onClose}
      onKeyDown={(e) => {
        if (e.key === 'Escape') {
          onClose();
        }
      }}
    >
      <div
        role='menu'
        tabIndex={-1}
        className={styles.contextMenu}
        onClick={(e) => e.stopPropagation()}
        onKeyDown={(e) => {
          if (e.key === 'Escape') {
            onClose();
          }
        }}
      >
        <button
          className={styles.contextMenuItem}
          onClick={onViewDetail}
        >
          {t('table.view_detail')}
        </button>

        {isContractor ? (
          <>
            <button
              className={`${styles.contextMenuItem} ${!isPendingConfirm ? styles.disabled : ''}`}
              disabled={!isPendingConfirm}
              onClick={() => {
                onConfirmRejectOT(APPROVAL_STATUS.APPROVED);
              }}
            >
              {t('confirm_visit.confirm_ot')}
            </button>
            <button
              className={`${styles.contextMenuItem} ${!isPendingConfirm ? styles.disabled : ''}`}
              disabled={!isPendingConfirm}
              onClick={() => {
                onConfirmRejectOT(APPROVAL_STATUS.REJECTED);
              }}
            >
              {t('confirm_visit.reject_ot')}
            </button>
          </>
        ) : isPendingClose ? (
          <>
            <button
              className={`${styles.contextMenuItem}`}
              onClick={onCancel}
            >
              {t('table.cancel_ot')}
            </button>
            <button
              className={`${styles.contextMenuItem} ${isClosingOT ? styles.disabled : ''}`}
              onClick={!isClosingOT ? onCloseOT : undefined}
              disabled={isClosingOT}
            >
              {isClosingOT ? t('table.closing_ot') : t('table.close_ot')}
            </button>
          </>
        ) : (
          <>
            <button
              className={`${styles.contextMenuItem} ${!isEditable ? styles.disabled : ''}`}
              onClick={isEditable ? onCancel : undefined}
              disabled={!isEditable}
            >
              {t('table.cancel_ot')}
            </button>

            <button
              className={`${styles.contextMenuItem} ${!canReschedule ? styles.disabled : ''}`}
              onClick={canReschedule ? onReschedule : onBlockedReschedule}
            >
              {t('table.reschedule_ot')}
            </button>
          </>
        )}
      </div>
    </div>
  );
};
