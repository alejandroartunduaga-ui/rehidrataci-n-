import styles from '../WorkOrderDetail/WorkOrderDetail.module.css';
import { EnumFeatureFlag, useFeatureFlag } from '@shared/hooks/useFeatureFlag';
import { IDocument } from '@desktop/work-orders/data/interfaces/workOrderDetail.interface';
import { PopUp } from '../../components/PopUp/PopUp';
import { RolesEnum } from '@auth/index';
import { TranslationNamespaces } from '@shared/i18n';
import { UploadActaModal } from '../../../ui/components/UploadActaModal/UploadActaModal';
import { endpoints, useAuthStore } from '@shared/index';
import { useEffect, useState } from 'react';
import { useIonRouter } from '@ionic/react';
import { useLocation, useParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { httpClient, useConnectivityStore } from '@shared/index';
import { useWorkOrders } from '@desktop/work-orders/data';
import { ReturnActaModal } from '../../components/ReturnActaModal/ReturnActaModal';
import { workOrdersEndpoints } from '@desktop/work-orders/data/endpoints/wordOrders.endpoints';
import {
  BiaBreadcrumb,
  BiaIcon,
  BiaVisualizer,
  BreadcrumbItem,
  BiaToast,
  BiaLoader,
} from '@entropy/index';

export const ViewDocument = () => {
  const { t } = useTranslation(TranslationNamespaces.WORK_ORDERS);
  const { workOrderId } = useParams<{ workOrderId: string }>();
  const location = useLocation<{ document?: IDocument; job_code?: string }>();
  const ionRouter = useIonRouter();
  const { getWorkOrderDetailMutation, resetVisitMutation } = useWorkOrders();
  const { user, token, session } = useAuthStore();
  const canResetVisit = useFeatureFlag(EnumFeatureFlag.RESET_VISIT);
  const isCoordinatorBia = user?.user?.role === RolesEnum.COORDINATOR_BIA;
  const [doc, setDoc] = useState<IDocument | null>(null);
  const [showUploadActaModal, setShowUploadActaModal] = useState(false);
  const [showSuccessToast, setShowSuccessToast] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showResetSuccessToast, setShowResetSuccessToast] = useState(false);
  const [showResetErrorToast, setShowResetErrorToast] = useState(false);
  const [showReturnActaModal, setShowReturnActaModal] = useState(false);
  const [returnObservation, setReturnObservation] = useState('');
  const [isReturningActa, setIsReturningActa] = useState(false);
  const handleOpenReturnActaModal = () => {
    setReturnObservation(''); 
    setShowReturnActaModal(true);
  };
  const handleCloseReturnActaModal = () => setShowReturnActaModal(false);
  const handleCloseDeleteModal = () => setShowDeleteModal(false);

const handleConfirmReturnActa = async (observation: string) => {
  const authToken = token || session?.token;

  if (
    !workOrderId ||
    isReturningActa ||
    !user?.user?.electrician_id ||
    !authToken
  )
    return;

  try {
    setIsReturningActa(true);

    const resp = await fetch(
      'https://electricians.dev.bia.app/ms-electricians-api/app/electrician-visits/cms/visit/revert-act',
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-user-id': user.user.electrician_id,
          authorization: `Bearer ${authToken}`,
        },
        body: JSON.stringify({
          visit_id: workOrderId,
          observation,
        }),
      }
    );

    if (!resp.ok) {
      const text = await resp.text().catch(() => '');
      throw new Error(text || `Error revert-act (${resp.status})`);
    }

    setShowReturnActaModal(false);
    setReturnObservation('');
  } catch (error) {
    console.error('[RETURN_ACTA] Error', error);
  } finally {
    setIsReturningActa(false);
  }
};
 
  const handleConfirmResetVisit = () => {
    if (resetVisitMutation.isPending || !workOrderId) return;
    resetVisitMutation
      .mutateAsync({ visit_id: workOrderId })
      .then(() => {
        setShowDeleteModal(false);
        setShowResetSuccessToast(true);
        setTimeout(() => {
          ionRouter.goBack();
        }, 1000);
      })
      .catch(() => {
        setShowDeleteModal(false);
        setShowResetErrorToast(true);
      });
  };

  useEffect(() => {
    if (location.state?.document) {
      setDoc(location.state.document);
    } else if (getWorkOrderDetailMutation.data?.documents) {
      setDoc(
        getWorkOrderDetailMutation.data.documents.find(
          (d) => d.type === 'file_report'
        ) || null
      );
    }
  }, [getWorkOrderDetailMutation.data, location.state]);

  const fetchDetail = () => {
    getWorkOrderDetailMutation.mutate(workOrderId);
  };

  useEffect(() => {
    if (!location.state?.document && workOrderId) {
      fetchDetail();
    }
  }, [workOrderId, location.state]);

  const breadcrumbItems: BreadcrumbItem[] = [
    { label: 'OTs', href: '/admin/ots' },
    {
      label:
        getWorkOrderDetailMutation.data?.visit?.job_code ||
        location.state?.job_code ||
        '',
      href: `/admin/ots/${workOrderId}`,
    },
    { label: doc?.label || 'Documento', active: true },
  ];

  const downloadFile = (url: string) => {
    window.open(url, '_blank');
    // const link = document.createElement('a');
    // link.href = url;
    // link.target = '_blank';
    // link.download = filename;
    // document.body.appendChild(link);
    // link.click();
    // document.body.removeChild(link);
  };
  console.log('[VISIT DETAIL]', getWorkOrderDetailMutation.data?.visit);
  return (
    <div className={styles.detailContainer}>
      <BiaBreadcrumb items={breadcrumbItems} />
      {!doc && getWorkOrderDetailMutation.isPending && <BiaLoader />}
      <div className={styles.contentContainer}>
        <div className={styles.infoContainer}>
          {doc && !getWorkOrderDetailMutation.isPending && (
            <BiaVisualizer src={doc.value} />
          )}
        </div>
        {doc?.type === 'file_report' ? (
          <div className={styles.actionsContainer}>
            <button
              type='button'
              className={styles.actionButton}
              onClick={() => setShowUploadActaModal(true)}
            >
              <BiaIcon
                iconName='faFileArrowUp'
                iconType='solid'
                size='16px'
                color='standard'
              />
              {t('upload_acta.replace')}
            </button>
            <button
              type='button'
              className={styles.actionButton}
              onClick={() => {
                downloadFile(doc.value);
              }}
            >
              <BiaIcon
                iconName='faFileArrowDown'
                iconType='solid'
                size='16px'
                color='standard'
              />
              {t('upload_acta.download')}
            </button>  
            <button
              type="button"
              className={styles.actionButton}
              onClick={handleOpenReturnActaModal}
            >
              <BiaIcon iconName="faUndo" 
                iconType="solid" 
                size="16px" 
                color="standard" />
              {t('upload_acta.return')}
            </button>
            {canResetVisit && isCoordinatorBia && (
              <div>
                <button
                type='button'
                className={styles.actionButton}
                onClick={() => {
                  setShowDeleteModal(true);
                }}
              >
                <BiaIcon
                  iconName='faTrash'
                  iconType='solid'
                  size='16px'
                />
                {t('reset_visit.title')}
                </button>
              </div>
            )}
          </div>
        ) : (
          <div
            className={styles.actionsContainer}
            style={{ border: 'none' }}
          ></div>
        )}
      </div>
      {/* Confirmación de borrado de acta (estilo PopUp) */}
      {showDeleteModal && canResetVisit && isCoordinatorBia && (
        <PopUp
          open={showDeleteModal}
          icon='faBan'
          title={t('reset_visit.title')}
          text={t('reset_visit.confirm_text')}
          confirmText={t('reset_visit.confirm_button')}
          cancelText={t('reset_visit.cancel')}
          onCancel={handleCloseDeleteModal}
          onConfirm={handleConfirmResetVisit}
        />
      )}
      {
        showReturnActaModal && (
          <ReturnActaModal
            isOpen={showReturnActaModal}
            onClose={handleCloseReturnActaModal}
            onConfirm={handleConfirmReturnActa}
            jobCode={
              getWorkOrderDetailMutation.data?.visit?.job_code ||
              location.state?.job_code ||
              ''
            }
            workOrderId={workOrderId}
            observation={returnObservation}
            setObservation={setReturnObservation}
            minChars={30}
          />
        )
      }
      
      {showUploadActaModal && (
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
          onError={() => {
            setShowUploadActaModal(false);
          }}
          isReplacing={true}
          document={doc?.value}
        />
      )}

      {showSuccessToast && (
        <BiaToast
          message={t('upload_acta.success').replace(
            '${JOB_CODE}',
            getWorkOrderDetailMutation.data?.visit?.job_code || workOrderId
          )}
          theme='success'
          onClose={() => {
            setShowSuccessToast(false);
          }}
        />
      )}
      {showResetSuccessToast && (
        <BiaToast
          message={t('reset_visit.success')}
          theme='success'
          onClose={() => {
            setShowResetSuccessToast(false);
          }}
        />
      )}
      {showResetErrorToast && (
        <BiaToast
          message={t('reset_visit.error')}
          theme='error'
          onClose={() => {
            setShowResetErrorToast(false);
          }}
        />
      )}
    </div>
  );
};
