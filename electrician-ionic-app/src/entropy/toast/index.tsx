import { BiaIcon } from '@entropy/icon/Icon';
import styles from './toast.module.css';

interface IToastProps {
  type: 'success' | 'error';
  title: string;
  message?: string;
}

export const Toast = ({ type, title, message }: IToastProps) => {
  return (
    <div className={`${styles.toast} ${styles[type]}`}>
      <BiaIcon
        iconName={type === 'success' ? 'faCircleCheck' : 'faCircleExclamation'}
        iconType='regular'
        className={styles.icon}
        color={type === 'success' ? 'positive' : 'error'}
      />

      <div>
        <p className={`${styles.title} ${styles[`title-${type}`]}`}>{title}</p>
        <p className={`${styles.message} ${styles[`message-${type}`]}`}>
          {message}
        </p>
      </div>
    </div>
  );
};
