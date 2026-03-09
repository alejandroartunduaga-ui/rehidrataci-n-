export interface IFormsByIdRequest {
  activity_id: string;
  page_code: string;
}

export interface IBuildWidget {
  field_code: string;
  index: number;
  values: string[];
}

export interface IFormsByIdResponse {
  code: string;
  name: string;
  description: string;
  hide_when_tags: null;
  open: boolean;
  icon_url: null;
  index: number;
  page: number;
  type: string;
  minimum_amount: number;
  maximum_amount: number;
  created_at: Date;
  updated_at: Date;
  fields: Field[];
  mandatory_fields: number;
  built_widgets: [IBuildWidget[]];
}

export interface Field {
  code: string;
  name: string;
  title: string;
  hide_when_tags: null;
  type: FieldType;
  mandatory: boolean;
  is_enabled: boolean;
  input_type: InputType;
  default_value: null;
  selected_value: string[];
  color: null;
  icon_url: null | string;
  index: number;
  minimum_inputs: number;
  maximum_inputs: number;
  data: null;
  options: Options | null;
  network_operators: string[];
  preloaded: boolean;
  editable: boolean;
  origin: string;
  created_at: Date;
  updated_at: Date;
  condition: string;
}

export enum InputType {
  Dropdown = 'DROPDOWN',
  Number = 'NUMBER',
  String = 'STRING',
}

export enum ENameField {
  RADIO_CONDITION_PARENT = 'radio_condition_parent',
  RADIO_CONDITION_CHILDREN = 'radio_condition_children',
}

export interface Options {
  code: string;
  name: string;
  options: string[];
  option_tags: OptionTag[];
  created_at: Date;
  updated_at: Date;
}

export interface OptionTag {
  background_color: null;
  condition: string;
  deletable_option: boolean;
  font_color: null;
  option: string;
  type: OptionTagType.Value;
  value_to_hide_tag: null;
}

export enum OptionTagType {
  Value = 'VALUE',
}

export enum FieldType {
  Selector = 'SELECTOR',
  TextField = 'TEXT_FIELD',
}

export interface IFormField {
  code: string;
  name: string;
  title: string;
  mandatory: boolean;
  input_type: string;
  type: string;
  selected_value: string;
  options: string[] | null;
  option_tags: OptionTag[];
  condition: string;
}

export interface IMappedFormsResponse {
  code: string;
  name: string;
  description: string;
  type: string;
  fields: IFormField[];
  built_widgets: [IBuildWidget[]];
}

export interface IFormDynamic {
  name: string;
  dataForm: IFormData;
  activity_id: string;
  page_code: string;
  index: string;
}

export interface ITransformer {
  items: IArrTransformer[];
  photos?: IPhotosAdd[];
  widget_code?: string;
}

export interface IArrTransformer {
  code: string;
  name: string;
  value: string;
  widget_code?: string;
}
export interface IPhotosAdd {
  url: string | Blob; // 🔄 Soporte para string (backward compatibility) y Blob (nuevo)
  blob?: Blob; // 🆕 Blob para almacenamiento eficiente
  displayUrl?: string; // 🆕 URL temporal para display (createObjectURL)
  name: string;
  code: string;
}

export interface IFormData {
  dataForms: IMappedFormsResponse[];
  addInfo?: ITransformer[] | [];
  photos?: IPhotosAdd[];
}

export interface RootObject {
  [key: string]: IFormData;
}

export interface ITransformedDataRequest {
  visit_id: string;
  values: {
    field_code: string;
    values: string[];
  }[];
  built_widgets: {
    widget_code: string | null;
    fields: {
      field_code: string;
      values: string[];
    }[];
  }[];
  status_history: [];
}

export interface IS3UploadResponse {
  location: string;
}

export interface IUploadFileParams {
  base64File: string;
  fileName: string;
}
