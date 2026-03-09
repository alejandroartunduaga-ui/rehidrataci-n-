import { ActivityStatus } from './visits.interface';

// export enum FieldType {
//   LABEL = 'LABEL',
//   PIN = 'PIN',
//   MULTIPLE_LINE_LABEL_WITH_ICON = 'MULTIPLE_LINE_LABEL_WITH_ICON',
//   MAP = 'MAP',
//   PREVIEW_BUTTON = 'PREVIEW_BUTTON',
// }

export interface IVisitDetail {
  activity_status: ActivityStatus;
  descriptions: IDescription[];
  form_version: string;
}

export interface IVisitDetailDB {
  visitId: string;
  data: IVisitDetail;
  createdAt: Date;
  updatedAt: Date;
}

export interface IField {
  code: string;
  name: string;
  title: string;
  hide_when_tags: null;
  type: string;
  mandatory: boolean;
  is_enabled: boolean;
  input_type: string;
  default_value: null | string | number;
  selected_value: string[];
  color: string;
  icon_url?: string;
  index: number;
  minimum_inputs: number;
  maximum_inputs: number;
  data:
    | null
    | string
    | { lat: number; long: number }
    | { button_copy: string; button_link: string[] }
    | IScopes[]
    | Array<IEquipments[]>;
  options: null;
  network_operators: string[];
  preloaded: boolean;
  editable: boolean;
  origin: null;
  created_at: string;
  updated_at: string;
}

export interface IScopes {
  label: string;
  type: string;
  value: string;
}
export interface IEquipments {
  equipment: string;
  label: string;
  type: string;
  value: string;
}

export interface IDescription {
  title: string;
  fields: IField[];
}
