export interface IListContractorsResponse {
  code: string;
  name: string;
  status: string;
  is_bia: boolean;
}

export interface IAssignContractorRequest {
  contractor_name: string;
  contractor_id: string;
  visit_id: string;
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

export interface IAssignContractorResponse {
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
