import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { BiaModalDesktop, BiaText } from '@entropy/index';
import { TranslationNamespaces } from '@shared/i18n';

interface ReturnActaModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (observation: string) => void;
  jobCode: string;
  workOrderId: string;
  observation: string;
  setObservation: (value: string) => void;
  minChars?: number;
}

export const ReturnActaModal: React.FC<ReturnActaModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
  jobCode,
  workOrderId,
  observation,
  setObservation,
  minChars = 30,
}) => {
  const { t } = useTranslation(TranslationNamespaces.WORK_ORDERS);

  const count = useMemo(() => observation.trim().length, [observation]);
  const confirmDisabled = count < minChars;

  return (
    <BiaModalDesktop
      isOpen={isOpen}
      onClose={onClose}
      title={t('upload_acta.return')}
      width={480}
      height={320}
      confirmText="Aceptar"
      cancelText="Cancelar"
      onCancel={onClose}
      onConfirm={() => onConfirm(observation.trim())}
      confirmDisabled={confirmDisabled}
    >
      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
        <BiaText token="caption" color="standard">
          <strong>OT:</strong> {jobCode}
        </BiaText>

        <BiaText token="caption" color="standard">
          <strong>ID:</strong> {workOrderId}
        </BiaText>

        <BiaText token="caption" color="weak">
          Motivo de devolución:
        </BiaText>

        <textarea
          value={observation}
          onChange={(e) => setObservation(e.target.value)}
          rows={4}
          style={{
            width: '100%',
            padding: '8px',
            resize: 'none',
            borderRadius: '4px',
            border: '1px solid #ccc',
          }}
        />
      </div>
    </BiaModalDesktop>
  );
};