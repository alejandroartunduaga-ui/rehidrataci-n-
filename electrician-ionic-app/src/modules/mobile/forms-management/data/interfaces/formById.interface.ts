import { IPhotosAdd, ITransformer } from './forms.interface';

export interface IFormsMap {
  dataForms: IFormResponse[];
  addInfo?: ITransformer[] | [];
  photos?: IPhotosAdd[];
}
export interface IFormResponse {
  code: string;
  name: string;
  description: string;
  type: string;
  fields: IFields[];
  built_widgets: IBuiltWidgets[];
  condition: string;
}

export interface IFields {
  code: string;
  name: string;
  title: string;
  type: string;
  mandatory: boolean;
  mandatory_telemetry: boolean;
  input_type: string;
  selected_value: string[] | null;
  items: IItems[] | null;
  editable: boolean;
  condition: string;
  name_parent: string;
  maximum_input: number;
  sub_title: string;
}

export interface IItems {
  condition: string;
  option: string;
  type: string;
}

export interface IBuiltWidgets {
  widget_code: string | null;
  fields: IFields[];
}

export interface IFormDataDB {
  id?: number;
  visitId: string;
  pageCode: string;
  data: IFormResponse;
  createdAt: Date;
  updatedAt: Date;
}
