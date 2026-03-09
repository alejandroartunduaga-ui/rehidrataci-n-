import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  BiaLoader,
  BiaModalDesktop,
  BiaText,
  BiaToast,
  BiaIcon,
} from '@entropy/index';
import { useWorkOrders } from '@desktop/work-orders/data';
import { useFileUploaderS3 } from '@mobile/forms-management';
import { TranslationNamespaces } from '@shared/i18n';
import styles from './UploadActaModal.module.css';
import { ReturnActaModal } from '../../components/ReturnActaModal/ReturnActaModal';


interface UploadActaModalProps {
  workOrderId: string;
  isOpen: boolean;
  onClose: () => void;
  onReload: () => void;
  onError?: () => void;
  isReplacing?: boolean;
  document?: string;
}

export const UploadActaModal: React.FC<UploadActaModalProps> = ({
  workOrderId,
  isOpen,
  onClose,
  onReload,
  onError,
  isReplacing = false,
  document,
}) => {
  const { t } = useTranslation(TranslationNamespaces.WORK_ORDERS);
  const { uploadS3VisitActMutation } = useFileUploaderS3();
  const { uploadActaMutation } = useWorkOrders();
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [returnObservation, setReturnObservation] = useState('');
  
  const handleFileSelect = (file: File) => {
    // Validar que sea un PDF
    if (file.type !== 'application/pdf') {
      setError('Solo se permiten archivos PDF');
      return;
    }

    setSelectedFile(file);
    setError(null);
  };

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files[0]) {
      handleFileSelect(files[0]);
    }
  };

  const handleUpload = async () => {
    if (!selectedFile) return;

    setIsUploading(true);
    setError(null);

    try {
      const uploadedUrl = await uploadS3VisitActMutation.mutateAsync({
        file: selectedFile,
        fileName: `${workOrderId}-acta.pdf`,
      });

      if (!uploadedUrl) {
        throw new Error('File acta upload failed: No response from server');
      }

      uploadActaMutation.mutate(
        {
          url: uploadedUrl,
          visit_id: workOrderId,
        },
        {
          onSuccess: () => {
            onReload();
          },
          onError: (error: Error) => {
            setIsUploading(false);
            setError(t('upload_acta.error'));
            console.error('Error uploading file acta:', error.message);
          },
        }
      );
    } catch {
      setIsUploading(false);
      setError(t('upload_acta.error'));
      if (onError) onError();
    } finally {
      setIsUploading(false);
    }
  };

  const handleCancel = () => {
    setSelectedFile(null);
    setError(null);
    onClose();
  };

  return (
    <>
      <BiaModalDesktop
        isOpen={isOpen}
        onClose={onClose}
        title={t('upload_acta.title')}
        width={414}
        height={208}
        confirmText={
          isReplacing ? t('upload_acta.replace') : t('upload_acta.save')
        }
        cancelText='Cancelar'
        onConfirm={handleUpload}
        onCancel={handleCancel}
        confirmDisabled={!selectedFile || isUploading}
      >
        <div className={styles.modalContent}>
          <div className={styles.uploadSection}>
            {selectedFile || document ? (
              <BiaText
                token='caption'
                color='standard'
                className={styles.documentName}
              >
                {selectedFile?.name || document}
              </BiaText>
            ) : (
              <BiaText
                token='caption'
                color='weak'
                className={styles.documentName}
              >
                {t('upload_acta.description')}
              </BiaText>
            )}
            <label className={styles.fileInputLabel}>
              <input
                name='acta'
                type='file'
                accept='application/pdf'
                onChange={handleFileInput}
                className={styles.fileInput}
              />
              <button
                type='button'
                className={styles.uploadButton}
                style={{
                  width: selectedFile || document ? '92px' : '112px',
                }}
              >
                {selectedFile || document
                  ? t('upload_acta.replace')
                  : t('upload_acta.upload')}
                <BiaIcon
                  iconName='faFileUpload'
                  iconType='solid'
                  size='12px'
                  color='strong'
                />
              </button>
            </label>
          </div>
        </div>
      </BiaModalDesktop>

      {isUploading && <BiaLoader />}

      {error && (
        <BiaToast
          message={error}
          theme='error'
          onClose={() => setError(null)}
        />
      )}
    </>
  );
};
