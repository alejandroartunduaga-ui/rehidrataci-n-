import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { BiaText } from '@entropy/index';
import { ISummary } from '@desktop/work-orders/data';
import { TranslationNamespaces } from '@shared/i18n';
import {
  DownloadCSV,
  Filters,
  TableOTs,
  WidgetsSummary,
} from '../../components';
import styles from './WorkOrders.module.css';

export const WorkOrders = () => {
  const { t } = useTranslation(TranslationNamespaces.WORK_ORDERS);
  const [summary, setSummary] = useState<ISummary | null>(null);

  // Usar el store global para los filtros
  /* const {
    code,
    dateRange,
    types,
    status,
    contractor,
    electrician,
    city,
    networkOperator,
    acta,
    page,
    setCode,
    setDateRange,
    setTypes,
    setStatus,
    setContractor,
    setElectrician,
    setCity,
    setNetworkOperator,
    setActa,
    setPage,
  } = useWorkOrdersFiltersStore(); */

  return (
    <div>
      <div className={styles.titleContainer}>
        <BiaText
          token='heading-2'
          color='standardOn'
        >
          {t('title')}
        </BiaText>
      </div>
      <DownloadCSV />
      <Filters />
      <WidgetsSummary summary={summary || null} />
      <TableOTs onSummaryChange={setSummary} />
    </div>
  );
};
