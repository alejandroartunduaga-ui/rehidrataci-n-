import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import dayjs from 'dayjs';
import customParseFormat from 'dayjs/plugin/customParseFormat';
import { BiaLoader, BiaBreadcrumb, BreadcrumbItem } from '@entropy/index';
import {
  ICostsVisitGetResponse,
  ID_GROUP_STATUS_ENTITY,
  useCostsVisit,
  useHistoryVisit,
  useWorkOrders,
} from '@desktop/work-orders/data';
import { DetailTabCost, DetailTabInfo } from '../../components';
import { DetailTabDocuments } from '../../components/DetailTabDocuments/DetailTabDocuments';
import { DetailTabScope } from '../../components/DetailTabScope/DetailTabScope';
import { DetailTabEquipments } from '../../components/DetailTabEquipments/DetailTabEquipments';
import { DetailTabHistory } from '../../components/DetailTabHistory/DetailTabHistory';
import styles from './WorkOrderDetail.module.css';
import { RolesEnum } from '@auth/index';
import { useAuthStore } from '@shared/index';

dayjs.extend(customParseFormat);

export const WorkOrderDetail = () => {
  const { user } = useAuthStore();
  const { workOrderId } = useParams<{ workOrderId: string }>();
  const [activeTab, setActiveTab] = useState('info');
  const [tabs, setTabs] = useState<{ key: string; label: string }[]>([]);
  const { getWorkOrderDetailMutation } = useWorkOrders();
  const { getHistoryVisitMutation } = useHistoryVisit();
  const { getCostsVisitMutation } = useCostsVisit();
  const breadcrumbItems: BreadcrumbItem[] = [
    { label: 'OTs', href: '/admin/ots' },
    {
      label: getWorkOrderDetailMutation.data?.visit?.job_code || '',
      active: true,
    },
  ];

  useEffect(() => {
    if (workOrderId) {
      getWorkOrderDetailMutation.mutate(workOrderId);
      getCostsVisitMutation.mutate({ visit_id: workOrderId });
      if (user?.user?.role === RolesEnum.COORDINATOR_BIA) {
        getHistoryVisitMutation.mutate({ visit_id: workOrderId });
      }
    }
  }, [workOrderId]);

  useEffect(() => {
    if (!getWorkOrderDetailMutation.data?.visit) return;

    const baseTabs = [
      { key: 'info', label: 'Información general' },
      { key: 'documents', label: 'Documentos' },
      { key: 'scope', label: 'Alcance' },
      { key: 'equipments', label: 'Equipos' },
    ];

    const newTabs = [...baseTabs];

    // Agregar tab de Historial si es coordinador
    if (user?.user?.role === RolesEnum.COORDINATOR_BIA) {
      newTabs.push({ key: 'history', label: 'Historial' });
    }

    const orderDetail = getWorkOrderDetailMutation.data.visit;
    const documents = getWorkOrderDetailMutation.data.documents;
    // Agregar tab de Costos si el estado no es CAN (Cancelada)
    if (
      orderDetail.group_status_entity.id !== ID_GROUP_STATUS_ENTITY.CAN &&
      (orderDetail.group_status_entity.id === ID_GROUP_STATUS_ENTITY.SUCC ||
        orderDetail.group_status_entity.id === ID_GROUP_STATUS_ENTITY.FAIL) &&
      documents.find(
        (document) => document.type === 'file_report' && document.value !== ''
      )
    ) {
      newTabs.push({ key: 'cost', label: 'Costos de la maniobra' });
    }

    setTabs(newTabs);
  }, [getWorkOrderDetailMutation.data, user]);

  if (
    !workOrderId ||
    getWorkOrderDetailMutation.isPending ||
    getHistoryVisitMutation.isPending ||
    getCostsVisitMutation.isPending
  ) {
    return <BiaLoader />;
  }

  const handleReload = () => {
    if (workOrderId) {
      setTimeout(() => {
        getCostsVisitMutation.mutate({ visit_id: workOrderId });
        getWorkOrderDetailMutation.mutate(workOrderId);
      }, 1000);
    }
  };

  const isExpiredOT = () => {
    const startDate = getWorkOrderDetailMutation.data?.visit?.start_date;
    if (!startDate) return false;

    // Parsear la fecha en formato DD-MM-YYYY
    const visitDate = dayjs(startDate, 'DD-MM-YYYY');
    if (!visitDate.isValid()) return false;
    // Sumar 15 días
    const expirationDate = visitDate.add(15, 'day');
    // Comparar con la fecha actual
    const now = dayjs();

    return now.isAfter(expirationDate);
  };

  const handleReloadCosts = () => {
    if (workOrderId) {
      setTimeout(() => {
        getCostsVisitMutation.mutate({ visit_id: workOrderId });
      }, 1000);
    }
  };

  return (
    <div className={styles.detailContainer}>
      <BiaBreadcrumb items={breadcrumbItems} />
      <div className={styles.tabsContainer}>
        {tabs.map((tab) => (
          <button
            key={tab.key}
            className={
              activeTab === tab.key
                ? `${styles.tabItem} ${styles.tabItemActive}`
                : styles.tabItem
            }
            onClick={() => {
              setActiveTab(tab.key);
            }}
            type='button'
          >
            {tab.label}
          </button>
        ))}
      </div>
      <div>
        {activeTab === 'info' && (
          <DetailTabInfo
            visit={getWorkOrderDetailMutation.data?.visit}
            handleReload={handleReload}
          />
        )}
        {activeTab === 'documents' && (
          <DetailTabDocuments
            workOrderId={workOrderId}
            job_code={getWorkOrderDetailMutation.data?.visit?.job_code || ''}
            documents={getWorkOrderDetailMutation.data?.documents || []}
          />
        )}
        {activeTab === 'scope' && (
          <DetailTabScope
            scope={getWorkOrderDetailMutation.data?.scope || []}
          />
        )}
        {activeTab === 'equipments' && (
          <DetailTabEquipments
            equipments={getWorkOrderDetailMutation.data?.equipments || []}
          />
        )}
        {activeTab === 'history' && (
          <DetailTabHistory history={getHistoryVisitMutation.data || []} />
        )}
        {activeTab === 'cost' && (
          <DetailTabCost
            costs={getCostsVisitMutation.data || ({} as ICostsVisitGetResponse)}
            isEditable={user?.user?.role === RolesEnum.CONTRACTOR}
            visitId={workOrderId || ''}
            isExpiredOT={isExpiredOT()}
            onSuccesChange={handleReloadCosts}
          />
        )}
      </div>
    </div>
  );
};
