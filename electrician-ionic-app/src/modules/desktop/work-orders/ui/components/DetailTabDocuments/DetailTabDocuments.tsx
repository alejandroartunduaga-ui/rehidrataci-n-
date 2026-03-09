import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useHistory } from 'react-router-dom';
import { BiaIcon, BiaToast } from '@entropy/index';
import { IDocument } from '@desktop/work-orders/data/interfaces/workOrderDetail.interface';
import { useWorkOrders } from '@desktop/work-orders/data';
import { TranslationNamespaces } from '@shared/i18n';
import { UploadActaModal } from '../UploadActaModal/UploadActaModal';
import styles from '../../pages/WorkOrderDetail/WorkOrderDetail.module.css';

interface DetailTabDocumentsProps {
  workOrderId: string;
  job_code: string;
  documents: IDocument[];
}

export const DetailTabDocuments = ({
  workOrderId,
  job_code,
  documents,
}: DetailTabDocumentsProps) => {
  const { t } = useTranslation(TranslationNamespaces.WORK_ORDERS);
  const history = useHistory();
  const { getWorkOrderDetailMutation } = useWorkOrders();
  const [docs, setDocs] = useState<IDocument[]>();
  const [showUploadActaModal, setShowUploadActaModal] = useState(false);
  const [showSuccessToast, setShowSuccessToast] = useState(false);

  const fetchDetail = () => {
    getWorkOrderDetailMutation.mutate(workOrderId);
  };

  useEffect(() => {
    if (getWorkOrderDetailMutation.data?.documents) {
      setDocs(getWorkOrderDetailMutation.data.documents);
    }
  }, [getWorkOrderDetailMutation.data]);

  useEffect(() => {
    setDocs(documents);
  }, [documents]);

  return (
    <div className={styles.contentContainer}>
      <div className={styles.infoContainer}>
        {docs?.map((doc, idx) => (
          <div
            className={styles.infoRow}
            key={idx}
          >
            <span
              className={styles.infoLabel}
              style={{ width: '226px' }}
            >
              {doc.label}
            </span>
            <span className={styles.infoValue}>
              {doc.value === '' ? (
                '-'
              ) : (
                <button
                  type='button'
                  className={styles.iconRow}
                  onClick={() => {
                    history.push(`/admin/ots/${workOrderId}/view-document`, {
                      document: doc,
                      job_code: job_code,
                    });
                  }}
                >
                  <BiaIcon
                    iconName={
                      doc.type !== 'file_report'
                        ? 'faFileInvoiceDollar'
                        : 'faFile'
                    }
                    iconType='solid'
                    size='16px'
                    color='weak'
                    className={styles.infoValueIcon}
                  />
                </button>
              )}
            </span>
          </div>
        ))}
      </div>
      <div className={styles.actionsContainer}>
        {docs?.filter((doc) => doc.type === 'file_report')[0]?.value === '' && (
          <button
            type='button'
            className={styles.actionButton}
            onClick={() => {
              setShowUploadActaModal(true);
            }}
          >
            <BiaIcon
              iconName='faFileArrowUp'
              iconType='solid'
              size='16px'
              color='standard'
            />
            {t('upload_acta.title')}
          </button>
        )}
      </div>
      <UploadActaModal
        workOrderId={workOrderId}
        isOpen={showUploadActaModal}
        onClose={() => setShowUploadActaModal(false)}
        onReload={() => {
          setShowUploadActaModal(false);
          setShowSuccessToast(true);
          setTimeout(() => {
            fetchDetail();
          }, 1000);
        }}
      />

      {showSuccessToast && (
        <BiaToast
          message={t('upload_acta.success').replace('${JOB_CODE}', job_code)}
          theme='success'
          onClose={() => {
            setShowSuccessToast(false);
          }}
        />
      )}
    </div>
  );
};
