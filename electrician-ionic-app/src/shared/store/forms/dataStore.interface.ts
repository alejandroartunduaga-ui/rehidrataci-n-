import {
  IPhotosAdd,
  ITransformer,
} from '@mobile/forms-management/data/interfaces/forms.interface';

// Tipo para campos de builder
export interface IBuilderField {
  field_code: string;
  value: string;
  name: string;
}

// Tipo para la estructura mejorada de datos
export type EnhancedFormData = Record<string, string | Array<IBuilderField>>;

// Interfaz para los datos del formulario procesados
export interface IFormSubmissionData {
  activity_id?: string;
  page_code?: string;
  normalFields: Record<string, string>;
  builderFields: Record<string, Array<IBuilderField>>;
  photos?: IPhotosAdd[];
  builderItems?: ITransformer[];
  timestamp?: Date;
}

// Interfaz del store
export interface IFormsDataStore {
  // Estado
  formsSubmissions: Record<string, IFormSubmissionData>; // key: `${activity_id}-${page_code}`
  lastSubmission: IFormSubmissionData | null;

  // Acciones
  saveFormSubmission: (
    activity_id: string,
    page_code: string,
    formData: EnhancedFormData,
    photos?: IPhotosAdd[],
    builderItems?: ITransformer[],
    isComplete?: boolean
  ) => Promise<void>;

  getFormSubmission: (
    activity_id: string,
    page_code: string
  ) => Promise<IFormSubmissionData | undefined>;

  getAllSubmissionsForActivity: (
    activity_id: string
  ) => Promise<IFormSubmissionData[]>;

  clearFormSubmission: (
    activity_id: string,
    page_code: string
  ) => Promise<void>;

  clearAllSubmissionsForActivity: (activity_id: string) => Promise<void>;

  getLastSubmission: () => IFormSubmissionData | null;
}
