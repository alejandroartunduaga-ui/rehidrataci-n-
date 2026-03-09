import { BiaIcon, BiaText } from '@entropy/index';
import { IHistory } from '@desktop/work-orders/data/interfaces/workOrderDetail.interface';
import styles from '../../pages/WorkOrderDetail/WorkOrderDetail.module.css';
import { colors } from '@entropy/icon/Icon';
import { useTrackEvent } from '@shared/index';
interface DetailTabHistoryProps {
  history: IHistory[];
}

export const DetailTabHistory = ({ history }: DetailTabHistoryProps) => {
  const trackEvent = useTrackEvent();
  trackEvent('OPS_HISTORY_TAB_VIEWED', {});
  return (
    <div className={styles.contentContainer}>
      <div className={styles.infoContainer}>
        {history.length === 0 ? (
          <div className={styles.infoRow}>
            <BiaText
              token='caption'
              color='weak'
            >
              No hay historial para esta OT.
            </BiaText>
          </div>
        ) : (
          history.map((item, index) => {
            return (
              <div
                key={index}
                className={styles.historyItem}
              >
                <div className={styles.historyIcon}>
                  <div className={styles.historyIconContentItem}>
                    <BiaIcon
                      iconName={item.icon || 'faCheck'}
                      iconType='solid'
                      size='16px'
                      color={
                        (item.icon_color as keyof typeof colors) ||
                        'recommendation'
                      }
                    />
                  </div>
                  <div className={styles.historyTimeLine}></div>
                </div>
                <div className={styles.historyCard}>
                  <div className={styles.historyContent}>
                    <BiaText
                      token='heading-3'
                      color='standard'
                      className={styles.historyDescription}
                    >
                      {item.description}
                    </BiaText>
                    {item.now && (
                      <div className={styles.historyNow}>
                        <BiaText
                          token='heading-3'
                          color='weak'
                          className={styles.historyDate}
                        >
                          Ahora:
                        </BiaText>
                        <BiaText
                          token='bodyRegular'
                          color='weak'
                          className={styles.historyDate}
                        >
                          {item.now}
                        </BiaText>
                      </div>
                    )}
                    {item.before && (
                      <div className={styles.historyBefore}>
                        <BiaText
                          token='heading-3'
                          color='weak'
                          className={styles.historyDate}
                        >
                          Antes:
                        </BiaText>
                        <BiaText
                          token='bodyRegular'
                          color='weak'
                          className={styles.historyDate}
                        >
                          {item.before}
                        </BiaText>
                      </div>
                    )}
                    <BiaText
                      token='caption'
                      color='weak'
                      className={styles.historyDate}
                    >
                      <BiaIcon
                        iconName='faClock'
                        iconType='regular'
                        size='12px'
                        color='weak'
                      />
                      {(() => {
                        const date = new Date(item.date);
                        const year = date.getFullYear();
                        const month = String(date.getMonth() + 1).padStart(
                          2,
                          '0'
                        );
                        const day = String(date.getDate()).padStart(2, '0');
                        const hours = String(date.getHours()).padStart(2, '0');
                        const minutes = String(date.getMinutes()).padStart(
                          2,
                          '0'
                        );
                        return `${year}-${month}-${day} ${hours}:${minutes}`;
                      })()}
                    </BiaText>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>
      <div
        className={styles.actionsContainer}
        style={{ border: 'none' }}
      ></div>
    </div>
  );
};
