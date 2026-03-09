import React from 'react';
import { IonModal } from '@ionic/react';
import styles from './popupMobile.module.css';
import { BiaIcon, BiaText } from '@entropy/index';

interface PopupMobileProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  message: string;
  icon?: {
    name: string;
    type?: 'solid' | 'regular';
    colorIcon?:
      | 'accent'
      | 'strong'
      | 'weak'
      | 'inverse'
      | 'positive'
      | 'warning'
      | 'error'
      | 'recommendation'
      | 'green05';
  };
  button: { label: string; onClick: () => void };
  buttonSecondary?: { label: string; onClick: () => void };
  backdropDismiss?: boolean;
}

export const BiaPopupMobile: React.FC<PopupMobileProps> = ({
  isOpen,
  onClose,
  title,
  message,
  icon,
  button,
  buttonSecondary,
  backdropDismiss = false,
}) => {
  return (
    <IonModal
      className={styles.popupMobile}
      isOpen={isOpen}
      backdropDismiss={backdropDismiss}
      initialBreakpoint={1}
    >
      <div className={styles.container}>
        <button
          className={styles.closeButton}
          onClick={onClose}
          aria-label='Cerrar'
        >
          <BiaIcon
            iconName='faXmark'
            iconType='solid'
            color='strong'
          />
        </button>

        <div className={styles.content}>
          <div
            className={styles.iconWrap}
            aria-hidden={!icon}
          >
            {icon && (
              <BiaIcon
                iconName={icon.name}
                iconType={icon.type || 'solid'}
                size='24px'
                color={icon.colorIcon || 'accent'}
              />
            )}
          </div>

          <div className={styles.title}>
            <BiaText
              token='heading-2'
              color='strong'
            >
              {title}
            </BiaText>
          </div>

          <div className={styles.message}>
            <BiaText
              token='bodyRegular'
              color='weak'
            >
              {message}
            </BiaText>
          </div>

          <button
            className={styles.button}
            onClick={button.onClick}
          >
            <BiaText
              token='bodySemibold'
              color='inverse'
            >
              {button.label}
            </BiaText>
          </button>

          {buttonSecondary && (
            <button
              className={styles.buttonSecondary}
              onClick={buttonSecondary.onClick}
            >
              {buttonSecondary.label}
            </button>
          )}
        </div>
      </div>
    </IonModal>
  );
};

export default BiaPopupMobile;
