// Interfaz para la request de guardar formularios
export interface ISaveFormsRequest {
  visit_id: string;
  values: Array<{
    field_code: string;
    values: string[];
  }>;
  built_widgets: Array<{
    widget_code: string | null;
    fields: Array<{
      field_code: string;
      values: string[];
    }>;
  }>;
  visit_type?: string;
}

// Interfaz para la respuesta de guardar formularios
export interface ISaveFormsResponse {
  success: boolean;
  message: string;
}
