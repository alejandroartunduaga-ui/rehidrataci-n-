import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { BiaModalDesktop, BiaOpenDropdownList, BiaText } from '@entropy/index';
import { RolesEnum } from '@auth/index';
import {
  useWorkOrders,
  useWorkOrdersFiltersStore,
} from '@desktop/work-orders/data';
import { TranslationNamespaces } from '@shared/i18n';
import { useAuthStore } from '@shared/index';
import { ConfirmClearModal } from '../ConfirmClearModal/ConfirmClearModal';
import styles from './AdvancedFiltersModal.module.css';

interface AdvancedFiltersModalProps {
  open: boolean;
  onClose: () => void;
}

export const AdvancedFiltersModal: React.FC<AdvancedFiltersModalProps> = ({
  open,
  onClose,
}) => {
  // Usar el store global para los filtros
  const {
    types,
    status,
    contractor,
    electrician,
    city,
    networkOperator,
    acta,
    setTypes,
    setStatus,
    setContractor,
    setElectrician,
    setCity,
    setNetworkOperator,
    setActa,
    clearFilters,
  } = useWorkOrdersFiltersStore();
  const { t } = useTranslation(TranslationNamespaces.WORK_ORDERS);
  const { user } = useAuthStore();
  const isContractor = user?.user?.role === RolesEnum.CONTRACTOR;

  // Sidebar navigation (estático por ahora)
  const sidebarItems = [
    { key: 'service_type', label: t('filters.type') },
    { key: 'status', label: t('filters.status') },
    ...(!isContractor
      ? [{ key: 'contractor', label: t('filters.contractor') }]
      : []),
    { key: 'electrician', label: t('filters.electrician') },
    { key: 'city', label: t('filters.city') },
    { key: 'network_operator', label: t('filters.network_operator') },
    { key: 'acta', label: t('filters.acta.title') },
  ];
  const [selectedSection, setSelectedSection] = useState('service_type');

  const { getFiltersMutation } = useWorkOrders();
  const [selectedTypes, setSelectedTypes] = useState<string[]>(types);
  const [selectedStatus, setSelectedStatus] = useState<string[]>(status);
  const [selectedContractor, setSelectedContractor] =
    useState<string[]>(contractor);
  const [selectedElectricians, setSelectedElectricians] =
    useState<string[]>(electrician);
  const [selectedCity, setSelectedCity] = useState<string[]>(city);
  const [selectedNetworkOperator, setSelectedNetworkOperator] =
    useState<string[]>(networkOperator);
  const [selectedActa, setSelectedActa] = useState<string[]>(acta);
  const [resetSearchTrigger, setResetSearchTrigger] = useState(false);

  const { data: filters } = getFiltersMutation;

  // Filtrar electricistas según los contratistas seleccionados
  const filteredContractors = selectedContractor.filter((c) => c !== '__all__');
  let filteredElectricians = filters?.electricians || [];
  if (filteredContractors.length > 0) {
    filteredElectricians = filteredElectricians.filter((e) =>
      filteredContractors.includes(e.contractor_id)
    );
  }

  // Sincronizar tipos seleccionados con los props
  useEffect(() => {
    if (open) {
      setSelectedTypes(types);
      setSelectedStatus(status);
      setSelectedContractor(contractor);
      setSelectedElectricians(electrician);
      setSelectedCity(city);
      setSelectedNetworkOperator(networkOperator);
      setSelectedActa(acta);
    }
  }, [
    open,
    types,
    status,
    contractor,
    electrician,
    city,
    networkOperator,
    acta,
  ]);

  // Al aplicar, actualizar el filtro real
  const handleApply = () => {
    setTypes(selectedTypes.length > 0 ? selectedTypes : ['__all__']);
    setStatus(selectedStatus.length > 0 ? selectedStatus : ['__all__']);
    setContractor(
      selectedContractor.length > 0 ? selectedContractor : ['__all__']
    );
    setElectrician(
      selectedElectricians.length > 0 ? selectedElectricians : ['__all__']
    );
    setCity(selectedCity.length > 0 ? selectedCity : ['__all__']);
    setNetworkOperator(
      selectedNetworkOperator.length > 0 ? selectedNetworkOperator : ['__all__']
    );
    setActa(selectedActa.length > 0 ? selectedActa : ['__all__']);
    onClose();
  };

  const [showConfirm, setShowConfirm] = useState(false);

  const handleClear = () => {
    setShowConfirm(true);
  };

  const handleConfirmClear = () => {
    clearFilters();
    setSelectedTypes([]);
    setSelectedStatus([]);
    setSelectedContractor([]);
    setSelectedElectricians([]);
    setSelectedCity([]);
    setSelectedNetworkOperator([]);
    setSelectedActa([]);
    // Trigger para resetear los campos de búsqueda
    setResetSearchTrigger(true);
    setTimeout(() => setResetSearchTrigger(false), 100);
    setShowConfirm(false);
  };

  return (
    <>
      <BiaModalDesktop
        isOpen={open}
        onClose={onClose}
        title={t('filters.title')}
        width={580}
        height={500}
        confirmText={t('filters.apply')}
        cancelText={t('filters.clear')}
        onConfirm={handleApply}
        onCancel={handleClear}
      >
        <div className={styles.advancedFiltersLayout}>
          {/* Sidebar */}
          <aside className={styles.sidebar}>
            {sidebarItems.map((item) => (
              <button
                key={item.key}
                className={
                  selectedSection === item.key
                    ? styles.sidebarItemActive
                    : styles.sidebarItem
                }
                onClick={() => setSelectedSection(item.key)}
                type='button'
              >
                <span>{item.label}</span>
              </button>
            ))}
          </aside>
          {/* Main content */}
          <section className={styles.contentSection}>
            {selectedSection === 'service_type' && (
              <>
                <BiaText
                  token='caption'
                  color='weak'
                >
                  {t('filters.type')}
                </BiaText>
                <BiaOpenDropdownList
                  options={(filters?.service_types || []).map((t) => ({
                    label: t.name,
                    value: t.value,
                  }))}
                  value={selectedTypes}
                  onChange={setSelectedTypes}
                  placeholder={t('filters.search_type')}
                  selectAllLabel={t('filters.all_types')}
                  resetSearch={resetSearchTrigger}
                />
              </>
            )}
            {selectedSection === 'status' && (
              <>
                <BiaText
                  token='caption'
                  color='weak'
                >
                  {t('filters.status')}
                </BiaText>
                <BiaOpenDropdownList
                  options={(filters?.group_status || []).map((s) => ({
                    label: s.name,
                    value: s.value,
                  }))}
                  value={selectedStatus}
                  onChange={setSelectedStatus}
                  placeholder={t('filters.search_status')}
                  selectAllLabel={t('filters.all_status')}
                  resetSearch={resetSearchTrigger}
                />
              </>
            )}
            {selectedSection === 'contractor' && !isContractor && (
              <>
                <BiaText
                  token='caption'
                  color='weak'
                >
                  {t('filters.contractor')}
                </BiaText>
                <BiaOpenDropdownList
                  options={(filters?.contractors || []).map((c) => ({
                    label: c.name,
                    value: c.value,
                  }))}
                  value={selectedContractor}
                  onChange={setSelectedContractor}
                  placeholder={t('filters.search_contractor')}
                  selectAllLabel={t('filters.all_contractors')}
                  resetSearch={resetSearchTrigger}
                />
              </>
            )}
            {selectedSection === 'electrician' && (
              <>
                <BiaText
                  token='caption'
                  color='weak'
                >
                  {t('filters.electrician')}
                </BiaText>
                <BiaOpenDropdownList
                  options={filteredElectricians.map((e) => ({
                    label: e.name,
                    value: e.value,
                  }))}
                  value={selectedElectricians}
                  onChange={setSelectedElectricians}
                  placeholder={t('filters.search_electrician')}
                  selectAllLabel={t('filters.all_electricians')}
                  resetSearch={resetSearchTrigger}
                />
              </>
            )}
            {selectedSection === 'city' && (
              <>
                <BiaText
                  token='caption'
                  color='weak'
                >
                  {t('filters.city')}
                </BiaText>
                <BiaOpenDropdownList
                  options={(filters?.cities || []).map((c) => ({
                    label: c.name,
                    value: c.value,
                  }))}
                  value={selectedCity}
                  onChange={setSelectedCity}
                  placeholder={t('filters.search_city')}
                  selectAllLabel={t('filters.all_cities')}
                  resetSearch={resetSearchTrigger}
                />
              </>
            )}
            {selectedSection === 'network_operator' && (
              <>
                <BiaText
                  token='caption'
                  color='weak'
                >
                  {t('filters.network_operator')}
                </BiaText>
                <BiaOpenDropdownList
                  options={(filters?.network_operators || []).map((n) => ({
                    label: n.name,
                    value: n.value,
                  }))}
                  value={selectedNetworkOperator}
                  onChange={setSelectedNetworkOperator}
                  placeholder={t('filters.search_network_operator')}
                  selectAllLabel={t('filters.all_network_operators')}
                  resetSearch={resetSearchTrigger}
                />
              </>
            )}
            {selectedSection === 'acta' && (
              <>
                <BiaText
                  token='caption'
                  color='weak'
                >
                  {t('filters.acta.title')}
                </BiaText>
                <BiaOpenDropdownList
                  options={[
                    { label: t('filters.acta.generated'), value: 'GENERATED' },
                    { label: t('filters.acta.pending'), value: 'PENDING' },
                  ]}
                  value={selectedActa}
                  onChange={setSelectedActa}
                  placeholder={t('filters.acta.search')}
                  selectAllLabel={t('filters.acta.all')}
                  resetSearch={resetSearchTrigger}
                />
              </>
            )}
          </section>
        </div>
      </BiaModalDesktop>
      <ConfirmClearModal
        open={showConfirm}
        onCancel={() => setShowConfirm(false)}
        onConfirm={handleConfirmClear}
      />
    </>
  );
};
