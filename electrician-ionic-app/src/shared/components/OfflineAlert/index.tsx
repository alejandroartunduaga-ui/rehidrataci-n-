import { BiaIcon, BiaText } from '@entropy/index';
import { useTranslation } from 'react-i18next';
import { TranslationNamespaces } from '@shared/i18n';
import styles from './OfflineAler.module.css';

interface OfflineAlertProps {
  className?: string;
  message?: string;
  title?: string;
}

export const OfflineAlert: React.FC<OfflineAlertProps> = ({
  className,
  message,
  title,
}) => {
  const { t } = useTranslation(TranslationNamespaces.GLOBAL);

  return (
    <div className={`${styles.offlineBanner} ${className || ''}`}>
      <BiaIcon
        iconType='solid'
        iconName='faWifiExclamation'
        color='warning'
        size='19px'
        className={styles.offlineIcon}
      />

      <div>
        <BiaText
          token='bodySemibold'
          color='standard'
          className={styles.offlineTitle}
        >
          {title || t('title_no_network')}
        </BiaText>

        <BiaText
          token='caption'
          color='weak'
        >
          {message || t('message_no_network')}
        </BiaText>
      </div>
    </div>
  );
};
