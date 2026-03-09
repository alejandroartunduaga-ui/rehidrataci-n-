import { useParams } from 'react-router-dom';
import { BiaBreadcrumb, BreadcrumbItem, BiaLoader } from '@entropy/index';
import { useTranslation } from 'react-i18next';
import { TranslationNamespaces } from '@shared/i18n';
import styles from './DetailScope.module.css';
import { useDetailScope } from '@hv/scopes/data/hooks/useDetailScope';
import { useEffect, useState } from 'react';
import {
  IGetRequirementDetailResponse,
  IHistoryScopeItem,
} from '@hv/scopes/data/interfaces/detailScopes.interface';
import { GeneralInfoScope, HistoryScope } from '../../components';

enum ETabsDetailScope {
  GENERAL_INFO = 'GENERAL_INFO',
  HISTORY = 'HISTORY',
}

export const DetailScope = () => {
  const { t } = useTranslation(TranslationNamespaces.SCOPES);
  const { scopeId, biaCode } = useParams<{
    scopeId: string;
    biaCode: string;
  }>();
  const { getRequirementDetailMutation, getHistoryScopeMutation } =
    useDetailScope();
  const [detailData, setDetailData] =
    useState<IGetRequirementDetailResponse | null>(null);
  const [activeTab, setActiveTab] = useState<ETabsDetailScope>(
    ETabsDetailScope.GENERAL_INFO
  );
  const [historyScope, setHistoryScope] = useState<IHistoryScopeItem[]>([]);

  const breadcrumbItems: BreadcrumbItem[] = [
    { label: t('title'), href: '/admin-regulatory/scopes' },
    {
      label: biaCode || scopeId || '',
      active: true,
    },
  ];

  const tabs = [
    { key: ETabsDetailScope.GENERAL_INFO, label: 'Información general' },
    { key: ETabsDetailScope.HISTORY, label: 'Historial' },
  ];

  useEffect(() => {
    if (scopeId) {
      getRequirementDetailMutation.mutate(
        { scope_id: scopeId },
        {
          onSuccess: (data) => {
            setDetailData(data);
            getRequirementDetailMutation.reset();
          },
          onError: () => {
            getRequirementDetailMutation.reset();
          },
        }
      );
      getHistoryScopeMutation.mutate(
        { scope_id: scopeId },
        {
          onSuccess: (data) => {
            setHistoryScope(data);
            getHistoryScopeMutation.reset();
          },
          onError: () => {
            getHistoryScopeMutation.reset();
          },
        }
      );
    }
  }, [scopeId]);

  return (
    <div className={styles.detailContainer}>
      {(getRequirementDetailMutation.isPending ||
        getHistoryScopeMutation.isPending) && <BiaLoader color='accent' />}
      <BiaBreadcrumb items={breadcrumbItems} />
      <div className={styles.tabsContainer}>
        {tabs.map((tab) => (
          <button
            key={tab.key}
            className={
              activeTab === tab.key
                ? `${styles.tabItem} ${styles.tabItemActive}`
                : styles.tabItem
            }
            onClick={() => setActiveTab(tab.key)}
            type='button'
          >
            {tab.label}
          </button>
        ))}
      </div>

      <div className={styles.contentContainer}>
        {activeTab === ETabsDetailScope.GENERAL_INFO && (
          <div className={styles.tabContent}>
            {detailData && (
              <GeneralInfoScope
                generalInfo={detailData.general_border_information}
                technicalInfo={detailData.technical_information}
                otInfo={detailData.ot_info}
                cgmInfo={detailData.cgm_info}
                scopeDefinition={detailData.scope_definition}
                biaCode={biaCode}
                scopeId={scopeId || ''}
              />
            )}
          </div>
        )}

        {activeTab === ETabsDetailScope.HISTORY && (
          <div className={styles.tabContent}>
            <HistoryScope history={historyScope} />
          </div>
        )}
      </div>
    </div>
  );
};
