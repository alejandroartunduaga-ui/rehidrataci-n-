import { useEffect, useState, useRef } from 'react';
import { useParams } from 'react-router-dom';
import {
  BiaText,
  BiaLoader,
  BreadcrumbItem,
  BiaToast,
  BiaAccordion,
  BiaAccordionGroup,
  BiaBreadcrumb,
  BiaInput,
  BiaDatePickerSimple,
  BiaTimerPicker,
  BiaDropdown,
  BiaIcon,
  BiaTextArea,
} from '@entropy/index';
import { TranslationNamespaces } from '@shared/i18n';
import { useTranslation } from 'react-i18next';
import {
  ISectionsHv,
  useSearchContract,
  IFieldHv,
  ETypesHv,
  IPostTechnicalLifeDetailsRequest,
  IFieldPostHv,
} from '../../../data';
import { TableDinamicHv } from '../../components/TableDinamicHv/TableDinamicHv';
import { TableStaticHv } from '../../components/TableStaticHv/TableStaticHv';
import { ModalConfirmEdit } from '../../components';
import styles from './DetailTechnicalLifeSheet.module.css';
import { IonItem, IonLabel, useIonRouter } from '@ionic/react';
import { useFileUploaderS3 } from '@mobile/forms-management';
import { useImageCompression } from '@shared/index';
import { convertToIsoFormat } from '@shared/utils/date';

interface IFormValues {
  [sectionId: string]: {
    [fieldName: string]: string | string[];
  };
}

export const DetailTechnicalLifeSheet = () => {
  const { t } = useTranslation(TranslationNamespaces.TECHNICAL_LIFE_SHEET);
  const { contract_id } = useParams<{
    cvId: string;
    contract_id: string;
  }>();
  const { getTechnicalLifeDetailsMutation, postTechnicalLifeDetailsMutation } =
    useSearchContract();
  const { uploadS3VisitActMutation } = useFileUploaderS3();
  const { compressImage } = useImageCompression();
  const [technicalLifeDetails, setTechnicalLifeDetails] = useState<
    ISectionsHv[]
  >([]);
  const [formValues, setFormValues] = useState<IFormValues>({});
  const [tableValues, setTableValues] = useState<{
    [sectionId: string]: { [key: string]: string };
  }>({});
  const [fileValues, setFileValues] = useState<{
    [fieldName: string]: File[];
  }>({});
  const [filePreviewUrls, setFilePreviewUrls] = useState<{
    [fieldName: string]: string[];
  }>({});
  const [existingFileUrls, setExistingFileUrls] = useState<{
    [fieldName: string]: string[];
  }>({});
  const [showErrors, setShowErrors] = useState(false);
  const [patternErrors, setPatternErrors] = useState<{
    [key: string]: boolean;
  }>({});
  const [toastMessage, setToastMessage] = useState<{
    message: string;
    type: 'error' | 'success';
  } | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [activeConditions, setActiveConditions] = useState<Set<string>>(
    new Set()
  );
  const fileInputRefs = useRef<{ [key: string]: HTMLInputElement | null }>({});
  const breadcrumbItems: BreadcrumbItem[] = [
    {
      label: 'Hoja de Vida Técnica',
      href: '/admin-regulatory/technical-life-sheet',
    },
    { label: 'Detalle', active: true },
  ];
  const router = useIonRouter();

  // Normalizar valores para prellenado (minúsculas y sin tildes)
  const normalizeForDisplay = (value: string): string => {
    return value
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, ''); // Remover acentos
  };

  // Función para decodificar valores (caracteres especiales)
  const decodeValue = (value: string | null | undefined): string => {
    if (!value || value === null || value === undefined) return '';
    try {
      return decodeURIComponent(value);
    } catch {
      // Si falla la decodificación, retornar el valor original
      return value;
    }
  };

  // Función para decodificar arrays de valores
  const decodeValues = (
    values: (string | null)[] | null | undefined
  ): string[] => {
    if (!values || !Array.isArray(values)) return [];
    return values.map((v) => decodeValue(v));
  };

  // Inicializar valores del formulario cuando se cargan los detalles
  const initializeFormValues = (sections: ISectionsHv[]) => {
    const initialFormValues: IFormValues = {};
    const initialTableValues: {
      [sectionId: string]: { [key: string]: string };
    } = {};
    const initialConditions = new Set<string>();
    const initialExistingFileUrls: { [fieldName: string]: string[] } = {};

    sections.forEach((section) => {
      initialFormValues[section.section_id] = {};

      section.fields.forEach((field) => {
        if (
          field.type === ETypesHv.GROUP_FIELDS ||
          field.type === ETypesHv.GROUP_FIELDS_STATIC
        ) {
          // Para grupos de campos (tablas), crear el formulario de la tabla
          if (!initialTableValues[section.section_id]) {
            initialTableValues[section.section_id] = {};
          }

          field.groups?.forEach((group) => {
            group.fields.forEach((groupField) => {
              const key = groupField.field_name;
              const rawValue = decodeValue(groupField.value?.[0]);
              // No normalizar campos de texto, fecha y hora (mantener formato original)
              if (
                groupField.type === ETypesHv.DATE ||
                groupField.type === ETypesHv.TIME ||
                groupField.type === ETypesHv.STRING ||
                groupField.type === ETypesHv.TEXT_AREA ||
                groupField.type === ETypesHv.NUMBER ||
                groupField.type === ETypesHv.INTEGER ||
                groupField.type === ETypesHv.FLOAT
              ) {
                // Solo decodificar, no normalizar para preservar mayúsculas, tildes y caracteres especiales
                initialTableValues[section.section_id][key] = rawValue;
              } else {
                // Solo para dropdowns: normalizar valores para comparación
                initialTableValues[section.section_id][key] = rawValue
                  ? normalizeForDisplay(rawValue)
                  : '';
              }
            });
          });
        } else if (field.type === ETypesHv.FILE) {
          // Para campos FILE, guardar las URLs existentes validando que sean URLs válidas
          if (field.value && field.value.length > 0) {
            // Decodificar las URLs antes de validarlas
            const decodedUrls = decodeValues(field.value);
            const validUrls = decodedUrls.filter((url) => {
              if (!url || typeof url !== 'string' || url.trim() === '') {
                return false;
              }
              // Validar que sea una URL válida
              try {
                new URL(url);
                return true;
              } catch {
                return false;
              }
            });

            if (validUrls.length > 0) {
              initialExistingFileUrls[field.field_name] = validUrls;
            }
          }
        } else {
          // Para campos normales
          // No normalizar campos de texto, fecha y hora (mantener formato original)
          if (
            field.type === ETypesHv.DATE ||
            field.type === ETypesHv.TIME ||
            field.type === ETypesHv.STRING ||
            field.type === ETypesHv.TEXT_AREA ||
            field.type === ETypesHv.NUMBER ||
            field.type === ETypesHv.INTEGER ||
            field.type === ETypesHv.FLOAT
          ) {
            // Solo decodificar, no normalizar para preservar mayúsculas, tildes y caracteres especiales
            const rawValue = decodeValue(field.value?.[0]);
            initialFormValues[section.section_id][field.field_name] = rawValue;
          } else if (field.type === ETypesHv.DROPDOWN_MULTIPLE) {
            // Si es DROPDOWN_MULTIPLE, decodificar y guardar como array normalizado
            const decodedValues = decodeValues(field.value);
            initialFormValues[section.section_id][field.field_name] =
              decodedValues.map((v) => normalizeForDisplay(v));
          } else {
            // Otros campos: solo decodificar (no normalizar)
            const rawValue = decodeValue(field.value?.[0]);
            initialFormValues[section.section_id][field.field_name] = rawValue;
          }

          // Verificar si hay valores iniciales que activen condiciones
          if (
            (field.type === ETypesHv.DROPDOWN_ONE ||
              field.type === ETypesHv.DROPDOWN_MULTIPLE) &&
            field.items
          ) {
            const fieldValue = field.value;
            if (fieldValue && fieldValue.length > 0) {
              // Decodificar y normalizar valores para comparación
              const decodedFieldValues = decodeValues(fieldValue);
              const normalizedFieldValues = decodedFieldValues.map((v) =>
                normalizeForDisplay(v)
              );
              field.items.forEach((item) => {
                const normalizedOption = normalizeForDisplay(item.option);
                if (
                  item.condition &&
                  normalizedFieldValues.includes(normalizedOption)
                ) {
                  initialConditions.add(item.condition);
                }
              });
            }
          }
        }
      });
    });

    setFormValues(initialFormValues);
    setTableValues(initialTableValues);
    setActiveConditions(initialConditions);
    setExistingFileUrls(initialExistingFileUrls);
  };

  // Validar pattern de un campo
  const validatePattern = (
    sectionId: string,
    fieldName: string,
    value: string,
    regex: string | null
  ) => {
    if (!regex || !value || value.trim() === '') {
      // Si no hay regex o el valor está vacío, no hay error de pattern
      setPatternErrors((prev) => ({
        ...prev,
        [`${sectionId}_${fieldName}`]: false,
      }));
      return;
    }

    const pattern = new RegExp(regex);
    const isValid = pattern.test(value);

    setPatternErrors((prev) => ({
      ...prev,
      [`${sectionId}_${fieldName}`]: !isValid,
    }));
  };

  // Actualizar condiciones activas basadas en la selección de dropdowns
  const updateActiveConditions = (
    sectionId: string,
    fieldName: string,
    value: string | string[]
  ) => {
    // Encontrar el campo en la estructura de datos
    const section = technicalLifeDetails.find(
      (s) => s.section_id === sectionId
    );
    const field = section?.fields.find((f) => f.field_name === fieldName);

    if (
      !field ||
      (field.type !== ETypesHv.DROPDOWN_ONE &&
        field.type !== ETypesHv.DROPDOWN_MULTIPLE)
    ) {
      return;
    }

    setActiveConditions((prev) => {
      const newConditions = new Set(prev);

      // Remover todas las condiciones relacionadas con este campo
      field.items?.forEach((item) => {
        if (item.condition) {
          newConditions.delete(item.condition);
        }
      });

      // Agregar las condiciones de las opciones seleccionadas
      const selectedValues = Array.isArray(value) ? value : [value];
      field.items?.forEach((item) => {
        if (item.condition && selectedValues.includes(item.option)) {
          newConditions.add(item.condition);
        }
      });

      return newConditions;
    });
  };

  // Manejar cambios en los campos
  const handleFieldChange = (
    sectionId: string,
    fieldName: string,
    value: string | string[],
    regex?: string | null
  ) => {
    setFormValues((prev) => ({
      ...prev,
      [sectionId]: {
        ...prev[sectionId],
        [fieldName]: value,
      },
    }));

    // Validar pattern si existe
    if (regex && typeof value === 'string') {
      validatePattern(sectionId, fieldName, value, regex);
    }

    // Actualizar condiciones activas si es un dropdown
    updateActiveConditions(sectionId, fieldName, value);
  };

  // Manejar cambios en los valores de las tablas
  const handleTableValuesChange = (
    sectionId: string,
    values: { [key: string]: string }
  ) => {
    setTableValues((prev) => ({
      ...prev,
      [sectionId]: values,
    }));
  };

  // Manejar carga de archivos (múltiples)
  const handleFileChange = (
    fieldName: string,
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    const files = event.target.files;
    if (!files || files.length === 0) return;

    const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
    const validExtensions = ['.jpg', '.jpeg', '.png', '.webp'];
    const newFiles: File[] = [];
    const newPreviewUrls: string[] = [];

    // Validar cada archivo
    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      const fileExtension = file.name
        .toLowerCase()
        .slice(file.name.lastIndexOf('.'));

      if (
        validTypes.includes(file.type) ||
        validExtensions.includes(fileExtension)
      ) {
        newFiles.push(file);
        newPreviewUrls.push(URL.createObjectURL(file));
      } else {
        setToastMessage({
          message: `${file.name}: ${t('detail_technical_life_sheet.type_allowed')}`,
          type: 'error',
        });
      }
    }

    if (newFiles.length > 0) {
      setFileValues((prev) => ({
        ...prev,
        [fieldName]: [...(prev[fieldName] || []), ...newFiles],
      }));

      setFilePreviewUrls((prev) => ({
        ...prev,
        [fieldName]: [...(prev[fieldName] || []), ...newPreviewUrls],
      }));

      // Limpiar el input para permitir seleccionar los mismos archivos de nuevo
      if (fileInputRefs.current[fieldName]) {
        fileInputRefs.current[fieldName]!.value = '';
      }
    }
  };

  const handleRemoveFile = (fieldName: string, fileIndex: number) => {
    // Liberar la URL de previsualización para evitar memory leaks
    const urlToRevoke = filePreviewUrls[fieldName]?.[fileIndex];
    if (urlToRevoke) {
      URL.revokeObjectURL(urlToRevoke);
    }

    setFileValues((prev) => {
      const currentFiles = prev[fieldName] || [];
      const newFiles = currentFiles.filter((_, index) => index !== fileIndex);
      return {
        ...prev,
        [fieldName]: newFiles,
      };
    });

    setFilePreviewUrls((prev) => {
      const currentUrls = prev[fieldName] || [];
      const newUrls = currentUrls.filter((_, index) => index !== fileIndex);
      return {
        ...prev,
        [fieldName]: newUrls,
      };
    });
  };

  const handleRemoveExistingFile = (fieldName: string, fileIndex: number) => {
    setExistingFileUrls((prev) => {
      const currentUrls = prev[fieldName] || [];
      const newUrls = currentUrls.filter((_, index) => index !== fileIndex);
      return {
        ...prev,
        [fieldName]: newUrls,
      };
    });
  };

  const handleUploadClick = (fieldName: string) => {
    fileInputRefs.current[fieldName]?.click();
  };

  // Validar campos obligatorios (excluyendo section_id === "0")
  const validateMandatoryFields = (): {
    isValid: boolean;
    missingFields: string[];
  } => {
    const missingFields: string[] = [];

    technicalLifeDetails.forEach((section) => {
      // Saltar validación para section_id === "0"
      if (section.section_id === '0') return;

      section.fields.forEach((field) => {
        // Solo validar si el campo debe mostrarse
        if (field.mandatory && shouldShowField(field)) {
          if (field.type === ETypesHv.FILE) {
            // Validar archivos (al menos uno entre nuevos y existentes)
            const newFiles = fileValues[field.field_name] || [];
            const existingFiles = existingFileUrls[field.field_name] || [];
            const totalFiles = newFiles.length + existingFiles.length;
            if (totalFiles === 0) {
              missingFields.push(field.title);
            }
          } else if (
            field.type === ETypesHv.GROUP_FIELDS ||
            field.type === ETypesHv.GROUP_FIELDS_STATIC
          ) {
            // Validar campos de tablas
            field.groups?.forEach((group) => {
              group.fields.forEach((groupField) => {
                if (groupField.mandatory) {
                  const key = groupField.field_name;
                  const value = tableValues[section.section_id]?.[key];
                  if (!value || value.trim() === '') {
                    missingFields.push(`${field.title} - ${groupField.title}`);
                  }
                }
              });
            });
          } else {
            // Validar campos normales
            const value = formValues[section.section_id]?.[field.field_name];

            // Si es un array (DROPDOWN_MULTIPLE), verificar que tenga elementos
            if (Array.isArray(value)) {
              if (value.length === 0) {
                missingFields.push(field.title);
              }
            } else {
              // Si es string, verificar que no esté vacío
              if (
                !value ||
                (typeof value === 'string' && value.trim() === '')
              ) {
                missingFields.push(field.title);
              }
            }
          }
        }
      });
    });

    return { isValid: missingFields.length === 0, missingFields };
  };

  const uploadFiles = async (): Promise<{
    [fieldName: string]: string[];
  }> => {
    const uploadedUrls: { [fieldName: string]: string[] } = {};

    // Por cada campo con archivos
    for (const fieldName in fileValues) {
      const files = fileValues[fieldName];
      if (!files || files.length === 0) continue;

      uploadedUrls[fieldName] = [];

      // Subir cada archivo
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        const timestamp = Date.now();
        const fileName = `${contract_id}_${fieldName}_${timestamp}_${i}`;

        try {
          // Comprimir la imagen antes de subir usando el hook
          const compressionResult = await compressImage(file, {
            maxSizeMB: 0.5,
            maxWidthOrHeight: 1920,
            initialQuality: 0.8,
            fileType: 'image/jpeg',
          });

          const url = await uploadS3VisitActMutation.mutateAsync({
            file: compressionResult.compressedFile,
            fileName,
          });
          uploadedUrls[fieldName].push(url);
        } catch (error) {
          console.error(`Error uploading file ${file.name}:`, error);
          throw new Error(`Error al subir el archivo ${file.name}`);
        }
      }
    }

    return uploadedUrls;
  };

  const createTechnicalLifeSheet = async () => {
    // Validar campos obligatorios
    const validation = validateMandatoryFields();
    if (!validation.isValid) {
      setShowErrors(true);
      setToastMessage({
        message: `Campos obligatorios faltantes: ${validation.missingFields.join(', ')}`,
        type: 'error',
      });
      return;
    }

    // Subir archivos primero
    let uploadedUrls: { [fieldName: string]: string[] } = {};
    try {
      if (Object.keys(fileValues).length > 0) {
        uploadedUrls = await uploadFiles();
      }
    } catch (error) {
      setToastMessage({
        message:
          error instanceof Error
            ? error.message
            : 'Error al subir los archivos',
        type: 'error',
      });
      return;
    }

    const allFields: IFieldPostHv[] = [];

    // Crear un mapa de campos editables para fácil acceso
    const editableFieldsMap: { [fieldName: string]: boolean } = {};
    technicalLifeDetails.forEach((section) => {
      section.fields.forEach((field) => {
        if (
          field.type === ETypesHv.GROUP_FIELDS ||
          field.type === ETypesHv.GROUP_FIELDS_STATIC
        ) {
          // Para tablas, mapear cada campo interno
          field.groups?.forEach((group) => {
            group.fields.forEach((groupField) => {
              editableFieldsMap[groupField.field_name] = groupField.editable;
            });
          });
        } else if (field.type === ETypesHv.FILE) {
          // Para archivos, siempre son editables si se pueden subir
          editableFieldsMap[field.field_name] = field.editable;
        } else {
          editableFieldsMap[field.field_name] = field.editable;
        }
      });
    });

    // Recopilar todos los valores de formValues (campos normales), excluyendo section_id === "0"
    Object.keys(formValues).forEach((sectionId) => {
      if (sectionId === '0') return; // Saltar section_id === "0"

      Object.keys(formValues[sectionId]).forEach((fieldName) => {
        const value = formValues[sectionId][fieldName];

        // Verificar si es editable
        if (!editableFieldsMap[fieldName]) return;

        // Si es un array (DROPDOWN_MULTIPLE)
        if (Array.isArray(value)) {
          if (value.length > 0) {
            allFields.push({
              field_name: fieldName,
              values: value.map((v) => v.toString()),
            });
          } else {
            // Si el array está vacío, enviar null
            allFields.push({
              field_name: fieldName,
              values: [null],
            });
          }
        } else {
          // Si es un string (otros tipos de campos)
          if (value && value.toString().trim() !== '') {
            allFields.push({
              field_name: fieldName,
              values: [value.toString()],
            });
          } else {
            // Si el valor está vacío, enviar null
            allFields.push({
              field_name: fieldName,
              values: [null],
            });
          }
        }
      });
    });

    // Recopilar todos los valores de tableValues (tablas), excluyendo section_id === "0"
    Object.keys(tableValues).forEach((sectionId) => {
      if (sectionId === '0') return; // Saltar section_id === "0"
      Object.keys(tableValues[sectionId]).forEach((fieldKey) => {
        const value = tableValues[sectionId][fieldKey];

        // Verificar si es editable
        if (!editableFieldsMap[fieldKey]) return;

        // Si tiene valor, agregarlo; si está vacío, enviar null
        if (value && value.trim() !== '') {
          allFields.push({
            field_name: fieldKey,
            values: [value],
          });
        } else {
          // Si el valor está vacío, enviar null
          allFields.push({
            field_name: fieldKey,
            values: [null],
          });
        }
      });
    });

    // Agregar URLs de archivos (nuevos y existentes)
    const allFileFieldNames = new Set([
      ...Object.keys(uploadedUrls),
      ...Object.keys(existingFileUrls),
    ]);

    allFileFieldNames.forEach((fieldName) => {
      const newUrls = uploadedUrls[fieldName] || [];
      const existingUrls = existingFileUrls[fieldName] || [];
      const allUrls = [...existingUrls, ...newUrls];

      if (allUrls.length > 0 && editableFieldsMap[fieldName]) {
        allFields.push({
          field_name: fieldName,
          values: allUrls,
        });
      }
    });

    // Preparar el request
    const request: IPostTechnicalLifeDetailsRequest = {
      contract_id: contract_id || '',
      data: {
        values: allFields,
      },
    };

    // Enviar al backend
    postTechnicalLifeDetailsMutation.mutate(request, {
      onSuccess: () => {
        setToastMessage({
          message: t(
            'detail_technical_life_sheet.save_technical_life_sheet_success'
          ),
          type: 'success',
        });
        setTimeout(() => {
          router.push(`/admin-regulatory/technical-life-sheet`);
        }, 1000);
      },
      onError: () => {
        setToastMessage({
          message: t(
            'detail_technical_life_sheet.save_technical_life_sheet_error'
          ),
          type: 'error',
        });
      },
    });
  };

  // Preparar datos para enviar al backend
  const handleSubmit = () => {
    setIsModalOpen(true);
  };

  const handleConfirmEdit = () => {
    setIsModalOpen(false);
    createTechnicalLifeSheet();
  };

  // Verificar si un campo tiene error de pattern
  const hasPatternError = (sectionId: string, fieldName: string): boolean => {
    return patternErrors[`${sectionId}_${fieldName}`] || false;
  };

  // Obtener mensaje de error para un campo
  const getFieldErrorMessage = (
    sectionId: string,
    fieldName: string,
    isMandatory: boolean
  ): string | undefined => {
    // Primero verificar error de pattern
    if (hasPatternError(sectionId, fieldName)) {
      return t('error_format_invalid');
    }

    // Luego verificar si está vacío y es obligatorio
    if (showErrors && isMandatory && sectionId !== '0') {
      const value = formValues[sectionId]?.[fieldName];

      // Si es un array (DROPDOWN_MULTIPLE), verificar que tenga elementos
      if (Array.isArray(value)) {
        if (value.length === 0) {
          return t('field_required');
        }
      } else {
        // Si es string, verificar que no esté vacío
        if (!value || (typeof value === 'string' && value.trim() === '')) {
          return t('field_required');
        }
      }
    }

    return undefined;
  };

  // Verificar si un campo tiene error (excluyendo section_id === "0")
  const hasFieldError = (
    sectionId: string,
    fieldName: string,
    isMandatory: boolean
  ): boolean => {
    return !!getFieldErrorMessage(sectionId, fieldName, isMandatory);
  };

  // Verificar si un campo FILE tiene error
  const hasFileError = (fieldName: string, isMandatory: boolean): boolean => {
    if (!showErrors || !isMandatory) return false;
    const newFiles = fileValues[fieldName] || [];
    const existingFiles = existingFileUrls[fieldName] || [];
    const totalFiles = newFiles.length + existingFiles.length;
    return totalFiles === 0;
  };

  // Obtener el valor de un campo como string (para inputs, dates, etc.)
  const getFieldValueAsString = (
    sectionId: string,
    fieldName: string
  ): string => {
    const value = formValues[sectionId]?.[fieldName];
    if (Array.isArray(value)) {
      return value[0] || '';
    }
    return typeof value === 'string' ? value : value?.[0] || '';
  };

  // Obtener el valor de un campo (puede ser string o string[] para dropdowns)
  const getFieldValue = (
    sectionId: string,
    fieldName: string
  ): string | string[] => {
    const value = formValues[sectionId]?.[fieldName];
    // Si es un array, retornarlo como array (para DROPDOWN_MULTIPLE)
    if (Array.isArray(value)) {
      return value;
    }
    // Si es string, retornarlo como string
    return typeof value === 'string' ? value : value?.[0] || '';
  };

  // Verificar si un campo debe mostrarse basado en su condición
  const shouldShowField = (field: IFieldHv): boolean => {
    // Si no tiene condición, siempre se muestra
    if (!field.condition || field.condition.trim() === '') {
      return true;
    }

    // Si tiene condición, solo se muestra si la condición está activa
    return activeConditions.has(field.condition);
  };

  const renderField = (field: IFieldHv, index: number, sectionId: string) => {
    // No renderizar si no debe mostrarse
    if (!shouldShowField(field)) {
      return null;
    }

    switch (field.type) {
      case ETypesHv.STRING:
        return (
          <BiaInput
            key={`${field.field_name}-${index}`}
            label={field.title}
            placeholder={`Ingrese`}
            type='text'
            value={getFieldValueAsString(sectionId, field.field_name)}
            readonly={!field.editable}
            required={field.mandatory}
            disabled={!field.editable}
            clearable={field.editable}
            helperMessage={field.description_regex || undefined}
            pattern={field.regex || undefined}
            error={hasFieldError(sectionId, field.field_name, field.mandatory)}
            errorMessage={getFieldErrorMessage(
              sectionId,
              field.field_name,
              field.mandatory
            )}
            onIonInput={(e) => {
              const value = e.detail.value || '';
              handleFieldChange(
                sectionId,
                field.field_name,
                value,
                field.regex
              );
            }}
          />
        );
      case ETypesHv.NUMBER:
        return (
          <BiaInput
            key={`${field.field_name}-${index}`}
            label={field.title}
            placeholder={`Ingrese`}
            type='number'
            value={getFieldValueAsString(sectionId, field.field_name)}
            readonly={!field.editable}
            required={field.mandatory}
            disabled={!field.editable}
            clearable={field.editable}
            pattern={field.regex || undefined}
            helperMessage={field.description_regex || undefined}
            error={hasFieldError(sectionId, field.field_name, field.mandatory)}
            errorMessage={getFieldErrorMessage(
              sectionId,
              field.field_name,
              field.mandatory
            )}
            onIonInput={(e) => {
              let value = e.detail.value || '';
              // Validar que no exceda el máximo permitido (2147483647)
              const numValue = Number(value);
              if (value && !isNaN(numValue) && numValue > 2147483647) {
                value = '2147483647';
              }
              handleFieldChange(
                sectionId,
                field.field_name,
                value,
                field.regex
              );
            }}
          />
        );
      case ETypesHv.INTEGER:
        return (
          <BiaInput
            key={`${field.field_name}-${index}`}
            label={field.title}
            placeholder={`Ingrese un número entero`}
            type='number'
            value={getFieldValueAsString(sectionId, field.field_name)}
            readonly={!field.editable}
            required={field.mandatory}
            disabled={!field.editable}
            clearable={field.editable}
            pattern={field.regex || '^-?\\d+$'}
            helperMessage={
              field.description_regex || 'Solo números enteros permitidos'
            }
            error={hasFieldError(sectionId, field.field_name, field.mandatory)}
            errorMessage={getFieldErrorMessage(
              sectionId,
              field.field_name,
              field.mandatory
            )}
            onIonInput={(e) => {
              let value = e.detail.value || '';
              // Remover todo excepto números y signo negativo
              value = value.replace(/[^0-9-]/g, '');
              // Asegurar que el signo negativo solo esté al inicio
              if (value.indexOf('-') > 0) {
                value = value.replace(/-/g, '');
              }
              // Validar que no exceda el máximo permitido (2147483647)
              const numValue = Number(value);
              if (value && !isNaN(numValue) && numValue > 2147483647) {
                value = '2147483647';
              }
              handleFieldChange(
                sectionId,
                field.field_name,
                value,
                field.regex || '^-?\\d+$'
              );
            }}
          />
        );
      case ETypesHv.FLOAT:
        return (
          <BiaInput
            key={`${field.field_name}-${index}`}
            label={field.title}
            placeholder={`Ingrese un número decimal`}
            type='text'
            value={getFieldValueAsString(sectionId, field.field_name)}
            readonly={!field.editable}
            required={field.mandatory}
            disabled={!field.editable}
            clearable={field.editable}
            pattern={field.regex || '^-?\\d+(\\.\\d{1,8})?$'}
            helperMessage={
              field.description_regex ||
              'Máximo 8 decimales separados por punto'
            }
            error={hasFieldError(sectionId, field.field_name, field.mandatory)}
            errorMessage={getFieldErrorMessage(
              sectionId,
              field.field_name,
              field.mandatory
            )}
            onIonInput={(e) => {
              let value = e.detail.value || '';
              // Remover todo excepto números, punto y signo negativo
              value = value.replace(/[^0-9.-]/g, '');
              // Asegurar que solo haya un punto
              const parts = value.split('.');
              if (parts.length > 2) {
                value = parts[0] + '.' + parts.slice(1).join('');
              }
              // Asegurar que el signo negativo solo esté al inicio
              if (value.indexOf('-') > 0) {
                value = value.replace(/-/g, '');
              }
              // Limitar a 7 decimales
              if (parts.length === 2 && parts[1].length > 7) {
                value = parts[0] + '.' + parts[1].substring(0, 8);
              }
              handleFieldChange(
                sectionId,
                field.field_name,
                value,
                field.regex || '^-?\\d+(\\.\\d{1,8})?$'
              );
            }}
          />
        );
      case ETypesHv.DATE:
        return (
          <div key={`${field.field_name}-${index}`}>
            <BiaDatePickerSimple
              label={field.title}
              required={field.mandatory}
              value={getFieldValueAsString(sectionId, field.field_name)}
              disabled={!field.editable}
              onDateChange={(date) => {
                handleFieldChange(sectionId, field.field_name, date);
              }}
            />
            {hasFieldError(sectionId, field.field_name, field.mandatory) && (
              <BiaText
                token='caption'
                color='error'
                className={styles.errorText}
              >
                {t('field_required')}
              </BiaText>
            )}
          </div>
        );
      case ETypesHv.TIME: {
        // Parsear fecha y hora del valor (formato: "YYYY-MM-DD HH:mm" o "YYYY-MM-DDTHH:mm")
        const fieldValue = getFieldValueAsString(sectionId, field.field_name);
        const parseDateTime = (val: string) => {
          if (!val) return { date: '', time: '' };

          // Reemplazar 'T' con espacio para normalizar
          const normalized = val.replace('T', ' ');
          const parts = normalized.split(' ');

          if (parts.length >= 2) {
            return { date: parts[0], time: parts[1] };
          } else if (parts.length === 1) {
            // Si solo hay fecha o solo hora
            if (parts[0].includes(':')) {
              return { date: '', time: parts[0] };
            } else {
              return { date: parts[0], time: '' };
            }
          }
          return { date: '', time: '' };
        };

        const { date: dateValue, time: timeValue } = parseDateTime(fieldValue);

        // Combinar fecha y hora para el valor final
        const combineDateTime = (date: string, time: string): string => {
          if (!date && !time) return '';
          if (!date) return time;
          if (!time) return date;
          return `${date} ${time}`;
        };

        // Formatear el valor de tiempo a HH:mm
        const formatTimeValue = (val: string): string | undefined => {
          if (!val) return undefined;

          // Si ya está en formato HH:mm, retornarlo directamente
          if (/^\d{2}:\d{2}$/.test(val)) {
            return val;
          }

          // Si está en formato ISO o tiene más partes, extraer HH:mm
          const timeMatch = val.match(/(\d{2}):(\d{2})/);
          if (timeMatch) {
            return `${timeMatch[1]}:${timeMatch[2]}`;
          }

          // Si no se puede parsear, retornar undefined
          return undefined;
        };

        return (
          <div key={`${field.field_name}-${index}`}>
            <BiaDatePickerSimple
              label={field.title}
              required={field.mandatory}
              value={dateValue}
              disabled={!field.editable}
              onDateChange={(date) => {
                // Si la fecha está vacía, también limpiar la hora
                if (!date || date.trim() === '') {
                  handleFieldChange(sectionId, field.field_name, '');
                  return;
                }
                // Si hay fecha pero no hay hora, establecer la hora actual
                if (!timeValue || timeValue.trim() === '') {
                  const now = new Date();
                  const currentTime = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
                  const combined = combineDateTime(date, currentTime);
                  handleFieldChange(
                    sectionId,
                    field.field_name,
                    convertToIsoFormat(combined) || ''
                  );
                  return;
                }
                const combined = combineDateTime(date, timeValue);
                handleFieldChange(
                  sectionId,
                  field.field_name,
                  convertToIsoFormat(combined) || ''
                );
              }}
            />
            <BiaTimerPicker
              value={formatTimeValue(timeValue)}
              disabled={!field.editable}
              hasDate={!!dateValue && dateValue.trim() !== ''}
              onTimeChange={(time) => {
                // Si la hora es null o está vacía, establecer "00:00" automáticamente
                if (!time || time.trim() === '') {
                  if (dateValue && dateValue.trim() !== '') {
                    const combined = combineDateTime(dateValue, '00:00');
                    handleFieldChange(
                      sectionId,
                      field.field_name,
                      convertToIsoFormat(combined) || ''
                    );
                  } else {
                    handleFieldChange(sectionId, field.field_name, '');
                  }
                  return;
                }
                const combined = combineDateTime(dateValue, time);
                handleFieldChange(
                  sectionId,
                  field.field_name,
                  convertToIsoFormat(combined) || ''
                );
              }}
            />
            {hasFieldError(sectionId, field.field_name, field.mandatory) && (
              <BiaText
                token='caption'
                color='error'
                className={styles.errorText}
              >
                {t('field_required')}
              </BiaText>
            )}
          </div>
        );
      }
      case ETypesHv.TEXT_AREA:
        return (
          <BiaTextArea
            key={`${field.field_name}-${index}`}
            label={field.title}
            placeholder='Ingrese'
            value={getFieldValueAsString(sectionId, field.field_name)}
            readonly={!field.editable}
            required={field.mandatory}
            disabled={!field.editable}
            rows={4}
            error={hasFieldError(sectionId, field.field_name, field.mandatory)}
            errorMessage={getFieldErrorMessage(
              sectionId,
              field.field_name,
              field.mandatory
            )}
            onIonInput={(e) => {
              const value = e.detail.value || '';
              handleFieldChange(
                sectionId,
                field.field_name,
                value,
                field.regex
              );
            }}
          />
        );
      case ETypesHv.DROPDOWN_ONE:
        return (
          <div key={`${field.field_name}-${index}`}>
            <BiaDropdown
              label={field.title}
              widthInput='100%'
              placeholder={`Seleccione`}
              options={
                field.items?.map((item) => ({
                  label: item.option,
                  value: normalizeForDisplay(item.option),
                })) || []
              }
              multiple={false}
              required={field.mandatory}
              value={getFieldValue(sectionId, field.field_name)}
              onChange={(value) => {
                handleFieldChange(sectionId, field.field_name, value as string);
              }}
            />
            {hasFieldError(sectionId, field.field_name, field.mandatory) && (
              <BiaText
                token='caption'
                color='error'
                className={styles.errorText}
              >
                {t('field_required')}
              </BiaText>
            )}
          </div>
        );
      case ETypesHv.DROPDOWN_MULTIPLE:
        return (
          <div key={`${field.field_name}-${index}`}>
            <BiaDropdown
              label={field.title}
              widthInput='100%'
              placeholder={`Seleccione`}
              options={
                field.items?.map((item) => ({
                  label: item.option,
                  value: normalizeForDisplay(item.option),
                })) || []
              }
              multiple={true}
              required={field.mandatory}
              value={getFieldValue(sectionId, field.field_name)}
              onChange={(value) => {
                handleFieldChange(sectionId, field.field_name, value);
              }}
            />
            {hasFieldError(sectionId, field.field_name, field.mandatory) && (
              <BiaText
                token='caption'
                color='error'
                className={styles.errorText}
              >
                {t('field_required')}
              </BiaText>
            )}
          </div>
        );
      case ETypesHv.FILE: {
        const uploadedFiles = fileValues[field.field_name] || [];
        const existingFiles = existingFileUrls[field.field_name] || [];
        const totalFiles = existingFiles.length + uploadedFiles.length;

        return (
          <div
            key={`${field.field_name}-${index}`}
            className={styles.fileFieldContainer}
          >
            <BiaText
              token='caption'
              color='weak'
              className={styles.fileLabel}
            >
              {field.title}
              {field.mandatory && (
                <span style={{ color: 'var(--ink-error)' }}> *</span>
              )}
            </BiaText>
            <BiaText
              token='label'
              color='weak'
              className={styles.messageTypeAllowed}
            >
              {t('detail_technical_life_sheet.type_allowed')}
            </BiaText>

            <input
              ref={(el) => (fileInputRefs.current[field.field_name] = el)}
              type='file'
              accept='image/jpeg,image/jpg,image/png,image/webp,.jpg,.jpeg,.png,.webp'
              onChange={(e) => handleFileChange(field.field_name, e)}
              className={styles.hiddenFileInput}
              disabled={!field.editable}
              multiple
            />

            {/* Botón para agregar imágenes */}
            <button
              type='button'
              onClick={() => handleUploadClick(field.field_name)}
              disabled={!field.editable}
              className={styles.uploadButton}
            >
              <BiaIcon
                iconName='faImage'
                iconType='solid'
                size='16px'
                color='strong'
              />
              <span>
                {totalFiles > 0
                  ? t('detail_technical_life_sheet.add_more_files')
                  : t('detail_technical_life_sheet.select_file')}
              </span>
            </button>

            {/* Previsualización de imágenes existentes */}
            {existingFiles.length > 0 && (
              <div className={styles.filePreviewContainer}>
                {existingFiles.map((url, fileIndex) => (
                  <div
                    key={`existing-${field.field_name}-${fileIndex}`}
                    className={styles.imagePreview}
                  >
                    <img
                      src={url}
                      alt={`Imagen ${fileIndex + 1}`}
                      className={styles.previewImage}
                    />
                    {field.editable && (
                      <button
                        type='button'
                        onClick={() =>
                          handleRemoveExistingFile(field.field_name, fileIndex)
                        }
                        className={styles.removeFileButton}
                      >
                        <BiaIcon
                          iconName='faTrash'
                          iconType='solid'
                          size='14px'
                          color='error'
                        />
                      </button>
                    )}
                  </div>
                ))}
              </div>
            )}

            {/* Previsualización de las imágenes nuevas */}
            {uploadedFiles.length > 0 && (
              <div className={styles.filePreviewContainer}>
                {uploadedFiles.map((file, fileIndex) => (
                  <div
                    key={`new-${field.field_name}-${fileIndex}`}
                    className={styles.imagePreview}
                  >
                    <img
                      src={filePreviewUrls[field.field_name]?.[fileIndex]}
                      alt={file.name}
                      className={styles.previewImage}
                    />
                    {field.editable && (
                      <button
                        type='button'
                        onClick={() =>
                          handleRemoveFile(field.field_name, fileIndex)
                        }
                        className={styles.removeFileButton}
                      >
                        <BiaIcon
                          iconName='faTrash'
                          iconType='solid'
                          size='14px'
                          color='error'
                        />
                      </button>
                    )}
                  </div>
                ))}
              </div>
            )}

            {hasFileError(field.field_name, field.mandatory) && (
              <BiaText
                token='caption'
                color='error'
                className={styles.errorText}
              >
                Campo obligatorio
              </BiaText>
            )}
          </div>
        );
      }
      case ETypesHv.GROUP_FIELDS:
        return (
          <div
            key={`${field.field_name}-${index}`}
            className={styles.tableFieldContainer}
          >
            <BiaText
              color='weak'
              token='caption'
              className={styles.tableTitle}
            >
              {field.title}
            </BiaText>
            <TableDinamicHv
              groups={field.groups}
              sectionId={sectionId}
              tableFormData={tableValues[sectionId] || {}}
              onTableValuesChange={(values) =>
                handleTableValuesChange(sectionId, values)
              }
              emptyMessage='No hay datos disponibles'
            />
          </div>
        );
      case ETypesHv.GROUP_FIELDS_STATIC:
        return (
          <div
            key={`${field.field_name}-${index}`}
            className={styles.tableFieldContainer}
          >
            <BiaText
              token='bodySemibold'
              color='standardOn'
              className={styles.tableTitle}
            >
              {field.title}
            </BiaText>
            <TableStaticHv
              groups={field.groups}
              sectionId={sectionId}
              tableFormData={tableValues[sectionId] || {}}
              onTableValuesChange={(values) =>
                handleTableValuesChange(sectionId, values)
              }
              emptyMessage='No hay datos disponibles'
            />
          </div>
        );
      case ETypesHv.LABEL:
        return (
          <div
            key={`${field.field_name}-${index}`}
            className={styles.fieldContainer + ' ' + styles.labelContainer}
          >
            <BiaText
              token='bodyRegular'
              color='standardOn'
              className={styles.labelText}
            >
              {field.title}
            </BiaText>
          </div>
        );
      default:
        return (
          <div
            key={`${field.field_name}-${index}`}
            className={styles.fieldContainer}
          >
            <BiaText
              token='bodyRegular'
              color='standardOn'
            >
              {field.title} - Tipo desconocido
            </BiaText>
          </div>
        );
    }
  };

  useEffect(() => {
    if (contract_id) {
      getTechnicalLifeDetailsMutation.mutate(
        { contract_id: contract_id },
        {
          onSuccess: (data) => {
            setTechnicalLifeDetails(data);
            initializeFormValues(data);
          },
          onError: () => {
            setToastMessage({
              message: t('error_get_detail_pdf'),
              type: 'error',
            });
            setTechnicalLifeDetails([]);
          },
        }
      );
    }
  }, [contract_id]);

  // Limpiar URLs de previsualización cuando el componente se desmonte
  useEffect(() => {
    return () => {
      Object.values(filePreviewUrls).forEach((urls) => {
        if (urls && Array.isArray(urls)) {
          urls.forEach((url) => {
            if (url) {
              URL.revokeObjectURL(url);
            }
          });
        }
      });
    };
  }, [filePreviewUrls]);

  return (
    <div className={styles.detailContainer}>
      <BiaBreadcrumb items={breadcrumbItems} />
      {toastMessage && (
        <BiaToast
          message={toastMessage.message}
          theme={toastMessage.type}
          onClose={() => setToastMessage(null)}
        />
      )}
      {(getTechnicalLifeDetailsMutation.isPending ||
        postTechnicalLifeDetailsMutation.isPending ||
        uploadS3VisitActMutation.isPending) && <BiaLoader color='accent' />}

      <ModalConfirmEdit
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onConfirm={handleConfirmEdit}
      />

      <div className={styles.contentContainer}>
        <BiaAccordionGroup
          className={styles.accordionGroup}
          expand='inset'
          multiple={true}
        >
          {technicalLifeDetails.map((section, sectionIndex) => (
            <BiaAccordion
              key={`${section.section_id}-${sectionIndex}`}
              value={`${section.section_id}-${sectionIndex}`}
            >
              <IonItem
                slot='header'
                color='light'
                className={styles.accordionHeader}
              >
                <IonLabel>{section.name}</IonLabel>
              </IonItem>
              <div
                className={styles.fieldsContainer}
                slot='content'
              >
                {section.fields.map((field, index) =>
                  renderField(field, index, section.section_id)
                )}
              </div>
            </BiaAccordion>
          ))}
        </BiaAccordionGroup>

        {/* Botón de submit */}
        {technicalLifeDetails.length > 0 && (
          <div className={styles.submitContainer}>
            <button
              type='button'
              onClick={handleSubmit}
              className={styles.submitButton}
              disabled={postTechnicalLifeDetailsMutation.isPending}
            >
              <BiaIcon
                iconName='faSave'
                iconType='solid'
                size='16px'
                color='inverse'
              />
              {t('detail_technical_life_sheet.save_technical_life_sheet')}
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
