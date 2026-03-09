import { useTranslation } from 'react-i18next';
import { BiaModalDesktop, BiaText } from '@entropy/index';
import { TranslationNamespaces } from '@shared/i18n';
import styles from './ModalConfirmScope.module.css';

interface ModalConfirmScopeProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
}

export const ModalConfirmScope: React.FC<ModalConfirmScopeProps> = ({
  isOpen,
  onClose,
  onConfirm,
}) => {
  const { t } = useTranslation(TranslationNamespaces.SCOPES);

  return (
    <BiaModalDesktop
      isOpen={isOpen}
      onClose={onClose}
      title={t('modal_confirm_scope.title')}
      width={480}
      confirmText={t('modal_confirm_scope.button_confirm')}
      cancelText={t('modal_confirm_scope.button_cancel')}
      onConfirm={onConfirm}
      onCancel={onClose}
    >
      <div className={styles.contentContainer}>
        <BiaText
          token='bodyRegular'
          color='standard'
        >
          {t('modal_confirm_scope.message')}
        </BiaText>
      </div>
    </BiaModalDesktop>
  );
};
