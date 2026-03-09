import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { BiaLoader, BiaText } from '@entropy/index';
import { TableConfines, Filters, AgeingSortOrder } from '../../components';
import { TranslationNamespaces } from '@shared/i18n';
import styles from './Scopes.module.css';
import {
  EStatusScope,
  ITypeScope,
  EScopeType,
  IRequirement,
} from '@hv/scopes/data/interfaces/scopes.interface';
import {
  STORAGE_KEY_BIA_CODE,
  STORAGE_KEY_SCOPE_TYPE,
  STORAGE_KEY_NETWORK_OPERATOR,
  STORAGE_KEY_ACTIVE_TAB,
} from '@hv/scopes/data/interfaces/keysSession.interface';
import { useIonRouter } from '@ionic/react';
import { useScopes } from '@hv/scopes/data/hooks/useScopes';

export const Scopes = () => {
  const { t } = useTranslation(TranslationNamespaces.SCOPES);
  const [activeTab, setActiveTab] = useState<EStatusScope>(() => {
    const saved = sessionStorage.getItem(STORAGE_KEY_ACTIVE_TAB);
    return (saved as EStatusScope) || EStatusScope.DOCUMENT_VALIDATION;
  });
  const router = useIonRouter();
  const {
    getNetworkOperatorRegistryMutation,
    postRequirementsSearchMutation,
    getTotalScopesMutation,
  } = useScopes();
  const [listNetworkOperators, setListNetworkOperators] = useState<string[]>(
    []
  );
  const [listScopeTypes, setListScopeTypes] = useState<ITypeScope[]>([]);
  const [confinesData, setConfinesData] = useState<IRequirement[]>([]);
  const [page, setPage] = useState<number>(0);
  const [size] = useState<number>(10);
  const [totalPages, setTotalPages] = useState<number>(0);
  const [totalScopes, setTotalScopes] = useState<{
    [key in EStatusScope]: number;
  }>({
    [EStatusScope.DOCUMENT_VALIDATION]: 0,
    [EStatusScope.SCOPE_DEFINITION]: 0,
    [EStatusScope.COMPLETED]: 0,
  });

  // Estados para los filtros - inicializar desde sessionStorage
  const [biaCode, setBiaCode] = useState(() => {
    return sessionStorage.getItem(STORAGE_KEY_BIA_CODE) || '';
  });
  const [scopeType, setScopeType] = useState<string[]>(() => {
    const saved = sessionStorage.getItem(STORAGE_KEY_SCOPE_TYPE);
    return saved ? JSON.parse(saved) : [];
  });
  const [networkOperator, setNetworkOperator] = useState<string[]>(() => {
    const saved = sessionStorage.getItem(STORAGE_KEY_NETWORK_OPERATOR);
    return saved ? JSON.parse(saved) : [];
  });

  // Estado para el ordenamiento de ageing
  const [ageingSortOrder, setAgeingSortOrder] =
    useState<AgeingSortOrder>('asc');

  // Función para buscar requirements
  const searchRequirements = () => {
    // Si viene __all__, enviar array vacío, sino enviar el array completo
    const filteredScopeTypes = scopeType.includes('__all__') ? [] : scopeType;
    const filteredNetworkOperators = networkOperator.includes('__all__')
      ? []
      : networkOperator;

    const request = {
      status: activeTab.toString(),
      direction: (ageingSortOrder === 'asc' ? 'ASC' : 'DESC') as 'ASC' | 'DESC',
      bia_code_or_sic_code:
        biaCode === '' || biaCode.length > 3 ? biaCode : null,
      type_scopes: filteredScopeTypes,
      network_operators: filteredNetworkOperators,
      page,
      size,
    };

    postRequirementsSearchMutation.mutate(request, {
      onSuccess: (data) => {
        setConfinesData(data.requirements);
        setTotalPages(data.total_pages);
        setTotalScopes((prev) => ({
          ...prev,
          [activeTab]: data.total_records,
        }));
        postRequirementsSearchMutation.reset();
      },
      onError: () => {
        postRequirementsSearchMutation.reset();
      },
    });
  };

  // Handler para el cambio de ordenamiento de ageing
  const handleAgeingSortChange = (order: AgeingSortOrder) => {
    setAgeingSortOrder(order);
  };

  // Handler para el click en una fila
  const handleRowClick = (requirement: IRequirement) => {
    switch (requirement.scope_type) {
      case EScopeType.INSTALLATION:
        break;
      case EScopeType.NORMALIZATION:
        router.push(
          `/admin-regulatory/scopes/${requirement.id}/${requirement.internal_bia_code}`
        );
        break;
      default:
        break;
    }
  };

  const tabs = [
    { key: EStatusScope.DOCUMENT_VALIDATION, label: t('tabs.validation') },
    { key: EStatusScope.SCOPE_DEFINITION, label: t('tabs.definition') },
    { key: EStatusScope.COMPLETED, label: t('tabs.finished') },
  ];

  // Cargar catálogos al iniciar
  useEffect(() => {
    getNetworkOperatorRegistryMutation.mutate(undefined, {
      onSuccess: (data) => {
        setListNetworkOperators(data.network_operators);
        setListScopeTypes(data.type_scopes);
        getNetworkOperatorRegistryMutation.reset();
      },
      onError: () => {
        getNetworkOperatorRegistryMutation.reset();
      },
    });

    getTotalScopesMutation.mutate(undefined, {
      onSuccess: (data) => {
        setTotalScopes(data);
        getTotalScopesMutation.reset();
      },
      onError: () => {
        getTotalScopesMutation.reset();
      },
    });
  }, []);

  // Buscar requirements al iniciar y cuando cambien los filtros o el tab activo
  useEffect(() => {
    // Solo buscar si biaCode está vacío o tiene más de 3 caracteres
    searchRequirements();
  }, [activeTab, scopeType, networkOperator, ageingSortOrder, page]);

  useEffect(() => {
    if (biaCode.length === 0 || biaCode.length > 3) {
      searchRequirements();
    }
  }, [biaCode]);

  // Resetear página cuando cambien los filtros
  useEffect(() => {
    if (page !== 0) {
      setPage(0);
    }
  }, [biaCode, scopeType, networkOperator]);

  // Sincronizar tab activo con sessionStorage
  useEffect(() => {
    sessionStorage.setItem(STORAGE_KEY_ACTIVE_TAB, activeTab);
  }, [activeTab]);

  // Sincronizar filtros con sessionStorage
  useEffect(() => {
    if (biaCode) {
      sessionStorage.setItem(STORAGE_KEY_BIA_CODE, biaCode);
    } else {
      sessionStorage.removeItem(STORAGE_KEY_BIA_CODE);
    }
  }, [biaCode]);

  useEffect(() => {
    if (scopeType.length > 0) {
      sessionStorage.setItem(STORAGE_KEY_SCOPE_TYPE, JSON.stringify(scopeType));
    } else {
      sessionStorage.removeItem(STORAGE_KEY_SCOPE_TYPE);
    }
  }, [scopeType]);

  useEffect(() => {
    if (networkOperator.length > 0) {
      sessionStorage.setItem(
        STORAGE_KEY_NETWORK_OPERATOR,
        JSON.stringify(networkOperator)
      );
    } else {
      sessionStorage.removeItem(STORAGE_KEY_NETWORK_OPERATOR);
    }
  }, [networkOperator]);

  return (
    <div className={styles.detailContainer}>
      {(getNetworkOperatorRegistryMutation.isPending ||
        postRequirementsSearchMutation.isPending ||
        getTotalScopesMutation.isPending) && <BiaLoader color='accent' />}
      <div className={styles.titleContainer}>
        <BiaText
          token='heading-2'
          color='standardOn'
        >
          {t('title')}
        </BiaText>
      </div>
      <Filters
        biaCode={biaCode}
        scopeType={scopeType}
        networkOperator={networkOperator}
        listNetworkOperators={listNetworkOperators}
        listScopeTypes={listScopeTypes}
        onBiaCodeChange={setBiaCode}
        onScopeTypeChange={setScopeType}
        onNetworkOperatorChange={setNetworkOperator}
      />
      <div className={styles.tabsContainer}>
        {tabs.map((tab) => (
          <button
            key={tab.key}
            className={
              activeTab === tab.key
                ? `${styles.tabItem} ${styles.tabItemActive}`
                : styles.tabItem
            }
            onClick={() => {
              setActiveTab(tab.key);
              setPage(0);
            }}
            type='button'
          >
            {tab.label} ({totalScopes[tab.key]})
          </button>
        ))}
      </div>
      <div className={styles.contentContainer}>
        {activeTab === EStatusScope.DOCUMENT_VALIDATION && (
          <div className={styles.tabContent}>
            <TableConfines
              data={confinesData}
              currentPage={page}
              totalPages={totalPages}
              onPageChange={setPage}
              onAgeingSortChange={handleAgeingSortChange}
              onRowClick={handleRowClick}
            />
          </div>
        )}
        {activeTab === EStatusScope.SCOPE_DEFINITION && (
          <div className={styles.tabContent}>
            <TableConfines
              data={confinesData}
              currentPage={page}
              totalPages={totalPages}
              onPageChange={setPage}
              onAgeingSortChange={handleAgeingSortChange}
              onRowClick={handleRowClick}
            />
          </div>
        )}
        {activeTab === EStatusScope.COMPLETED && (
          <div className={styles.tabContent}>
            <TableConfines
              data={confinesData}
              currentPage={page}
              totalPages={totalPages}
              onPageChange={setPage}
              onAgeingSortChange={handleAgeingSortChange}
              onRowClick={handleRowClick}
            />
          </div>
        )}
      </div>
    </div>
  );
};
