import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { TooltipPortal } from '@shared/components/TooltipPortal/TooltipPortal';
import { TranslationNamespaces } from '@shared/i18n';
import styles from './TableOts.module.css';

interface CopyCellProps {
  value: string;
  noEllipsis?: boolean;
}

export const CopyCell: React.FC<CopyCellProps> = ({ value, noEllipsis }) => {
  const [copied, setCopied] = useState(false);
  const { t } = useTranslation(TranslationNamespaces.WORK_ORDERS);

  return (
    <button
      className={noEllipsis ? undefined : styles.ellipsisText}
      style={{
        position: 'relative',
        cursor: 'pointer',
        background: 'transparent',
        color: 'var(--ink-weak)',
        border: 'none',
        padding: 0,
        margin: 0,
        fontSize: '12px',
        fontWeight: 400,
        lineHeight: '20px',
      }}
      onClick={(e) => {
        e.stopPropagation();
        navigator.clipboard.writeText(value);
        setCopied(true);
        setTimeout(() => setCopied(false), 1200);
      }}
      onMouseLeave={() => setCopied(false)}
      tabIndex={0}
      aria-label={t('copy.copy')}
    >
      <TooltipPortal
        text={copied ? t('copy.copied') : value}
        ellipsis={!noEllipsis}
      >
        {value}
      </TooltipPortal>
    </button>
  );
};
