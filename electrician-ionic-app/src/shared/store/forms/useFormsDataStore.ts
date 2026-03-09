import { create } from 'zustand';
import {
  IPhotosAdd,
  ITransformer,
} from '@mobile/forms-management/data/interfaces/forms.interface';
import {
  IFormsDataStore,
  IFormSubmissionData,
  EnhancedFormData,
  IBuilderField,
} from './dataStore.interface';
import {
  getTableDataByQuery,
  updateTableData,
  deleteTableData,
  upsertTableData,
} from '@shared/db/databaseService';
import {
  IDataBaseNames,
  IDataBaseTables,
  ITableAnswers,
} from '@shared/data/IDatabase';

export const useFormsDataStore = create<IFormsDataStore>((set, get) => ({
  // Estado inicial
  formsSubmissions: {},
  lastSubmission: null,

  // Guardar datos del formulario
  saveFormSubmission: async (
    activity_id: string,
    page_code: string,
    formData: EnhancedFormData,
    photos?: IPhotosAdd[],
    builderItems?: ITransformer[],
    isComplete: boolean = false
  ) => {
    try {
      const key = `${activity_id}__${page_code}`;

      // Separar campos normales de builders
      const normalFields: Record<string, string> = {};
      const builderFields: Record<string, Array<IBuilderField>> = {};

      Object.entries(formData).forEach(([fieldKey, value]) => {
        if (typeof value === 'string') {
          normalFields[fieldKey] = value;
        } else {
          builderFields[fieldKey] = value;
        }
      });

      const submissionData: IFormSubmissionData = {
        activity_id,
        page_code,
        normalFields,
        builderFields,
        photos,
        builderItems,
        timestamp: new Date(),
      };

      const dbData: ITableAnswers = {
        visitId_pageCode: key, // activity_id + "-" + page_code
        isComplete: isComplete, // ✅ Usar el parámetro isComplete
        value: {
          normalFields,
          builderFields,
          photos,
          builderItems,
        },
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      // Verificar si ya existe un registro para esta clave compuesta
      const existingRecords = await getTableDataByQuery<ITableAnswers>(
        IDataBaseNames.OPERACIONES,
        IDataBaseTables.ANSWERS,
        (table) => table.where('visitId_pageCode').equals(key).toArray()
      );

      if (existingRecords.length > 0) {
        // Actualizar registro existente
        await updateTableData<ITableAnswers>(
          IDataBaseNames.OPERACIONES,
          IDataBaseTables.ANSWERS,
          key, // Usar la clave compuesta
          {
            value: dbData.value,
            isComplete: isComplete, // ✅ Actualizar isComplete
            updatedAt: new Date(),
          }
        );
      } else {
        // Insertar nuevo registro
        await upsertTableData<ITableAnswers>(
          IDataBaseNames.OPERACIONES,
          IDataBaseTables.ANSWERS,
          dbData
        );
      }

      // También mantener en memoria para acceso inmediato
      set((state) => ({
        formsSubmissions: {
          ...state.formsSubmissions,
          [key]: submissionData,
        },
        lastSubmission: submissionData,
      }));
    } catch (error) {
      console.error('Error al guardar formulario en BD:', error);
      // Si falla la BD, al menos guardar en memoria
      const key = `${activity_id}-${page_code}`;
      const normalFields: Record<string, string> = {};
      const builderFields: Record<string, Array<IBuilderField>> = {};

      Object.entries(formData).forEach(([fieldKey, value]) => {
        if (typeof value === 'string') {
          normalFields[fieldKey] = value;
        } else {
          builderFields[fieldKey] = value;
        }
      });

      const submissionData: IFormSubmissionData = {
        activity_id,
        page_code,
        normalFields,
        builderFields,
        photos,
        builderItems,
        timestamp: new Date(),
      };

      set((state) => ({
        formsSubmissions: {
          ...state.formsSubmissions,
          [key]: submissionData,
        },
        lastSubmission: submissionData,
      }));
    }
  },

  // Obtener datos de un formulario específico
  getFormSubmission: async (activity_id: string, page_code: string) => {
    try {
      const key = `${activity_id}__${page_code}`;

      // Primero intentar obtener de memoria
      const memoryData = get().formsSubmissions[key];
      if (memoryData) {
        return memoryData;
      }

      // Si no está en memoria, buscar en la base de datos
      const dbRecords = await getTableDataByQuery<ITableAnswers>(
        IDataBaseNames.OPERACIONES,
        IDataBaseTables.ANSWERS,
        (table) => table.where('visitId_pageCode').equals(key).toArray()
      );

      if (dbRecords.length > 0) {
        const dbRecord = dbRecords[0];
        const parsedValue = dbRecord.value;

        const submissionData: IFormSubmissionData = {
          activity_id,
          page_code,
          normalFields: parsedValue.normalFields || {},
          builderFields: parsedValue.builderFields || {},
          photos: parsedValue.photos,
          builderItems: parsedValue.builderItems,
          timestamp: dbRecord.createdAt,
        };

        // Guardar en memoria para acceso futuro
        set((state) => ({
          formsSubmissions: {
            ...state.formsSubmissions,
            [key]: submissionData,
          },
        }));

        return submissionData;
      }

      return undefined;
    } catch (error) {
      console.error('Error al obtener formulario de BD:', error);
      // Fallback a memoria si falla la BD
      const key = `${activity_id}-${page_code}`;
      return get().formsSubmissions[key];
    }
  },

  // Obtener todas las submissions de una actividad
  getAllSubmissionsForActivity: async (activity_id: string) => {
    try {
      // Obtener de la base de datos - buscar todas las claves que comiencen con activity_id-
      const dbRecords = await getTableDataByQuery<ITableAnswers>(
        IDataBaseNames.OPERACIONES,
        IDataBaseTables.ANSWERS,
        (table) =>
          table
            .where('visitId_pageCode')
            .startsWith(`${activity_id}__`)
            .toArray()
      );

      const submissions: IFormSubmissionData[] = [];

      for (const dbRecord of dbRecords) {
        try {
          const parsedValue = dbRecord.value;
          // Extraer page_code de la clave compuesta (formato: "activity_id-page_code")
          const page_code = dbRecord['visitId_pageCode']
            .split('__')
            .slice(1)
            .join('-'); // En caso de que page_code tenga guiones

          const submissionData: IFormSubmissionData = {
            activity_id,
            page_code,
            normalFields: parsedValue.normalFields || {},
            builderFields: parsedValue.builderFields || {},
            photos: parsedValue.photos,
            builderItems: parsedValue.builderItems,
            timestamp: dbRecord.createdAt,
          };
          submissions.push(submissionData);

          // También agregar a memoria
          const key = dbRecord['visitId_pageCode'];
          set((state) => ({
            formsSubmissions: {
              ...state.formsSubmissions,
              [key]: submissionData,
            },
          }));
        } catch (parseError) {
          console.error('Error parsing submission data:', parseError);
        }
      }

      // También incluir datos que solo estén en memoria
      const memorySubmissions = get().formsSubmissions;
      Object.entries(memorySubmissions)
        .filter(([key]) => key.startsWith(`${activity_id}-`))
        .forEach(([_, submission]) => {
          // Solo agregar si no está ya en la lista de BD
          const exists = submissions.some(
            (s) => s.page_code === submission.page_code
          );
          if (!exists) {
            submissions.push(submission);
          }
        });

      return submissions;
    } catch (error) {
      console.error('Error al obtener submissions de BD:', error);
      // Fallback a memoria
      const submissions = get().formsSubmissions;
      return Object.entries(submissions)
        .filter(([key]) => key.startsWith(`${activity_id}-`))
        .map(([_, submission]) => submission);
    }
  },

  // Limpiar submission específica
  clearFormSubmission: async (activity_id: string, page_code: string) => {
    try {
      const compositeKey = `${activity_id}-${page_code}`;

      // Eliminar de la base de datos usando la clave compuesta
      await deleteTableData(
        IDataBaseNames.OPERACIONES,
        IDataBaseTables.ANSWERS,
        compositeKey
      );

      // También eliminar de memoria
      set((state) => {
        const newSubmissions = { ...state.formsSubmissions };
        delete newSubmissions[compositeKey];
        return { formsSubmissions: newSubmissions };
      });
    } catch (error) {
      console.error('Error al eliminar formulario de BD:', error);
      // Fallback: solo eliminar de memoria
      const compositeKey = `${activity_id}-${page_code}`;
      set((state) => {
        const newSubmissions = { ...state.formsSubmissions };
        delete newSubmissions[compositeKey];
        return { formsSubmissions: newSubmissions };
      });
    }
  },

  // Limpiar todas las submissions de una actividad
  clearAllSubmissionsForActivity: async (activity_id: string) => {
    try {
      // Eliminar de la base de datos - buscar todas las claves que comiencen con activity_id-
      const dbRecords = await getTableDataByQuery<ITableAnswers>(
        IDataBaseNames.OPERACIONES,
        IDataBaseTables.ANSWERS,
        (table) =>
          table
            .where('visitId_pageCode')
            .startsWith(`${activity_id}__`)
            .toArray()
      );

      for (const record of dbRecords) {
        await deleteTableData(
          IDataBaseNames.OPERACIONES,
          IDataBaseTables.ANSWERS,
          record['visitId_pageCode'] // Usar la clave compuesta como identificador
        );
      }

      // También eliminar de memoria (FIX: pattern correcto)
      set((state) => {
        const newSubmissions = { ...state.formsSubmissions };
        Object.keys(newSubmissions).forEach((key) => {
          if (key.startsWith(`${activity_id}__`)) {
            // FIX: Doble underscore
            delete newSubmissions[key];
          }
        });
        return { formsSubmissions: newSubmissions };
      });
    } catch (error) {
      console.error('Error al eliminar submissions de BD:', error);
      // Fallback: solo eliminar de memoria (FIX: pattern correcto)
      set((state) => {
        const newSubmissions = { ...state.formsSubmissions };
        Object.keys(newSubmissions).forEach((key) => {
          if (key.startsWith(`${activity_id}__`)) {
            // FIX: Doble underscore
            delete newSubmissions[key];
          }
        });
        return { formsSubmissions: newSubmissions };
      });
    }
  },

  // Obtener la última submission
  getLastSubmission: () => {
    return get().lastSubmission;
  },
}));
