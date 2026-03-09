import React, { useEffect, useState } from 'react';
import { BiaIcon } from '@entropy/icon/Icon';
import styles from './BiaOpenDropdownList.module.css';

export interface OpenDropdownOption {
  label: string;
  value: string;
}

interface BiaOpenDropdownListProps {
  options: OpenDropdownOption[];
  value: string[];
  onChange: (value: string[]) => void;
  placeholder?: string;
  selectAllLabel?: string;
  className?: string;
  resetSearch?: boolean;
  showSelectAll?: boolean;
}

export const BiaOpenDropdownList: React.FC<BiaOpenDropdownListProps> = ({
  options,
  value,
  onChange,
  selectAllLabel = 'Todos',
  className = '',
  resetSearch = false,
  showSelectAll = true,
}) => {
  const [search, setSearch] = useState('');

  // Resetea el campo de búsqueda cuando resetSearch cambia a true
  useEffect(() => {
    if (resetSearch) {
      setSearch('');
    }
  }, [resetSearch]);

  // Opción "Todos"
  const allOption: OpenDropdownOption = {
    label: selectAllLabel,
    value: '__all__',
  };
  const allOptions = showSelectAll ? [allOption, ...options] : [...options];

  // Mostrar search solo si hay más de 10 opciones (sin contar 'Todos')
  const showSearch = options.length >= 10;

  // Filtrado por búsqueda
  const filteredOptions = showSearch
    ? allOptions.filter((opt) =>
        opt.label.toLowerCase().includes(search.toLowerCase())
      )
    : allOptions;

  // Normaliza el valor a array
  const selected = value || [];

  // Separa seleccionados y no seleccionados
  const selectedOptions = filteredOptions.filter((opt) =>
    selected.includes(opt.value)
  );
  const unselectedOptions = filteredOptions.filter(
    (opt) => !selected.includes(opt.value)
  );

  // Maneja selección
  const handleSelect = (val: string) => {
    const allValues = options.map((opt) => opt.value);
    if (val === '__all__') {
      if (selected.includes('__all__')) {
        onChange([]);
      } else {
        onChange(['__all__', ...allValues]);
      }
    } else {
      if (selected.includes('__all__')) {
        // Si "Todos" está seleccionado y deseleccionas una, solo quita esa y '__all__'
        const newSelected = allValues.filter((v) => v !== val);
        onChange(newSelected);
      } else {
        let newSelected = selected;
        if (selected.includes(val)) {
          newSelected = selected.filter((v) => v !== val);
        } else {
          newSelected = [...selected, val];
        }
        if (newSelected.length === 0) {
          onChange([]);
          return;
        }
        const nowAllSelected = allValues.every((v) => newSelected.includes(v));
        if (nowAllSelected) {
          onChange(['__all__', ...allValues]);
        } else {
          onChange(newSelected);
        }
      }
    }
  };

  const isChecked = (optValue: string) => {
    if (selected.includes('__all__')) return true;
    return selected.includes(optValue);
  };

  return (
    <div className={`${styles.openDropdownListContainer} ${className}`.trim()}>
      {showSearch && (
        <div className={styles.searchBox}>
          <BiaIcon
            iconName='faSearch'
            iconType='regular'
            size='12px'
            color='weak'
          />
          <input
            className={styles.searchInput}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder='Buscar'
          />
          {search && (
            <button
              type='button'
              className={styles.clearSearchBtn}
              onClick={() => setSearch('')}
              aria-label='Limpiar búsqueda'
            >
              <BiaIcon
                iconName='faXmark'
                iconType='solid'
                size='10px'
                color='inverse'
              />
            </button>
          )}
        </div>
      )}
      <div className={styles.openDropdownOptionsList}>
        {selectedOptions.length > 0 && (
          <div className={styles.selectedSection}>
            {selectedOptions.map((opt) => (
              <label
                key={opt.value}
                className={styles.openDropdownOption}
              >
                <input
                  type='checkbox'
                  checked={isChecked(opt.value)}
                  onChange={() => handleSelect(opt.value)}
                />
                <span className={styles.openDropdownCheckboxCustom} />
                <span className={styles.openDropdownOptionLabel}>
                  {opt.label}
                </span>
              </label>
            ))}
          </div>
        )}
        {selectedOptions.length > 0 && unselectedOptions.length > 0 && (
          <div className={styles.divider} />
        )}
        {unselectedOptions.length > 0 && (
          <div className={styles.unselectedSection}>
            {unselectedOptions.map((opt) => (
              <label
                key={opt.value}
                className={styles.openDropdownOption}
              >
                <input
                  type='checkbox'
                  checked={isChecked(opt.value)}
                  onChange={() => handleSelect(opt.value)}
                />
                <span className={styles.openDropdownCheckboxCustom} />
                <span className={styles.openDropdownOptionLabel}>
                  {opt.label}
                </span>
              </label>
            ))}
          </div>
        )}
        {filteredOptions.length === 0 && (
          <div className={styles.openDropdownNoOptions}>Sin opciones</div>
        )}
      </div>
    </div>
  );
};
