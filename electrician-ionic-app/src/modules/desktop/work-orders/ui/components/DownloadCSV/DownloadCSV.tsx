import { useTranslation } from 'react-i18next';
import { TranslationNamespaces } from '@shared/i18n';
import styles from './DownloadCSV.module.css';
import { DownloasCSVModal } from '../DownloasCSVModal/DownloasCSVModal';
import { useState } from 'react';

export const DownloadCSV = () => {
  const { t } = useTranslation(TranslationNamespaces.WORK_ORDERS);
  const [isOpenModalCSV, setIsOpenModalCSV] = useState<boolean>(false);
  const openModalCSV = () => {
    setIsOpenModalCSV(true);
  };

  return (
    <div className={styles.downloadCSVContainer}>
      <button
        className={styles.confirmBtn}
        onClick={openModalCSV}
      >
        {t('download_csv')}
      </button>
      <DownloasCSVModal
        isOpen={isOpenModalCSV}
        onClose={() => setIsOpenModalCSV(false)}
        onConfirm={() => {}}
      />
    </div>
  );
};
