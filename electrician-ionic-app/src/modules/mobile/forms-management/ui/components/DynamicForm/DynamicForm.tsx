import React, { useState, useCallback, useEffect, useRef } from 'react';
import {
  IonButton,
  IonItem,
  IonLabel,
  IonInput,
  IonSelect,
  IonSelectOption,
  IonTextarea,
  IonCheckbox,
  IonRadioGroup,
  IonRadio,
  IonText,
  IonAccordion,
  IonAccordionGroup,
  IonFab,
  IonModal,
} from '@ionic/react';
import {
  IFormResponse,
  IFields,
  IItems,
} from '@forms-management/data/interfaces/formById.interface';
import {
  IPhotosAdd,
  ITransformer,
} from '@forms-management/data/interfaces/forms.interface';
import {
  BiaDatePicker,
  BiaIcon,
  BiaInput,
  BiaLoader,
  BiaRadioGroup,
  BiaSelect,
  BiaText,
  BiaTextArea,
  InputTelemetry,
  BiaPopupMobile,
} from '@entropy/index';
import { BiaSignaturePad } from '@entropy/signature/signature';
import { AddPhoto } from './AddPhoto/AddPhoto';
import { BuilderModal } from './BuilderModal';
import { useFormsDataStore } from '@shared/store/forms/useFormsDataStore';
import styles from './../../pages/Forms.module.css';
import {
  StatusTelemetry,
  StatusTelemetryResponse,
} from '@mobile/forms-management/data/interfaces/telemetry.interface';
import { useHistory, useParams } from 'react-router-dom';
import { useTelemetryInstaled } from '@mobile/forms-management/data/hooks';
import { useIonViewWillEnter } from '@ionic/react';
import { useQueryParams } from '@shared/hooks/useQueryParams';
import { useTranslation } from 'react-i18next';
import { TranslationNamespaces } from '@shared/i18n';
import { useConnectivityStore } from '@shared/store/offline/useConnectivityStore';
import { EnumFeatureFlag, useFeatureFlag } from '@shared/hooks/useFeatureFlag';
import { TELEMETRY_POLLING_INTERVAL } from '@shared/constants/environment.constants';
import { getTableDataByQuery } from '@shared/db/databaseService';
import {
  IDataBaseNames,
  IDataBaseTables,
  ITableTelemetry,
} from '@shared/data/IDatabase';
import { OfflineAlert } from '@shared/components';
import { ActivityStatus } from '@mobile/visits/data/interfaces/visits.interface';
import { ENameField } from '@mobile/forms-management/data/interfaces/forms.interface';

// Tipo para campos de builder
interface IBuilderField {
  field_code: string;
  value: string;
  name: string;
}

// Tipo para la estructura mejorada de datos
type EnhancedFormData = Record<string, string | Array<IBuilderField>>;

interface DynamicFormProps {
  formData: IFormResponse[];
  onSubmit: (
    data: EnhancedFormData,
    photos?: IPhotosAdd[],
    builderItems?: ITransformer[] // Mantener para compatibilidad si es necesario
  ) => void; // NOTA: Solo para navegación - DynamicForm ya guardó con isComplete:true. Llamar ref.current.resetLoading()
  onCancel?: () => void;
  submitButtonText?: string;
  cancelButtonText?: string;
  initialPhotos?: IPhotosAdd[]; // Fotos iniciales si existen
  initialBuilderItems?: ITransformer[]; // Items de builder iniciales si existen
  hideButtons?: boolean; // Para ocultar botones flotantes cuando está en modal
  disableBuilders?: boolean; // Para deshabilitar completamente la funcionalidad de builders

  initialValues?: Record<string, string>;
}

interface RouteParams {
  activity_id: string;
  page_code: string;
  name_form: string;
  index: string;
}

export const DynamicForm = React.forwardRef<
  { submit: () => void; resetLoading: () => void },
  DynamicFormProps
>(
  (
    {
      formData,
      onSubmit,
      onCancel,
      submitButtonText = 'Guardar',
      cancelButtonText = 'Cancelar',
      initialPhotos = [],
      initialBuilderItems = [],
      hideButtons = false,
      disableBuilders = false,
      initialValues,
    },
    ref
  ) => {
    const { t } = useTranslation(TranslationNamespaces.FORMS_MANAGEMENT);
    const { activity_id, page_code, name_form, index } =
      useParams<RouteParams>();
    const { getQueryParam } = useQueryParams();
    const activityStatus = getQueryParam('activity_status');
    const [formValues, setFormValues] = useState<Record<string, string>>({});
    const [errors, setErrors] = useState<Record<string, string>>({});
    const [parentSelected, setParentSelected] = useState<string | null>(null);
    const [visibleFields, setVisibleFields] = useState<Set<string>>(new Set());
    const [showErrors, setShowErrors] = useState<boolean>(false);
    const [photos, setPhotos] = useState<IPhotosAdd[]>(initialPhotos);
    const [isLoadingData, setIsLoadingData] = useState<boolean>(false);
    const [isLoading, setIsLoading] = useState<boolean>(false);
    const [loadingMessage, setLoadingMessage] = useState<string>('');
    const [isOpenTelemetryEditPopup, setIsOpenTelemetryEditPopup] =
      useState<boolean>(false);
    // Guardar el código del campo de telemedida que activó el popup
    const [
      currentTelemetryFieldBeingEdited,
      setCurrentTelemetryFieldBeingEdited,
    ] = useState<string | null>(null);
    // Hook para navegar
    const history = useHistory();
    // Hook Telemetry store
    const {
      setTelemetry,
      getTelemetryStatusByCodeField,
      getTelemetryReadById,
      updateTelemetryFromRead,
    } = useTelemetryInstaled();
    // Hook Feature Flag
    const isTelemetryEnabled = useFeatureFlag(EnumFeatureFlag.TELEMETRY);
    const [telemetryStatusByField, setTelemetryStatusByField] = useState<
      Record<string, StatusTelemetry>
    >({});
    const [showPhotoForTelemetry, setShowPhotoForTelemetry] = useState<
      Record<string, boolean>
    >({});
    const isOnline = useConnectivityStore((state) => state.isOnline) ?? false;

    const mapResponseToStatus = useCallback(
      (resp: StatusTelemetryResponse | null): StatusTelemetry => {
        switch (resp) {
          case 'SUCCESS':
            return StatusTelemetry.SUCCESS;
          case 'FAILED':
            return StatusTelemetry.FAILED;
          case 'PROCESS':
            return StatusTelemetry.PROCESS;
          case 'PENDING':
          default:
            return StatusTelemetry.PENDING;
        }
      },
      []
    );

    // Utilidades para manejar múltiples condiciones en un mismo tag (separadas por "|")
    const splitConditions = (cond?: string): string[] => {
      return (cond || '')
        .split('|')
        .map((c) => c.trim())
        .filter((c) => c.length > 0);
    };

    // Verifica si un campo debe mostrarse basado en sus condiciones
    // Condiciones múltiples (ej: "yes_condition_cell|other_type_cell")
    // requieren que TODAS estén activas (operador AND)
    const shouldShowFieldByCondition = (
      fieldCondition: string | undefined,
      activeConditions: Set<string>
    ): boolean => {
      if (!fieldCondition || fieldCondition.trim() === '') return true;

      const parts = splitConditions(fieldCondition);
      if (parts.length === 0) return true;

      // Si hay múltiples condiciones separadas por |, TODAS deben estar activas (AND)
      return parts.every((condition) => activeConditions.has(condition));
    };

    // Retorna las condiciones que activa un campo
    const fieldTriggerConditions = (
      fieldCondition: string | undefined,
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      activeConditions: Set<string>
    ): string[] => {
      const parts = splitConditions(fieldCondition);
      if (parts.length === 0) return [];
      return parts;
    };

    // Recopila todas las condiciones activas de TODOS los selectores con valores seleccionados
    const getAllActiveConditions = (
      currentFieldCode?: string,
      currentValue?: string
    ): Set<string> => {
      const activeConditions = new Set<string>();

      formData.forEach((form: IFormResponse) => {
        form.fields.forEach((field: IFields) => {
          // Solo considerar campos SELECTOR con valor seleccionado
          if (field.type === 'SELECTOR') {
            // Usar el valor actual si es el campo que se está modificando
            const selectedValue =
              field.code === currentFieldCode
                ? currentValue
                : formValues[field.code];

            if (!selectedValue) return;

            // Buscar el item seleccionado directamente en field.items
            const selectedItem = (field.items || []).find(
              (item) => item.option === selectedValue
            );

            // Si el item seleccionado tiene condición, agregarla al conjunto
            if (selectedItem?.condition) {
              const conditions = splitConditions(selectedItem.condition);
              conditions.forEach((cond) => activeConditions.add(cond));
            }
          }
        });
      });

      return activeConditions;
    };

    const loadTelemetryStatuses = useCallback(async () => {
      try {
        if (!isTelemetryEnabled) {
          return;
        }
        setIsLoading(true);
        setLoadingMessage(t('loading.data.telemetry'));
        const telemetryFieldCodes: string[] = [];
        formData.forEach((form) => {
          form.fields.forEach((field) => {
            if (field.input_type === 'TELEMETRY') {
              telemetryFieldCodes.push(field.code);
            }
          });
        });

        if (telemetryFieldCodes.length === 0) {
          setIsLoading(false);
          return;
        }

        // Obtener estados y registros de telemedida en paralelo
        const [statusResults, telemetryRecords] = await Promise.all([
          Promise.all(
            telemetryFieldCodes.map(async (code) => {
              const resp = await getTelemetryStatusByCodeField(
                code,
                activity_id
              );
              return [code, mapResponseToStatus(resp)] as const;
            })
          ),
          Promise.all(
            telemetryFieldCodes.map(async (code) => {
              const records = await getTableDataByQuery<ITableTelemetry>(
                IDataBaseNames.OPERACIONES,
                IDataBaseTables.TELEMETRY,
                async (table) =>
                  table
                    .where('codeField')
                    .equals(code)
                    .filter((record) => record.visitId === activity_id)
                    .toArray()
              );
              return [code, records] as const;
            })
          ),
        ]);

        // Actualizar estados de telemedida
        setTelemetryStatusByField((prev) => {
          const updated = { ...prev };
          statusResults.forEach(([code, status]) => {
            updated[code] = status;
          });
          return updated;
        });

        // Verificar y actualizar visibilidad de fotos
        const photoVisibility: Record<string, boolean> = {};
        telemetryRecords.forEach(([code, records]) => {
          if (records && records.length > 0) {
            const currentRecord = records.reduce((latest, current) =>
              latest.updatedAt > current.updatedAt ? latest : current
            );
            if (currentRecord?.intent >= 3) {
              photoVisibility[code] = true;
            }
          }
        });
        setShowPhotoForTelemetry((prev) => ({
          ...prev,
          ...photoVisibility,
        }));

        setIsLoading(false);
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
      } catch (_error) {
        // silent
      }
    }, [
      formData,
      getTelemetryStatusByCodeField,
      mapResponseToStatus,
      t,
      isTelemetryEnabled,
      activity_id,
    ]);

    // Función para polling de telemetría cada 25 segundos
    const pollTelemetryReads = useCallback(async () => {
      if (!isTelemetryEnabled) return;

      try {
        // Obtener todos los registros de telemetría de la base de datos para esta visita
        const telemetryRecords = await getTableDataByQuery<ITableTelemetry>(
          IDataBaseNames.OPERACIONES,
          IDataBaseTables.TELEMETRY,
          async (table) => table.where('visitId').equals(activity_id).toArray()
        );

        if (!telemetryRecords || telemetryRecords.length === 0) return;

        // Filtrar solo registros que necesitan seguimiento
        // PENDING: Solo si NO tiene idTelemetry (nueva prueba sin enviar)
        // PROCESS: Siempre (prueba en curso que necesita seguimiento)
        const recordsToCheck = telemetryRecords.filter(
          (record) =>
            record.status === 'PROCESS' ||
            (record.status === 'PENDING' && !record.idTelemetry)
        );

        // Para cada registro de telemetría en estado PENDING o PROCESS, ejecutar fetchTelemetryRead
        for (const record of recordsToCheck) {
          if (record.idTelemetry) {
            try {
              const readResponse = await getTelemetryReadById(
                record.idTelemetry.toString(),
                isOnline
              );

              // Actualizar la base de datos con los nuevos valores de url y status
              await updateTelemetryFromRead({
                idTelemetry: record.idTelemetry,
                status: readResponse.status,
                url: readResponse.url,
                message: readResponse.message,
              });

              // Actualizar el estado local para reflejar el cambio en la UI
              setTelemetryStatusByField((prev) => {
                const updated = { ...prev };
                const fieldCode = record.codeField;
                updated[fieldCode] = mapResponseToStatus(readResponse.status);
                return updated;
              });

              // Actualizar también el registro de telemetría para refrescar los intentos
              const updatedRecords = await getTableDataByQuery<ITableTelemetry>(
                IDataBaseNames.OPERACIONES,
                IDataBaseTables.TELEMETRY,
                async (table) =>
                  table
                    .where('codeField')
                    .equals(record.codeField)
                    .filter((r) => r.visitId === activity_id)
                    .toArray()
              );

              if (updatedRecords && updatedRecords.length > 0) {
                const latestRecord = updatedRecords.reduce((latest, current) =>
                  latest.updatedAt > current.updatedAt ? latest : current
                );
                setTelemetryRecordsByField((prev) => ({
                  ...prev,
                  [record.codeField]: latestRecord,
                }));
              }

              // Si el estado es SUCCESS, actualizar el valor del campo con la URL
              if (readResponse.status === 'SUCCESS') {
                setFormValues((prev) => ({
                  ...prev,
                  [record.codeField]: readResponse.url,
                }));
              }
              // eslint-disable-next-line @typescript-eslint/no-unused-vars
            } catch (_error) {
              // Silent error para cada registro individual
            }
          }
        }
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
      } catch (_error) {
        // Silent error - polling continuo no debe interrumpir la UI
      }
    }, [
      isTelemetryEnabled,
      getTelemetryReadById,
      updateTelemetryFromRead,
      isOnline,
      activity_id,
    ]);

    useEffect(() => {
      loadTelemetryStatuses();
    }, []);

    useIonViewWillEnter(() => {
      loadTelemetryStatuses();
      loadTelemetryRecords();
    });

    // Resetear el estado de popups mostrados cuando cambie el formulario
    useEffect(() => {
      setCurrentTelemetryFieldBeingEdited(null);
    }, [activity_id, page_code]);

    // Configurar polling de telemetría cada 25 segundos
    useEffect(() => {
      if (!isTelemetryEnabled) return;

      const interval = setInterval(() => {
        pollTelemetryReads();
      }, TELEMETRY_POLLING_INTERVAL);

      return () => clearInterval(interval);
    }, [pollTelemetryReads, isTelemetryEnabled]);
    // Estados para BUILDER - Mejorados y simplificados (solo si no están deshabilitados)
    const [builderItems, setBuilderItems] = useState<
      Record<string, ITransformer[]>
    >({});
    const [modalState, setModalState] = useState<{
      isOpenAdd: boolean;
      isOpenOptions: boolean;
      isEdit: boolean;
      activeBuilderCode: string | null;
      activeIndex: number | null;
    }>({
      isOpenAdd: false,
      isOpenOptions: false,
      isEdit: false,
      activeBuilderCode: null,
      activeIndex: null,
    });

    // Hook para acceder al store de formularios
    const { getFormSubmission, saveFormSubmission } = useFormsDataStore();

    // 🔄 AUTO-SAVE: Referencias para controlar el comportamiento
    const lastAutoSaveRef = useRef<string>('');
    const isInitialLoadRef = useRef<boolean>(true);
    const previousPhotosCountRef = useRef<Record<string, number>>({});

    // Exponer funciones al ref
    React.useImperativeHandle(ref, () => {
      return {
        submit: () => {
          handleSubmit();
        },
        resetLoading: () => {
          setIsLoading(false);
          setLoadingMessage('');
        },
      };
    });

    // Función para aplicar lógica de visibilidad basada en valores de formulario
    const applyVisibilityLogic = useCallback(
      (values: Record<string, string>) => {
        const newVisibleFields = new Set<string>();

        // Primero, agregar campos base que siempre deben ser visibles
        formData.forEach((form: IFormResponse) => {
          form.fields.forEach((field: IFields) => {
            // Campos FILE visibles solo si no tienen condición específica
            if (field.type === 'FILE' || field.input_type === 'FILE') {
              // Solo añadir si no tiene condición específica o está en formulario sin condición/widget_parent
              if (
                (!field.condition || field.condition === '') &&
                (!form.condition || form.condition === 'widget_parent')
              ) {
                newVisibleFields.add(field.code);
              }
            }
            // Campos de formularios widget_parent siempre visibles (excepto FILE ya manejados arriba)
            else if (form.condition === 'widget_parent') {
              newVisibleFields.add(field.code);
            }
            // Campos de formularios sin condición siempre visibles (excepto FILE ya manejados arriba)
            else if (
              !form.condition &&
              (!field.condition || field.condition === '')
            ) {
              newVisibleFields.add(field.code);
            }
          });
        });

        // 🔧 Obtener todas las condiciones posibles del sistema
        const allPossibleConditions = new Set<string>();
        formData.forEach((form) => {
          if (form.condition && form.condition !== 'widget_parent') {
            allPossibleConditions.add(form.condition);
          }
          form.fields.forEach((field) => {
            if (field.condition) {
              allPossibleConditions.add(field.condition);
            }
            if (field.items) {
              field.items.forEach((item) => {
                if (item.condition) {
                  allPossibleConditions.add(item.condition);
                }
              });
            }
          });
        });

        // 🔧 Identificar qué condiciones están realmente activas
        const activeConditions = new Set<string>();

        // Procesar campos condicionales basados en valores REALES seleccionados
        Object.entries(values).forEach(([fieldCode, value]) => {
          // 🔧 Solo procesar si el valor tiene contenido real (no vacío, no solo espacios)
          if (value && value.trim().length > 0) {
            // Buscar el campo y su formulario
            let fieldInfo: { field: IFields; form: IFormResponse } | null =
              null;
            for (const form of formData) {
              const field = form.fields.find((f) => f.code === fieldCode);
              if (field) {
                fieldInfo = { field, form };
                break;
              }
            }

            if (fieldInfo) {
              const { field, form } = fieldInfo;

              // Si es un dropdown, procesar condiciones
              if (
                field.type === 'SELECTOR' &&
                field.input_type === 'DROPDOWN' &&
                field.items
              ) {
                const selectedItem = field.items.find(
                  (item) => item.option === value
                );

                if (
                  selectedItem &&
                  selectedItem.condition &&
                  selectedItem.condition.trim().length > 0
                ) {
                  // 🔧 Marcar esta condición como activa (puede tener múltiples condiciones separadas por "|")
                  const itemConditions = splitConditions(
                    selectedItem.condition
                  );
                  itemConditions.forEach((cond) => activeConditions.add(cond));

                  // Para widget_parent, mostrar formularios relacionados con esta condición
                  if (form.condition === 'widget_parent') {
                    formData.forEach((relatedForm: IFormResponse) => {
                      // 🔧 Comparación exacta de condiciones
                      if (
                        relatedForm.condition &&
                        relatedForm.condition.trim() ===
                          selectedItem.condition.trim()
                      ) {
                        relatedForm.fields.forEach((relatedField: IFields) => {
                          // 🔧 FIX: Solo agregar campos SIN condición específica o con condición vacía
                          // Los campos con condición específica se agregan solo cuando esa condición está activa
                          if (
                            !relatedField.condition ||
                            relatedField.condition.trim() === ''
                          ) {
                            newVisibleFields.add(relatedField.code);
                          } else {
                            // Verificar si la condición del campo debe mostrarse
                            // Usar shouldShowFieldByCondition para validar que TODAS las condiciones múltiples estén activas
                            if (
                              shouldShowFieldByCondition(
                                relatedField.condition,
                                activeConditions
                              )
                            ) {
                              newVisibleFields.add(relatedField.code);
                            }
                          }
                        });
                      }
                    });
                  }

                  // También buscar campos individuales con esta condición
                  formData.forEach((anyForm: IFormResponse) => {
                    anyForm.fields.forEach((anyField: IFields) => {
                      if (!anyField.condition) return;

                      // Verificar si la condición del campo debe mostrarse
                      // Usar shouldShowFieldByCondition para validar que TODAS las condiciones múltiples estén activas
                      if (
                        shouldShowFieldByCondition(
                          anyField.condition,
                          activeConditions
                        )
                      ) {
                        newVisibleFields.add(anyField.code);
                      }
                    });
                  });
                }
              }

              // Manejar acordeones especiales
              if (field.name === 'radio_condition_parent' && field.items) {
                const selectedItem = field.items.find(
                  (item) => item.option === value
                );
                if (selectedItem && selectedItem.condition) {
                  setParentSelected(selectedItem.condition);
                }
              }
            }
          }
        });

        // 🔧 IMPORTANTE: Remover activamente campos cuyas condiciones NO están cumplidas
        // Verificar cada formulario y campo para asegurar que sus condiciones múltiples se cumplan
        formData.forEach((form) => {
          // Remover formularios completos si su condición no se cumple
          if (form.condition && form.condition !== 'widget_parent') {
            if (!shouldShowFieldByCondition(form.condition, activeConditions)) {
              form.fields.forEach((field) => {
                newVisibleFields.delete(field.code);
              });
            }
          }

          // Remover campos individuales si su condición no se cumple
          form.fields.forEach((field) => {
            if (field.condition) {
              if (
                !shouldShowFieldByCondition(field.condition, activeConditions)
              ) {
                newVisibleFields.delete(field.code);
              }
            }
          });
        });

        return newVisibleFields;
      },
      [formData]
    );

    // Función para cargar datos existentes desde la base de datos
    const loadExistingData = useCallback(async () => {
      if (!activity_id || !page_code) return;

      try {
        setIsLoadingData(true);

        // Consultar datos existentes en la base de datos
        const existingData = await getFormSubmission(activity_id, page_code);

        if (existingData) {
          // Cargar valores normales en los campos
          if (existingData.normalFields) {
            // Validar y filtrar valores para campos DROPDOWN antes de cargar
            const validatedFields: Record<string, string> = {};
            Object.entries(existingData.normalFields).forEach(
              ([fieldCode, value]) => {
                // Buscar la definición del campo
                let fieldDefinition: IFields | null = null;
                for (const form of formData) {
                  const field = form.fields.find((f) => f.code === fieldCode);
                  if (field) {
                    fieldDefinition = field;
                    break;
                  }
                }

                // Validación especial para campos DROPDOWN
                if (fieldDefinition?.input_type === 'DROPDOWN' && value) {
                  const availableOptions =
                    fieldDefinition.items?.map((item) =>
                      item.option.toLowerCase()
                    ) || [];
                  const valueExists = availableOptions.includes(
                    value.toLowerCase()
                  );

                  if (!valueExists) {
                    validatedFields[fieldCode] = ''; // Limpiar el valor si no existe en las opciones
                  } else {
                    validatedFields[fieldCode] = value;
                  }
                } else {
                  // Para otros tipos de campo, cargar el valor sin validación adicional
                  validatedFields[fieldCode] = value;
                }
              }
            );

            // Aplicar lógica de visibilidad usando la función centralizada
            const newVisibleFields = applyVisibilityLogic(validatedFields);

            setFormValues((prev) => ({
              ...prev,
              ...validatedFields,
            }));

            setVisibleFields(newVisibleFields);
          }

          // Cargar fotos existentes - Actualizar para nueva estructura
          if (existingData.photos && existingData.photos.length > 0) {
            // Procesar fotos existentes para asegurar compatibilidad con nueva interfaz
            const processedPhotos = existingData.photos.map(
              (photo: IPhotosAdd) => {
                // Si es una foto con Blob, crear displayUrl
                if (photo.blob && !photo.displayUrl) {
                  return {
                    ...photo,
                    displayUrl: URL.createObjectURL(photo.blob),
                    url: URL.createObjectURL(photo.blob), // Para compatibilidad
                  };
                }
                // Si solo tiene url string, mantenerla
                return photo;
              }
            );

            setPhotos(processedPhotos);
          }

          // Cargar datos de builders si existen y no están deshabilitados
          if (!disableBuilders && existingData.builderFields) {
            const loadedBuilderItems: Record<string, ITransformer[]> = {};

            Object.entries(existingData.builderFields).forEach(
              ([widgetCode, fields]) => {
                if (Array.isArray(fields) && fields.length > 0) {
                  // Agrupar campos por items (asumiendo que vienen en orden)
                  const groupedItems: ITransformer[] = [];
                  const fieldsPerItem =
                    formData.find((form) => form.code === widgetCode)?.fields
                      .length || 1;

                  for (let i = 0; i < fields.length; i += fieldsPerItem) {
                    const itemFields = fields.slice(i, i + fieldsPerItem);
                    const transformerItem: ITransformer = {
                      widget_code: widgetCode,
                      items: itemFields.map((field) => ({
                        code: field.field_code,
                        name: field.name,
                        value: field.value,
                        widget_code: widgetCode,
                      })),
                    };
                    groupedItems.push(transformerItem);
                  }

                  loadedBuilderItems[widgetCode] = groupedItems;
                }
              }
            );

            setBuilderItems(loadedBuilderItems);
          }
        }
      } catch (error) {
        console.error('❌ Error al cargar datos existentes:', error);
      } finally {
        setIsLoadingData(false);
      }
    }, [
      activity_id,
      page_code,
      getFormSubmission,
      disableBuilders,
      formData,
      applyVisibilityLogic,
    ]);

    // Inicializar valores del formulario
    React.useEffect(() => {
      // Valores iniciales calculados a partir de formData (como antes)
      const computedInitialValues: Record<string, string> = {};
      formData.forEach((form: IFormResponse) => {
        form.fields.forEach((field: IFields) => {
          // 🔧 Restaurar carga de selected_value para precargar valores iniciales
          let value =
            field.selected_value && field.selected_value.length > 0
              ? field.selected_value[0]
              : '';

          // Validación especial para campos DROPDOWN
          if (field.input_type === 'DROPDOWN' && value) {
            // Verificar que el valor existe en los items disponibles (comparación case-insensitive)
            const availableOptions =
              field.items?.map((item) => item.option.toLowerCase()) || [];
            const valueExists = availableOptions.includes(value.toLowerCase());

            if (!valueExists) {
              value = ''; // Limpiar el valor si no existe en las opciones
            }
          }

          computedInitialValues[field.code] = value;
        });
      });

      // 🔁 Si llegan initialValues por props (REVERT_ACT), sobrescribir sólo esos campos
      const mergedInitialValues: Record<string, string> = {
        ...computedInitialValues,
      };

      if (initialValues && Object.keys(initialValues).length > 0) {
        Object.entries(initialValues).forEach(([code, val]) => {
          if (typeof val === 'string') {
            mergedInitialValues[code] = val;
          }
        });
      }

      // 🔧 FIX: Aplicar solo visibilidad BASE (sin lógica condicional automática)
      // Aunque cargamos selected_value, NO aplicamos lógica condicional automáticamente
      // Solo mostrar campos que SIEMPRE deben ser visibles
      const baseVisibleFields = new Set<string>();

      formData.forEach((form: IFormResponse) => {
        form.fields.forEach((field: IFields) => {
          // Campos FILE visibles solo si no tienen condición específica
          if (field.type === 'FILE' || field.input_type === 'FILE') {
            // Solo añadir si no tiene condición específica o está en formulario sin condición/widget_parent
            if (
              (!field.condition || field.condition === '') &&
              (!form.condition || form.condition === 'widget_parent')
            ) {
              baseVisibleFields.add(field.code);
            }
          }
          // Campos de formularios widget_parent siempre visibles (excepto FILE ya manejados arriba)
          else if (form.condition === 'widget_parent') {
            baseVisibleFields.add(field.code);
          }
          // Campos de formularios sin condición siempre visibles (excepto FILE ya manejados arriba)
          else if (
            !form.condition &&
            (!field.condition || field.condition === '')
          ) {
            baseVisibleFields.add(field.code);
          }
        });
      });

      setFormValues(mergedInitialValues);
      setVisibleFields(baseVisibleFields);

      // 🔧 APLICAR lógica condicional con valores iniciales precargados
      // Solo si hay valores que puedan activar condiciones
      const hasInitialValues = Object.values(mergedInitialValues).some(
        (value) => value && value.trim() !== ''
      );

      if (hasInitialValues) {
        // Aplicar lógica de visibilidad con los valores iniciales
        const conditionalVisibleFields =
          applyVisibilityLogic(mergedInitialValues);
        setVisibleFields(conditionalVisibleFields);
      }

      // Cargar datos existentes después de inicializar (esto puede sobrescribir si hay datos guardados)
      loadExistingData();
    }, [formData, loadExistingData, initialValues]);

    // Inicializar builder items desde props (solo si builders están habilitados)
    useEffect(() => {
      if (
        !disableBuilders &&
        initialBuilderItems &&
        initialBuilderItems.length > 0
      ) {
        const groupedBuilderItems: Record<string, ITransformer[]> = {};
        initialBuilderItems.forEach((item) => {
          if (item.widget_code) {
            if (!groupedBuilderItems[item.widget_code]) {
              groupedBuilderItems[item.widget_code] = [];
            }
            groupedBuilderItems[item.widget_code].push(item);
          }
        });
        setBuilderItems(groupedBuilderItems);
      }
    }, [initialBuilderItems, disableBuilders]);

    // Limpiar errores de campos que ya no son visibles cuando cambia visibleFields
    useEffect(() => {
      if (Object.keys(errors).length > 0) {
        const newErrors = { ...errors };
        let hasChanges = false;

        // Remover errores de campos que ya no son visibles
        Object.keys(newErrors).forEach((fieldCode) => {
          if (!visibleFields.has(fieldCode)) {
            delete newErrors[fieldCode];
            hasChanges = true;
          }
        });

        if (hasChanges) {
          setErrors(newErrors);

          // Si no quedan errores, ocultar la indicación de errores
          if (Object.keys(newErrors).length === 0) {
            setShowErrors(false);
          }
        }
      }
    }, [visibleFields, errors]);

    // Validar campos FILE obligatorios cuando cambia el array de photos
    useEffect(() => {
      const newErrors = { ...errors };
      let hasChanges = false;
      let shouldShowErrors = showErrors;

      // Recorrer todos los formularios para encontrar campos FILE obligatorios
      formData.forEach((form: IFormResponse) => {
        form.fields.forEach((field: IFields) => {
          // Solo validar campos FILE visibles y obligatorios
          if (
            visibleFields.has(field.code) &&
            (field.type === 'FILE' || field.input_type === 'FILE') &&
            field.mandatory
          ) {
            // Contar cuántas fotos VÁLIDAS hay para este campo
            // Una foto es válida si tiene url string, displayUrl, o blob
            const photosForField = photos.filter((photo) => {
              if (!photo || photo.code !== field.code) return false;
              return (
                (typeof photo.url === 'string' && photo.url) ||
                photo.displayUrl ||
                photo.blob
              );
            });
            const currentCount = photosForField.length;
            const previousCount =
              previousPhotosCountRef.current[field.code] || 0;

            // Actualizar el conteo actual
            previousPhotosCountRef.current[field.code] = currentCount;

            // Si no hay fotos, agregar error
            if (currentCount === 0) {
              // Mostrar error si:
              // 1. Ya se intentó guardar (showErrors = true) O
              // 2. El campo tenía fotos antes y ahora no tiene (se eliminaron)
              if (showErrors || previousCount > 0) {
                if (!newErrors[field.code]) {
                  newErrors[field.code] = `Debe agregar al menos una foto`;
                  hasChanges = true;
                  shouldShowErrors = true;
                }
              }
            } else {
              // Si hay fotos, limpiar error si existía
              if (newErrors[field.code]) {
                delete newErrors[field.code];
                hasChanges = true;
              }
            }
          }
        });
      });

      if (hasChanges) {
        setErrors(newErrors);
        if (shouldShowErrors !== showErrors) {
          setShowErrors(shouldShowErrors);
        }
      }
    }, [photos, showErrors, visibleFields, errors, formData]);

    // 🔄 AUTO-SAVE: Función para verificar si el formulario está completo (lógica extraída de isFormComplete)
    const checkFormCompleteness = useCallback((): boolean => {
      let isComplete = true;

      formData.forEach((form: IFormResponse) => {
        // Verificar si el formulario debe ser visible/validado según su condición
        const shouldValidateForm = () => {
          // Si no tiene condición, siempre se valida
          if (!form.condition) return true;

          // Si es widget_parent, siempre se valida (es el dropdown padre)
          if (form.condition === 'widget_parent') return true;

          // Para formularios con otras condiciones, verificar si algún campo visible tiene esa condición activa
          const hasMatchingCondition = Array.from(visibleFields).some(
            (fieldCode) => {
              const fieldValue = formValues[fieldCode];
              if (!fieldValue) return false;

              // Buscar el campo en todos los formularios
              for (const currentForm of formData) {
                const field = currentForm.fields.find(
                  (f: IFields) => f.code === fieldCode
                );
                if (field && field.items) {
                  const selectedItem = field.items.find(
                    (item: IItems) => item.option === fieldValue
                  );
                  if (
                    selectedItem &&
                    selectedItem.condition === form.condition
                  ) {
                    return true;
                  }
                }
              }
              return false;
            }
          );

          return hasMatchingCondition;
        };

        // Solo validar formularios que deberían estar visibles
        if (!shouldValidateForm()) {
          return;
        }

        // Verificar formularios BUILDER - Los builders ya no son obligatorios
        if (form.type === 'BUILDER' && !disableBuilders) {
          // Los campos BUILDER ya no afectan el estado de completitud del formulario
        } else {
          // Verificar formularios SIMPLE
          form.fields.forEach((field: IFields) => {
            // Solo verificar campos visibles, obligatorios y que NO sean FILE
            if (
              visibleFields.has(field.code) &&
              field.mandatory &&
              field.type !== 'FILE'
            ) {
              // Si es TELEMETRY, verificar condiciones especiales
              if ((field as IFields).input_type === 'TELEMETRY') {
                // Si no hay internet o el flag está deshabilitado, no considerar obligatorio
                if (!isOnline || !isTelemetryEnabled) {
                  return;
                }

                // Si está en FAILED y se muestra la sección de fotos, no es obligatorio
                if (
                  telemetryStatusByField[field.code] ===
                    StatusTelemetry.FAILED &&
                  showPhotoForTelemetry[field.code]
                ) {
                  return;
                }
              }
              if (!formValues[field.code] || formValues[field.code] === '') {
                isComplete = false;
              }
            }

            // Validación adicional de IP según operador_sim (afecta completitud)
            if (
              visibleFields.has(field.code) &&
              field.type !== 'FILE' &&
              (field.name || '').toLowerCase() === 'ip'
            ) {
              const operatorField = form.fields.find(
                (f) => (f.name || '').toLowerCase() === 'operador_sim'
              );
              const operatorValue = operatorField
                ? formValues[operatorField.code]
                : '';
              const ipValue = formValues[field.code] || '';
              if (operatorValue && ipValue) {
                const startsWith = (prefix: string) =>
                  ipValue.startsWith(prefix);
                if (
                  (operatorValue === 'CLARO' && !startsWith('10.87.')) ||
                  (operatorValue === 'TIGO' && !startsWith('10.196.')) ||
                  (operatorValue === 'WOM' && !startsWith('10.205.'))
                ) {
                  isComplete = false;
                }
              }
            }

            // Validación especial para campos FILE obligatorios
            if (
              visibleFields.has(field.code) &&
              (field.type === 'FILE' || field.input_type === 'FILE') &&
              field.mandatory
            ) {
              // Contar cuántas fotos VÁLIDAS hay para este campo
              const validPhotos = photos.filter((photo) => {
                if (!photo || photo.code !== field.code) return false;
                return (
                  (typeof photo.url === 'string' && photo.url) ||
                  photo.displayUrl ||
                  photo.blob
                );
              });
              if (validPhotos.length === 0) {
                isComplete = false;
              }
            }
          });
        }
      });

      return isComplete;
    }, [
      formValues,
      visibleFields,
      formData,
      disableBuilders,
      isOnline,
      isTelemetryEnabled,
      photos,
    ]);

    // 🔄 AUTO-SAVE: Función para auto-guardar datos
    const performAutoSave = useCallback(async () => {
      if (!activity_id || !page_code) return;

      try {
        // Crear estructura de datos igual que en handleSubmit
        const enhancedFormData: EnhancedFormData = {};

        // Obtener códigos de campos que pertenecen a builders
        const builderFieldCodes = new Set<string>();
        formData.forEach((form) => {
          if (form.type === 'BUILDER') {
            form.fields.forEach((field) => {
              builderFieldCodes.add(field.code);
            });
          }
        });

        // Agregar solo campos normales (no de builders)
        Object.entries(formValues).forEach(([fieldCode, value]) => {
          if (
            !builderFieldCodes.has(fieldCode) &&
            value &&
            value.trim() !== ''
          ) {
            enhancedFormData[fieldCode] = value;
          }
        });

        // Agregar datos de builders
        Object.entries(builderItems).forEach(([widgetCode, items]) => {
          if (items && items.length > 0) {
            enhancedFormData[widgetCode] = items
              .map((item) =>
                item.items.map((field) => ({
                  field_code: field.code,
                  value: field.value,
                  name: field.name,
                }))
              )
              .flat();
          }
        });

        // Solo hacer auto-save si hay datos para guardar
        if (
          Object.keys(enhancedFormData).length > 0 ||
          (photos &&
            photos.some(
              (p) =>
                (typeof p.url === 'string' && p.url) || p.displayUrl || p.blob
            ))
        ) {
          const currentDataHash = JSON.stringify({ enhancedFormData, photos });

          // Solo guardar si los datos han cambiado
          if (currentDataHash !== lastAutoSaveRef.current) {
            const allBuilderItems = Object.values(builderItems).flat();

            // ✅ DETECTAR SI EL FORMULARIO ESTÁ COMPLETO
            const isFormCompleteNow =
              checkFormCompleteness() && areTelemetryFieldsComplete;

            // ✅ USAR saveFormSubmission CON isComplete DINÁMICO
            await saveFormSubmission(
              activity_id,
              page_code,
              enhancedFormData,
              photos,
              allBuilderItems,
              isFormCompleteNow
            );

            // ✅ MOSTRAR NOTIFICACIÓN SI SE COMPLETÓ AUTOMÁTICAMENTE

            lastAutoSaveRef.current = currentDataHash;
          }
        }
      } catch (error) {
        console.error('❌ Error en auto-save:', error);
      }
    }, [
      activity_id,
      page_code,
      formValues,
      builderItems,
      photos,
      formData,
      saveFormSubmission,
      checkFormCompleteness,
    ]);

    // 🔄 AUTO-SAVE: Effect inmediato al cambiar valores
    useEffect(() => {
      // 🚫 NO auto-guardar si el modal de builder está abierto
      // (previene que se recarguen los datos y se reinicien los inputs del modal)
      if (modalState.isOpenAdd || modalState.isOpenOptions) {
        return;
      }

      // Solo hacer auto-save si no está cargando datos iniciales y no es la primera carga
      if (
        !isLoadingData &&
        activity_id &&
        page_code &&
        !isInitialLoadRef.current
      ) {
        // Auto-save inmediato al cambiar cualquier valor
        performAutoSave();
      }
    }, [
      formValues,
      builderItems,
      photos,
      performAutoSave,
      isLoadingData,
      activity_id,
      page_code,
      modalState,
    ]);

    // 🔄 Effect para marcar que ya pasó la carga inicial
    useEffect(() => {
      if (!isLoadingData && isInitialLoadRef.current) {
        // Después de la carga inicial, permitir auto-saves
        const timer = setTimeout(() => {
          isInitialLoadRef.current = false;
        }, 500); // Pequeño delay para asegurar que se cargaron todos los datos

        return () => clearTimeout(timer);
      }
    }, [isLoadingData]);

    // 🧹 Cleanup de URLs al desmontar componente
    useEffect(() => {
      return () => {
        // Limpiar todas las URLs de objeto al desmontar
        photos?.forEach((photo) => {
          if (photo.displayUrl) {
            URL.revokeObjectURL(photo.displayUrl);
          }
        });
      };
    }, []);

    // 💾 AUTO-SAVE al desmontar el componente (cuando se cierra/sale)
    useEffect(() => {
      return () => {
        // Solo ejecutar si hay datos para guardar y no es la carga inicial
        if (
          !isInitialLoadRef.current &&
          activity_id &&
          page_code &&
          Object.keys(formValues).length > 0
        ) {
          // Validar y guardar antes de desmontar
          const isValid = validateForm();

          if (isValid) {
            // Realizar guardado sin mostrar loader (ya que el componente se está desmontando)
            performAutoSave();
          }
        }
      };
    }, [formValues, builderItems, photos, activity_id, page_code]);

    const goToTelemetry = (
      status: StatusTelemetry,
      parentFormForTelemetry: IFormResponse,
      codeField: string
    ) => {
      // Extraer valores de los campos del parentForm marcados como mandatory_telemetry
      const sourceForm = parentFormForTelemetry;

      const telemetryFromForm: Partial<{
        serie_del_modem: string;
        marca_del_modem: string;
        ip: string;
        puerto: string;
        ime_modem: string;
        fact_modem: string;
        operador_sim: string;
        input_ime_modem: string;
      }> = {};
      if (sourceForm) {
        const normalize = (s: string) => s.toLowerCase().trim();
        const mapFieldToKey = (
          field: IFields
        ): keyof typeof telemetryFromForm | undefined => {
          const name = normalize(field.name || '');
          switch (name) {
            case 'serie_del_modem':
              return 'serie_del_modem';
            case 'marca_del_modem':
              return 'marca_del_modem';
            case 'fact_modem':
              return 'fact_modem';
            case 'ip':
              return 'ip';
            case 'ime_modem':
              return 'ime_modem';
            case 'puerto':
              return 'puerto';
            case 'operador_sim':
              return 'operador_sim';
            case 'input_ime_modem':
              return 'input_ime_modem';
            default:
              return undefined;
          }
        };

        sourceForm.fields
          .filter((f) => visibleFields.has(f.code))
          .forEach((f) => {
            const key = mapFieldToKey(f);
            const value = (formValues[f.code] || '').toString().trim();
            if (key && value) {
              telemetryFromForm[key] = value;
            }
          });
      }

      // Asegurar que todos los campos requeridos tengan valor antes de navegar
      const telemetryData = {
        status: status,
        serie_del_modem: telemetryFromForm.serie_del_modem ?? '',
        marca_del_modem: telemetryFromForm.marca_del_modem ?? '',
        ip: telemetryFromForm.ip ?? '',
        puerto: telemetryFromForm.puerto ?? '',
        ime_modem: telemetryFromForm.ime_modem ?? '',
        fact_modem: telemetryFromForm.fact_modem ?? '',
        operador_sim: telemetryFromForm.operador_sim ?? '',
      };

      // Validar que los campos obligatorios tengan valor
      if (
        !telemetryData.serie_del_modem ||
        !telemetryData.marca_del_modem ||
        !telemetryData.ip ||
        !telemetryData.fact_modem
      ) {
        return; // No navegar si faltan campos obligatorios
      }

      // Actualizar estado global y navegar cuando se confirme la actualización
      setTelemetry(telemetryData);

      // Navegar después de que el estado se haya actualizado
      history.push(
        `/forms-managment/${activity_id}/${page_code}/${name_form}/${index}/telemetry/${codeField}`
      );
    };

    const handleInputChange = (fieldCode: string, value: string) => {
      try {
        // Detectar cambio en cualquier campo del parent cuando su TELEMETRY está en SUCCESS
        let parentForm: IFormResponse | null = null;
        for (const form of formData) {
          if (form.fields.some((ff) => ff.code === fieldCode)) {
            parentForm = form;
            break;
          }
        }

        // Verificar si el campo es obligatorio para telemedida
        const isMandatoryTelemetry = parentForm?.fields.find(
          (f) => f.code === fieldCode
        )?.mandatory_telemetry;

        const telemetryFieldCode = parentForm?.fields.find(
          (f) => f.input_type === 'TELEMETRY'
        )?.code;
        const prevVal = (formValues[fieldCode] || '').toString();
        const isChanged = prevVal !== (value || '');
        const telemetryStatusForParent = telemetryFieldCode
          ? telemetryStatusByField[telemetryFieldCode]
          : undefined;

        if (
          telemetryFieldCode &&
          (telemetryStatusForParent === StatusTelemetry.SUCCESS ||
            telemetryStatusForParent === StatusTelemetry.FAILED) &&
          isChanged &&
          hasRemainingAttempts(telemetryFieldCode)
        ) {
          setIsOpenTelemetryEditPopup(true);
          setCurrentTelemetryFieldBeingEdited(telemetryFieldCode);
        }

        // Si es un campo obligatorio de telemedida y cambia su valor
        if (
          isMandatoryTelemetry &&
          isChanged &&
          telemetryFieldCode &&
          hasRemainingAttempts(telemetryFieldCode)
        ) {
          // Actualizar estado a PENDING tanto en UI como en BD
          updateTelemetryToPending(telemetryFieldCode);
        }

        // Validación inmediata de IP por operador_sim (mostrar error en BiaInput)
        if (parentForm) {
          const ipField = parentForm.fields.find(
            (f) => (f.name || '').toLowerCase() === 'ip'
          );
          const operatorField = parentForm.fields.find(
            (f) => (f.name || '').toLowerCase() === 'operador_sim'
          );
          if (ipField && operatorField) {
            const nextOperatorValue =
              operatorField.code === fieldCode
                ? value
                : formValues[operatorField.code] || '';
            const nextIpValue =
              ipField.code === fieldCode
                ? value
                : formValues[ipField.code] || '';
            if (nextOperatorValue && nextIpValue) {
              const startsWith = (prefix: string) =>
                nextIpValue.startsWith(prefix);
              const invalid =
                (nextOperatorValue === 'CLARO' && !startsWith('10.87.')) ||
                (nextOperatorValue === 'TIGO' && !startsWith('10.196.')) ||
                (nextOperatorValue === 'WOM' && !startsWith('10.205.'));
              setErrors((prev) => ({
                ...prev,
                [ipField.code]: invalid ? 'IP Invalida' : '',
              }));
              if (invalid) setShowErrors(true);
            }
          }
        }
        //eslint-disable-next-line @typescript-eslint/no-unused-vars
      } catch (_error) {
        // silent
      }
      setFormValues((prev) => ({
        ...prev,
        [fieldCode]: value,
      }));

      // Limpiar error del campo y ocultar errores si el campo se ha llenado
      if (errors[fieldCode]) {
        let skipClear = false;
        try {
          let fieldDef: IFields | null = null;
          for (const form of formData) {
            const f = form.fields.find((ff) => ff.code === fieldCode);
            if (f) {
              fieldDef = f;
              break;
            }
          }
          if ((fieldDef?.name || '').toLowerCase() === 'ip') {
            // Reevaluar con valores ya actualizados
            let parentFormLocal: IFormResponse | null = null;
            for (const form of formData) {
              if (form.fields.some((ff) => ff.code === fieldCode)) {
                parentFormLocal = form;
                break;
              }
            }
            const operatorField = parentFormLocal?.fields.find(
              (f) => (f.name || '').toLowerCase() === 'operador_sim'
            );
            const operatorValue = operatorField
              ? operatorField.code === fieldCode
                ? value
                : formValues[operatorField.code] || ''
              : '';
            const ipValue =
              fieldCode === fieldDef?.code
                ? value
                : formValues[fieldCode] || '';
            if (operatorValue && ipValue) {
              const startsWith = (prefix: string) => ipValue.startsWith(prefix);
              const invalid =
                (operatorValue === 'CLARO' && !startsWith('10.87.')) ||
                (operatorValue === 'TIGO' && !startsWith('10.196.')) ||
                (operatorValue === 'WOM' && !startsWith('10.205.'));
              skipClear = invalid;
            }
          }
          //eslint-disable-next-line @typescript-eslint/no-unused-vars
        } catch (_error) {
          // silent
        }
        if (!skipClear) {
          setErrors((prev) => ({
            ...prev,
            [fieldCode]: '',
          }));

          // Si el campo ahora tiene valor y era obligatorio, ocultar los errores
          const field = formData
            .flatMap((form) => form.fields)
            .find((f) => f.code === fieldCode);

          if (field?.mandatory && value.trim() !== '') {
            // Verificar si todos los errores están resueltos
            const remainingErrors = Object.entries(errors).filter(
              ([code, error]) => code !== fieldCode && !!error
            );

            if (remainingErrors.length === 0) {
              setShowErrors(false);
            }
          }
        }
      }
    };

    const handleDropdownChange = (
      field: IFields,
      selectedValue: string,
      parentForm: IFormResponse
    ) => {
      try {
        // Detectar cambio en cualquier campo del parent cuando su TELEMETRY está en SUCCESS
        const prevVal = (formValues[field.code] || '').toString();
        const isChanged = prevVal !== (selectedValue || '');
        const telemetryFieldCode = parentForm.fields.find(
          (f) => f.input_type === 'TELEMETRY'
        )?.code;
        const telemetryStatusForParent = telemetryFieldCode
          ? telemetryStatusByField[telemetryFieldCode]
          : undefined;

        // Verificar si el campo es obligatorio para telemedida
        const isMandatoryTelemetry = field.mandatory_telemetry;

        if (
          telemetryFieldCode &&
          (telemetryStatusForParent === StatusTelemetry.SUCCESS ||
            telemetryStatusForParent === StatusTelemetry.FAILED) &&
          isChanged &&
          hasRemainingAttempts(telemetryFieldCode)
        ) {
          setIsOpenTelemetryEditPopup(true);
          setCurrentTelemetryFieldBeingEdited(telemetryFieldCode);
        }

        // Si es un campo obligatorio de telemedida y cambia su valor
        if (
          isMandatoryTelemetry &&
          isChanged &&
          telemetryFieldCode &&
          hasRemainingAttempts(telemetryFieldCode)
        ) {
          // Actualizar estado a PENDING tanto en UI como en BD
          updateTelemetryToPending(telemetryFieldCode);
        }

        // Validación inmediata de IP por operador_sim cuando cambia dropdown
        const ipField = parentForm.fields.find(
          (f) => (f.name || '').toLowerCase() === 'ip'
        );
        const operatorField = parentForm.fields.find(
          (f) => (f.name || '').toLowerCase() === 'operador_sim'
        );
        if (ipField && operatorField) {
          const nextOperatorValue =
            field.code === operatorField.code
              ? selectedValue
              : formValues[operatorField.code] || '';
          const nextIpValue =
            field.code === ipField.code
              ? selectedValue
              : formValues[ipField.code] || '';
          if (nextOperatorValue && nextIpValue) {
            const startsWith = (prefix: string) =>
              nextIpValue.startsWith(prefix);
            const invalid =
              (nextOperatorValue === 'CLARO' && !startsWith('10.87.')) ||
              (nextOperatorValue === 'TIGO' && !startsWith('10.196.')) ||
              (nextOperatorValue === 'WOM' && !startsWith('10.205.'));
            setErrors((prev) => ({
              ...prev,
              [ipField.code]: invalid ? 'IP Invalida' : '',
            }));
            if (invalid) setShowErrors(true);
          }
        }
        //eslint-disable-next-line @typescript-eslint/no-unused-vars
      } catch (_error) {
        // silent
      }
      // Actualizar el valor
      handleInputChange(field.code, selectedValue);

      // Buscar el item que coincida con el valor seleccionado usando opciones filtradas
      const filteredOptions = getFilteredOptions(field);
      const selectedItem = filteredOptions.find(
        (item) => item.option === selectedValue
      );

      // Obtener todos los campos de todos los formularios
      const allFields: IFields[] = [];
      formData.forEach((form: IFormResponse) => {
        form.fields.forEach((f: IFields) => {
          allFields.push(f);
        });
      });

      // Obtener todas las condiciones posibles de este dropdown usando opciones filtradas
      const relatedConditions =
        filteredOptions.map((item) => item.condition).filter(Boolean) || [];

      // Obtener el estado actual de campos visibles
      const newVisibleFields = new Set(visibleFields);

      // Asegurar que los campos FILE de formularios sin condición o widget_parent permanezcan visibles
      // Solo si no tienen condición específica en el campo
      formData.forEach((form: IFormResponse) => {
        form.fields.forEach((field: IFields) => {
          if (
            (field.type === 'FILE' || field.input_type === 'FILE') &&
            (!form.condition || form.condition === 'widget_parent') &&
            (!field.condition || field.condition === '')
          ) {
            newVisibleFields.add(field.code);
          }
        });
      });

      // Validación para widget_parent
      if (parentForm.condition === 'widget_parent') {
        // Verificar si hay un valor seleccionado con condición
        if (selectedItem && selectedItem.condition) {
          const selectedFieldCondition = selectedItem.condition;

          formData.forEach((form: IFormResponse) => {
            // Si el formulario tiene la misma condición que el valor seleccionado, mostrarlo (incluyendo BUILDER, SIMPLE, FILE)
            // 🔧 Comparación exacta de condiciones
            if (
              form.condition &&
              form.condition.trim() === selectedFieldCondition.trim()
            ) {
              form.fields.forEach((f: IFields) => {
                // 🔧 FIX: Solo agregar campos SIN condición específica o con condición vacía
                // Los campos con condición específica se agregan solo cuando esa condición está activa
                if (!f.condition || f.condition.trim() === '') {
                  newVisibleFields.add(f.code);
                }
              });
            }
            // Si el formulario tiene una condición diferente pero no es widget_parent, ocultarlo (incluyendo todos los tipos)
            else if (
              form.condition &&
              form.condition.trim() !== selectedFieldCondition.trim() &&
              form.condition !== 'widget_parent'
            ) {
              form.fields.forEach((f: IFields) => {
                newVisibleFields.delete(f.code);
              });
            }
          });
        } else {
          // Si no hay valor seleccionado, ocultar todos los formularios relacionados por defecto
          formData.forEach((form: IFormResponse) => {
            if (form.condition && form.condition !== 'widget_parent') {
              form.fields.forEach((f: IFields) => {
                newVisibleFields.delete(f.code);
              });
            }
          });
        }
      } else if (selectedItem && selectedItem.condition) {
        // Obtener TODAS las condiciones activas globalmente (de todos los selectores)
        // Incluimos el campo actual con su nuevo valor
        const globalActiveConditions = getAllActiveConditions(
          field.code,
          selectedValue
        );

        // Mostrar u ocultar campos basándose en si TODAS sus condiciones están activas
        allFields.forEach((f) => {
          if (!f.condition) return;

          // Verificar si el campo tiene alguna condición relacionada con este dropdown
          const fieldConds = splitConditions(f.condition);
          const isRelatedToThisDropdown = fieldConds.some((cond) =>
            relatedConditions.includes(cond)
          );

          if (!isRelatedToThisDropdown) return;

          // Verificar si TODAS las condiciones del campo están activas (AND)
          if (shouldShowFieldByCondition(f.condition, globalActiveConditions)) {
            newVisibleFields.add(f.code);
          } else {
            newVisibleFields.delete(f.code);
          }
        });
      } else {
        // Si no hay condición seleccionada, ocultar todos los campos condicionales
        // relacionados ÚNICAMENTE con este dropdown
        allFields.forEach((f) => {
          if (!f.condition) return;
          const fieldConds = fieldTriggerConditions(f.condition, new Set());
          if (fieldConds.some((c) => relatedConditions.includes(c))) {
            newVisibleFields.delete(f.code);
          }
        });
      }

      setVisibleFields(newVisibleFields);

      // Limpiar valores de campos que se ocultan
      const newFormValues = { ...formValues };
      Object.keys(newFormValues).forEach((fieldCode) => {
        // No limpiar el valor del campo que se está seleccionando actualmente
        if (fieldCode === field.code) {
          newFormValues[fieldCode] = selectedValue;
          return;
        }

        // Solo limpiar campos que se están ocultando
        // PROTECCIÓN: Nunca limpiar campos FILE de formularios sin condición
        if (!newVisibleFields.has(fieldCode)) {
          const fieldExists = allFields.find((f) => f.code === fieldCode);
          const fieldParentForm = formData.find((form) =>
            form.fields.some((f) => f.code === fieldCode)
          );

          // No limpiar campos FILE de formularios sin condición o widget_parent,
          // SOLO si el campo FILE no tiene condición específica
          const isProtectedFileField =
            (fieldExists?.type === 'FILE' ||
              fieldExists?.input_type === 'FILE') &&
            (!fieldParentForm?.condition ||
              fieldParentForm?.condition === 'widget_parent') &&
            (!fieldExists?.condition || fieldExists?.condition === '');

          if (fieldExists && !isProtectedFileField) {
            // Para widget_parent, limpiar campos de formularios con condiciones diferentes
            if (parentForm.condition === 'widget_parent') {
              if (
                fieldParentForm &&
                fieldParentForm.condition &&
                fieldParentForm.condition !== 'widget_parent'
              ) {
                if (selectedItem && selectedItem.condition) {
                  // 🔧 Comparación exacta de condiciones
                  if (
                    fieldParentForm.condition.trim() !==
                    selectedItem.condition.trim()
                  ) {
                    newFormValues[fieldCode] = '';
                  }
                } else {
                  newFormValues[fieldCode] = '';
                }
              }
            } else if (
              // Lógica original para otros casos
              fieldExists.condition &&
              relatedConditions.includes(fieldExists.condition)
            ) {
              newFormValues[fieldCode] = '';
            }
          }
        }
      });

      setFormValues(newFormValues);
    };

    const validateForm = (): boolean => {
      const newErrors: Record<string, string> = {};

      formData.forEach((form: IFormResponse) => {
        // Verificar si el formulario debe ser visible/validado según su condición
        const shouldValidateForm = () => {
          // Si no tiene condición, siempre se valida
          if (!form.condition) return true;

          // Si es widget_parent, siempre se valida (es el dropdown padre)
          if (form.condition === 'widget_parent') return true;

          // Para formularios con otras condiciones, verificar si algún campo visible tiene esa condición activa
          const hasMatchingCondition = Array.from(visibleFields).some(
            (fieldCode) => {
              const fieldValue = formValues[fieldCode];
              if (!fieldValue) return false;

              // Buscar el campo en todos los formularios
              for (const currentForm of formData) {
                const field = currentForm.fields.find(
                  (f: IFields) => f.code === fieldCode
                );
                if (field && field.items) {
                  const selectedItem = field.items.find(
                    (item: IItems) => item.option === fieldValue
                  );
                  if (
                    selectedItem &&
                    selectedItem.condition === form.condition
                  ) {
                    return true;
                  }
                }
              }
              return false;
            }
          );

          return hasMatchingCondition;
        };

        // Solo validar formularios que deberían estar visibles
        if (!shouldValidateForm()) {
          return;
        }

        // Validar formularios BUILDER - REMOVIDO: Los builders ya no son obligatorios
        if (form.type === 'BUILDER' && !disableBuilders) {
          // Los campos BUILDER ya no requieren validación obligatoria
          // Se permite enviar el formulario sin elementos en los builders
        } else {
          // Validar formularios SIMPLE
          form.fields.forEach((field: IFields) => {
            // Solo validar campos visibles
            if (visibleFields.has(field.code)) {
              // Validación especial para campos FILE (fotos)
              if (field.type === 'FILE' || field.input_type === 'FILE') {
                if (field.mandatory) {
                  // Contar cuántas fotos VÁLIDAS hay para este campo
                  // Una foto es válida si tiene url string, displayUrl, o blob
                  const photosForField = photos.filter((photo) => {
                    if (!photo || photo.code !== field.code) return false;
                    return (
                      (typeof photo.url === 'string' && photo.url) ||
                      photo.displayUrl ||
                      photo.blob
                    );
                  });
                  if (photosForField.length === 0) {
                    newErrors[field.code] = `Debe agregar al menos una foto`;
                  }
                }
                return; // No continuar con las demás validaciones para FILE
              }

              // Si es TELEMETRY y no hay internet o el flag está deshabilitado, no validar como obligatorio
              if (
                (field as IFields).input_type === 'TELEMETRY' &&
                (!isOnline || !isTelemetryEnabled)
              ) {
                return;
              }
              if (
                field.mandatory &&
                (!formValues[field.code] || formValues[field.code] === '')
              ) {
                newErrors[field.code] = `El campo es obligatorio`;
              }
              // Validación de IP según operador_sim (errores de campo)
              if ((field.name || '').toLowerCase() === 'ip') {
                const operatorField = form.fields.find(
                  (f) => (f.name || '').toLowerCase() === 'operador_sim'
                );
                const operatorValue = operatorField
                  ? formValues[operatorField.code]
                  : '';
                const ipValue = formValues[field.code] || '';
                if (operatorValue && ipValue) {
                  const startsWith = (prefix: string) =>
                    ipValue.startsWith(prefix);
                  const invalid =
                    (operatorValue === 'CLARO' && !startsWith('10.87.')) ||
                    (operatorValue === 'TIGO' && !startsWith('10.196.')) ||
                    (operatorValue === 'WOM' && !startsWith('10.205.'));
                  if (invalid) {
                    newErrors[field.code] = t('telemetry.ip_invalid');
                  }
                }
              }
            }
          });
        }
      });

      setErrors(newErrors);
      return Object.keys(newErrors).length === 0;
    };

    // 🔄 REFACTORIZADO: isFormComplete ahora usa checkFormCompleteness para evitar duplicación
    const isFormComplete = React.useMemo((): boolean => {
      return checkFormCompleteness();
    }, [checkFormCompleteness]);

    // Verificar si todos los campos de telemetría visibles tienen estado SUCCESS
    const areTelemetryFieldsComplete = React.useMemo((): boolean => {
      // Si está offline o telemetría deshabilitada, considerar campos TELEMETRY como "completos"
      if (!isOnline || !isTelemetryEnabled) return true;

      const telemetryFields: string[] = [];

      formData.forEach((form) => {
        form.fields.forEach((field) => {
          if (
            field.input_type === 'TELEMETRY' &&
            visibleFields.has(field.code)
          ) {
            telemetryFields.push(field.code);
          }
        });
      });

      // Si no hay campos de telemetría visibles, están "completos"
      if (telemetryFields.length === 0) return true;

      // Todos los campos de telemetría deben tener estado SUCCESS
      return telemetryFields.every((fieldCode) => {
        const status = telemetryStatusByField[fieldCode];
        // Es válido si está en SUCCESS o si está en FAILED y se muestra la sección de fotos
        return (
          status === StatusTelemetry.SUCCESS ||
          (status === StatusTelemetry.FAILED &&
            showPhotoForTelemetry[fieldCode])
        );
      });
    }, [
      formData,
      visibleFields,
      telemetryStatusByField,
      isOnline,
      isTelemetryEnabled,
      showPhotoForTelemetry,
      formValues,
    ]);

    // Estado para manejar los registros de telemetría por campo
    const [telemetryRecordsByField, setTelemetryRecordsByField] = useState<
      Record<string, ITableTelemetry | null>
    >({});

    // Función para verificar si quedan intentos para un campo de telemedida
    const hasRemainingAttempts = React.useCallback(
      (fieldCode: string): boolean => {
        const currentRecord = telemetryRecordsByField[fieldCode];
        if (!currentRecord) return true; // Si no hay registro, asumimos que hay intentos

        const remainingAttempts = 3 - (currentRecord.intent ?? 0);
        return remainingAttempts > 0;
      },
      [telemetryRecordsByField]
    );

    // Función separada para verificar solo si los campos requeridos tienen valores (sin verificar intentos)
    const areTelemetryFieldsCompleted = React.useCallback(
      (form: IFormResponse): boolean => {
        const requiredCodes = form.fields
          .filter((f) => f.mandatory_telemetry && visibleFields.has(f.code))
          .map((f) => f.code);

        // Solo verificar que todos los campos requeridos tengan valores
        return requiredCodes.every((code) => {
          const value = formValues[code];
          return value !== undefined && String(value).trim() !== '';
        });
      },
      [visibleFields, formValues]
    );

    const handleSubmit = async () => {
      setShowErrors(true); // Mostrar errores al intentar enviar
      setIsLoading(true);
      setLoadingMessage('Validando formulario...');
      const isValid = validateForm();

      if (isValid) {
        // Crear estructura de datos mejorada con builders integrados
        const enhancedFormData: EnhancedFormData = {};

        // Obtener códigos de campos que pertenecen a builders para excluirlos de campos normales
        const builderFieldCodes = new Set<string>();
        formData.forEach((form) => {
          if (form.type === 'BUILDER') {
            form.fields.forEach((field) => {
              builderFieldCodes.add(field.code);
            });
          }
        });

        // Agregar solo campos normales (no de builders) a enhancedFormData
        Object.entries(formValues).forEach(([fieldCode, value]) => {
          if (!builderFieldCodes.has(fieldCode)) {
            enhancedFormData[fieldCode] = value;
          }
        });

        // Agregar datos de builders a la estructura con la llave del widget_code
        Object.entries(builderItems).forEach(([widgetCode, items]) => {
          if (items && items.length > 0) {
            // Convertir items de builders a array de fields
            enhancedFormData[widgetCode] = items
              .map((item) =>
                item.items.map((field) => ({
                  field_code: field.code,
                  value: field.value,
                  name: field.name,
                }))
              )
              .flat(); // Aplanar en caso de múltiples items por widget
          }
        });

        // Aplanar todos los builderItems para mantener compatibilidad si es necesario
        const allBuilderItems = Object.values(builderItems).flat();

        try {
          // ✅ PASO 1: Marcar como completo en base de datos local
          await saveFormSubmission(
            activity_id,
            page_code,
            enhancedFormData,
            photos,
            allBuilderItems,
            true
          );

          // ✅ PASO 2: Notificar al componente padre para navegación
          // IMPORTANTE: onSubmit ya NO debe guardar otra vez, solo navegar
          setLoadingMessage('Guardando información...');
          onSubmit(enhancedFormData, photos, allBuilderItems);
        } catch (error) {
          console.error('❌ Error al marcar formulario como completo:', error);
          setLoadingMessage('Guardando información...');
          onSubmit(enhancedFormData, photos, allBuilderItems); // Fallback
        }
      } else {
        setIsLoading(false);
      }
    };

    // Handlers para fotos - Adaptados de DynamicFormRenderer
    const handlePhotoAdd = useCallback(
      (newPhoto: IPhotosAdd) => {
        setPhotos((prevPhotos = []) => {
          const updatedPhotos = [...prevPhotos];
          const availableIndex = updatedPhotos.findIndex(
            (p) => p.code === newPhoto.code && !p.url
          );

          if (availableIndex !== -1) {
            updatedPhotos[availableIndex] = {
              ...newPhoto,
              name:
                newPhoto.name.startsWith('compressed-') ||
                newPhoto.name.startsWith('original-')
                  ? newPhoto.name
                  : `${availableIndex}`,
            };
          } else {
            updatedPhotos.push({
              ...newPhoto,
              name:
                newPhoto.name.startsWith('compressed-') ||
                newPhoto.name.startsWith('original-')
                  ? newPhoto.name
                  : `${updatedPhotos.length}`,
            });
          }

          // Obtener el valor de la URL para el formValues
          const photoUrl =
            typeof newPhoto.url === 'string'
              ? newPhoto.url
              : newPhoto.displayUrl || '';

          // Actualizar formValues con la URL para display
          setFormValues((prev) => ({
            ...prev,
            [newPhoto.code]: photoUrl,
          }));

          // Si es un campo de telemedida en estado FAILED, usar la foto como valor del campo
          const field = formData
            .flatMap((form) => form.fields)
            .find((f) => f.code === newPhoto.code);

          if (
            field?.input_type === 'TELEMETRY' &&
            telemetryStatusByField[field.code] === StatusTelemetry.FAILED &&
            showPhotoForTelemetry[field.code]
          ) {
            setFormValues((prev) => ({
              ...prev,
              [field.code]: photoUrl,
            }));
          }

          return updatedPhotos;
        });

        // ✅ El auto-save se ejecutará automáticamente por el useEffect que escucha cambios en photos
      },
      [formData, telemetryStatusByField, showPhotoForTelemetry]
    );

    const handlePhotoDelete = useCallback((name: string) => {
      setPhotos((prevPhotos = []) => {
        const deletedPhoto = prevPhotos.find((photo) => photo.name === name);

        // 🧹 Cleanup de URLs de objeto antes de eliminar
        if (deletedPhoto?.displayUrl) {
          URL.revokeObjectURL(deletedPhoto.displayUrl);
        }

        const updatedPhotos = prevPhotos.map((photo) =>
          photo.name === name
            ? {
                ...photo,
                url: '',
                blob: undefined,
                displayUrl: undefined,
              }
            : photo
        );

        // Encontrar el código del campo para limpiar formValues
        if (deletedPhoto) {
          setFormValues((prev) => ({
            ...prev,
            [deletedPhoto.code]: '',
          }));
        }

        return updatedPhotos;
      });

      // ✅ El auto-save se ejecutará automáticamente por el useEffect que escucha cambios en photos
    }, []);

    // Handlers para BUILDER - Mejorados y simplificados
    const handleModalAddClick = useCallback((builderCode: string) => {
      setModalState({
        isOpenAdd: true,
        isOpenOptions: false,
        isEdit: false,
        activeBuilderCode: builderCode,
        activeIndex: null,
      });
    }, []);

    const handleModalOptionsClick = useCallback(
      (builderCode: string, itemIndex: number) => {
        setModalState({
          isOpenAdd: false,
          isOpenOptions: true,
          isEdit: false,
          activeBuilderCode: builderCode,
          activeIndex: itemIndex,
        });
      },
      []
    );

    const handleEditClick = useCallback(() => {
      setModalState((prev) => {
        const newState = {
          ...prev,
          isOpenOptions: false,
          isOpenAdd: true,
          isEdit: true,
        };
        return newState;
      });
    }, []);

    const handleDeleteClick = useCallback(() => {
      if (modalState.activeBuilderCode && modalState.activeIndex !== null) {
        const code = modalState.activeBuilderCode;
        const indexToRemove = modalState.activeIndex;
        setBuilderItems((prev) => ({
          ...prev,
          [code]: prev[code]?.filter((_, i) => i !== indexToRemove) || [],
        }));
        setModalState({
          isOpenAdd: false,
          isOpenOptions: false,
          isEdit: false,
          activeBuilderCode: null,
          activeIndex: null,
        });

        // ✅ Auto-save inmediato al eliminar item de builder (solo si no es carga inicial)
        if (!isInitialLoadRef.current && activity_id && page_code) {
          setTimeout(() => {
            performAutoSave();
          }, 100); // Pequeño delay para que se actualice el estado
        }
      }
    }, [
      modalState.activeBuilderCode,
      modalState.activeIndex,
      activity_id,
      page_code,
      performAutoSave,
    ]);

    const handleItemAdded = useCallback(
      (builderCode: string, newItem: ITransformer) => {
        setBuilderItems((prev) => {
          const currentItems = prev[builderCode] || [];
          const updatedItems =
            modalState.isEdit && modalState.activeIndex !== null
              ? currentItems.map((item, i) =>
                  i === modalState.activeIndex ? newItem : item
                )
              : [...currentItems, newItem];

          return {
            ...prev,
            [builderCode]: updatedItems,
          };
        });

        setModalState({
          isOpenAdd: false,
          isOpenOptions: false,
          isEdit: false,
          activeBuilderCode: null,
          activeIndex: null,
        });

        // ✅ Auto-save inmediato al agregar/editar item de builder (solo si no es carga inicial)
        if (!isInitialLoadRef.current && activity_id && page_code) {
          setTimeout(() => {
            performAutoSave();
          }, 100); // Pequeño delay para que se actualice el estado
        }
      },
      [
        modalState.isEdit,
        modalState.activeIndex,
        activity_id,
        page_code,
        performAutoSave,
      ]
    );

    const closeModalOptions = useCallback(() => {
      setModalState((prev) => {
        if (prev.isEdit && prev.isOpenAdd) {
          return {
            ...prev,
            isOpenOptions: false,
          };
        }
        return {
          ...prev,
          isOpenOptions: false,
          activeBuilderCode: null,
          activeIndex: null,
          isEdit: false,
        };
      });
    }, []);

    const closeModalAdd = useCallback(() => {
      setModalState({
        isOpenAdd: false,
        isOpenOptions: false,
        isEdit: false,
        activeBuilderCode: null,
        activeIndex: null,
      });

      // 💾 Guardar en BD después de cerrar el modal
      // (el modal ya está cerrado, por lo que el useEffect de auto-save podrá ejecutarse)
      if (!isInitialLoadRef.current && activity_id && page_code) {
        setTimeout(() => {
          performAutoSave();
        }, 100);
      }
    }, [activity_id, page_code, performAutoSave]);

    // Helper para renderizar sección de fotos
    const renderPhotoSection = useCallback(
      (field: IFields, parentForm: IFormResponse) => {
        // Obtener fotos existentes para este campo (considerar tanto url string como blob)
        const photosForThisField =
          photos?.filter((p) => {
            if (!p || p.code !== field.code) return false;
            // Una foto es válida si tiene url string, displayUrl, o blob
            return (
              (typeof p.url === 'string' && p.url) || p.displayUrl || p.blob
            );
          }) || [];

        return (
          <div
            key={`${field.code}-photos`}
            className={styles.containerPhotos}
          >
            {field.name.includes('telemetry') && (
              <div className={styles.containerPhotosHeader}>
                <BiaText
                  token='heading-3'
                  color='standard'
                >
                  {field.title}
                  {field.mandatory && (
                    <span style={{ color: 'var(--ink-error)' }}> *</span>
                  )}
                </BiaText>
              </div>
            )}
            {field.name === 'foto_modem_respaldo' && (
              <div className={styles.containerPhotosHeader}>
                <BiaText
                  token='heading-3'
                  color='standard'
                >
                  {field.title}
                  {field.mandatory && (
                    <span style={{ color: 'var(--ink-error)' }}> *</span>
                  )}
                </BiaText>
              </div>
            )}

            {field.title && !parentForm.name && (
              <div className={styles.containerPhotosHeader}>
                <BiaText
                  token='heading-3'
                  color='standard'
                >
                  {field.title}
                  {field.mandatory && (
                    <span style={{ color: 'var(--ink-error)' }}> *</span>
                  )}
                </BiaText>
              </div>
            )}
            {field.sub_title && (
              <>
                <BiaText
                  token='bodyRegular'
                  color='weak'
                  className={styles.textSubtitle}
                >
                  {field.sub_title}
                </BiaText>
                <br />
              </>
            )}
            <BiaText
              token='bodyRegular'
              color='weak'
              className={styles.textMaxPhotos}
            >
              {field.maximum_input} fotos máximo
            </BiaText>
            {field.mandatory && (
              <div style={{ marginTop: '4px', marginBottom: '8px' }}>
                <BiaText
                  token='bodyRegular'
                  className={styles.textMaxPhotos}
                  color='warning'
                >
                  Debe agregar al menos una foto
                </BiaText>
              </div>
            )}
            <AddPhoto
              code={field.code}
              _activityID={activity_id}
              currentPhotos={photosForThisField}
              onPhotoAdd={handlePhotoAdd}
              onPhotoDelete={handlePhotoDelete}
              maxPhotos={field.maximum_input}
            />
          </div>
        );
      },
      [
        photos,
        activity_id,
        handlePhotoAdd,
        handlePhotoDelete,
        errors,
        showErrors,
      ]
    );

    // Helper para renderizar sección de builder
    const renderBuilderSection = (form: IFormResponse) => {
      const builderCode = form.code;
      const currentItems = builderItems[builderCode] || [];

      return (
        <React.Fragment key={`${builderCode}-builder`}>
          {/* Botón Agregar */}
          <IonButton
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              handleModalAddClick(builderCode);
            }}
            fill='outline'
            expand='block'
            className={styles.btn_add}
            type='button'
          >
            {`Agregar ${form.name || 'elemento'}`}
          </IonButton>

          {/* Lista de Items */}
          {currentItems.length >= 1 && (
            <div className={styles.wrap_transformers}>
              {currentItems.map((item, idx) => (
                <div
                  key={`${builderCode}-item-${idx}-${item.items[0]?.code || idx}`}
                  className={styles.wrap_only_transformer}
                >
                  <BiaText
                    token='bodyRegular'
                    color='accent'
                  >
                    {`${form.name || 'Elemento'} ${idx + 1}`}
                  </BiaText>
                  <button
                    type='button'
                    className={styles.btn_transformer}
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      handleModalOptionsClick(builderCode, idx);
                    }}
                  >
                    <BiaIcon
                      iconName='faEllipsisVertical'
                      iconType='regular'
                      color='accent'
                      size='1.25em'
                    />
                  </button>
                </div>
              ))}
            </div>
          )}

          {/* Modal Opciones */}
          <IonModal
            isOpen={
              modalState.isOpenOptions &&
              modalState.activeBuilderCode === builderCode
            }
            onDidDismiss={closeModalOptions}
            initialBreakpoint={0.29}
            breakpoints={[0, 0.29]}
            backdropDismiss={false}
          >
            <div className={styles.wrap_opt_camera}>
              <button
                type='button'
                className={styles.wrap_opt}
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  handleEditClick();
                }}
              >
                <BiaText
                  token='heading-2'
                  color='accent'
                >
                  Editar
                </BiaText>
              </button>
                <button
                  type='button'
                  className={styles.wrap_opt}
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    handleDeleteClick();
                  }}
              >
                <BiaText
                  token='heading-2'
                  color='accent'
                >
                  Eliminar
                </BiaText>
              </button>
              <button
                type='button'
                className={styles.wrap_opt}
                onClick={closeModalOptions}
              >
                <BiaText
                  token='heading-2'
                  color='error'
                >
                  Cancelar
                </BiaText>
              </button>
            </div>
          </IonModal>
        </React.Fragment>
      );
    };

    // Helper para filtrar opciones según parámetros URL
    const getFilteredOptions = useCallback(
      (field: IFields) => {
        const originalOptions = field.items || [];

        // Filtro específico para verificación de equipos fallida
        if (
          field.code === '195fb117-ea5a-41e5-9fda-1a7e222c672d' &&
          field.name === ENameField.RADIO_CONDITION_PARENT &&
          activityStatus === ActivityStatus.EQUIPMENT_VERIFICATION_FAILED
        ) {
          return originalOptions.filter(
            (item) => item.option === 'Errores en equipos'
          );
        }

        return originalOptions;
      },
      [activityStatus]
    );

    // Renderizar acordeón padre - usando estilos consistentes con FieldsRenderer
    const renderParentAccordion = (field: IFields) => {
      const optionTags = getFilteredOptions(field);
      const currentValue = formValues[field.code] || '';
      // const hasValue = !!currentValue;

      return (
        <IonAccordionGroup
          key={field.code}
          className={styles.accordion_group}
        >
          <IonAccordion value={field.title}>
            <IonItem
              slot='header'
              className={styles.accordion_header}
            >
              <div className={styles.accordion_header_content}>
                <BiaText
                  token='bodyRegular'
                  color='weak'
                >
                  {field.mandatory && (
                    <span style={{ color: 'var(--ink-error)' }}>*</span>
                  )}{' '}
                  {field.title}
                </BiaText>
                {currentValue && currentValue.trim() !== '' && (
                  <BiaIcon
                    iconType={'solid'}
                    iconName={'faCircleCheck'}
                    color='green05'
                    size='1.5em'
                    className={styles.icon_check}
                  />
                )}
              </div>
            </IonItem>
            <div
              slot='content'
              className={styles.accordion_content}
            >
              <BiaRadioGroup
                options={optionTags.map((item) => ({
                  label: item.option,
                  value: item.option,
                }))}
                value={currentValue} // Agregar valor actual
                className={styles.radio_group_accordion}
                onCheckedChange={(option) => {
                  setParentSelected(null);
                  // setChildrenSelected(null); // Limpiar selección del hijo

                  // Limpiar valor del campo hijo en formValues
                  const childField = formData
                    .flatMap((form) => form.fields)
                    .find((f) => f.name === 'radio_condition_children');

                  if (childField) {
                    setFormValues((prev) => ({
                      ...prev,
                      [childField.code]: '', // Limpiar valor del hijo
                    }));
                  }

                  setTimeout(() => {
                    const condition = optionTags.find(
                      (item) => item.option === option
                    )?.condition;
                    setParentSelected(condition || '');
                    handleInputChange(field.code, option);
                  }, 100);
                }}
              />
            </div>
          </IonAccordion>
        </IonAccordionGroup>
      );
    };

    // Renderizar acordeón hijo - usando estilos consistentes con FieldsRenderer
    const renderChildAccordion = (field: IFields) => {
      if (!parentSelected) return null;
      if (field.name !== 'radio_condition_children') return null;

      const optionTags = field.items || [];
      let filteredTags = optionTags.filter(
        (item) => item.condition === parentSelected
      );

      // Filtro adicional para verificación de equipos fallida
      if (
        field.code === '7c980cd2-390c-4dfa-a8ba-a38c31a7b1b7' &&
        activityStatus === ActivityStatus.EQUIPMENT_VERIFICATION_FAILED
      ) {
        filteredTags = filteredTags.filter(
          (item) => item.option === 'Equipos en sitio'
        );
      }

      const currentValue = formValues[field.code] || '';
      // const hasValue = !!currentValue;

      if (filteredTags.length === 0) {
        return (
          <IonAccordionGroup
            key={field.code}
            className={styles.accordion_group}
          >
            <IonAccordion value={field.title}>
              <IonItem
                slot='header'
                className={styles.accordion_header}
              >
                <BiaText
                  className={styles.textWrap}
                  token='bodyRegular'
                  color='weak'
                >
                  {field.mandatory && (
                    <span style={{ color: 'var(--ink-error)' }}>*</span>
                  )}{' '}
                  {field.title}
                </BiaText>
              </IonItem>
              <div
                slot='content'
                className={styles.accordion_content}
              >
                <BiaText
                  color='error'
                  token='bodyRegular'
                >
                  No hay opciones disponibles para la selección actual.
                </BiaText>
              </div>
            </IonAccordion>
          </IonAccordionGroup>
        );
      }

      return (
        <IonAccordionGroup
          key={field.code}
          className={styles.accordion_group}
        >
          <IonAccordion value={field.title}>
            <IonItem
              slot='header'
              className={styles.accordion_header}
            >
              <div className={styles.accordion_header_content}>
                <BiaText
                  token='bodyRegular'
                  color='weak'
                >
                  {field.mandatory && (
                    <span style={{ color: 'var(--ink-error)' }}>*</span>
                  )}{' '}
                  {field.title}
                </BiaText>
                {currentValue && currentValue.trim() !== '' && (
                  <BiaIcon
                    iconType={'solid'}
                    iconName={'faCircleCheck'}
                    color='green05'
                    size='1.5em'
                    className={styles.icon_check}
                  />
                )}
              </div>
            </IonItem>
            <div
              slot='content'
              className={styles.accordion_content}
            >
              <BiaRadioGroup
                options={filteredTags.map((item) => ({
                  label: item.option,
                  value: item.option,
                }))}
                value={currentValue} // Agregar valor actual
                className={`${styles.radio_group_accordion}`}
                onCheckedChange={(option) => {
                  // setChildrenSelected(option);
                  handleInputChange(field.code, option);
                }}
              />
            </div>
          </IonAccordion>
        </IonAccordionGroup>
      );
    };

    const checkIpError = (field: IFields, parentForm: IFormResponse) => {
      const ipFieldInParent = parentForm.fields.find(
        (f) => (f.name || '').toLowerCase() === 'ip'
      );
      return ipFieldInParent ? Boolean(errors[ipFieldInParent.code]) : false;
    };

    // Función para cargar los registros de telemetría
    const loadTelemetryRecords = useCallback(async () => {
      formData.forEach((form) => {
        form.fields.forEach((field) => {
          if (field.input_type === 'TELEMETRY') {
            getTableDataByQuery<ITableTelemetry>(
              IDataBaseNames.OPERACIONES,
              IDataBaseTables.TELEMETRY,
              async (table) =>
                table
                  .where('codeField')
                  .equals(field.code)
                  .filter((record) => record.visitId === activity_id)
                  .toArray()
            ).then((records) => {
              if (records && records.length > 0) {
                const latest = records.reduce((latest, current) =>
                  latest.updatedAt > current.updatedAt ? latest : current
                );
                setTelemetryRecordsByField((prev) => ({
                  ...prev,
                  [field.code]: latest,
                }));
              }
            });
          }
        });
      });
    }, [formData, activity_id]);

    // Función para actualizar el estado de telemedida a PENDING tanto en UI como en BD
    const updateTelemetryToPending = useCallback(
      async (fieldCode: string) => {
        // Cambiar estado de telemedida a PENDING en UI
        setTelemetryStatusByField((prev) => ({
          ...prev,
          [fieldCode]: StatusTelemetry.PENDING,
        }));

        // Actualizar el estado en la base de datos local
        try {
          const telemetryRecords = await getTableDataByQuery<ITableTelemetry>(
            IDataBaseNames.OPERACIONES,
            IDataBaseTables.TELEMETRY,
            async (table) =>
              table
                .where('codeField')
                .equals(fieldCode)
                .filter((record) => record.visitId === activity_id)
                .toArray()
          );

          if (telemetryRecords && telemetryRecords.length > 0) {
            const currentRecord = telemetryRecords.reduce((latest, current) =>
              latest.updatedAt > current.updatedAt ? latest : current
            );

            // Actualizar el registro con estado PENDING
            await updateTelemetryFromRead({
              idTelemetry: currentRecord.idTelemetry,
              status: StatusTelemetryResponse.PENDING,
              url: currentRecord.url || '',
              message: currentRecord.message || '',
            });

            // Actualizar también el registro local para refrescar los intentos
            setTimeout(() => {
              loadTelemetryRecords();
            }, 100);
          }
        } catch (error) {
          console.error(
            '❌ Error al actualizar estado de telemedida en BD local:',
            error
          );
        }
      },
      [activity_id, updateTelemetryFromRead, loadTelemetryRecords]
    );

    // Efecto para cargar los registros de telemetría
    useEffect(() => {
      loadTelemetryRecords();
    }, [loadTelemetryRecords]);

    const renderField = (field: IFields, parentForm: IFormResponse) => {
      const value = formValues[field.code] || '';
      const error = errors[field.code];
      const hasError = showErrors && !!error;

      // Solo renderizar campos visibles
      if (!visibleFields.has(field.code)) {
        return null;
      }

      // Obtener opciones del campo
      const options = field.items?.map((item) => item.option) || [];

      // Manejar acordeones especiales
      if (field.input_type === 'RADIO_ACCORDION') {
        if (field.name === 'radio_condition_parent') {
          return renderParentAccordion(field);
        }
        if (field.name === 'radio_condition_children') {
          return renderChildAccordion(field);
        }
      }

      switch (field.type) {
        case 'TEXT_FIELD':
          return (
            <BiaInput
              key={field.code}
              type={
                field.input_type === 'STRING'
                  ? 'text'
                  : field.input_type === 'NUMBER'
                    ? 'number'
                    : 'text'
              }
              label={field.title}
              value={value}
              required={field.mandatory}
              error={hasError}
              errorMessage={error}
              readonly={!field.editable}
              onIonChange={(e) => {
                handleInputChange(field.code, e.detail.value || '');
              }}
              disabled={!field.editable}
            />
          );

        case 'TEXT_VIEW':
          return (
            <BiaTextArea
              key={field.code}
              label={field.title}
              required={field.mandatory}
              value={value}
              placeholder={field.title}
              rows={4}
              error={hasError}
              errorMessage={error}
              onIonChange={(e) =>
                handleInputChange(field.code, e.detail.value || '')
              }
              disabled={!field.editable}
            />
          );

        case 'SELECTOR':
          // Mapear todos los input_type de SELECTOR como en FieldsRenderer
          if (field.input_type === 'DROPDOWN') {
            return (
              <BiaSelect
                key={field.code}
                options={options}
                label={field.title}
                required={field.mandatory}
                value={value}
                error={hasError}
                errorMessage={error}
                onIonChange={(e) =>
                  handleDropdownChange(field, e.detail.value || '', parentForm)
                }
                disabled={!field.editable}
              />
            );
          }
          if (field.input_type === 'RADIO_BUTTON') {
            return (
              <BiaSelect
                key={field.code}
                options={options}
                label={field.title}
                required={field.mandatory}
                value={value}
                error={hasError}
                errorMessage={error}
                onIonChange={(e) =>
                  handleInputChange(field.code, e.detail.value || '')
                }
                disabled={!field.editable}
              />
            );
          }
          if (field.input_type === 'RADIO_ACCORDION') {
            return renderParentAccordion(field);
          }
          if (field.input_type === 'COLOR') {
            return (
              <BiaSelect
                key={field.code}
                options={options}
                label={field.title}
                required={field.mandatory}
                value={value}
                error={hasError}
                errorMessage={error}
                onIonChange={(e) =>
                  handleInputChange(field.code, e.detail.value || '')
                }
                disabled={!field.editable}
              />
            );
          }
          if (field.input_type === 'DATE') {
            return (
              <BiaDatePicker
                key={field.code}
                label={field.title}
                required={field.mandatory}
                value={value} // Agregar soporte para valor inicial
                onChange={(date) => handleInputChange(field.code, date)}
              />
            );
          }
          break;

        case 'MULTIPLE_LINE_LABEL':
        case 'FORMATTED_LABEL':
          return (
            <div
              key={field.code}
              className={styles.caption}
            >
              <BiaText
                token='caption'
                color='weak'
              >
                <div
                  dangerouslySetInnerHTML={{
                    __html: field.title
                      .replaceAll('<*', '<b>')
                      .replaceAll('*>', '</b>'),
                  }}
                ></div>
              </BiaText>
            </div>
          );

        case 'SIGN':
          return (
            <BiaSignaturePad
              key={field.code}
              label={field.title}
              onSave={(signatureDataUrl: string) =>
                handleInputChange(field.code, signatureDataUrl || '')
              }
              initialSignatureDataUrl={value}
              onClear={() => handleInputChange(field.code, '')}
            />
          );

        case 'FILE':
          return renderPhotoSection(field, parentForm);

        default:
          // Fallback para input_type específicos que no están en field.type
          switch (field.input_type) {
            case 'TELEMETRY': {
              if (!isTelemetryEnabled) return null;
              if (!isOnline) return renderPhotoSection(field, parentForm);

              // Verificar si hay registro de telemedida con más de 2 intentos
              const telemetryStatus =
                telemetryStatusByField[field.code] ?? StatusTelemetry.PENDING;

              // Si está en FAILED, verificar los intentos
              if (telemetryStatus === StatusTelemetry.FAILED) {
                // Verificar si ya sabemos si debemos mostrar la sección de fotos
                if (showPhotoForTelemetry[field.code] === undefined) {
                  getTableDataByQuery<ITableTelemetry>(
                    IDataBaseNames.OPERACIONES,
                    IDataBaseTables.TELEMETRY,
                    async (table) =>
                      table
                        .where('codeField')
                        .equals(field.code)
                        .filter((record) => record.visitId === activity_id)
                        .toArray()
                  ).then((telemetryRecords) => {
                    const currentRecord = telemetryRecords?.reduce(
                      (latest, current) =>
                        latest.updatedAt > current.updatedAt ? latest : current
                    );

                    setShowPhotoForTelemetry((prev) => ({
                      ...prev,
                      [field.code]: currentRecord?.intent >= 3,
                    }));
                  });
                }

                // Si debemos mostrar la sección de fotos junto con el InputTelemetry
                if (showPhotoForTelemetry[field.code]) {
                  const photoField = { ...field };
                  if (photoField.name === 'telemetry_backup') {
                    photoField.title = 'Diagrama Fasorial: Modem respaldo';
                    photoField.sub_title =
                      'Carga foto del diagrama fasorial del modem respaldo.';
                  } else if (photoField.name === 'telemetry_primary') {
                    photoField.title = 'Diagrama Fasorial: Modem principal';
                    photoField.sub_title =
                      'Carga foto del diagrama fasorial del modem principal.';
                  }
                  photoField.maximum_input = 1;

                  const currentRecord = telemetryRecordsByField[field.code];
                  const remainingAttempts = 3 - (currentRecord?.intent ?? 0);

                  const telemetryComponent = (
                    <>
                      <BiaText
                        token='caption'
                        color='weak'
                        className={styles.telemetry_description}
                      >
                        {t('telemetry.counter')
                          .replace(
                            '${text}',
                            remainingAttempts === 1 ? 'queda' : 'quedan'
                          )
                          .replace(
                            '${remaining_attempts}',
                            remainingAttempts.toString()
                          )
                          .replace(
                            '${intent_text}',
                            remainingAttempts === 1 ? 'intento' : 'intentos'
                          )}
                      </BiaText>
                      <InputTelemetry
                        key={`telemetry-${field.code}`}
                        disabled={
                          !areTelemetryFieldsCompleted(parentForm) ||
                          !field.editable ||
                          checkIpError(field, parentForm)
                        }
                        status={telemetryStatus}
                        label={t('input_telemetry.title')}
                        onClick={(status) =>
                          goToTelemetry(status, parentForm, field.code)
                        }
                      />
                    </>
                  );

                  const photoComponent = renderPhotoSection(
                    photoField,
                    parentForm
                  );

                  return (
                    <React.Fragment key={field.code}>
                      {telemetryComponent}
                      {photoComponent}
                    </React.Fragment>
                  );
                }
              }

              const currentRecord = telemetryRecordsByField[field.code];
              const remainingAttempts = 3 - (currentRecord?.intent ?? 0);

              return (
                <>
                  <BiaText
                    token='caption'
                    color='weak'
                    className={styles.telemetry_description}
                  >
                    {t('telemetry.counter')
                      .replace(
                        '${text}',
                        remainingAttempts === 1 ? 'queda' : 'quedan'
                      )
                      .replace(
                        '${remaining_attempts}',
                        remainingAttempts.toString()
                      )
                      .replace(
                        '${intent_text}',
                        remainingAttempts === 1 ? 'intento' : 'intentos'
                      )}
                  </BiaText>
                  <InputTelemetry
                    key={field.code}
                    disabled={
                      !areTelemetryFieldsCompleted(parentForm) ||
                      !field.editable ||
                      checkIpError(field, parentForm)
                    }
                    status={telemetryStatus}
                    label={t('input_telemetry.title')}
                    onClick={(status) =>
                      goToTelemetry(status, parentForm, field.code)
                    }
                  />
                </>
              );
            }
            case 'FILE':
              return renderPhotoSection(field, parentForm);

            case 'MULTIPLE_CHOICES_WITH_DELETE':
              return (
                <BiaSelect
                  key={field.code}
                  options={options}
                  label={field.title}
                  required={field.mandatory}
                  value={value}
                  error={hasError}
                  errorMessage={error}
                  onIonChange={(e) =>
                    handleInputChange(field.code, e.detail.value || '')
                  }
                  disabled={!field.editable}
                />
              );

            case 'STRING':
              return (
                <IonItem
                  key={field.code}
                  className={hasError ? 'ion-invalid' : ''}
                >
                  <IonLabel position='stacked'>{field.title}</IonLabel>
                  <IonInput
                    value={value}
                    onIonChange={(e) =>
                      handleInputChange(field.code, String(e.detail.value))
                    }
                    placeholder={`Ingrese ${field.title.toLowerCase()}`}
                    disabled={!field.editable}
                  />
                  {hasError && (
                    <IonText
                      color='danger'
                      className='ion-padding-start'
                    >
                      {error}
                    </IonText>
                  )}
                </IonItem>
              );

            case 'NUMBER':
              return (
                <IonItem
                  key={field.code}
                  className={hasError ? 'ion-invalid' : ''}
                >
                  <IonLabel position='stacked'>{field.title}</IonLabel>
                  <IonInput
                    type='number'
                    value={value}
                    onIonChange={(e) =>
                      handleInputChange(field.code, String(e.detail.value))
                    }
                    placeholder={`Ingrese ${field.title.toLowerCase()}`}
                    disabled={!field.editable}
                  />
                  {hasError && (
                    <IonText
                      color='danger'
                      className='ion-padding-start'
                    >
                      {error}
                    </IonText>
                  )}
                </IonItem>
              );

            case 'DROPDOWN':
              return (
                <IonItem
                  key={field.code}
                  className={hasError ? 'ion-invalid' : ''}
                >
                  <IonLabel position='stacked'>{field.title}</IonLabel>
                  <IonSelect
                    value={value}
                    onIonChange={(e) =>
                      handleDropdownChange(
                        field,
                        e.detail.value || '',
                        parentForm
                      )
                    }
                    placeholder={`Seleccione ${field.title.toLowerCase()}`}
                    disabled={!field.editable}
                  >
                    {options.map((option: string, index: number) => (
                      <IonSelectOption
                        key={index}
                        value={option}
                      >
                        {option}
                      </IonSelectOption>
                    ))}
                  </IonSelect>
                  {hasError && (
                    <IonText
                      color='danger'
                      className='ion-padding-start'
                    >
                      {error}
                    </IonText>
                  )}
                </IonItem>
              );

            case 'TEXTAREA':
              return (
                <IonItem
                  key={field.code}
                  className={hasError ? 'ion-invalid' : ''}
                >
                  <IonLabel position='stacked'>{field.title}</IonLabel>
                  <IonTextarea
                    value={value}
                    onIonChange={(e) =>
                      handleInputChange(field.code, String(e.detail.value))
                    }
                    placeholder={`Ingrese ${field.title.toLowerCase()}`}
                    rows={4}
                    disabled={!field.editable}
                  />
                  {hasError && (
                    <IonText
                      color='danger'
                      className='ion-padding-start'
                    >
                      {error}
                    </IonText>
                  )}
                </IonItem>
              );

            case 'CHECKBOX':
              return (
                <IonItem key={field.code}>
                  <IonLabel>{field.title}</IonLabel>
                  <IonCheckbox
                    checked={value === 'true'}
                    onIonChange={(e) =>
                      handleInputChange(field.code, String(e.detail.checked))
                    }
                    disabled={!field.editable}
                  />
                </IonItem>
              );

            case 'RADIO_BUTTON':
              return (
                <IonItem
                  key={field.code}
                  className={hasError ? 'ion-invalid' : ''}
                >
                  <IonLabel position='stacked'>{field.title}</IonLabel>
                  <IonRadioGroup
                    value={value}
                    onIonChange={(e) =>
                      handleInputChange(field.code, String(e.detail.value))
                    }
                  >
                    {options.map((option: string, index: number) => (
                      <IonItem
                        key={index}
                        lines='none'
                      >
                        <IonRadio
                          value={option}
                          disabled={!field.editable}
                        />
                        <IonLabel>{option}</IonLabel>
                      </IonItem>
                    ))}
                  </IonRadioGroup>
                  {hasError && (
                    <IonText
                      color='danger'
                      className='ion-padding-start'
                    >
                      {error}
                    </IonText>
                  )}
                </IonItem>
              );

            default:
              return (
                <IonItem
                  key={field.code}
                  className={hasError ? 'ion-invalid' : ''}
                >
                  <IonLabel position='stacked'>{field.title}</IonLabel>
                  <IonInput
                    value={value}
                    onIonChange={(e) =>
                      handleInputChange(field.code, String(e.detail.value))
                    }
                    placeholder={`Ingrese ${field.title.toLowerCase()}`}
                    disabled={!field.editable}
                  />
                  {hasError && (
                    <IonText
                      color='danger'
                      className='ion-padding-start'
                    >
                      {error}
                    </IonText>
                  )}
                </IonItem>
              );
          }
      }

      return null;
    };

    const renderForm = (form: IFormResponse) => {
      // Verificar si el formulario debe ser visible según su condición
      const shouldRenderForm = () => {
        // Si no tiene condición, siempre se muestra
        if (!form.condition) return true;

        // Si es widget_parent, siempre se muestra (es el dropdown padre)
        if (form.condition === 'widget_parent') return true;

        // Para formularios con otras condiciones, verificar si algún campo visible tiene esa condición activa
        const hasMatchingCondition = Array.from(visibleFields).some(
          (fieldCode) => {
            const fieldValue = formValues[fieldCode];
            if (!fieldValue) return false;

            // Buscar el campo en todos los formularios
            for (const currentForm of formData) {
              const field = currentForm.fields.find(
                (f: IFields) => f.code === fieldCode
              );
              if (field && field.items) {
                const selectedItem = field.items.find(
                  (item: IItems) => item.option === fieldValue
                );
                if (selectedItem && selectedItem.condition === form.condition) {
                  return true;
                }
              }
            }
            return false;
          }
        );

        return hasMatchingCondition;
      };

      const shouldRender = shouldRenderForm();

      // Si el formulario no debe renderizarse, retornar null
      if (!shouldRender) {
        return null;
      }

      // Si es una sección BUILDER y los builders están habilitados, renderizar la funcionalidad completa
      if (form.type === 'BUILDER' && !disableBuilders) {
        return renderBuilderSection(form);
      }

      // Para secciones SIMPLE, renderizar normalmente
      return (
        <div key={form.code}>
          {/* Siempre mostrar el título del formulario si existe */}
          {form.name && (
            <div className={styles.title_section}>
              <BiaText
                token='heading-3'
                color='standard'
              >
                {form.name}
              </BiaText>
            </div>
          )}
          {form.fields.map((field) => (
            <div key={field.code}>{renderField(field, form)}</div>
          ))}
        </div>
      );
    };

    // Obtener datos del formulario activo para el modal
    const getActiveBuilderData = () => {
      if (!modalState.activeBuilderCode) return null;

      const activeForm = formData.find(
        (form) => form.code === modalState.activeBuilderCode
      );
      if (!activeForm) return null;

      const currentItems = builderItems[modalState.activeBuilderCode] || [];

      return {
        form: activeForm,
        currentItems,
        formData: [
          {
            code: modalState.activeBuilderCode,
            name: activeForm.name,
            description: activeForm.description,
            type: 'SIMPLE' as const,
            fields: activeForm.fields.map((field) => ({
              ...field,
              selected_value:
                modalState.isEdit && modalState.activeIndex !== null
                  ? [
                      currentItems[modalState.activeIndex]?.items.find(
                        (item) => item.code === field.code
                      )?.value || '',
                    ]
                  : field.selected_value || [''],
            })),
            built_widgets: [],
          },
        ],
      };
    };

    const activeBuilderData = getActiveBuilderData();

    // Mostrar indicador de carga si se están cargando datos
    if (isLoadingData) {
      return (
        <div
          style={{
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            padding: '2rem',
            flexDirection: 'column',
            gap: '1rem',
          }}
        >
          <BiaText
            token='bodyRegular'
            color='weak'
          >
            Cargando datos existentes...
          </BiaText>
        </div>
      );
    }

    return (
      <>
        {isLoading && (
          <BiaLoader
            color='accent'
            text={loadingMessage}
            className={styles.loader}
          />
        )}
        {!isOnline && page_code === 'd82e2858-0f97-4696-8e7f-ab1d6d066792' && (
          <OfflineAlert
            className={styles.offlineAlert}
            message={t('message_no_network')}
            title={t('title_no_network')}
          />
        )}
        <form
          onSubmit={
            hideButtons
              ? (e) => {
                  e.preventDefault();
                }
              : (e) => {
                  e.preventDefault();
                  if (isFormComplete) {
                    handleSubmit();
                  }
                }
          }
        >
          {formData.map((form) => (
            <div key={form.code}>{renderForm(form)}</div>
          ))}
        </form>

        {/* Modal centralizado para BUILDER */}
        {activeBuilderData && (
          <BuilderModal
            isOpen={modalState.isOpenAdd}
            onDidDismiss={closeModalAdd}
            title={modalState.isEdit ? `Editar elemento` : `Agregar elemento`}
            fields={activeBuilderData.form.fields}
            initialValues={
              modalState.isEdit && modalState.activeIndex !== null
                ? Object.fromEntries(
                    activeBuilderData.currentItems[
                      modalState.activeIndex
                    ]?.items.map((item) => [item.code, item.value]) || []
                  )
                : {}
            }
            onAutoSave={(data) => {
              // 🔄 AUTO-SAVE solo para modo EDICIÓN
              if (!modalState.isEdit || modalState.activeIndex === null) {
                return;
              }

              // Convertir los datos del formulario en un ITransformer
              const newItem: ITransformer = {
                widget_code: modalState.activeBuilderCode!,
                items: Object.entries(data).map(([code, value]) => {
                  const field = activeBuilderData.form.fields.find(
                    (f) => f.code === code
                  );
                  return {
                    code,
                    name: field?.name || '',
                    value: value || '',
                    widget_code: modalState.activeBuilderCode!,
                  };
                }),
              };

              // Actualizar solo el estado local (builderItems)
              setBuilderItems((prev) => {
                const currentItems = prev[modalState.activeBuilderCode!] || [];

                // Modo edición: actualizar el elemento existente
                const updatedItems = currentItems.map((item, i) =>
                  i === modalState.activeIndex ? newItem : item
                );

                return {
                  ...prev,
                  [modalState.activeBuilderCode!]: updatedItems,
                };
              });

              // NO guardar en BD aquí, solo actualizar estado local
            }}
            onSubmit={(data) => {
              // Convertir los datos del formulario en un ITransformer
              const newItem: ITransformer = {
                widget_code: modalState.activeBuilderCode!,
                items: Object.entries(data).map(([code, value]) => {
                  const field = activeBuilderData.form.fields.find(
                    (f) => f.code === code
                  );
                  return {
                    code,
                    name: field?.name || '',
                    value: value || '',
                    widget_code: modalState.activeBuilderCode!,
                  };
                }),
              };
              handleItemAdded(modalState.activeBuilderCode!, newItem);
            }}
            submitButtonText={modalState.isEdit ? 'Actualizar' : 'Guardar'}
            autoSaveDelay={1000}
          />
        )}

        {!hideButtons && (
          <IonFab
            vertical='bottom'
            horizontal='end'
            slot='fixed'
            className={styles.containerButtonFloat}
          >
            <div style={{ display: 'flex', gap: '1rem', width: '100%' }}>
              {onCancel && (
                <IonButton
                  expand='block'
                  fill='outline'
                  onClick={onCancel}
                  style={{ flex: 1 }}
                >
                  {cancelButtonText}
                </IonButton>
              )}

              <IonButton
                expand='block'
                onClick={handleSubmit}
                className={`${styles.button}`}
                {...(!isFormComplete ||
                !areTelemetryFieldsComplete ||
                isLoading ||
                isLoadingData
                  ? { disabled: true }
                  : {})}
                style={{ flex: 1 }}
              >
                {isLoading
                  ? 'Guardando información...'
                  : isLoadingData
                    ? 'Cargando datos existentes...'
                    : submitButtonText}
              </IonButton>
            </div>
          </IonFab>
        )}

        <BiaPopupMobile
          isOpen={isOpenTelemetryEditPopup}
          onClose={() => {
            setIsOpenTelemetryEditPopup(false);
            setCurrentTelemetryFieldBeingEdited(null);
          }}
          title={t('telemetry.edit.popup.title')}
          message={t('telemetry.edit.popup.message')}
          button={{
            label: t('telemetry.edit.popup.button'),
            onClick: async () => {
              if (currentTelemetryFieldBeingEdited) {
                await updateTelemetryToPending(
                  currentTelemetryFieldBeingEdited
                );
              }
              setIsOpenTelemetryEditPopup(false);
              setCurrentTelemetryFieldBeingEdited(null);
            },
          }}
          icon={{
            name: 'faTriangleExclamation',
            type: 'solid',
            colorIcon: 'warning',
          }}
        />
      </>
    );
  }
);

DynamicForm.displayName = 'DynamicForm';

export default DynamicForm;
