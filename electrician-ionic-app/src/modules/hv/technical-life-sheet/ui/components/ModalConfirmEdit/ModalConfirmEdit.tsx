import { useTranslation } from 'react-i18next';
import { BiaModalDesktop, BiaText } from '@entropy/index';
import { TranslationNamespaces } from '@shared/i18n';
import styles from './ModalConfirmEdit.module.css';

interface ModalConfirmEditProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
}

export const ModalConfirmEdit: React.FC<ModalConfirmEditProps> = ({
  isOpen,
  onClose,
  onConfirm,
}) => {
  const { t } = useTranslation(TranslationNamespaces.TECHNICAL_LIFE_SHEET);

  return (
    <BiaModalDesktop
      isOpen={isOpen}
      onClose={onClose}
      title={t('modal_confirm_edit.title')}
      width={480}
      confirmText={t('modal_confirm_edit.button_confirm')}
      cancelText={t('modal_confirm_edit.button_cancel')}
      onConfirm={onConfirm}
      onCancel={onClose}
    >
      <div className={styles.contentContainer}>
        <BiaText
          token='bodyRegular'
          color='standard'
        >
          {t('modal_confirm_edit.message')}
        </BiaText>
      </div>
    </BiaModalDesktop>
  );
};
