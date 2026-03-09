import { BiaIcon, BiaText } from '@entropy/index';
import { IEquipment } from '@desktop/work-orders/data/interfaces/workOrderDetail.interface';
import styles from '../../pages/WorkOrderDetail/WorkOrderDetail.module.css';

interface DetailTabEquipmentsProps {
  equipments: IEquipment[];
}

export const DetailTabEquipments = ({
  equipments,
}: DetailTabEquipmentsProps) => {
  const downloadFile = (url: string) => {
    window.open(url, '_blank');
  };

  return (
    <div className={styles.contentContainer}>
      <div className={styles.infoContainer}>
        {equipments.length === 0 ? (
          <div className={styles.infoRow}>
            <BiaText
              token='caption'
              color='weak'
            >
              No hay equipos para esta OT.
            </BiaText>
          </div>
        ) : (
          equipments.map((item, equipmentIdx) => {
            return (
              <div
                key={equipmentIdx}
                style={{ marginBottom: '20px' }}
              >
                {item.map((item, idx) => {
                  return (
                    <div
                      className={styles.infoRow}
                      key={idx}
                    >
                      {item.type === 'text' && (
                        <>
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
                        </>
                      )}
                      {item.type === 'file' && (
                        <>
                          <span
                            className={styles.infoLabel}
                            style={{ width: '156px' }}
                          >
                            {item.label}
                          </span>
                          <span className={styles.infoValue}>
                            {item.value === '' ? (
                              '-'
                            ) : (
                              <button
                                type='button'
                                className={styles.iconRow}
                                onClick={() => {
                                  downloadFile(item.value);
                                }}
                              >
                                <BiaIcon
                                  iconName='faFile'
                                  iconType='solid'
                                  size='16px'
                                  color='weak'
                                  className={styles.infoValueIcon}
                                />
                              </button>
                            )}
                          </span>
                        </>
                      )}
                    </div>
                  );
                })}
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
