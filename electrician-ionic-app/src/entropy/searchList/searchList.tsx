import React, { useState, useMemo } from 'react';
import { BiaInput } from '@entropy/input/input';
import { BiaIcon } from '@entropy/icon/Icon';
import styles from './searchList.module.css';

interface BiaSearchListProps {
  options: { label: string; value: string }[];
  value?: string;
  onChange: (value: string) => void;
  searchPlaceholder?: string;
  className?: string;
  maxHeight?: string;
}

export const BiaSearchList: React.FC<BiaSearchListProps> = ({
  options,
  value,
  onChange,
  searchPlaceholder = 'Buscar',
  className = '',
  maxHeight = '',
}) => {
  const [search, setSearch] = useState('');

  const filteredOptions = useMemo(
    () =>
      options.filter((opt) =>
        opt.label.toLowerCase().includes(search.toLowerCase())
      ),
    [options, search]
  );

  const selectedOption = filteredOptions.find((opt) => opt.value === value);
  const unselectedOptions = filteredOptions.filter(
    (opt) => opt.value !== value
  );

  const renderOption = (
    opt: { label: string; value: string },
    selected: boolean
  ) => (
    <button
      key={opt.value}
      onClick={() => onChange(opt.value)}
      className={`${styles.option} ${selected ? styles.selected : ''}`}
    >
      <span className={styles.radioIcon}>
        <BiaIcon
          iconName={selected ? 'faCircleDot' : 'faCircle'}
          iconType='regular'
          size='18px'
          color={selected ? 'accent' : 'weak'}
        />
        <span className={styles.optionLabel}>{opt.label}</span>
      </span>
    </button>
  );

  return (
    <div className={`${styles.searchListContainer} ${className}`}>
      <BiaInput
        value={search}
        onIonInput={(e) => setSearch(e.detail.value ?? '')}
        placeholder={searchPlaceholder}
        icon='faSearch'
        clearable
        onClear={() => setSearch('')}
        className={styles.searchInput}
      />
      <div
        className={styles.optionsList}
        style={{ maxHeight: maxHeight }}
      >
        {selectedOption && (
          <div className={styles.selectedSection}>
            {renderOption(selectedOption, true)}
          </div>
        )}
        {selectedOption && unselectedOptions.length > 0 && (
          <div className={styles.divider} />
        )}
        <div className={styles.unselectedSection}>
          {unselectedOptions.map((opt) => renderOption(opt, false))}
        </div>
      </div>
    </div>
  );
};
