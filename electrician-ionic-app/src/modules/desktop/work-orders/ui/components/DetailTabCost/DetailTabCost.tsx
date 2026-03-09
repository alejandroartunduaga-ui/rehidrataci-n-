import { useState, useRef, useEffect } from 'react';
import {
  BiaInput,
  BiaTextArea,
  BiaText,
  BiaIcon,
  BiaToast,
  BiaLoader,
} from '@entropy/index';
import {
  ICostsVisitGetResponse,
  useCostsVisit,
} from '@desktop/work-orders/data';
import { useFileUploaderS3 } from '@mobile/forms-management';
import { ResumeCostModal } from '../ResumeCostModal/ResumeCostModal';
import styles from './DetailTabCost.module.css';
import { useAuthStore, useTrackEvent } from '@shared/index';
import { useTranslation } from 'react-i18next';
import { RolesEnum } from '@auth/index';

interface DetailTabCostProps {
  costs: ICostsVisitGetResponse;
  isEditable: boolean;
  isExpiredOT: boolean;
  visitId: string;
  onSuccesChange: () => void;
}

interface CostFormData {
  serviceCost: string;
  transportCost: string;
  materialCost: string;
  otherCost: string;
  comments: string;
}

interface ValidationErrors {
  serviceCost?: string;
  transportCost?: string;
  materialCost?: string;
  otherCost?: string;
}

export const DetailTabCost = ({
  costs,
  isEditable,
  isExpiredOT,
  visitId,
  onSuccesChange,
}: DetailTabCostProps) => {
  const { user } = useAuthStore();
  const { t } = useTranslation('work_orders');
  const [formData, setFormData] = useState<CostFormData>({
    serviceCost: costs?.service_cost?.toString() || '',
    transportCost: costs?.transport_cost?.toString() || '',
    materialCost: costs?.material_cost?.toString() || '',
    otherCost: costs?.other_cost?.toString() || '',
    comments: costs?.comments || '',
  });

  const [errors, setErrors] = useState<ValidationErrors>({});
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [showResumeModal, setShowResumeModal] = useState(false);
  const [removedExistingFile, setRemovedExistingFile] = useState(false);
  const [toastMessage, setToastMessage] = useState<{
    message: string;
    type: 'error' | 'success';
  } | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { postCostsVisitMutation } = useCostsVisit();
  const { uploadS3ConsumablesPdfMutation } = useFileUploaderS3();
  const trackEvent = useTrackEvent();

  useEffect(() => {
    trackEvent('OPS_TAB_COSTOS_OPENED', { ot_id: visitId });
  }, [visitId]);

  const formatCurrency = (value: string): string => {
    // Si el valor está vacío, retornar vacío
    if (value === '') return '';

    const number = parseInt(value, 10);
    if (isNaN(number)) return '';

    // Formatear como moneda colombiana sin decimales
    return new Intl.NumberFormat('es-CO', {
      style: 'currency',
      currency: 'COP',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(number);
  };

  const validateField = (
    fieldName: keyof CostFormData,
    value: string
  ): string | undefined => {
    // El campo comments no requiere validación
    if (fieldName === 'comments') {
      return undefined;
    }

    if (value.trim() === '') {
      return 'Este campo no puede estar vacío';
    }

    const number = parseInt(value, 10);
    if (isNaN(number)) {
      return 'Este campo no puede estar vacío';
    }

    /* if (number === 0) {
      return 'Este campo no puede estar vacío';
    } */

    // Validar formato: máximo 7 dígitos
    if (value.length > 7) {
      return 'Máximo 7 dígitos';
    }

    return undefined;
  };

  const handleCostChange = (fieldName: keyof CostFormData, value: string) => {
    if (fieldName === 'comments') {
      // El campo comments acepta cualquier texto sin validación
      setFormData((prev) => ({ ...prev, [fieldName]: value }));
      return;
    }

    // Para campos numéricos - permitir solo números
    // Eliminar todo excepto dígitos
    let cleanValue = value.replace(/\D/g, '');

    // Limitar a 7 dígitos
    if (cleanValue.length > 7) {
      cleanValue = cleanValue.slice(0, 7);
    }

    setFormData((prev) => ({ ...prev, [fieldName]: cleanValue }));

    const error = validateField(fieldName, cleanValue);
    setErrors((prev) => ({ ...prev, [fieldName]: error }));
  };

  const handleBlur = (fieldName: keyof CostFormData) => {
    const error = validateField(fieldName, formData[fieldName]);
    setErrors((prev) => ({ ...prev, [fieldName]: error }));
  };

  const isFormValid = () => {
    // Verificar que no haya errores
    const hasErrors = Object.values(errors).some(
      (error) => error !== undefined
    );
    if (hasErrors) return false;

    // Verificar que todos los campos de costos tengan valores válidos
    const serviceCostValue = parseInt(formData.serviceCost, 10);
    const transportCostValue = parseInt(formData.transportCost, 10);
    const materialCostValue = parseInt(formData.materialCost, 10);
    const otherCostValue = parseInt(formData.otherCost, 10);

    return (
      !isNaN(serviceCostValue) &&
      serviceCostValue >= 0 &&
      !isNaN(transportCostValue) &&
      transportCostValue >= 0 &&
      !isNaN(materialCostValue) &&
      materialCostValue >= 0 &&
      !isNaN(otherCostValue) &&
      otherCostValue >= 0
    );
  };

  const handleSaveCosts = () => {
    if (!isFormValid()) return;
    // Mostrar modal de resumen
    trackEvent('OPS_BUTTON_GUARDAR_CLICK', { ot_id: visitId });
    setShowResumeModal(true);
  };

  const handleConfirmSave = async () => {
    trackEvent('OPS_MODAL_CONFIRMAR_ACCEPT', { ot_id: visitId });
    try {
      let consumablesPdfUrl: string = '';

      // Si hay archivo subido, primero subirlo a S3
      if (uploadedFile) {
        const uploadedUrl = await uploadS3ConsumablesPdfMutation.mutateAsync({
          file: uploadedFile,
          fileName: `${visitId}-consumables.${uploadedFile.name.split('.').pop()}`,
        });

        if (!uploadedUrl) {
          throw new Error('File upload failed: No response from server');
        }

        consumablesPdfUrl = uploadedUrl;
      }

      // Guardar los costos (con o sin URL del archivo)
      // Si se removió el archivo existente, enviar string vacío
      const finalConsumablesPdf = removedExistingFile
        ? consumablesPdfUrl
        : consumablesPdfUrl || costs.consumables_pdf || '';

      postCostsVisitMutation.mutate(
        {
          visit_id: visitId,
          service_cost: parseInt(formData.serviceCost, 10),
          material_cost: parseInt(formData.materialCost, 10),
          transport_cost: parseInt(formData.transportCost, 10),
          other_cost: parseInt(formData.otherCost, 10),
          comments: formData.comments,
          consumables_pdf: finalConsumablesPdf,
        },
        {
          onSuccess: () => {
            setToastMessage({
              message: t('detail_tab_cost.save_costs_success'),
              type: 'success',
            });
            onSuccesChange();
            setShowResumeModal(false);
            trackEvent('OPS_TAB_COSTOS_SAVED', { ot_id: visitId });
          },
          onError: () => {
            setToastMessage({
              message: t('detail_tab_cost.save_costs_error'),
              type: 'error',
            });
          },
        }
      );
    } catch (error) {
      console.error('Error uploading file:', error);
      setToastMessage({
        message: t('detail_tab_cost.error_upload_file'),
        type: 'error',
      });
    }
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      // Validar que sea PDF o ZIP
      const validTypes = [
        'application/pdf',
        'application/zip',
        'application/x-zip-compressed',
      ];
      const validExtensions = ['.pdf', '.zip'];
      const fileExtension = file.name
        .toLowerCase()
        .slice(file.name.lastIndexOf('.'));

      if (
        validTypes.includes(file.type) ||
        validExtensions.includes(fileExtension)
      ) {
        setUploadedFile(file);
      } else {
        setToastMessage({
          message: t('detail_tab_cost.error_upload_file'),
          type: 'error',
        });
        if (fileInputRef.current) {
          fileInputRef.current.value = '';
        }
      }
    }
  };

  const handleRemoveFile = () => {
    setUploadedFile(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleRemoveExistingFile = () => {
    setRemovedExistingFile(true);
  };

  const handleUploadClick = () => {
    fileInputRef.current?.click();
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i];
  };

  // Validar si consumables_pdf es una URL válida de PDF o ZIP
  const isValidConsumableUrl = (url: string | null): boolean => {
    if (!url || url.trim() === '') return false;

    try {
      const urlObj = new URL(url);
      const pathname = urlObj.pathname.toLowerCase();
      return pathname.endsWith('.pdf') || pathname.endsWith('.zip');
    } catch {
      return false;
    }
  };

  const handleDownloadConsumable = () => {
    if (costs.consumables_pdf) {
      window.open(costs.consumables_pdf, '_blank');
    }
  };

  const getFileNameFromUrl = (url: string): string => {
    try {
      const urlObj = new URL(url);
      const pathname = urlObj.pathname;
      const fileName = pathname.substring(pathname.lastIndexOf('/') + 1);
      return decodeURIComponent(fileName);
    } catch {
      return 'archivo';
    }
  };

  if (
    postCostsVisitMutation.isPending ||
    uploadS3ConsumablesPdfMutation.isPending
  ) {
    return <BiaLoader color='accent' />;
  }

  return (
    <div className={styles.costContainer}>
      <div className={styles.costCard}>
        <div className={styles.costHeader}>
          <BiaText
            token='heading-2'
            color='strong'
            className={styles.costTitle}
          >
            {t('detail_tab_cost.title')}
          </BiaText>
          {isExpiredOT && (
            <BiaText
              token='caption'
              color='error'
              className={styles.expiredMessage}
            >
              {t('detail_tab_cost.expired_message')}
            </BiaText>
          )}
          {user?.user?.role !== RolesEnum.CONTRACTOR && (
            <BiaText
              token='caption'
              color='blue02'
              className={styles.expiredMessage}
            >
              {t('detail_tab_cost.rol_wrong_message').replace(
                '${ROL}',
                user?.user?.role_description || 'que posees'
              )}
            </BiaText>
          )}
        </div>

        <div className={styles.formGrid}>
          <div className={styles.formField}>
            <BiaInput
              label={t('detail_tab_cost.service_cost')}
              type='text'
              value={formatCurrency(formData.serviceCost)}
              onIonInput={(e) =>
                handleCostChange('serviceCost', e.detail.value || '')
              }
              onBlur={() => handleBlur('serviceCost')}
              disabled={!isEditable || isExpiredOT}
              required
              className={styles.costInput}
            />
            {errors.serviceCost && (
              <BiaText
                token='caption'
                color='error'
                className={styles.errorText}
              >
                {errors.serviceCost}
              </BiaText>
            )}
          </div>

          <div className={styles.formField}>
            <BiaInput
              label={t('detail_tab_cost.transport_cost')}
              type='text'
              value={formatCurrency(formData.transportCost)}
              onIonInput={(e) =>
                handleCostChange('transportCost', e.detail.value || '')
              }
              onBlur={() => handleBlur('transportCost')}
              disabled={!isEditable || isExpiredOT}
              required
              className={styles.costInput}
            />
            {errors.transportCost && (
              <BiaText
                token='caption'
                color='error'
                className={styles.errorText}
              >
                {errors.transportCost}
              </BiaText>
            )}
          </div>

          <div className={styles.formField}>
            <BiaInput
              label={t('detail_tab_cost.material_cost')}
              type='text'
              value={formatCurrency(formData.materialCost)}
              onIonInput={(e) =>
                handleCostChange('materialCost', e.detail.value || '')
              }
              onBlur={() => handleBlur('materialCost')}
              disabled={!isEditable || isExpiredOT}
              required
              className={styles.costInput}
            />
            {errors.materialCost && (
              <BiaText
                token='caption'
                color='error'
                className={styles.errorText}
              >
                {errors.materialCost}
              </BiaText>
            )}
          </div>

          <div className={styles.formField}>
            <BiaInput
              label={t('detail_tab_cost.other_cost')}
              type='text'
              value={formatCurrency(formData.otherCost)}
              onIonInput={(e) =>
                handleCostChange('otherCost', e.detail.value || '')
              }
              onBlur={() => handleBlur('otherCost')}
              disabled={!isEditable || isExpiredOT}
              required
              className={styles.costInput}
            />
            {errors.otherCost && (
              <BiaText
                token='caption'
                color='error'
                className={styles.errorText}
              >
                {errors.otherCost}
              </BiaText>
            )}
          </div>
          <div className={styles.formFieldFull}>
            {/* Sección de carga de archivos */}
            <div className={styles.fileUploadSection}>
              <BiaText
                token='caption'
                color='weak'
                className={styles.fileUploadTitle}
              >
                {t('detail_tab_cost.attach_consumables')}
              </BiaText>

              <input
                ref={fileInputRef}
                type='file'
                accept='.pdf,.zip,application/pdf,application/zip'
                onChange={handleFileChange}
                className={styles.hiddenFileInput}
                disabled={!isEditable || isExpiredOT}
              />

              {/* Mostrar archivo existente de consumables_pdf si es válido */}
              {isValidConsumableUrl(costs.consumables_pdf) &&
              !uploadedFile &&
              !removedExistingFile ? (
                <div className={styles.filePreview}>
                  <div className={styles.fileInfo}>
                    <BiaIcon
                      iconName={
                        costs.consumables_pdf?.toLowerCase().endsWith('.pdf')
                          ? 'faFilePdf'
                          : 'faFileZipper'
                      }
                      iconType='solid'
                      size='20px'
                      color='accent'
                    />
                    <div className={styles.fileDetails}>
                      <BiaText
                        token='bodySemibold'
                        color='strong'
                      >
                        {getFileNameFromUrl(costs.consumables_pdf || '')}
                      </BiaText>
                      <BiaText
                        token='caption'
                        color='weak'
                      >
                        {t('detail_tab_cost.existing_file')}
                      </BiaText>
                    </div>
                  </div>
                  <div className={styles.fileActions}>
                    <button
                      type='button'
                      onClick={handleDownloadConsumable}
                      className={styles.downloadFileButton}
                      aria-label='Descargar archivo'
                    >
                      <BiaIcon
                        iconName='faDownload'
                        iconType='solid'
                        size='14px'
                        color='accent'
                      />
                    </button>
                    {isEditable && !isExpiredOT && (
                      <button
                        type='button'
                        onClick={handleRemoveExistingFile}
                        className={styles.removeFileButton}
                        aria-label='Eliminar archivo'
                      >
                        <BiaIcon
                          iconName='faTrash'
                          iconType='solid'
                          size='14px'
                          color='error'
                        />
                      </button>
                    )}
                  </div>
                </div>
              ) : !uploadedFile ? (
                <button
                  type='button'
                  onClick={handleUploadClick}
                  disabled={!isEditable || isExpiredOT}
                  className={styles.uploadButton}
                >
                  <BiaIcon
                    iconName='faCloudArrowUp'
                    iconType='solid'
                    size='16px'
                    color='strong'
                  />
                  <span>{t('detail_tab_cost.select_file')}</span>
                </button>
              ) : (
                <div className={styles.filePreview}>
                  <div className={styles.fileInfo}>
                    <BiaIcon
                      iconName={
                        uploadedFile.name.endsWith('.pdf')
                          ? 'faFilePdf'
                          : 'faFileZipper'
                      }
                      iconType='solid'
                      size='20px'
                      color='accent'
                    />
                    <div className={styles.fileDetails}>
                      <BiaText
                        token='bodySemibold'
                        color='strong'
                      >
                        {uploadedFile.name}
                      </BiaText>
                      <BiaText
                        token='caption'
                        color='weak'
                      >
                        {formatFileSize(uploadedFile.size)}
                      </BiaText>
                    </div>
                  </div>
                  <button
                    type='button'
                    onClick={handleRemoveFile}
                    className={styles.removeFileButton}
                    disabled={!isEditable || isExpiredOT}
                  >
                    <BiaIcon
                      iconName='faTrash'
                      iconType='solid'
                      size='14px'
                      color='error'
                    />
                  </button>
                </div>
              )}
            </div>
          </div>
          <div className={styles.formFieldFull}>
            <BiaTextArea
              label={t('detail_tab_cost.comments')}
              value={formData.comments}
              onIonChange={(e) =>
                handleCostChange('comments', e.detail.value || '')
              }
              disabled={!isEditable || isExpiredOT}
              required={false}
              rows={4}
              className={styles.costTextArea}
            />
          </div>
        </div>

        {isEditable && !isExpiredOT && (
          <div className={styles.actionsContainer}>
            <button
              type='button'
              disabled={!isFormValid()}
              onClick={handleSaveCosts}
              className={styles.saveButton}
            >
              {t('detail_tab_cost.save_costs')}
            </button>
          </div>
        )}
      </div>

      <ResumeCostModal
        isOpen={showResumeModal}
        onClose={() => {
          trackEvent('OPS_MODAL_CONFIRMAR_CANCEL', { ot_id: visitId });
          setShowResumeModal(false);
        }}
        onConfirm={handleConfirmSave}
        serviceCost={parseInt(formData.serviceCost, 10) || 0}
        transportCost={parseInt(formData.transportCost, 10) || 0}
        materialCost={parseInt(formData.materialCost, 10) || 0}
        otherCost={parseInt(formData.otherCost, 10) || 0}
      />

      {toastMessage && (
        <BiaToast
          message={toastMessage.message}
          theme={toastMessage.type}
          onClose={() => setToastMessage(null)}
        />
      )}
    </div>
  );
};
