import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  useReactTable,
  getCoreRowModel,
  flexRender,
  ColumnDef,
} from '@tanstack/react-table';
import { BiaTag, BiaIcon, BiaText } from '@entropy/index';
import { TranslationNamespaces } from '@shared/i18n';
import styles from './TableConfines.module.css';
import {
  EScopeType,
  IRequirement,
} from '@hv/scopes/data/interfaces/scopes.interface';

export type AgeingSortOrder = 'asc' | 'desc' | null;

interface TableConfinesProps {
  data: IRequirement[];
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  onAgeingSortChange?: (order: AgeingSortOrder) => void;
  onRowClick?: (requirement: IRequirement) => void;
}

export const TableConfines = ({
  data,
  currentPage,
  totalPages,
  onPageChange,
  onAgeingSortChange,
  onRowClick,
}: TableConfinesProps) => {
  const { t } = useTranslation(TranslationNamespaces.SCOPES);
  const [ageingSortOrder, setAgeingSortOrder] =
    useState<AgeingSortOrder>('asc');

  // Función para manejar el click en el header de ageing
  const handleAgeingSortClick = () => {
    let newOrder: AgeingSortOrder;

    if (ageingSortOrder === null) {
      newOrder = 'asc';
    } else if (ageingSortOrder === 'asc') {
      newOrder = 'desc';
    } else {
      newOrder = null;
    }

    setAgeingSortOrder(newOrder);
    onAgeingSortChange?.(newOrder);
  };

  // Función para obtener el color del tag según el tipo de alcance
  const getScopeTypeColor = (scopeType: EScopeType) => {
    switch (scopeType) {
      case EScopeType.INSTALLATION:
        return 'disabled';
      case EScopeType.NORMALIZATION:
        return 'purple';
      default:
        return 'disabled';
    }
  };

  const columns: ColumnDef<IRequirement>[] = [
    {
      accessorKey: 'internal_bia_code',
      header: 'Código BIA',
    },
    {
      accessorKey: 'contract_name',
      header: 'Nombre de la frontera',
      cell: (info) => {
        const contractName = info.getValue() as string;
        return (
          <BiaText
            token='caption'
            color='weak'
          >
            {contractName || '-'}
          </BiaText>
        );
      },
    },
    {
      accessorKey: 'scope_type',
      header: 'Tipo de alcance',
      cell: (info) => {
        const scopeType = info.getValue() as EScopeType;
        const scopeTypeLabel =
          scopeType === EScopeType.INSTALLATION
            ? 'Instalación'
            : 'Normalización';
        return (
          <BiaTag
            color={getScopeTypeColor(scopeType)}
            corner='rounded'
            className={styles.scopeTypeTag}
            text={scopeTypeLabel}
            size='small'
          />
        );
      },
    },
    {
      accessorKey: 'network_operator',
      header: 'Operador de red',
    },
    {
      accessorKey: 'ageing_days',
      header: () => (
        <div
          className={styles.sortableHeader}
          onClick={handleAgeingSortClick}
        >
          <span>Ageing</span>
          <div className={styles.sortIcon}>
            {ageingSortOrder === 'asc' && (
              <BiaIcon
                iconName='faArrowUp'
                iconType='solid'
                color='standard'
                size='12px'
              />
            )}
            {ageingSortOrder === 'desc' && (
              <BiaIcon
                iconName='faArrowDown'
                iconType='solid'
                color='standard'
                size='12px'
              />
            )}
            {ageingSortOrder === null && (
              <BiaIcon
                iconName='faArrowsUpDown'
                iconType='solid'
                color='weak'
                size='12px'
              />
            )}
          </div>
        </div>
      ),
      cell: (info) => {
        const days = info.getValue() as number;
        const color = days >= 15 ? 'warning' : 'success';
        return (
          <BiaTag
            color={color}
            corner='rounded'
            text={`${days} días`}
            size='small'
          />
        );
      },
    },
  ];

  const table = useReactTable({
    data,
    columns,
    getCoreRowModel: getCoreRowModel(),
  });

  return (
    <div className={styles.tableContainer}>
      {data.length === 0 ? (
        <div className={styles.emptyState}>
          <BiaText
            token='caption'
            color='weak'
          >
            {t('table.empty_state')}
          </BiaText>
        </div>
      ) : (
        <table className={styles.table}>
          <thead className={styles.thead}>
            {table.getHeaderGroups().map((headerGroup) => (
              <tr key={headerGroup.id}>
                {headerGroup.headers.map((header) => (
                  <th key={header.id}>
                    {header.isPlaceholder
                      ? null
                      : flexRender(
                          header.column.columnDef.header,
                          header.getContext()
                        )}
                  </th>
                ))}
              </tr>
            ))}
          </thead>
          <tbody>
            {table.getRowModel().rows.map((row) => (
              <tr
                key={row.id}
                onClick={() => onRowClick?.(row.original)}
                style={{
                  cursor:
                    onRowClick &&
                    row.original.scope_type === EScopeType.NORMALIZATION
                      ? 'pointer'
                      : 'default',
                }}
              >
                {row.getVisibleCells().map((cell) => (
                  <td key={cell.id}>
                    {flexRender(cell.column.columnDef.cell, cell.getContext())}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      )}

      {/* Paginador */}
      {data.length > 0 && (
        <div className={styles.pagination}>
          <span>
            Página {currentPage + 1}{' '}
            <span className={styles.gray}>de {totalPages}</span>
          </span>
          <button
            onClick={() => onPageChange(Math.max(currentPage - 1, 0))}
            disabled={currentPage === 0}
            className={styles.iconsPaginator}
            type='button'
          >
            <BiaIcon
              iconName='faAngleLeft'
              iconType='solid'
              color='weak'
            />
          </button>
          <button
            onClick={() => onPageChange(currentPage + 1)}
            disabled={currentPage + 1 >= totalPages}
            className={styles.iconsPaginator}
            type='button'
          >
            <BiaIcon
              iconName='faAngleRight'
              iconType='solid'
              color='weak'
            />
          </button>
        </div>
      )}
    </div>
  );
};
