import { useTranslation } from 'react-i18next';
import { BiaModalDesktop, BiaText } from '@entropy/index';
import { TranslationNamespaces } from '@shared/i18n';
import styles from './ResumeCostModal.module.css';

interface ResumeCostModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  serviceCost: number;
  transportCost: number;
  materialCost: number;
  otherCost: number;
}

export const ResumeCostModal: React.FC<ResumeCostModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
  serviceCost,
  transportCost,
  materialCost,
  otherCost,
}) => {
  const { t } = useTranslation(TranslationNamespaces.WORK_ORDERS);

  const formatCurrency = (value: number): string => {
    return new Intl.NumberFormat('es-CO', {
      style: 'currency',
      currency: 'COP',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);
  };

  const totalCost = serviceCost + transportCost + materialCost + otherCost;

  return (
    <BiaModalDesktop
      isOpen={isOpen}
      onClose={onClose}
      title={t('detail_tab_cost.modal_resume.title')}
      width={480}
      confirmText={t('detail_tab_cost.modal_resume.button_confirm')}
      cancelText={t('detail_tab_cost.modal_resume.button_cancel')}
      onConfirm={onConfirm}
      onCancel={onClose}
    >
      <div className={styles.resumeContainer}>
        <BiaText
          token='caption'
          color='weak'
          className={styles.description}
        >
          {t('detail_tab_cost.modal_resume.description')}
        </BiaText>

        <div className={styles.costsList}>
          <div className={styles.costRow}>
            <BiaText
              token='bodySemibold'
              color='weak'
            >
              {t('detail_tab_cost.modal_resume.service_cost')}
            </BiaText>
            <BiaText
              token='bodySemibold'
              color='strong'
            >
              {formatCurrency(serviceCost)}
            </BiaText>
          </div>

          <div className={styles.costRow}>
            <BiaText
              token='bodySemibold'
              color='weak'
            >
              {t('detail_tab_cost.modal_resume.transport_cost')}
            </BiaText>
            <BiaText
              token='bodySemibold'
              color='strong'
            >
              {formatCurrency(transportCost)}
            </BiaText>
          </div>

          <div className={styles.costRow}>
            <BiaText
              token='bodySemibold'
              color='weak'
            >
              {t('detail_tab_cost.modal_resume.material_cost')}
            </BiaText>
            <BiaText
              token='bodySemibold'
              color='strong'
            >
              {formatCurrency(materialCost)}
            </BiaText>
          </div>

          <div className={styles.costRow}>
            <BiaText
              token='bodySemibold'
              color='weak'
            >
              {t('detail_tab_cost.modal_resume.other_cost')}
            </BiaText>
            <BiaText
              token='bodySemibold'
              color='strong'
            >
              {formatCurrency(otherCost)}
            </BiaText>
          </div>
        </div>

        <div className={styles.totalSection}>
          <BiaText
            token='heading-2'
            color='strong'
          >
            {t('detail_tab_cost.modal_resume.total')}
          </BiaText>
          <BiaText
            token='heading-1'
            color='accent'
          >
            {formatCurrency(totalCost)}
          </BiaText>
        </div>
      </div>
    </BiaModalDesktop>
  );
};
