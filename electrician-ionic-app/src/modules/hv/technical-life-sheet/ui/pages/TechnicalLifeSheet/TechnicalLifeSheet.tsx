import { BiaText, BiaLoader, BiaToast } from '@entropy/index';
import { TranslationNamespaces } from '@shared/i18n';
import { CardFormHv } from '../../components/CardFormHv/CardFormHv';
import { CardDetailFrontier } from '../../components/CardDetailFrontier/CardDetailFrontier';
import { CardTableVersionsHv } from '../../components/CardTableVersionsHv/CardTableVersionsHv';
import {
  useSearchContract,
  ISearchContractRequest,
  IHistoryCvContent,
} from '../../../data';
import styles from './TechnicalLifeSheet.module.css';
import { useTranslation } from 'react-i18next';
import { useState, useEffect } from 'react';
import { useIonRouter } from '@ionic/react';

export const TechnicalLifeSheet = () => {
  const { t } = useTranslation(TranslationNamespaces.TECHNICAL_LIFE_SHEET);
  const router = useIonRouter();
  const {
    searchContractMutation,
    getTechnicalLifeDetailsMutation,
    getTechnicalLifeDetailsPdfMutation,
    contract,
    searchParams,
    clearContract,
  } = useSearchContract();
  const [toastMessage, setToastMessage] = useState<{
    message: string;
    type: 'error' | 'success';
  } | null>(null);
  const [notFoundFrontier, setNotFoundFrontier] = useState(false);
  const [currentPage, setCurrentPage] = useState(0);
  const [lastSearchParams, setLastSearchParams] = useState<{
    code_bia: string;
    sic_code: string;
  } | null>(null);
  const [latestVersion, setLatestVersion] = useState<IHistoryCvContent | null>(
    null
  );

  const getLatestVersion = (
    historyCv: IHistoryCvContent[]
  ): IHistoryCvContent | null => {
    if (!historyCv || historyCv.length === 0) return null;
    return historyCv.reduce((latest, current) => {
      const latestVersionNumber = parseInt(latest.version.replace('v', ''), 10);
      const currentVersionNumber = parseInt(
        current.version.replace('v', ''),
        10
      );

      return currentVersionNumber > latestVersionNumber ? current : latest;
    });
  };

  const handleSearch = (
    code_bia: string,
    sic_code: string,
    page: number = 0
  ) => {
    const request: ISearchContractRequest = {
      search_texts: code_bia,
      sic: sic_code,
      page: page,
    };

    setLastSearchParams({ code_bia, sic_code });
    setCurrentPage(page);

    searchContractMutation.mutate(request, {
      onSuccess: (data) => {
        searchContractMutation.reset();
        setNotFoundFrontier(false);
        if (page === 0 && data.history_cv && data.history_cv.content) {
          const latest = getLatestVersion(data.history_cv.content);
          setLatestVersion(latest);
        }
      },
      onError: (error) => {
        searchContractMutation.reset();
        clearContract();
        if (error.message.includes('404')) {
          setNotFoundFrontier(true);
          setToastMessage({
            message: t('error_search_contract_404'),
            type: 'error',
          });
        } else {
          setNotFoundFrontier(false);
          setToastMessage({
            message: t('error_search_contract'),
            type: 'error',
          });
        }
      },
    });
  };

  const handlePageChange = (newPage: number) => {
    if (lastSearchParams) {
      handleSearch(
        lastSearchParams.code_bia,
        lastSearchParams.sic_code,
        newPage
      );
    }
  };

  const handleEditVersion = (cvId: number) => {
    router.push(
      `/admin-regulatory/technical-life-sheet/${cvId}/${contract?.contract_id?.toString() || ''}`
    );
  };

  const handleDownloadPdf = (cvId: number, version: string) => {
    getTechnicalLifeDetailsPdfMutation.mutate(
      { cv_id: cvId.toString() },
      {
        onSuccess: (response) => {
          getTechnicalLifeDetailsPdfMutation.reset();
          router.push(
            `/admin-regulatory/technical-life-sheet/view-document/${version}/${encodeURIComponent(response.url)}`
          );
        },
      }
    );
  };

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const handleRowClick = (item: IHistoryCvContent) => {
    return;
  };

  // Ejecutar búsqueda automáticamente si existen searchParams en sessionStorage
  useEffect(() => {
    if (searchParams && !contract) {
      handleSearch(
        searchParams.search_texts,
        searchParams.sic,
        searchParams.page
      );
    }
  }, []);

  return (
    <div>
      {(searchContractMutation.isPending ||
        getTechnicalLifeDetailsMutation.isPending ||
        getTechnicalLifeDetailsPdfMutation.isPending) && (
        <BiaLoader color='accent' />
      )}
      <div className={styles.titleContainer}>
        <BiaText
          token='heading-2'
          color='standardOn'
        >
          {t('title')}
        </BiaText>
      </div>
      <div style={{ padding: '25px' }}>
        <CardFormHv
          onSubmit={handleSearch}
          clearInputs={() => {
            clearContract();
            setNotFoundFrontier(false);
          }}
        />
        {contract && (
          <>
            <CardDetailFrontier
              contract_id={contract.contract_id}
              contract_name={contract.contract_name}
              network_operator={contract.network_operator}
              company_id={contract.company_id}
              code_sic={contract.code_sic}
              internal_bia_code={contract.internal_bia_code}
              address={contract.address}
            />
            <CardTableVersionsHv
              historyCv={contract.history_cv}
              onDownloadPdf={handleDownloadPdf}
              onRowClick={handleRowClick}
              currentPage={currentPage}
              onPageChange={handlePageChange}
              latestVersion={latestVersion}
              onEditVersion={handleEditVersion}
            />
          </>
        )}
        {notFoundFrontier && (
          <BiaText
            token='caption'
            color='weak'
          >
            {t('error_search_contract_404')}
          </BiaText>
        )}
      </div>
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
