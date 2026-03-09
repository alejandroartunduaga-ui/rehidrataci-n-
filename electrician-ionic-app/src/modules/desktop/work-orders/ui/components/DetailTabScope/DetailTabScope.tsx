import { BiaText } from '@entropy/index';
import styles from '../../pages/WorkOrderDetail/WorkOrderDetail.module.css';

interface IScopeItem {
  type: string;
  value: string;
  label: string;
}

interface DetailTabScopeProps {
  scope: IScopeItem[];
}

export const DetailTabScope = ({ scope }: DetailTabScopeProps) => {
  return (
    <div className={styles.contentContainer}>
      <div className={styles.infoContainer}>
        {scope.length === 0 ? (
          <div className={styles.infoRow}>
            <BiaText
              token='caption'
              color='weak'
            >
              No hay alcance para esta OT.
            </BiaText>
          </div>
        ) : (
          scope.map((item, idx) => (
            <div
              className={styles.infoRow}
              key={idx}
            >
              <span
                className={styles.infoLabel}
                style={{ minWidth: '156px' }}
              >
                {item.label}
              </span>
              <span
                className={styles.infoValue}
                style={{ width: '100%' }}
              >
                {item.value || '-'}
              </span>
            </div>
          ))
        )}
      </div>
      <div
        className={styles.actionsContainer}
        style={{ border: 'none' }}
      ></div>
    </div>
  );
};
