import React, { useEffect, useState, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import {
  useReactTable,
  getCoreRowModel,
  flexRender,
  ColumnDef,
} from '@tanstack/react-table';
import dayjs from 'dayjs';
import customParseFormat from 'dayjs/plugin/customParseFormat';
import { useHistory } from 'react-router-dom';
dayjs.extend(customParseFormat);
import { BiaIcon, BiaLoader, BiaTag, BiaText, BiaToast } from '@entropy/index';
import { RolesEnum } from '@auth/index';
import { useWorkOrders } from '@desktop/work-orders/data/hooks/useWorkOrders';
import {
  IContractor,
  IElectricianOrder,
  IGroupStatusEntity,
  IWorkOrder,
  ID_GROUP_STATUS_ENTITY,
  ISummary,
  APPROVAL_STATUS,
  useWorkOrdersFiltersStore,
} from '@desktop/work-orders/data';
import { TranslationNamespaces } from '@shared/i18n';
import { useAuthStore, useScrollStore } from '@shared/index';
import { TooltipPortal } from '@shared/components/TooltipPortal/TooltipPortal';
import { AssignElectriciansModal } from '../AssignElectriciansModal/AssignElectriciansModal';
import { AssignContractorModal } from '../AssignContractorModal/AssignContractorModal';
import { CancelOTModal } from '../CancelOTModal/CancelOTModal';
import { CopyCell } from './CopyCell';
import { ContextMenu } from './ContextMenu';
import { CloseOTModal } from '../CloseOTModal/CloseOTModal';
import { RescheduleModal } from '../RescheduleModal/RescheduleModal';
import { PopUp } from '../PopUp/PopUp';
import { UploadActaModal } from '../UploadActaModal/UploadActaModal';
import styles from './TableOts.module.css';

interface TableOTsProps {
  onSummaryChange: (summary: ISummary) => void;
}

export const TableOTs: React.FC<TableOTsProps> = ({ onSummaryChange }) => {
  // Usar el store global para los filtros
  const {
    code,
    dateRange,
    types,
    status,
    contractor,
    electrician,
    city,
    networkOperator,
    acta,
    page,
    setPage,
  } = useWorkOrdersFiltersStore();
  const { t } = useTranslation(TranslationNamespaces.WORK_ORDERS);
  const { user } = useAuthStore();
  const isContractor = user?.user?.role === RolesEnum.CONTRACTOR;
  const isScrolling = useScrollStore((state) => state.isScrolling);
  const { postWorkOrdersMutation, confirmRejectOTMutation } = useWorkOrders();
  const [data, setData] = useState<IWorkOrder[]>([]);
  const [selectedOT, setSelectedOT] = useState<IWorkOrder | null>(null);
  const [dateExecutionPassed, setDateExecutionPassed] = useState(false);
  const [showModalElectrician, setShowModalElectrician] = useState(false);
  const [showModalContractor, setShowModalContractor] = useState(false);
  const [showSuccessToast, setShowSuccessToast] = useState(false);
  const [showErrorToast, setShowErrorToast] = useState(false);
  const [successType, setSuccessType] = useState<
    | 'electricians'
    | 'contractor'
    | 'reassign_contractor'
    | 'upload_acta'
    | 'reschedule'
    | 'cancel_ot'
    | 'close_ot'
    | 'confirm_reject_ot'
    | 'error_confirm_reject_ot'
    | 'assing_visit_success'
    | 'error_upload_acta'
    | null
  >(null);
  const [showModalContractorError, setShowModalContractorError] =
    useState(false);
  const [showUploadActaModal, setShowUploadActaModal] = useState(false);
  const [showRescheduleModal, setShowRescheduleModal] = useState(false);
  const [showBlockedRescheduleModal, setShowBlockedRescheduleModal] =
    useState(false);
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [showCloseOTModal, setShowCloseOTModal] = useState(false);
  const [isClosingOT, setIsClosingOT] = useState(false);
  const history = useHistory();
  const [contextMenuPosition, setContextMenuPosition] = useState<{
    x: number;
    y: number;
  } | null>(null);
  const [selectedContextOT, setSelectedContextOT] = useState<IWorkOrder | null>(
    null
  );
  const [showConfirmRejectOTModal, setShowConfirmRejectOTModal] =
    useState(false);
  const [confirmRejectOTStatus, setConfirmRejectOTStatus] =
    useState<APPROVAL_STATUS | null>(null);
  const lastCodeRef = useRef(code);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  // Verificar si una OT es editable (no finalizada)
  const isWorkOrderEditable = (workOrder: IWorkOrder): boolean => {
    const finalizedStates = [
      ID_GROUP_STATUS_ENTITY.SUCC,
      ID_GROUP_STATUS_ENTITY.FAIL,
      ID_GROUP_STATUS_ENTITY.CAN,
      ID_GROUP_STATUS_ENTITY.EXPIRED,
      ID_GROUP_STATUS_ENTITY.PEN_CLOS,
    ];
    return !finalizedStates.includes(workOrder.group_status_entity.id);
  };

  const isWorkOrderEditableCoordinator = (workOrder: IWorkOrder): boolean => {
    const finalizedStates = [
      ID_GROUP_STATUS_ENTITY.PEN_CLOS,
      ID_GROUP_STATUS_ENTITY.PEND_PDF,
      ID_GROUP_STATUS_ENTITY.SUCC,
      ID_GROUP_STATUS_ENTITY.FAIL,
      ID_GROUP_STATUS_ENTITY.CAN,
      ID_GROUP_STATUS_ENTITY.EXPIRED,
    ];
    return !finalizedStates.includes(workOrder.group_status_entity.id);
  };

  // Reglas para reprogramar una OT
  const canRescheduleWorkOrder = (workOrder: IWorkOrder): boolean => {
    // Si la OT no es editable, no se puede reprogramar
    if (!isWorkOrderEditable(workOrder)) return false;
    // Obtener fecha y hora de ejecución
    const executionDate = dayjs(
      `${workOrder.start_date} ${workOrder.hours}`,
      'DD-MM-YYYY hh:mm A'
    );

    const now = dayjs();

    // Si no tiene contratista asignado
    if (!workOrder.contractor) return true;

    // Si la fecha/hora de ejecución ya pasó, no se puede reprogramar
    if (!executionDate.isValid() || executionDate.isBefore(now)) {
      return false;
    }

    // Si tiene contratista BIA asignado
    if (workOrder.contractor.is_bia) return true;

    // Si tiene contratista externo asignado
    // Calcular diferencia en horas
    const diffHours = executionDate.diff(now, 'hour');
    if (diffHours > 24) return true;
    // Si faltan menos de 24h para la visita, no se puede reprogramar
    if (diffHours < 24) return false;

    const finalizedStates = [
      ID_GROUP_STATUS_ENTITY.SUCC,
      ID_GROUP_STATUS_ENTITY.FAIL,
      ID_GROUP_STATUS_ENTITY.CAN,
      ID_GROUP_STATUS_ENTITY.EXPIRED,
    ];
    if (finalizedStates.includes(workOrder.group_status_entity.id))
      return false;

    return false;
  };

  const columns: ColumnDef<IWorkOrder>[] = [
    {
      accessorKey: 'job_code',
      header: t('table.job_code'),
      cell: (info) => (
        <CopyCell
          value={info.getValue() as string}
          noEllipsis={true}
        />
      ),
    },
    { accessorKey: 'service_type.name', header: t('table.service_type') },
    {
      accessorKey: 'group_status_entity',
      header: t('table.group_status_entity'),
      cell: (info) => {
        const groupStatus = info.getValue() as IGroupStatusEntity;
        return (
          <BiaTag
            color={getEstadoColor(groupStatus)}
            corner='rounded'
            text={groupStatus.name}
            size='small'
          />
        );
      },
    },
    {
      id: 'contractor',
      accessorKey: 'contractor',
      header: t('table.contractor'),
      cell: ({ row }) => {
        const isEditable = isWorkOrderEditableCoordinator(row.original);
        const contractor = row.original.contractor as IContractor;
        return contractor !== null ? (
          <div className={styles.iconRow}>
            <span className={styles.ellipsisText}>
              <TooltipPortal text={contractor.name}>
                {contractor.name}
              </TooltipPortal>
            </span>
            {isEditable && (
              <button
                className={styles.iconRow}
                onClick={() => {
                  setSelectedOT(row.original);
                  const isBia = contractor.is_bia;
                  if (
                    row.original.group_status_entity.id ===
                    ID_GROUP_STATUS_ENTITY.REJ_CONT
                  ) {
                    setShowModalContractor(true);
                    return;
                  }
                  const executionDate = dayjs(
                    `${row.original.start_date} ${row.original.hours}`,
                    'DD-MM-YYYY hh:mm A'
                  );
                  if (!isBia && executionDate.isValid()) {
                    const now = dayjs();
                    const diffHours = executionDate.diff(now, 'hour');
                    if (diffHours < 24) {
                      setShowModalContractorError(true);
                      return;
                    }
                  }
                  setShowModalContractor(true);
                }}
              >
                <BiaIcon
                  iconName='faPenToSquare'
                  iconType='solid'
                  color='weak'
                />
              </button>
            )}
          </div>
        ) : (
          <div className={styles.iconRow}>
            <span>-</span>
            {isEditable && (
              <button
                className={styles.iconRow}
                onClick={() => {
                  setShowModalContractor(true);
                  setSelectedOT(row.original);
                }}
              >
                <BiaIcon
                  iconName='faPlus'
                  iconType='solid'
                  color='accent'
                />
              </button>
            )}
          </div>
        );
      },
    },
    {
      accessorKey: 'electricians',
      header: t('table.electricians'),
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      cell: ({ row }: any) => {
        const contractor = row.original.contractor as IContractor;
        const electricians = row.original.electricians;
        const lead = electricians.find(
          (e: IElectricianOrder) => e.role === 'LEAD'
        );
        const displayName = lead ? lead.name : '-';
        const extra =
          electricians.length > 1 ? `(+${electricians.length - 1})` : '';
        const allNames = electricians
          .map((e: IElectricianOrder) => e.name)
          .join('\n');
        const addElectrician =
          contractor !== null &&
          (contractor.is_bia || isContractor) &&
          row.original.group_status_entity.id ===
            ID_GROUP_STATUS_ENTITY.AS_ELEC;
        const isEditable =
          isWorkOrderEditable(row.original) && !row.original.is_process;
        return (
          <div className={styles.iconRow}>
            <span className={styles.ellipsisText}>
              <TooltipPortal text={allNames}>
                {displayName} {extra}
              </TooltipPortal>
            </span>
            {contractor !== null &&
              (contractor.is_bia || isContractor) &&
              isEditable &&
              row.original.group_status_entity.id !==
                ID_GROUP_STATUS_ENTITY.PEN_CONF && (
                <button
                  className={styles.iconRow}
                  onClick={() => {
                    setShowModalElectrician(true);
                    setSelectedOT(row.original);
                  }}
                >
                  <BiaIcon
                    iconName={!addElectrician ? 'faPenToSquare' : 'faPlus'}
                    iconType='solid'
                    color={!addElectrician ? 'weak' : 'accent'}
                  />
                </button>
              )}
          </div>
        );
      },
    },
    { accessorKey: 'start_date', header: t('table.start_date') },
    { accessorKey: 'hours', header: t('table.hours') },
    { accessorKey: 'city_name', header: t('table.city_name') },
    {
      accessorKey: 'internal_bia_code',
      header: t('table.internal_bia_code'),
      cell: (info) => <CopyCell value={info.getValue() as string} />,
    },
    {
      accessorKey: 'contract_name',
      header: t('table.contract_name'),
      cell: (info) => {
        const value = info.getValue() as string;
        return (
          <span className={styles.ellipsisText}>
            <TooltipPortal text={value}>{value}</TooltipPortal>
          </span>
        );
      },
    },
    {
      accessorKey: 'address',
      header: t('table.address'),
      cell: (info) => {
        const value = info.getValue() as string;
        return (
          <span className={styles.ellipsisText}>
            <TooltipPortal text={value}>{value}</TooltipPortal>
          </span>
        );
      },
    },
    {
      accessorKey: 'network_operator_name',
      header: t('table.network_operator_name'),
    },
    {
      accessorKey: 'url',
      header: t('table.url'),
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      cell: ({ row }: any) => {
        const url = row.original.url;
        if (!url) {
          return (
            <button
              className={styles.iconRow}
              onClick={() => {
                setSelectedOT(row.original);
                setShowUploadActaModal(true);
              }}
            >
              <BiaIcon
                iconName='faPlus'
                iconType='solid'
                color='accent'
              />
            </button>
          );
        } else {
          return (
            <button
              className={styles.iconRow}
              onClick={() => {
                history.push(`/admin/ots/${row.original.id}/view-document`, {
                  document: {
                    type: 'file_report',
                    value: url,
                    label: 'Acta',
                  },
                  job_code: row.original.job_code,
                });
              }}
            >
              <BiaIcon
                iconName='faFile'
                iconType='solid'
                color='weak'
              />
            </button>
          );
        }
      },
    },
    {
      id: 'detalle',
      cell: () => (
        <button
          className={styles.iconRow}
          title={t('table.detalle')}
        >
          <BiaIcon
            iconName='faEllipsis'
            iconType='solid'
            color='weak'
          />
        </button>
      ),
      enableSorting: false,
      enableResizing: false,
      size: 60,
    },
  ];

  const getEstadoColor = (groupStatus: IGroupStatusEntity) => {
    switch (groupStatus.id) {
      case ID_GROUP_STATUS_ENTITY.AS_CON:
        return 'warning'; // Por asignar contratista
      case ID_GROUP_STATUS_ENTITY.AS_ELEC:
        return 'info-yellow'; // Por asignar electricista
      case ID_GROUP_STATUS_ENTITY.PEN_CONF:
        return isContractor ? 'warning' : 'purple'; // Pendiente de confirmación
      case ID_GROUP_STATUS_ENTITY.REJ_CONT:
        return 'magenta'; // Rechazada contratista
      case ID_GROUP_STATUS_ENTITY.RED_EXE:
        return 'teal'; // Lista para ejecutar
      case ID_GROUP_STATUS_ENTITY.PEN_CLOS:
        return 'blue'; // Pendiente de cierre
      case ID_GROUP_STATUS_ENTITY.SUCC:
        return 'success'; // Exitosa
      case ID_GROUP_STATUS_ENTITY.FAIL:
        return 'error'; // Fallida
      case ID_GROUP_STATUS_ENTITY.CAN:
        return 'disabled'; // Cancelada
      case ID_GROUP_STATUS_ENTITY.PEND_PDF:
        return 'blue'; // Pendiente de acta
      case ID_GROUP_STATUS_ENTITY.EXPIRED:
        return 'disabled'; // Expirada
      default:
        return 'disabled';
    }
  };

  const fetchOTs = () => {
    postWorkOrdersMutation.mutate({
      page,
      search_texts: code || undefined,
      start_from_date: dateRange?.from
        ? dayjs(dateRange.from).format('DD-MM-YYYY')
        : undefined,
      start_to_date: dateRange?.to
        ? dayjs(dateRange.to).format('DD-MM-YYYY')
        : undefined,
      service_type_ids:
        types.includes('__all__') || types.length === 0 ? undefined : types,
      group_status:
        status.includes('__all__') || status.length === 0 ? undefined : status,
      contractor_ids:
        contractor.includes('__all__') || contractor.length === 0
          ? undefined
          : contractor,
      electrician_ids:
        electrician.includes('__all__') || electrician.length === 0
          ? undefined
          : electrician,
      city_names: city && city[0] !== '__all__' ? city : undefined,
      network_operator_names:
        networkOperator && networkOperator[0] !== '__all__'
          ? networkOperator
          : undefined,
      report_pdf:
        acta && acta[0] !== '__all__'
          ? (acta[0] as 'PENDING' | 'GENERATED' | 'ALL')
          : undefined,
    });
  };

  useEffect(() => {
    fetchOTs();
  }, [
    page,
    dateRange,
    types,
    status,
    contractor,
    electrician,
    city,
    networkOperator,
    acta,
  ]);

  useEffect(() => {
    // Verificar si el código cambió
    const hasChanged = lastCodeRef.current !== code;

    // Limpiar el timer anterior si existe
    if (timerRef.current) {
      clearTimeout(timerRef.current);
    }

    // Si hubo un cambio y cumple las condiciones, ejecutar después de 1 segundo
    if (hasChanged && (code.length >= 3 || code === '')) {
      timerRef.current = setTimeout(() => {
        fetchOTs();
        lastCodeRef.current = code;
      }, 1000);
    } else {
      // Actualizar la referencia si no cumple las condiciones
      lastCodeRef.current = code;
    }

    return () => {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
      }
    };
  }, [code]);

  useEffect(() => {
    if (postWorkOrdersMutation.data) {
      setData(postWorkOrdersMutation.data.content);
      onSummaryChange(postWorkOrdersMutation.data.summary);
    }
  }, [postWorkOrdersMutation.data]);

  const table = useReactTable({
    initialState: {
      columnVisibility: {
        contractor: !isContractor,
      },
    },
    data,
    columns,
    getCoreRowModel: getCoreRowModel(),
  });

  const handleContextMenu = (e: React.MouseEvent, workOrder: IWorkOrder) => {
    e.preventDefault();
    e.stopPropagation();

    if (selectedContextOT?.id === workOrder.id) {
      closeContextMenu();
      return;
    }

    const rect = e.currentTarget.getBoundingClientRect();
    setContextMenuPosition({
      x: rect.right - 171,
      y: rect.top + window.scrollY + 35,
    });
    setSelectedContextOT(workOrder);
  };

  const closeContextMenu = () => {
    setContextMenuPosition(null);
    setSelectedContextOT(null);
  };

  const handleViewDetail = () => {
    if (selectedContextOT) {
      history.push(`/admin/ots/${selectedContextOT.id}`, {
        workOrder: selectedContextOT,
      });
    }
    setContextMenuPosition(null);
  };

  // Cerrar el menú contextual cuando se detecta scroll en el layout
  useEffect(() => {
    if (isScrolling && contextMenuPosition && selectedContextOT) {
      closeContextMenu();
    }
  }, [isScrolling]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (selectedContextOT && !event.defaultPrevented) {
        closeContextMenu();
      }
    };

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && selectedContextOT) {
        closeContextMenu();
      }
    };

    const handleScroll = () => {
      if (contextMenuPosition && selectedContextOT) {
        closeContextMenu();
      }
    };

    // Buscar el contenedor de la tabla por su clase CSS module
    const tableContainer = document.querySelector(
      `.${styles.tableOtsContainer}`
    );

    document.addEventListener('click', handleClickOutside);
    document.addEventListener('keydown', handleKeyDown);

    if (tableContainer) {
      tableContainer.addEventListener('scroll', handleScroll);
    }

    return () => {
      document.removeEventListener('click', handleClickOutside);
      document.removeEventListener('keydown', handleKeyDown);

      if (tableContainer) {
        tableContainer.removeEventListener('scroll', handleScroll);
      }
    };
  }, [selectedContextOT, contextMenuPosition]);

  const handleConfirmRejectOT = () => {
    if (selectedOT && confirmRejectOTStatus) {
      confirmRejectOTMutation.mutate(
        {
          visit_id: selectedOT.id,
          params: {
            status: confirmRejectOTStatus,
          },
        },
        {
          onSuccess: () => {
            setShowConfirmRejectOTModal(false);
            setShowSuccessToast(true);
            setSuccessType('confirm_reject_ot');
            setTimeout(() => {
              setShowConfirmRejectOTModal(false);
              fetchOTs();
            }, 1000);
          },
          onError: () => {
            setShowErrorToast(true);
            setSuccessType('error_confirm_reject_ot');
          },
        }
      );
    }
  };

  // Mensajes para el toast de éxito
  const toastMessages: Record<
    | 'electricians'
    | 'contractor'
    | 'reassign_contractor'
    | 'upload_acta'
    | 'reschedule'
    | 'cancel_ot'
    | 'close_ot'
    | 'confirm_reject_ot'
    | 'error_confirm_reject_ot'
    | 'assing_visit_success'
    | 'error_upload_acta',
    string
  > = {
    electricians: t('assing_visit_success').replace(
      '${JOB_CODE}',
      selectedOT?.job_code || ''
    ),
    contractor: t('assign_contractor.assign_contractor_success').replace(
      '${JOB_CODE}',
      selectedOT?.job_code || ''
    ),
    reassign_contractor: t(
      'assign_contractor.reassign_contractor_success'
    ).replace('${JOB_CODE}', selectedOT?.job_code || ''),
    upload_acta: t('upload_acta.success').replace(
      '${JOB_CODE}',
      selectedOT?.job_code || ''
    ),
    reschedule: t('reschedule.success').replace(
      '${JOB_CODE}',
      selectedOT?.job_code || ''
    ),
    cancel_ot: t('cancel_ot.success').replace(
      '${JOB_CODE}',
      selectedOT?.job_code || ''
    ),
    close_ot: t('close_ot.success').replace(
      '${JOB_CODE}',
      selectedOT?.job_code || ''
    ),
    confirm_reject_ot:
      confirmRejectOTStatus === APPROVAL_STATUS.APPROVED
        ? t('confirm_visit.success_confirm').replace(
            '${JOB_CODE}',
            selectedOT?.job_code || ''
          )
        : t('confirm_visit.success_reject').replace(
            '${JOB_CODE}',
            selectedOT?.job_code || ''
          ),
    error_confirm_reject_ot:
      confirmRejectOTStatus === APPROVAL_STATUS.APPROVED
        ? t('confirm_visit.error_confirm')
        : t('confirm_visit.error_reject'),
    assing_visit_success: t('assing_visit_success').replace(
      '${JOB_CODE}',
      selectedOT?.job_code || ''
    ),
    error_upload_acta: t('upload_acta.error').replace(
      '${JOB_CODE}',
      selectedOT?.job_code || ''
    ),
  };

  return (
    <div style={{ position: 'relative' }}>
      {(postWorkOrdersMutation.isPending ||
        confirmRejectOTMutation.isPending) && <BiaLoader />}
      {showSuccessToast && (
        <BiaToast
          message={
            toastMessages[
              (successType as keyof typeof toastMessages) ??
                'assing_visit_success'
            ]
          }
          theme='success'
          onClose={() => {
            setShowSuccessToast(false);
            if (
              !showModalElectrician &&
              !showModalContractor &&
              !showModalContractorError &&
              !showUploadActaModal &&
              !showRescheduleModal &&
              !showBlockedRescheduleModal &&
              !showCancelModal &&
              !showCloseOTModal &&
              !showConfirmRejectOTModal
            ) {
              setSelectedOT(null);
              setSuccessType(null);
              setConfirmRejectOTStatus(null);
            }
          }}
        />
      )}
      {showErrorToast && (
        <BiaToast
          message={
            toastMessages[
              (successType as keyof typeof toastMessages) ??
                'error_confirm_reject_ot'
            ]
          }
          theme='error'
          onClose={() => {
            setShowErrorToast(false);
            setSuccessType(null);
            setConfirmRejectOTStatus(null);
          }}
        />
      )}
      {!postWorkOrdersMutation.isPending &&
        postWorkOrdersMutation.data &&
        postWorkOrdersMutation.data?.content.length > 0 && (
          <>
            <div className={styles.tableOtsContainer}>
              <table className={styles.tableOts}>
                <thead className={styles.thead}>
                  {table.getHeaderGroups().map((headerGroup) => (
                    <tr key={headerGroup.id}>
                      {headerGroup.headers.map((header) => (
                        <th
                          key={header.id}
                          className={
                            header.column.columnDef.id === 'detalle'
                              ? styles.stickyColRight
                              : ''
                          }
                        >
                          {flexRender(
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
                      style={{ cursor: 'pointer' }}
                      onClick={(e) => {
                        if ((e.target as HTMLElement).closest('button')) return;
                        history.push(`/admin/ots/${row.original.id}`, {
                          workOrder: row.original,
                        });
                      }}
                    >
                      {row.getVisibleCells().map((cell) => (
                        <td
                          key={cell.id}
                          onClick={(e) => {
                            if (cell.column.id === 'detalle') {
                              handleContextMenu(e, row.original);
                            }
                          }}
                          className={`
                            ${
                              cell.column.id === 'detalle'
                                ? styles.stickyColRight
                                : cell.column.id === 'electricians'
                                  ? styles.electriciansCell
                                  : ''
                            }
                              ${
                                selectedContextOT?.id === row.original.id
                                  ? styles.selectedContextOT
                                  : ''
                              }
                          `}
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
            </div>

            <div className={styles.pagination}>
              <span>
                {t('pagination.page')} {page + 1}{' '}
                <span className={styles.gray}>
                  {t('pagination.of')}{' '}
                  {postWorkOrdersMutation.data
                    ? postWorkOrdersMutation.data?.total_pages
                    : 1}
                </span>
              </span>
              <button
                onClick={() => setPage(Math.max(page - 1, 0))}
                disabled={page === 0}
                className={styles.iconsPaginator}
              >
                <BiaIcon
                  iconName='faAngleLeft'
                  iconType='solid'
                  color='weak'
                />
              </button>
              <button
                onClick={() => setPage(page + 1)}
                disabled={data.length < 20}
                className={styles.iconsPaginator}
              >
                <BiaIcon
                  iconName='faAngleRight'
                  iconType='solid'
                  color='weak'
                />
              </button>
            </div>
          </>
        )}
      {!postWorkOrdersMutation.isPending &&
        postWorkOrdersMutation.data &&
        postWorkOrdersMutation.data?.content.length === 0 && (
          <div className={styles.emptyState}>
            <BiaIcon
              iconName='faSearch'
              iconType='solid'
              color='weak'
              size='12px'
            />
            <BiaText
              token='caption'
              color='weak'
            >
              {t('empty_state')}
            </BiaText>
          </div>
        )}

      {showModalElectrician && selectedOT && (
        <AssignElectriciansModal
          workOrder={selectedOT}
          onClose={() => {
            setShowModalElectrician(false);
            setSelectedOT(null);
          }}
          onReload={() => {
            setShowModalElectrician(false);
            setShowSuccessToast(true);
            setSuccessType('electricians');
            fetchOTs();
          }}
        />
      )}

      {showModalContractor && selectedOT && (
        <AssignContractorModal
          workOrder={selectedOT}
          onClose={() => {
            setShowModalContractor(false);
            setSelectedOT(null);
          }}
          onReload={() => {
            setShowModalContractor(false);
            setShowSuccessToast(true);
            setSuccessType(
              selectedOT.contractor?.code ? 'reassign_contractor' : 'contractor'
            );
            fetchOTs();
          }}
        />
      )}

      {showModalContractorError && selectedOT && (
        <PopUp
          icon='faTriangleExclamation'
          title={t('assign_contractor.not_possible_title')}
          text={t('assign_contractor.not_possible_message')}
          confirmText={t('assign_contractor.not_possible_confirm')}
          open={showModalContractorError}
          onCancel={() => setShowModalContractorError(false)}
          onConfirm={() => setShowModalContractorError(false)}
        />
      )}
      {showUploadActaModal && selectedOT && (
        <UploadActaModal
          workOrderId={selectedOT.id}
          isOpen={showUploadActaModal}
          onClose={() => {
            setShowUploadActaModal(false);
            setSelectedOT(null);
          }}
          onReload={() => {
            setShowUploadActaModal(false);
            setShowSuccessToast(true);
            setSuccessType('upload_acta');
            fetchOTs();
          }}
          onError={() => {
            setShowUploadActaModal(false);
          }}
        />
      )}

      {showRescheduleModal && selectedOT && (
        <RescheduleModal
          workOrder={selectedOT}
          isOpen={showRescheduleModal}
          onClose={() => {
            setShowRescheduleModal(false);
            setSelectedContextOT(null);
          }}
          onReload={() => {
            setShowRescheduleModal(false);
            setShowSuccessToast(true);
            setSuccessType('reschedule');
            fetchOTs();
          }}
        />
      )}

      {showBlockedRescheduleModal && (
        <PopUp
          icon='faTriangleExclamation'
          title={t('reschedule.not_possible_title')}
          text={
            dateExecutionPassed
              ? t('reschedule.not_possible_message_2')
              : t('reschedule.not_possible_message')
          }
          confirmText={t('reschedule.not_possible_confirm')}
          open={showBlockedRescheduleModal}
          onCancel={() => setShowBlockedRescheduleModal(false)}
          onConfirm={() => setShowBlockedRescheduleModal(false)}
        />
      )}

      {showCancelModal && selectedOT && (
        <CancelOTModal
          workOrder={selectedOT}
          isOpen={showCancelModal}
          onClose={() => {
            setShowCancelModal(false);
            setSelectedOT(null);
          }}
          onReload={() => {
            setShowCancelModal(false);
            setShowSuccessToast(true);
            setSuccessType('cancel_ot');
            fetchOTs();
          }}
        />
      )}

      {showCloseOTModal && selectedOT && (
        <CloseOTModal
          workOrder={selectedOT}
          isOpen={showCloseOTModal}
          onClose={() => {
            setShowCloseOTModal(false);
            setSelectedOT(null);
            setIsClosingOT(false);
          }}
          onReload={() => {
            setShowCloseOTModal(false);
            setIsClosingOT(false);
            setShowSuccessToast(true);
            setSuccessType('close_ot');
            fetchOTs();
          }}
        />
      )}

      {showConfirmRejectOTModal && selectedOT && confirmRejectOTStatus && (
        <PopUp
          open={showConfirmRejectOTModal}
          icon={
            confirmRejectOTStatus === APPROVAL_STATUS.APPROVED
              ? 'faCircleCheck'
              : 'faCircleXmark'
          }
          backgroundIcon={
            confirmRejectOTStatus === APPROVAL_STATUS.APPROVED
              ? 'var(--chart-green05)'
              : 'var(--chart-red05)'
          }
          colorIcon={
            confirmRejectOTStatus === APPROVAL_STATUS.APPROVED
              ? 'positive'
              : 'error'
          }
          title={
            confirmRejectOTStatus === APPROVAL_STATUS.APPROVED
              ? t('confirm_visit.confirm_ot')
              : t('confirm_visit.reject_ot')
          }
          text={
            confirmRejectOTStatus === APPROVAL_STATUS.APPROVED
              ? t('confirm_visit.confirm_text')
                  .replace('${JOB_CODE}', selectedOT.job_code)
                  .replace('${DATE}', selectedOT.start_date)
                  .replace('${TIME}', selectedOT.hours)
              : t('confirm_visit.reject_text')
                  .replace('${JOB_CODE}', selectedOT.job_code)
                  .replace('${DATE}', selectedOT.start_date)
                  .replace('${TIME}', selectedOT.hours)
          }
          confirmText={
            confirmRejectOTStatus === APPROVAL_STATUS.APPROVED
              ? t('confirm_visit.confirm_button')
              : t('confirm_visit.reject_button')
          }
          cancelText={t('confirm_visit.cancel_button')}
          onCancel={() => {
            setShowConfirmRejectOTModal(false);
            setConfirmRejectOTStatus(null);
          }}
          onConfirm={() => {
            handleConfirmRejectOT();
          }}
        />
      )}

      {contextMenuPosition && selectedContextOT && (
        <div
          style={{
            position: 'fixed',
            left: `${contextMenuPosition.x}px`,
            top: `${contextMenuPosition.y}px`,
          }}
        >
          <ContextMenu
            onClose={closeContextMenu}
            onViewDetail={handleViewDetail}
            onCancel={() => {
              setSelectedOT(selectedContextOT);
              setShowCancelModal(true);
              closeContextMenu();
            }}
            onReschedule={() => {
              closeContextMenu();
              setSelectedOT(selectedContextOT);
              setShowRescheduleModal(true);
            }}
            onBlockedReschedule={() => {
              const executionDate = dayjs(
                `${selectedContextOT.start_date} ${selectedContextOT.hours}`,
                'DD-MM-YYYY hh:mm A'
              );
              const now = dayjs();
              setDateExecutionPassed(
                !executionDate.isValid() || executionDate.isBefore(now)
              );
              setShowBlockedRescheduleModal(true);
              closeContextMenu();
            }}
            onCloseOT={() => {
              setSelectedOT(selectedContextOT);
              setIsClosingOT(true);
              setShowCloseOTModal(true);
              closeContextMenu();
            }}
            onConfirmRejectOT={(status) => {
              setSelectedOT(selectedContextOT);
              setShowConfirmRejectOTModal(true);
              setConfirmRejectOTStatus(status);
              closeContextMenu();
            }}
            isEditable={isWorkOrderEditable(selectedContextOT)}
            canReschedule={canRescheduleWorkOrder(selectedContextOT)}
            isPendingClose={
              selectedContextOT.group_status_entity.id ===
              ID_GROUP_STATUS_ENTITY.PEN_CLOS
            }
            isPendingConfirm={
              selectedContextOT.group_status_entity.id ===
              ID_GROUP_STATUS_ENTITY.PEN_CONF
            }
            isClosingOT={isClosingOT}
          />
        </div>
      )}
    </div>
  );
};
