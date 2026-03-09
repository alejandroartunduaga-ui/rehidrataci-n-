export interface IWorkOrdersRequest {
  page: number;
  search_texts?: string;
  start_from_date?: string;
  start_to_date?: string;
  service_type_ids?: string[];
  group_status?: string[];
  contractor_ids?: string[];
  electrician_ids?: string[];
  city_names?: string[];
  network_operator_names?: string[];
  report_pdf?: 'PENDING' | 'GENERATED' | 'ALL';
}

export interface IElectricianOrder {
  id: string;
  role: 'LEAD' | 'ASSISTANT';
  name: string;
}

export interface IServiceType {
  name: string;
  id: string;
}

export enum ID_GROUP_STATUS_ENTITY {
  AS_CON = 'AS_CON', //'Por asignar contratista',
  AS_ELEC = 'AS_ELEC', //'Por asignar electricista',
  PEN_CONF = 'PEN_CONF', //'Pendiente de confirmación',
  REJ_CONT = 'REJ_CONT', //'Rechazada contratista',
  RED_EXE = 'RED_EXE', //'Lista para ejecutar',
  PEN_CLOS = 'PEN_CLOS', //'Pendiente de cierre',
  SUCC = 'SUCC', //'Exitosa',
  FAIL = 'FAIL', //'Fallida',
  CAN = 'CAN', //'Cancelada',
  PEND_PDF = 'PEND_PDF', //'Pendiente de acta',
  EXPIRED = 'EXPIRED', //'Expirada',
}

export interface IGroupStatusEntity {
  id: ID_GROUP_STATUS_ENTITY;
  name: string;
}

export interface IContractor {
  code: string;
  name: string;
  status: string;
  is_bia: boolean;
  bia?: boolean;
}

export interface IWorkOrder {
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
  is_process: boolean;
}

export interface ISummary {
  canceled: number;
  failed: number;
  pending: number;
  successful: number;
  total: number;
  expired: number;
}

export interface IWorkOrderResponse {
  content: IWorkOrder[];
  total_elements: number;
  total_pages: number;
  page_number: number;
  page_size: number;
  summary: ISummary;
}

export interface IRescheduleRequest {
  visit_id: string;
  start: string; // ISO 8601
  contractor_id?: string;
  contractor_name?: string;
}

interface IElectricianStatus {
  id: string;
  name: string;
  color: string;
}

interface IVisitType {
  id: string;
  description: string;
  duration: number;
}

export interface IRescheduleResponse {
  service_type_id: string;
  electrician_status_id: string;
  measurement_type: string | null;
  contract_id: string;
  created_at: string;
  electrician_status: IElectricianStatus;
  arrival_photos: string[];
  visit_type: IVisitType;
  title: string;
  contractor_name: string;
  emails: string[];
  visit_serial: number;
  city_name: string;
  updated_at: string;
  pdf_document_data_id: string | null;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  electricians: any[];
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  contract_details: any | null;
  internal_bia_code: string;
  end: string;
  visit_type_id: string;
  id: string;
  network_operator_name: string;
  department: string;
  send_status_network_operator: string | null;
  measurement_type_id: string | null;
  address: string;
  company_id: string;
  start: string;
  contract_name: string;
  created_by: string;
  card_id: number;
  contractor_id: string;
  installation_fee_id: string;
  company_name: string;
  network_operator_id: string;
  updated_by: string;
  act_pdf_url: string | null;
  city_id: string;
  status: string;
}

export enum ELECTRICIAN_STATUS {
  CLOSURE_CANCELED = 'CLOSURE_CANCELED', // Canceladas
  CLOSURE_FAILED = 'CLOSURE_FAILED', // Fallidas
  CLOSURE_SUCCESSFUL = 'CLOSURE_SUCCESSFUL', // Pendientes
}

export interface IReasonCancelCloseResponse {
  electrician_status: ELECTRICIAN_STATUS[];
  id: string;
  title: string;
}

export interface ICancelCloseOTRequest {
  visit_id: string;
  params: {
    status: ELECTRICIAN_STATUS;
    reason_ids?: string[];
    observation?: string;
  };
}

export enum APPROVAL_STATUS {
  APPROVED = 'ACCEPTED_CONTRACTOR', // Aprobada
  REJECTED = 'REJECTED_CONTRACTOR', // Rechazada
}

export interface IConfirmRejectOTRequest {
  visit_id: string;
  params: {
    status: APPROVAL_STATUS;
  };
}

export interface IConfirmRejectOTResponse {
  success: boolean;
  message: string;
}

export interface IResetVisitRequest {
  visit_id: string;
}

export interface IResetVisitResponse {
  success?: boolean;
  message?: string;
}
