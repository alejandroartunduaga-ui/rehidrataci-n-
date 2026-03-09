import React, { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { BiaIcon, BiaText } from '@entropy/index';
import styles from './BiaDropdown.module.css';

export interface DropdownOption {
  label: string;
  value: string;
  disabled?: boolean;
}

interface BiaDropdownProps {
  options: DropdownOption[];
  value: string[] | string;
  onChange: (value: string[] | string) => void;
  multiple?: boolean;
  placeholder: string;
  selectAllLabel?: string;
  searchable?: boolean;
  className?: string;
  icon?: string;
  minWidthMenu?: string;
  widthInput?: string;
  label?: string;
  required?: boolean;
}

export const BiaDropdown: React.FC<BiaDropdownProps> = ({
  options,
  value,
  onChange,
  multiple = false,
  placeholder,
  selectAllLabel = 'Todos',
  searchable = false,
  className,
  icon,
  minWidthMenu,
  widthInput,
  label,
  required = false,
}) => {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState('');
  const ref = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const [menuPosition, setMenuPosition] = useState({
    top: 0,
    left: 0,
    width: 0,
  });

  // Calcular posición del menú
  useEffect(() => {
    if (open && buttonRef.current) {
      const rect = buttonRef.current.getBoundingClientRect();
      setMenuPosition({
        top: rect.bottom + window.scrollY + 4,
        left: rect.left + window.scrollX,
        width: rect.width,
      });
    }
  }, [open]);

  // Cierra el dropdown al hacer click fuera
  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (
        ref.current &&
        !ref.current.contains(e.target as Node) &&
        menuRef.current &&
        !menuRef.current.contains(e.target as Node)
      ) {
        setOpen(false);
      }
    };
    if (open) document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, [open]);

  // Normaliza el valor a array
  const selected = Array.isArray(value) ? value : value ? [value] : [];

  // Agrega la opción "Todos" solo si multiple es true
  const allOption: DropdownOption = { label: selectAllLabel, value: '__all__' };
  const allOptions = multiple ? [allOption, ...options] : options;

  // Filtra opciones por búsqueda
  const filteredOptions = allOptions.filter((opt) =>
    opt.label.toLowerCase().includes(search.toLowerCase())
  );

  // Separa opciones seleccionadas y no seleccionadas
  let selectedOptions = filteredOptions.filter((opt) =>
    selected.includes(opt.value)
  );
  let unselectedOptions = filteredOptions.filter(
    (opt) => !selected.includes(opt.value)
  );

  // Ordena para que "Todos" sea primero en su sección
  selectedOptions = selectedOptions.sort((a, b) =>
    a.value === '__all__' ? -1 : b.value === '__all__' ? 1 : 0
  );
  unselectedOptions = unselectedOptions.sort((a, b) =>
    a.value === '__all__' ? -1 : b.value === '__all__' ? 1 : 0
  );

  // Inicializa con todas seleccionadas si no hay selección
  useEffect(() => {
    if (multiple && selected.length === 0 && options.length > 0) {
      onChange(['__all__', ...options.map((opt) => opt.value)]);
    }
  }, [multiple, options.length]);

  // Maneja selección
  const handleSelect = (val: string) => {
    if (multiple) {
      const allValues = options.map((opt) => opt.value);
      if (val === '__all__') {
        if (selected.includes('__all__')) {
          // Desmarcar todo
          onChange([]);
        } else {
          // Marcar todo
          onChange(['__all__', ...allValues]);
        }
      } else {
        if (selected.includes('__all__')) {
          // Si "Todas" está seleccionada y deseleccionas una, solo quita esa y '__all__'
          const newSelected = allValues.filter((v) => v !== val);
          onChange(newSelected);
        } else {
          let newSelected = selected;
          if (selected.includes(val)) {
            // Desmarcar la opción
            newSelected = selected.filter((v) => v !== val);
          } else {
            // Marcar la opción
            newSelected = [...selected, val];
          }
          // Si no queda ninguna seleccionada, limpiar todo
          if (newSelected.length === 0) {
            onChange([]);
            return;
          }
          // Si todas las individuales quedan seleccionadas, agregar '__all__'
          const nowAllSelected = allValues.every((v) =>
            newSelected.includes(v)
          );
          if (nowAllSelected) {
            onChange(['__all__', ...allValues]);
          } else {
            onChange(newSelected);
          }
        }
      }
    } else {
      onChange(val);
      setOpen(false);
    }
  };

  const renderValue = () => {
    if (!selected.length) return placeholder;
    if (
      multiple &&
      selected.includes('__all__') &&
      selected.length === allOptions.length
    ) {
      return allOption.label;
    }
    const first = allOptions.find((o) => o.value === selected[0]);
    if (!first) return placeholder;
    if (multiple && selected.length > 1) {
      return `${first.label} (+${selected.length - 1})`;
    }
    return first.label;
  };

  const isChecked = (optValue: string) => {
    if (selected.includes('__all__')) {
      // Si "Todos" está seleccionado, todos los checks deben estar activos
      return true;
    }
    return selected.includes(optValue);
  };

  return (
    <>
      <div
        style={{ width: widthInput || '' }}
        className={`${styles.dropdownContainer} ${className || ''}`}
        ref={ref}
      >
        {label && (
          <BiaText
            className={styles.labelText}
            color='error'
            token='bodySemibold'
          >
            {`${required ? '* ' : ''}`}
            <BiaText
              className={styles.label}
              color='weak'
              token='caption'
            >
              {label}
            </BiaText>
          </BiaText>
        )}
        <button
          ref={buttonRef}
          className={`${styles.input} ${open ? styles.inputActive : ''}`}
          onClick={() => setOpen((o) => !o)}
          type='button'
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            {icon && (
              <BiaIcon
                iconName={icon}
                iconType='solid'
                size='12px'
                color='weak'
              />
            )}
            <span
              className={
                selected.length ? styles.inputValue : styles.inputPlaceholder
              }
            >
              {renderValue()}
            </span>
          </div>
          <BiaIcon
            iconName='faChevronDown'
            iconType='solid'
            size='12px'
            color='weak'
          />
        </button>
      </div>
      {open &&
        createPortal(
          <div
            ref={menuRef}
            className={styles.dropdownMenu}
            style={{
              position: 'fixed',
              top: `${menuPosition.top}px`,
              left: `${menuPosition.left}px`,
              width: minWidthMenu || `${menuPosition.width}px`,
            }}
          >
            {searchable && (
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
                  placeholder='Buscar...'
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
            <div className={styles.optionsList}>
              {selectedOptions.length > 0 && (
                <div className={styles.selectedSection}>
                  {selectedOptions.map((opt) => (
                    <button
                      key={opt.value}
                      className={`${styles.option} ${!multiple && styles.singleOption} ${isChecked(opt.value) ? styles.activeOption : ''} ${opt.disabled ? styles.disabledOption : ''}`}
                      onClick={() => !opt.disabled && handleSelect(opt.value)}
                      disabled={opt.disabled}
                    >
                      <span className={styles.checkCircle}>
                        {multiple ? (
                          isChecked(opt.value) ? (
                            <BiaIcon
                              iconName='faSquareCheck'
                              iconType='solid'
                              color='accent'
                              size='18px'
                            />
                          ) : (
                            <BiaIcon
                              iconName='faSquare'
                              iconType='regular'
                              color='weak'
                              size='18px'
                            />
                          )
                        ) : isChecked(opt.value) ? (
                          <BiaIcon
                            iconName='faCircleDot'
                            iconType='regular'
                            color='accent'
                            size='20px'
                          />
                        ) : (
                          <BiaIcon
                            iconName='faCircle'
                            iconType='regular'
                            color='weak'
                            size='20px'
                          />
                        )}
                      </span>
                      <span className={styles.optionLabel}>{opt.label}</span>
                    </button>
                  ))}
                </div>
              )}
              {selectedOptions.length > 0 && unselectedOptions.length > 0 && (
                <div className={styles.divider} />
              )}
              {unselectedOptions.length > 0 && (
                <div className={styles.unselectedSection}>
                  {unselectedOptions.map((opt) => (
                    <button
                      key={opt.value}
                      className={`${styles.option} ${!multiple && styles.singleOption} ${opt.disabled ? styles.disabledOption : ''}`}
                      onClick={() => !opt.disabled && handleSelect(opt.value)}
                      disabled={opt.disabled}
                    >
                      <span className={styles.checkCircle}>
                        {multiple ? (
                          isChecked(opt.value) ? (
                            <BiaIcon
                              iconName='faSquareCheck'
                              iconType='solid'
                              color='accent'
                              size='18px'
                            />
                          ) : (
                            <BiaIcon
                              iconName='faSquare'
                              iconType='regular'
                              color='weak'
                              size='18px'
                            />
                          )
                        ) : isChecked(opt.value) ? (
                          <BiaIcon
                            iconName='faCircleDot'
                            iconType='solid'
                            color='accent'
                            size='20px'
                          />
                        ) : (
                          <BiaIcon
                            iconName='faCircle'
                            iconType='regular'
                            color='weak'
                            size='20px'
                          />
                        )}
                      </span>
                      <span className={styles.optionLabel}>{opt.label}</span>
                    </button>
                  ))}
                </div>
              )}
              {!filteredOptions.length && (
                <div className={styles.noOptions}>Sin opciones</div>
              )}
            </div>
          </div>,
          document.body
        )}
    </>
  );
};
