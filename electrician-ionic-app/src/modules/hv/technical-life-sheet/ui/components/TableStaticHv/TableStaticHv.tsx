import { useState, useEffect, useRef, useCallback } from 'react';
import {
  useReactTable,
  getCoreRowModel,
  flexRender,
  ColumnResizeMode,
  CellContext,
} from '@tanstack/react-table';
import {
  BiaText,
  BiaInput,
  BiaDatePickerSimple,
  BiaTimerPicker,
  BiaDropdown,
} from '@entropy/index';
import {
  IGroupsHv,
  ETypesHv,
  IFieldHv,
} from '../../../data/interfaces/searchContract.interface';
import styles from './TableStaticHv.module.css';
import { convertToIsoFormat } from '@shared/utils/date';

// Normalizar valores para prellenado (minúsculas y sin tildes) - Solo para dropdowns
const normalizeForDisplay = (value: string): string => {
  return value
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, ''); // Remover acentos
};

// Componente de celda para inputs de texto y número
const TableInputCell = ({
  field,
  initialValue,
  onChange,
}: {
  field: IFieldHv;
  initialValue: string;
  onChange: (value: string) => void;
}) => {
  const [value, setValue] = useState(initialValue);
  const [hasPatternError, setHasPatternError] = useState(false);
  const prevInitialValueRef = useRef(initialValue);
  const isFirstRender = useRef(true);

  // Solo sincronizar con initialValue si realmente cambió
  useEffect(() => {
    if (isFirstRender.current) {
      isFirstRender.current = false;
      prevInitialValueRef.current = initialValue;
      return;
    }

    // Solo actualizar si initialValue cambió desde el padre
    // Y el valor local sigue siendo igual al valor anterior del padre
    if (
      prevInitialValueRef.current !== initialValue &&
      value === prevInitialValueRef.current
    ) {
      setValue(initialValue);
      prevInitialValueRef.current = initialValue;

      // Validar pattern al sincronizar
      if (initialValue && field.regex) {
        const regex = new RegExp(field.regex);
        setHasPatternError(!regex.test(initialValue));
      } else {
        setHasPatternError(false);
      }
    } else if (prevInitialValueRef.current !== initialValue) {
      prevInitialValueRef.current = initialValue;
    }
  }, [initialValue, field.regex, value]);

  const handleChange = (e: CustomEvent) => {
    let newValue = e.detail.value || '';

    // Validación específica para INTEGER
    if (field.type === ETypesHv.INTEGER) {
      newValue = newValue.replace(/[^0-9-]/g, '');
      if (newValue.indexOf('-') > 0) {
        newValue = newValue.replace(/-/g, '');
      }
      // Validar que no exceda el máximo permitido (2147483647)
      const numValue = Number(newValue);
      if (newValue && !isNaN(numValue) && numValue > 2147483647) {
        newValue = '2147483647';
      }
    }

    // Validación específica para NUMBER
    if (field.type === ETypesHv.NUMBER) {
      // Validar que no exceda el máximo permitido (2147483647)
      const numValue = Number(newValue);
      if (newValue && !isNaN(numValue) && numValue > 2147483647) {
        newValue = '2147483647';
      }
    }

    // Validación específica para FLOAT
    if (field.type === ETypesHv.FLOAT) {
      newValue = newValue.replace(/[^0-9.-]/g, '');
      const parts = newValue.split('.');
      if (parts.length > 2) {
        newValue = parts[0] + '.' + parts.slice(1).join('');
      }
      if (newValue.indexOf('-') > 0) {
        newValue = newValue.replace(/-/g, '');
      }
      if (parts.length === 2 && parts[1].length > 7) {
        newValue = parts[0] + '.' + parts[1].substring(0, 7);
      }
    }

    setValue(newValue);

    // Validar pattern si existe
    if (newValue && field.regex) {
      const regex = new RegExp(field.regex);
      setHasPatternError(!regex.test(newValue));
    } else {
      setHasPatternError(false);
    }

    onChange(newValue);
  };

  // Determinar el tipo de input y placeholder
  const getInputType = () => {
    if (field.type === ETypesHv.NUMBER || field.type === ETypesHv.INTEGER) {
      return 'number';
    }
    return 'text';
  };

  const getPlaceholder = () => {
    if (field.type === ETypesHv.INTEGER) return 'Número entero';
    if (field.type === ETypesHv.FLOAT) return 'Número decimal';
    return 'Ingrese';
  };

  const getPattern = () => {
    if (field.regex) return field.regex;
    if (field.type === ETypesHv.INTEGER) return '^-?\\d+$';
    if (field.type === ETypesHv.FLOAT) return '^-?\\d+(\\.\\d{1,7})?$';
    return undefined;
  };

  const getHelperMessage = () => {
    if (field.description_regex) return field.description_regex;
    if (field.type === ETypesHv.INTEGER) return 'Solo números enteros';
    if (field.type === ETypesHv.FLOAT)
      return 'Máximo 7 decimales separados por punto';
    return undefined;
  };

  return (
    <BiaInput
      label=''
      placeholder={getPlaceholder()}
      type={getInputType()}
      value={value}
      containerClassName={styles.inputTableStaticHv}
      readonly={!field.editable}
      required={field.mandatory}
      disabled={!field.editable}
      clearable={field.editable}
      pattern={getPattern()}
      error={hasPatternError}
      errorMessage='Formato inválido'
      helperMessage={getHelperMessage()}
      onIonInput={handleChange}
    />
  );
};

// Componente de celda para DatePicker
const TableDatePickerCell = ({
  field,
  initialValue,
  onChange,
}: {
  field: IFieldHv;
  initialValue: string;
  onChange: (value: string) => void;
}) => {
  const [value, setValue] = useState(initialValue);
  const prevInitialValueRef = useRef(initialValue);
  const isFirstRender = useRef(true);

  // Solo sincronizar con initialValue si realmente cambió
  useEffect(() => {
    if (isFirstRender.current) {
      isFirstRender.current = false;
      prevInitialValueRef.current = initialValue;
      return;
    }

    if (
      prevInitialValueRef.current !== initialValue &&
      value === prevInitialValueRef.current
    ) {
      setValue(initialValue);
      prevInitialValueRef.current = initialValue;
    } else if (prevInitialValueRef.current !== initialValue) {
      prevInitialValueRef.current = initialValue;
    }
  }, [initialValue, value]);

  const handleChange = (newValue: string) => {
    setValue(newValue);
    onChange(newValue);
  };

  return (
    <BiaDatePickerSimple
      label=''
      required={field.mandatory}
      value={value}
      disabled={!field.editable}
      onDateChange={handleChange}
    />
  );
};

// Componente de celda para TimePicker
const TableTimePickerCell = ({
  field,
  initialValue,
  onChange,
}: {
  field: IFieldHv;
  initialValue: string;
  onChange: (value: string) => void;
}) => {
  // Parsear fecha y hora del valor inicial (formato: "YYYY-MM-DD HH:mm" o "YYYY-MM-DDTHH:mm")
  const parseDateTime = (val: string) => {
    if (!val) return { date: '', time: '' };

    // Reemplazar 'T' con espacio para normalizar
    const normalized = val.replace('T', ' ');
    const parts = normalized.split(' ');

    if (parts.length >= 2) {
      return { date: parts[0], time: parts[1] };
    } else if (parts.length === 1) {
      // Si solo hay fecha o solo hora
      if (parts[0].includes(':')) {
        return { date: '', time: parts[0] };
      } else {
        return { date: parts[0], time: '' };
      }
    }
    return { date: '', time: '' };
  };

  const initialParsed = parseDateTime(initialValue);
  const [dateValue, setDateValue] = useState(initialParsed.date);
  const [timeValue, setTimeValue] = useState(initialParsed.time);
  const prevInitialValueRef = useRef(initialValue);
  const isFirstRender = useRef(true);

  // Solo sincronizar con initialValue si realmente cambió
  useEffect(() => {
    if (isFirstRender.current) {
      isFirstRender.current = false;
      prevInitialValueRef.current = initialValue;
      return;
    }

    if (
      prevInitialValueRef.current !== initialValue &&
      `${dateValue} ${timeValue}`.trim() === prevInitialValueRef.current.trim()
    ) {
      const parsed = parseDateTime(initialValue);
      setDateValue(parsed.date);
      setTimeValue(parsed.time);
      prevInitialValueRef.current = initialValue;
    } else if (prevInitialValueRef.current !== initialValue) {
      prevInitialValueRef.current = initialValue;
    }
  }, [initialValue, dateValue, timeValue]);

  // Combinar fecha y hora para el valor final
  const combineDateTime = (date: string, time: string): string => {
    if (!date && !time) return '';
    if (!date) return time;
    if (!time) return date;
    return `${date} ${time}`;
  };

  const handleDateChange = (newDate: string) => {
    setDateValue(newDate);
    // Si la fecha está vacía, también limpiar la hora
    if (!newDate || newDate.trim() === '') {
      setTimeValue('');
      onChange('');
      return;
    }
    // Si hay fecha pero no hay hora, establecer la hora actual
    if (!timeValue || timeValue.trim() === '') {
      const now = new Date();
      const currentTime = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
      setTimeValue(currentTime);
      const combined = combineDateTime(newDate, currentTime);
      onChange(convertToIsoFormat(combined) || '');
      return;
    }
    const combined = combineDateTime(newDate, timeValue);
    onChange(convertToIsoFormat(combined) || '');
  };

  const handleTimeChange = (newTime: string | null) => {
    // Si la hora es null o está vacía, establecer "00:00" automáticamente
    if (!newTime || newTime.trim() === '') {
      setTimeValue('00:00');
      if (dateValue && dateValue.trim() !== '') {
        const combined = combineDateTime(dateValue, '00:00');
        onChange(convertToIsoFormat(combined) || '');
      } else {
        onChange('');
      }
      return;
    }
    setTimeValue(newTime);
    const combined = combineDateTime(dateValue, newTime);
    onChange(convertToIsoFormat(combined) || '');
  };

  // Formatear el valor de tiempo a HH:mm
  const formatTimeValue = (val: string): string | undefined => {
    if (!val) return undefined;

    // Si ya está en formato HH:mm, retornarlo directamente
    if (/^\d{2}:\d{2}$/.test(val)) {
      return val;
    }

    // Si está en formato ISO o tiene más partes, extraer HH:mm
    const timeMatch = val.match(/(\d{2}):(\d{2})/);
    if (timeMatch) {
      return `${timeMatch[1]}:${timeMatch[2]}`;
    }

    // Si no se puede parsear, retornar undefined
    return undefined;
  };

  return (
    <div className={styles.dateTimeContainer}>
      <BiaDatePickerSimple
        label=''
        required={field.mandatory}
        value={dateValue}
        disabled={!field.editable}
        onDateChange={handleDateChange}
      />
      <BiaTimerPicker
        value={formatTimeValue(timeValue)}
        disabled={!field.editable}
        hasDate={!!dateValue && dateValue.trim() !== ''}
        onTimeChange={handleTimeChange}
      />
    </div>
  );
};

// Componente de celda para Dropdown (simple)
const TableDropdownCell = ({
  field,
  initialValue,
  onChange,
}: {
  field: IFieldHv;
  initialValue: string;
  onChange: (value: string) => void;
}) => {
  const [value, setValue] = useState(initialValue);
  const prevInitialValueRef = useRef(initialValue);
  const isFirstRender = useRef(true);

  // Solo sincronizar con initialValue si realmente cambió
  useEffect(() => {
    if (isFirstRender.current) {
      isFirstRender.current = false;
      prevInitialValueRef.current = initialValue;
      return;
    }

    if (
      prevInitialValueRef.current !== initialValue &&
      value === prevInitialValueRef.current
    ) {
      setValue(initialValue);
      prevInitialValueRef.current = initialValue;
    } else if (prevInitialValueRef.current !== initialValue) {
      prevInitialValueRef.current = initialValue;
    }
  }, [initialValue, value]);

  const handleChange = (newValue: string | string[]) => {
    const stringValue =
      typeof newValue === 'string' ? newValue : newValue[0] || '';
    setValue(stringValue);
    onChange(stringValue);
  };

  return (
    <BiaDropdown
      label=''
      widthInput='100%'
      placeholder={`Seleccione`}
      options={
        field.items?.map((item) => ({
          label: item.option,
          value: normalizeForDisplay(item.option),
        })) || []
      }
      multiple={false}
      required={field.mandatory}
      value={value}
      onChange={handleChange}
    />
  );
};

// Componente de celda para Dropdown Multiple
const TableDropdownMultipleCell = ({
  field,
  initialValue,
  onChange,
}: {
  field: IFieldHv;
  initialValue: string;
  onChange: (value: string) => void;
}) => {
  const [value, setValue] = useState<string[]>(() => {
    // Parsear el valor inicial si es un string JSON
    try {
      return initialValue ? JSON.parse(initialValue) : [];
    } catch {
      return initialValue ? [initialValue] : [];
    }
  });
  const prevInitialValueRef = useRef(initialValue);
  const isFirstRender = useRef(true);

  // Solo sincronizar con initialValue si realmente cambió
  useEffect(() => {
    if (isFirstRender.current) {
      isFirstRender.current = false;
      prevInitialValueRef.current = initialValue;
      return;
    }

    if (
      prevInitialValueRef.current !== initialValue &&
      JSON.stringify(value) === prevInitialValueRef.current
    ) {
      try {
        const parsed = initialValue ? JSON.parse(initialValue) : [];
        setValue(parsed);
        prevInitialValueRef.current = initialValue;
      } catch {
        setValue(initialValue ? [initialValue] : []);
        prevInitialValueRef.current = initialValue;
      }
    } else if (prevInitialValueRef.current !== initialValue) {
      prevInitialValueRef.current = initialValue;
    }
  }, [initialValue, value]);

  const handleChange = (newValue: string | string[]) => {
    const arrayValue = Array.isArray(newValue) ? newValue : [newValue];
    setValue(arrayValue);
    // Guardar como JSON string para mantener compatibilidad con el estado
    onChange(JSON.stringify(arrayValue));
  };

  return (
    <BiaDropdown
      label=''
      widthInput='100%'
      placeholder={`Seleccione`}
      options={
        field.items?.map((item) => ({
          label: item.option,
          value: normalizeForDisplay(item.option),
        })) || []
      }
      multiple={true}
      required={field.mandatory}
      value={value}
      onChange={handleChange}
    />
  );
};

interface TableStaticHvProps {
  groups: IGroupsHv[] | null;
  sectionId: string;
  emptyMessage?: string;
  tableFormData: { [key: string]: string };
  onTableValuesChange?: (values: { [key: string]: string }) => void;
}

const TableStaticHvComponent = ({
  groups,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  sectionId,
  emptyMessage = 'No hay datos disponibles',
  tableFormData,
  onTableValuesChange,
}: TableStaticHvProps) => {
  const [columnResizeMode] = useState<ColumnResizeMode>('onChange');

  // Estado interno sincronizado con tableFormData del padre
  const [internalFormData, setInternalFormData] = useState(tableFormData);

  // Ref para mantener valores actualizados sin causar re-renders
  const internalFormDataRef = useRef(internalFormData);

  // Ref para rastrear si estamos en medio de un cambio del usuario
  const isUserChangeRef = useRef(false);

  // Mantener el ref actualizado
  useEffect(() => {
    internalFormDataRef.current = internalFormData;
  }, [internalFormData]);

  // Sincronizar con el prop tableFormData SOLO si no es un cambio del usuario
  useEffect(() => {
    if (!isUserChangeRef.current) {
      setInternalFormData(tableFormData);
    }
    isUserChangeRef.current = false;
  }, [tableFormData]);

  // Manejar cambios en los campos
  const handleFieldChangeInternal = useCallback(
    (event: CustomEvent, fieldName: string) => {
      const value = event.detail.value || '';
      const key = fieldName; // Para tabla estática, la key es solo el field_name

      const newValues = {
        ...internalFormDataRef.current,
        [key]: value,
      };

      // Marcar que este es un cambio del usuario
      isUserChangeRef.current = true;

      // Actualizar estado interno inmediatamente
      setInternalFormData(newValues);

      // Notificar al padre con todos los valores actualizados
      if (onTableValuesChange) {
        onTableValuesChange(newValues);
      }
    },
    [onTableValuesChange]
  );

  // Ref para almacenar columnas y evitar recrearlas en cada render
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const columnsRef = useRef<any[]>([]);
  const prevGroupsRef = useRef<IGroupsHv[] | null>(null);

  // Solo recrear columnas si groups realmente cambió
  if (groups !== prevGroupsRef.current) {
    prevGroupsRef.current = groups;

    if (!groups || groups.length === 0) {
      columnsRef.current = [];
    } else {
      const firstGroup = groups[0];

      // Primera columna: Nombre de la fila
      const nameColumn = {
        id: 'row_name',
        header: () => (
          <BiaText
            token='caption'
            color='standardOn'
          >
            {/* Vacío o un título genérico */}
          </BiaText>
        ),
        cell: (info: CellContext<IGroupsHv, unknown>) => {
          const rowIndex = info.row.index;
          const currentGroup = groups[rowIndex];
          return (
            <BiaText
              color='weak'
              token='caption'
            >
              {currentGroup.name}
            </BiaText>
          );
        },
      };

      // Columnas para cada field (FASE R, FASE S, FASE T, etc.)
      const fieldColumns = firstGroup.fields.map((field, fieldIndex) => ({
        id: field.title || `column_${fieldIndex}`,
        header: () => (
          <BiaText
            token='caption'
            color='standardOn'
          >
            {field.title}
          </BiaText>
        ),
        cell: (info: CellContext<IGroupsHv, unknown>) => {
          const rowIndex = info.row.index;
          const currentGroup = groups[rowIndex];
          const currentField = currentGroup.fields[fieldIndex];

          // Validar que el campo existe
          if (!currentField || !currentField.field_name) {
            return (
              <BiaText
                token='bodyRegular'
                color='weak'
              >
                -
              </BiaText>
            );
          }

          // Leer el valor del estado interno usando ref
          const key = `${currentField.field_name}`;
          const fieldValue = internalFormDataRef.current[key] || '';

          switch (currentField.type) {
            case ETypesHv.STRING:
            case ETypesHv.NUMBER:
            case ETypesHv.INTEGER:
            case ETypesHv.FLOAT:
              return (
                <TableInputCell
                  field={currentField}
                  initialValue={fieldValue}
                  onChange={(newValue) => {
                    const fakeEvent = {
                      detail: { value: newValue },
                    } as CustomEvent;
                    handleFieldChangeInternal(
                      fakeEvent,
                      currentField.field_name
                    );
                  }}
                />
              );
            case ETypesHv.DATE:
              return (
                <TableDatePickerCell
                  field={currentField}
                  initialValue={fieldValue}
                  onChange={(newValue) => {
                    const fakeEvent = {
                      detail: { value: newValue },
                    } as CustomEvent;
                    handleFieldChangeInternal(
                      fakeEvent,
                      currentField.field_name
                    );
                  }}
                />
              );
            case ETypesHv.TIME:
              return (
                <TableTimePickerCell
                  field={currentField}
                  initialValue={fieldValue}
                  onChange={(newValue) => {
                    const fakeEvent = {
                      detail: { value: newValue },
                    } as CustomEvent;
                    handleFieldChangeInternal(
                      fakeEvent,
                      currentField.field_name
                    );
                  }}
                />
              );
            case ETypesHv.DROPDOWN_ONE:
              return (
                <TableDropdownCell
                  field={currentField}
                  initialValue={fieldValue}
                  onChange={(newValue) => {
                    const fakeEvent = {
                      detail: { value: newValue },
                    } as CustomEvent;
                    handleFieldChangeInternal(
                      fakeEvent,
                      currentField.field_name
                    );
                  }}
                />
              );
            case ETypesHv.DROPDOWN_MULTIPLE:
              return (
                <TableDropdownMultipleCell
                  field={currentField}
                  initialValue={fieldValue}
                  onChange={(newValue) => {
                    const fakeEvent = {
                      detail: { value: newValue },
                    } as CustomEvent;
                    handleFieldChangeInternal(
                      fakeEvent,
                      currentField.field_name
                    );
                  }}
                />
              );
            default:
              return (
                <BiaText
                  token='bodyRegular'
                  color='weak'
                >
                  {fieldValue || '-'}
                </BiaText>
              );
          }
        },
      }));

      columnsRef.current = [nameColumn, ...fieldColumns];
    }
  }

  const columns = columnsRef.current;

  const table = useReactTable({
    data: groups || [],
    columns,
    getCoreRowModel: getCoreRowModel(),
    columnResizeMode,
    enableColumnResizing: true,
    defaultColumn: {
      size: 200,
      minSize: 100,
      maxSize: 500,
    },
    getRowId: (row, index) => `row-${index}`,
  });

  return (
    <div className={styles.tableContainer}>
      {groups && groups.length > 0 ? (
        <table
          className={styles.table}
          style={{
            width: '100%',
          }}
        >
          <thead className={styles.tableHeader}>
            {table.getHeaderGroups().map((headerGroup) => (
              <tr key={headerGroup.id}>
                {headerGroup.headers.map((header) => (
                  <th
                    key={header.id}
                    className={styles.tableHeaderCell}
                    style={{
                      width: header.getSize(),
                      position: 'relative',
                    }}
                  >
                    {header.isPlaceholder
                      ? null
                      : flexRender(
                          header.column.columnDef.header,
                          header.getContext()
                        )}
                    <div
                      onMouseDown={header.getResizeHandler()}
                      onTouchStart={header.getResizeHandler()}
                      className={`${styles.resizer} ${
                        header.column.getIsResizing() ? styles.isResizing : ''
                      }`}
                    />
                  </th>
                ))}
              </tr>
            ))}
          </thead>
          <tbody>
            {table.getRowModel().rows.map((row) => (
              <tr key={row.id}>
                {row.getVisibleCells().map((cell) => (
                  <td
                    key={cell.id}
                    className={styles.tableCell}
                    style={{
                      width: cell.column.getSize(),
                    }}
                  >
                    {flexRender(cell.column.columnDef.cell, cell.getContext())}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      ) : (
        <div className={styles.emptyState}>
          <BiaText
            token='bodyRegular'
            color='weak'
          >
            {emptyMessage}
          </BiaText>
        </div>
      )}
    </div>
  );
};

// Exportar sin memo - dejar que React maneje los renders naturalmente
export const TableStaticHv = TableStaticHvComponent;
