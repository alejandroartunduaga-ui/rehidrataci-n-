export interface ISearchContractRequest {
  search_texts: string;
  sic: string;
  page: number;
}

export interface IContract {
  contract_id: string;
  bia_code: string;
  sic_code: string;
  contract_number: string;
  client_name: string;
  status: string;
  created_at: string;
  updated_at: string;
}

export interface ISearchContractResponse {
  contract_id: number;
  contract_name: string;
  network_operator: string;
  company_id: number;
  code_sic: string;
  internal_bia_code: string;
  address: string;
  history_cv: IHistoryCv;
  total_elements: number;
  total_pages: number;
}

export interface IHistoryCv {
  total_elements: number;
  total_pages: number;
  content: IHistoryCvContent[];
}

export interface IHistoryCvContent {
  cv_id: number;
  version: string;
  created_at: string;
  user: string;
}

export interface IGetTechnicalLifeDetailsRequest {
  contract_id: string;
}
// eslint-disable-next-line @typescript-eslint/no-empty-object-type
export interface IGetTechnicalLifeDetailsResponse extends Array<ISectionsHv> {}

export interface ISectionsHv {
  name: string;
  section_id: string;
  fields: IFieldHv[];
}

export interface IFieldHv {
  condition: string;
  mandatory: boolean;
  regex: string | null;
  description_regex: string | null;
  title: string;
  field_name: string;
  value: string[] | null;
  type: ETypesHv;
  editable: boolean;
  items: IItemsHv[] | null;
  groups: IGroupsHv[] | null;
}

export interface IItemsHv {
  condition: string;
  option: string;
}

export interface IGroupsHv {
  name: string;
  fields: IFieldHv[];
}

export enum ETypesHv {
  DROPDOWN_ONE = 'DROPDOWN_ONE',
  DROPDOWN_MULTIPLE = 'DROPDOWN_MULTIPLE',
  STRING = 'STRING',
  DATE = 'DATE',
  TIME = 'TIME',
  FILE = 'FILE',
  NUMBER = 'NUMBER',
  INTEGER = 'INTEGER',
  FLOAT = 'FLOAT',
  GROUP_FIELDS = 'GROUP_FIELDS',
  GROUP_FIELDS_STATIC = 'GROUP_FIELDS_STATIC',
  LABEL = 'LABEL',
  TEXT_AREA = 'TEXT_AREA',
}

export interface IPostTechnicalLifeDetailsRequest {
  contract_id: string;
  data: {
    values: IFieldPostHv[];
  };
}

export interface IFieldPostHv {
  field_name: string;
  values: string[] | null[] | null;
}

export interface IPostTechnicalLifeDetailsResponse {
  cause: object;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  stack_trace: any[];
  service_id: string;
  message: string;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  suppressed: any[];
  localized_message: string;
}

export interface IGetTechnicalLifeDetailsPdfRequest {
  cv_id: string;
}

export interface IGetTechnicalLifeDetailsPdfResponse {
  created_at: string;
  hv_id: number;
  url: string;
}
