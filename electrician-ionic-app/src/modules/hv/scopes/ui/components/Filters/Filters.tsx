import { useTranslation } from 'react-i18next';
import { BiaInput, BiaDropdown, DropdownOption } from '@entropy/index';
import { TranslationNamespaces } from '@shared/i18n';
import { ITypeScope } from '@hv/scopes/data/interfaces/scopes.interface';
import styles from './Filters.module.css';

interface FiltersProps {
  biaCode: string;
  scopeType: string[];
  networkOperator: string[];
  listNetworkOperators: string[];
  listScopeTypes: ITypeScope[];
  onBiaCodeChange: (value: string) => void;
  onScopeTypeChange: (value: string[]) => void;
  onNetworkOperatorChange: (value: string[]) => void;
}

export const Filters = ({
  biaCode,
  scopeType,
  networkOperator,
  listNetworkOperators,
  listScopeTypes,
  onBiaCodeChange,
  onScopeTypeChange,
  onNetworkOperatorChange,
}: FiltersProps) => {
  const { t } = useTranslation(TranslationNamespaces.SCOPES);

  // Convertir las listas a opciones de dropdown
  const scopeTypeOptions: DropdownOption[] = listScopeTypes.map((type) => ({
    label: type.name,
    value: type.id.toString(),
  }));

  const networkOperatorOptions: DropdownOption[] = listNetworkOperators.map(
    (operator) => ({
      label: operator,
      value: operator,
    })
  );

  return (
    <div className={styles.filtersContainer}>
      <BiaInput
        type='text'
        placeholder={t('filters.bia_code_placeholder')}
        value={biaCode}
        onIonInput={(e) => onBiaCodeChange(e.detail.value!.trim())}
        onClear={() => onBiaCodeChange('')}
        clearable
        className={styles.filterInput}
        containerClassName={styles.filterInputContainer}
        icon='faSearch'
      />
      <BiaDropdown
        options={scopeTypeOptions}
        value={scopeType}
        onChange={(val) => {
          if (Array.isArray(val)) {
            onScopeTypeChange(val);
          }
        }}
        multiple
        placeholder={t('filters.scope_type_placeholder')}
        selectAllLabel={t('filters.all_scope_types')}
        searchable
        className={styles.filterInput}
      />
      <BiaDropdown
        options={networkOperatorOptions}
        value={networkOperator}
        onChange={(val) => {
          if (Array.isArray(val)) {
            onNetworkOperatorChange(val);
          }
        }}
        multiple
        placeholder={t('filters.network_operator_placeholder')}
        selectAllLabel={t('filters.all_network_operators')}
        searchable
        className={styles.filterInput}
      />
    </div>
  );
};
