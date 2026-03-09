export enum EScopeType {
  INSTALLATION = 'INST',
  NORMALIZATION = 'NORM',
}

export enum EStatusScope {
  DOCUMENT_VALIDATION = 'DOCUMENT_VALIDATION',
  SCOPE_DEFINITION = 'SCOPE_DEFINITION',
  COMPLETED = 'COMPLETED',
}
export interface IGetNetworkOperatorRegistryResponse {
  network_operators: string[];
  type_scopes: ITypeScope[];
}

export interface ITypeScope {
  id: number;
  name: string;
}

export interface IPostRequirementsSearchRequest {
  status: string;
  direction: 'ASC' | 'DESC';
  bia_code_or_sic_code: string | null;
  type_scopes: string[];
  network_operators: string[];
  page: number;
  size: number;
}

export interface IPostRequirementsSearchResponse {
  requirements: IRequirement[];
  total_records_page: number;
  total_records: number;
  total_pages: number;
}

export interface IRequirement {
  id: string;
  internal_bia_code: string;
  contract_name: string;
  scope_type: EScopeType;
  sub_status: string | null;
  network_operator: string;
  ageing_days: number;
  created_at: string;
  can_edit: boolean;
}
