import { useTranslation } from 'react-i18next';
import { ISummary } from '@desktop/work-orders/data';
import { TranslationNamespaces } from '@shared/i18n';
import styles from './WidgetsSummary.module.css';

interface WidgetsSummaryProps {
  summary: ISummary | null;
}
export const WidgetsSummary = ({ summary }: WidgetsSummaryProps) => {
  const { t } = useTranslation(TranslationNamespaces.WORK_ORDERS);
  return (
    <div className={styles.widgetsSummary}>
      <div className={styles.widget}>
        <div className={styles.widgetTitle}>
          {t('widgets_summary.total_ots')}
        </div>
        <div className={styles.widgetValue}>{summary?.total || '0'}</div>
      </div>
      <div className={styles.widget}>
        <div className={styles.widgetTitle}>
          {t('widgets_summary.total_ots_pending')}
        </div>
        <div className={styles.widgetValue}>{summary?.pending || '0'}</div>
      </div>
      <div className={styles.widget}>
        <div className={styles.widgetTitle}>
          {t('widgets_summary.total_ots_success')}
        </div>
        <div className={styles.widgetValue}>{summary?.successful || '0'}</div>
      </div>
      <div className={styles.widget}>
        <div className={styles.widgetTitle}>
          {t('widgets_summary.total_ots_failed')}
        </div>
        <div className={styles.widgetValue}>{summary?.failed || '0'}</div>
      </div>
      <div className={styles.widget}>
        <div className={styles.widgetTitle}>
          {t('widgets_summary.total_ots_canceled')}
        </div>
        <div className={styles.widgetValue}>{summary?.canceled || '0'}</div>
      </div>
      <div className={styles.widget}>
        <div className={styles.widgetTitle}>
          {t('widgets_summary.total_ots_expired')}
        </div>
        <div className={styles.widgetValue}>{summary?.expired || '0'}</div>
      </div>
    </div>
  );
};
