import { useMemo } from 'react';
import {
  useReactTable,
  getCoreRowModel,
  flexRender,
  createColumnHelper,
  ColumnDef,
} from '@tanstack/react-table';
import { BiaText, BiaIcon } from '@entropy/index';
import { TranslationNamespaces } from '@shared/i18n';
import { useTranslation } from 'react-i18next';
import {
  IHistoryCv,
  IHistoryCvContent,
} from '../../../data/interfaces/searchContract.interface';
import styles from './CardTableVersionsHv.module.css';

interface CardTableVersionsHvProps {
  historyCv: IHistoryCv;
  onDownloadPdf: (cvId: number, version: string) => void;
  onEditVersion: (cvId: number) => void;
  onRowClick?: (item: IHistoryCvContent) => void;
  currentPage: number;
  onPageChange: (page: number) => void;
  latestVersion: IHistoryCvContent | null;
}

const columnHelper = createColumnHelper<IHistoryCvContent>();

export const CardTableVersionsHv = ({
  historyCv,
  onDownloadPdf,
  onEditVersion,
  onRowClick,
  currentPage,
  onPageChange,
  latestVersion,
}: CardTableVersionsHvProps) => {
  const { t } = useTranslation(TranslationNamespaces.TECHNICAL_LIFE_SHEET);

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const columns = useMemo<ColumnDef<IHistoryCvContent, any>[]>(
    () => [
      columnHelper.accessor('version', {
        header: () => t('card_table_versions.version'),
        cell: (info) => (
          <BiaText
            className={styles.itemText}
            token='bodyRegular'
            color='weak'
          >
            {info.getValue()}
          </BiaText>
        ),
      }),
      columnHelper.accessor('created_at', {
        header: () => t('card_table_versions.created_at'),
        cell: (info) => (
          <BiaText
            className={styles.itemText}
            token='bodyRegular'
            color='weak'
          >
            {formatDate(info.getValue())}
          </BiaText>
        ),
      }),
      columnHelper.accessor('user', {
        header: () => t('card_table_versions.user'),
        cell: (info) => (
          <BiaText
            className={styles.itemText}
            token='bodyRegular'
            color='weak'
          >
            {info.getValue()}
          </BiaText>
        ),
      }),
      columnHelper.display({
        id: 'actions',
        header: () => t('card_table_versions.actions'),
        cell: (info) => {
          const isLatestVersion =
            latestVersion?.cv_id === info.row.original.cv_id;
          return (
            <div className={styles.actionsContainer}>
              <button
                className={styles.iconRow}
                onClick={() =>
                  onDownloadPdf(
                    info.row.original.cv_id,
                    info.row.original.version
                  )
                }
              >
                <BiaIcon
                  iconName='faFile'
                  iconType='solid'
                  color='weak'
                />
              </button>
              {isLatestVersion && (
                <button
                  className={styles.iconRow}
                  onClick={() => onEditVersion(info.row.original.cv_id)}
                >
                  <BiaIcon
                    iconName='faPencil'
                    iconType='solid'
                    color='weak'
                  />
                </button>
              )}
            </div>
          );
        },
      }),
    ],
    [t, onDownloadPdf, latestVersion]
  );

  const table = useReactTable({
    data: historyCv.content || [],
    columns,
    getCoreRowModel: getCoreRowModel(),
  });

  return (
    <div className={styles.card}>
      <div className={styles.title}>
        <BiaText
          token='heading-3'
          color='standardOn'
        >
          {t('card_table_versions.title')}
        </BiaText>
      </div>

      <div className={styles.tableContainer}>
        {historyCv.content && historyCv.content.length > 0 ? (
          <table className={styles.table}>
            <thead className={styles.tableHeader}>
              {table.getHeaderGroups().map((headerGroup) => (
                <tr key={headerGroup.id}>
                  {headerGroup.headers.map((header) => (
                    <th
                      key={header.id}
                      className={`${styles.tableHeaderCell} ${
                        header.id === 'actions' ? styles.actionCell : ''
                      }`}
                    >
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
                  className={styles.tableRow}
                  onClick={() => onRowClick?.(row.original)}
                >
                  {row.getVisibleCells().map((cell) => (
                    <td
                      key={cell.id}
                      className={`${styles.tableCell} ${
                        cell.column.id === 'actions' ? styles.actionCell : ''
                      }`}
                      onClick={(e) => {
                        // Evitar que el click en el botón de descarga dispare el click de la fila
                        if (cell.column.id === 'actions') {
                          e.stopPropagation();
                        }
                      }}
                    >
                      {flexRender(
                        cell.column.columnDef.cell,
                        cell.getContext()
                      )}
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
              {t('card_table_versions.no_versions')}
            </BiaText>
          </div>
        )}
      </div>

      {historyCv.content && historyCv.content.length > 0 && (
        <div className={styles.pagination}>
          <span>
            {t('pagination.page')} {currentPage + 1}{' '}
            <span className={styles.gray}>
              {t('pagination.of')} {historyCv ? historyCv.total_pages : 1}
            </span>
          </span>
          <button
            onClick={() => onPageChange(Math.max(currentPage - 1, 0))}
            disabled={currentPage === 0}
            className={styles.iconsPaginator}
          >
            <BiaIcon
              iconName='faAngleLeft'
              iconType='solid'
              color='weak'
            />
          </button>
          <button
            onClick={() => onPageChange(currentPage + 1)}
            disabled={currentPage + 1 >= historyCv.total_pages}
            className={styles.iconsPaginator}
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
