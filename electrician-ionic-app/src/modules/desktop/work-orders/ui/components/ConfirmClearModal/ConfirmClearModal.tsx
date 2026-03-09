import React from 'react';
import { useTranslation } from 'react-i18next';
import { BiaIcon } from '@entropy/index';
import { TranslationNamespaces } from '@shared/i18n';
import styles from './ConfirmClearModal.module.css';

interface ConfirmClearModalProps {
  open: boolean;
  onCancel: () => void;
  onConfirm: () => void;
}

export const ConfirmClearModal: React.FC<ConfirmClearModalProps> = ({
  open,
  onCancel,
  onConfirm,
}) => {
  const { t } = useTranslation(TranslationNamespaces.WORK_ORDERS);
  if (!open) return null;
  return (
    <div className={styles.overlay}>
      <div className={styles.modal}>
        <button
          className={styles.closeBtn}
          onClick={onCancel}
          aria-label={t('clear_filters.close')}
        >
          <BiaIcon
            iconName='faXmark'
            iconType='solid'
            size='12px'
          />
        </button>
        <div className={styles.iconWrapper}>
          <BiaIcon
            iconName='faBroomWide'
            iconType='solid'
            size='18px'
            color='accent'
          />
        </div>
        <h2 className={styles.title}>{t('clear_filters.title')}</h2>
        <p className={styles.text}>
          {t('clear_filters.message')}
          <br />
          <strong className={styles.strong}>¿Desea continuar?</strong>
        </p>
        <div className={styles.actions}>
          <button
            className={styles.cancelBtn}
            onClick={onCancel}
          >
            {t('clear_filters.cancel')}
          </button>
          <button
            className={styles.confirmBtn}
            onClick={onConfirm}
          >
            {t('clear_filters.confirm')}
          </button>
        </div>
      </div>
    </div>
  );
};
