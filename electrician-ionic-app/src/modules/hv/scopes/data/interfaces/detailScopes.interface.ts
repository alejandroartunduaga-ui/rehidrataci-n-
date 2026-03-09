export interface IGetRequirementDetailRequest {
  scope_id: string;
}

export interface IGetRequirementDetailResponse {
  general_border_information: IGeneralBorderInformation;
  ot_info: IOTInfo;
  technical_information: ITechnicalInformation;
  cgm_info: ICGMInfo;
  scope_definition: IScopeDefinition;
}

export interface IGeneralBorderInformation {
  sic: string;
  border_name: string;
  network_operator: string;
  city: string;
  department: string;
  address: string;
  monthly_consumption_kwh: number;
  contract_id: string;
}

export interface IOTInfo {
  last_visit_service_type: string;
  last_visit_date: string;
  last_visit_observation: string;
  total_telemetry_work_orders: number;
  total_successful_telemetry_work_orders: number;
  last_successful_telemetry_observation: string;
}

export interface ITechnicalInformation {
  measurement_type: string;
  voltage_level: string;
  measurement_factor: number;
  meter_serial: string;
  current_meter_brand: string;
  current_ip: string;
  current_apn: string;
  ageing_without_tm: string;
}

export interface ICGMInfo {
  failure_cause: string;
  sustained_ip_test15_seconds: string;
  ip_test_image: string;
  port40005000_tests: string;
  port_tests_image: string;
  text_message_recovery_test: string;
  recovery_test_image: string;
  meter_telemetry_test: string;
  additional_observations: string;
}

export interface IScopeDefinition {
  type_service: string;
  requires_network_operator_support: boolean;
  scope_description: string;
  requires_kit: boolean;
  requires_additional_equipment: boolean;
  sku_ids: ISkuId[];
  can_edit: boolean;
}

export interface ISkuId {
  name: string;
  quantity: number;
  sku_id: number;
}

export interface IHistoryScopeItem {
  date: string;
  description: string;
  user: string;
  action: string;
  label_action: string;
  icon: string;
  icon_color: string;
  type_card: string;
  before: string;
  now: string;
  timestamp: string;
}

export interface ISku {
  id: number;
  name: string;
  category: string;
}

export interface ISaveScopeDefinitionRequest {
  scope_id: string;
  type_service: string;
  requires_network_operator_support: boolean;
  scope_description: string;
  requires_kit: boolean;
  requires_additional_equipment: boolean;
  sku_ids: ISkuId[];
}

export interface ISaveScopeDefinitionResponse {
  message: string;
  success: boolean;
}
