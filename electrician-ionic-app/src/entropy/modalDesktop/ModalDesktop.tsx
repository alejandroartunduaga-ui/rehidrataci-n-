import React from 'react';
import { BiaIcon, BiaText } from '@entropy/index';
import styles from './ModalDesktop.module.css';

interface BiaModalDesktopProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  width?: string | number;
  height?: string | number;
  confirmText?: string;
  cancelText?: string;
  onConfirm?: () => void;
  onCancel?: () => void;
  confirmDisabled?: boolean;
  children: React.ReactNode;
}

export const BiaModalDesktop: React.FC<BiaModalDesktopProps> = ({
  isOpen,
  onClose,
  title,
  width = 420,
  height = 'auto',
  confirmText = 'Confirmar',
  cancelText = 'Cancelar',
  onConfirm,
  onCancel,
  confirmDisabled = false,
  children,
}) => {
  if (!isOpen) return null;

  return (
    <div className={styles.overlay}>
      <div
        className={styles.modal}
        style={{ width, height }}
      >
        <div className={styles.header}>
          <BiaText
            token='heading-3'
            color='strong'
          >
            {title}
          </BiaText>
          <button
            className={styles.closeButton}
            onClick={onClose}
            aria-label='Cerrar'
          >
            <BiaIcon
              iconName='faXmark'
              iconType='solid'
              color='strong'
              size='12px'
            />
          </button>
        </div>
        <div className={styles.body}>{children}</div>
        <div className={styles.footer}>
          <button
            className={styles.cancelBtn}
            onClick={onCancel || onClose}
          >
            {cancelText}
          </button>
          <button
            className={styles.confirmBtn}
            onClick={onConfirm}
            disabled={confirmDisabled}
          >
            {confirmText}
          </button>
        </div>
      </div>
    </div>
  );
};
