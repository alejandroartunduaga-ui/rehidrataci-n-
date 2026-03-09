import { BiaText } from '@entropy/index';
import { TranslationNamespaces } from '@shared/i18n';
import { useTranslation } from 'react-i18next';
import styles from './CardDetailFrontier.module.css';

interface CardDetailFrontierProps {
  contract_id: number;
  contract_name: string;
  network_operator: string;
  company_id: number;
  code_sic: string;
  internal_bia_code: string;
  address: string;
}

export const CardDetailFrontier = ({
  contract_id,
  contract_name,
  network_operator,
  company_id,
  code_sic,
  internal_bia_code,
  address,
}: CardDetailFrontierProps) => {
  const { t } = useTranslation(TranslationNamespaces.TECHNICAL_LIFE_SHEET);

  return (
    <div className={styles.card}>
      <div className={styles.title}>
        <BiaText
          token='heading-3'
          color='standardOn'
        >
          {t('card_detail_frontier.title')}
        </BiaText>
      </div>

      <div className={styles.content}>
        {/* 1. Nombre de la frontera */}
        <div className={styles.field}>
          <BiaText
            className={styles.label}
            token='label'
            color='weak'
          >
            {t('card_detail_frontier.contract_name')}
          </BiaText>
          <BiaText
            className={styles.value}
            token='bodyRegular'
            color='standardOn'
          >
            {contract_name || '-'}
          </BiaText>
        </div>

        {/* 2. Código Bia */}
        <div className={styles.field}>
          <BiaText
            className={styles.label}
            token='label'
            color='weak'
          >
            {t('card_detail_frontier.internal_bia_code')}
          </BiaText>
          <BiaText
            className={styles.value}
            token='bodyRegular'
            color='standardOn'
          >
            {internal_bia_code || '-'}
          </BiaText>
        </div>

        {/* 3. Company ID */}
        <div className={styles.field}>
          <BiaText
            className={styles.label}
            token='caption'
            color='weak'
          >
            {t('card_detail_frontier.company_id')}
          </BiaText>
          <BiaText
            className={styles.value}
            token='bodyRegular'
            color='standardOn'
          >
            {company_id || '-'}
          </BiaText>
        </div>

        {/* 4. Contract ID */}
        <div className={styles.field}>
          <BiaText
            className={styles.label}
            token='caption'
            color='weak'
          >
            {t('card_detail_frontier.contract_id')}
          </BiaText>
          <BiaText
            className={styles.value}
            token='bodyRegular'
            color='standardOn'
          >
            {contract_id || '-'}
          </BiaText>
        </div>

        {/* 5. Código SIC */}
        <div className={styles.field}>
          <BiaText
            className={styles.label}
            token='caption'
            color='weak'
          >
            {t('card_detail_frontier.code_sic')}
          </BiaText>
          <BiaText
            className={styles.value}
            token='bodyRegular'
            color='standardOn'
          >
            {code_sic || '-'}
          </BiaText>
        </div>

        {/* 6. Operador de Red */}
        <div className={styles.field}>
          <BiaText
            className={styles.label}
            token='caption'
            color='weak'
          >
            {t('card_detail_frontier.network_operator')}
          </BiaText>
          <BiaText
            className={styles.value}
            token='bodyRegular'
            color='standardOn'
          >
            {network_operator || '-'}
          </BiaText>
        </div>

        {/* 7. Dirección */}
        <div className={styles.field}>
          <BiaText
            className={styles.label}
            token='caption'
            color='weak'
          >
            {t('card_detail_frontier.address')}
          </BiaText>
          <BiaText
            className={styles.value}
            token='bodyRegular'
            color='standardOn'
          >
            {address || '-'}
          </BiaText>
        </div>
      </div>
    </div>
  );
};
