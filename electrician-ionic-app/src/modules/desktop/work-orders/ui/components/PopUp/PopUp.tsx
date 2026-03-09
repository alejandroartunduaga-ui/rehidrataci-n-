import React from 'react';
import { BiaIcon } from '@entropy/index';
import styles from './PopUp.module.css';

interface PopUpProps {
  open: boolean;
  icon: string;
  backgroundIcon?: string;
  colorIcon?: 'positive' | 'error';
  title: string;
  text: string;
  confirmText: string;
  cancelText?: string;
  onCancel: () => void;
  onConfirm: () => void;
}

export const PopUp: React.FC<PopUpProps> = ({
  open,
  icon,
  backgroundIcon,
  colorIcon,
  title,
  text,
  confirmText,
  cancelText,
  onCancel,
  onConfirm,
}) => {
  if (!open) return null;
  return (
    <div className={styles.overlay}>
      <div className={styles.modal}>
        <button
          className={styles.closeBtn}
          onClick={onCancel}
        >
          <BiaIcon
            iconName='faXmark'
            iconType='solid'
            size='12px'
          />
        </button>
        <div
          className={styles.iconWrapper}
          style={{ background: backgroundIcon }}
        >
          <BiaIcon
            iconName={icon}
            iconType='solid'
            size='18px'
            color={colorIcon || 'warning'}
          />
        </div>
        <h2 className={styles.title}>{title}</h2>
        <p className={styles.text}>{text}</p>
        <div className={styles.actions}>
          {cancelText && (
            <button
              className={styles.cancelBtn}
              onClick={onCancel}
            >
              {cancelText}
            </button>
          )}
          <button
            className={styles.confirmBtn}
            onClick={onConfirm}
          >
            {confirmText}
          </button>
        </div>
      </div>
    </div>
  );
};
