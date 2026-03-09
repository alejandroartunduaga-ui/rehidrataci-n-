import { IonToast } from '@ionic/react';
import { alertCircleOutline, checkmarkCircleOutline } from 'ionicons/icons';
import styles from './BiaToast.module.css';

interface BiaToastProps {
  id?: string;
  title?: string;
  message?: string;
  theme:
    | 'error'
    | 'success'
    | 'warning'
    | 'danger'
    | 'primary'
    | 'secondary'
    | 'tertiary'
    | 'light'
    | 'medium'
    | 'dark';
  duration?: number;
  onClose?: () => void;
  position?: 'top' | 'bottom';
}

export const BiaToast: React.FC<BiaToastProps> = ({
  id,
  title,
  message,
  theme,
  duration = 5000,
  position = 'top',
  onClose,
}) => {
  return (
    <IonToast
      id={id ? `toast-${id}` : `toast-default`}
      isOpen={true}
      header={title ? title : ''}
      message={message ? message : ''}
      cssClass={`${styles.toastWrapper} ${styles[theme]}`}
      duration={duration}
      position={position}
      icon={
        theme === 'error'
          ? alertCircleOutline
          : theme === 'success'
            ? checkmarkCircleOutline
            : alertCircleOutline
      }
      onDidDismiss={onClose}
    />
  );
};
