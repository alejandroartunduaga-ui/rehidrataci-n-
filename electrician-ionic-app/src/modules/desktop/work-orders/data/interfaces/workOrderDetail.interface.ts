import {
  IContractor,
  IElectricianOrder,
  IGroupStatusEntity,
  IServiceType,
} from './workOrders.interface';

export interface IDocument {
  type: string;
  value: string;
  label: string;
}

interface IEquipmentItem {
  type: string;
  label: string;
  value: string;
  equipment: string;
}

export type IEquipment = IEquipmentItem[];

interface IScopeItem {
  type: string;
  value: string;
  label: string;
}

export interface IVisit {
  id: string;
  job_code: string;
  service_type_id: string | null;
  service_type: IServiceType;
  group_status_entity: IGroupStatusEntity;
  electricians: IElectricianOrder[] | [];
  electricians_name?: string;
  start_date: string;
  hours: string;
  city_name: string;
  internal_bia_code: string;
  contract_name: string;
  address: string;
  network_operator_name: string;
  contractor_id: string;
  electrician_status_id: string;
  url: string;
  contractor: IContractor | null;
  notes: string;
  is_process: boolean;
}

export interface IWorkOrderDetailResponse {
  visit: IVisit;
  documents: IDocument[];
  equipments: IEquipment[];
  scope: IScopeItem[];
}

export interface IHistory {
  date: string;
  description: string;
  user: string;
  action: string;
  label_action: string;
  icon: string;
  type_card: string;
  before: string;
  now: string;
  icon_color: string;
}

export interface IHistoryVisitRequest {
  visit_id: string;
}
