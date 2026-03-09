import { useEffect, useState } from 'react';
import { IMappedFormsResponse } from '@forms-management/data/interfaces/forms.interface';

export const useFormValidation = (dataForms: IMappedFormsResponse[]) => {
  const [isFormValid, setIsFormValid] = useState<boolean>(false);
  const [showFields, setShowFields] = useState<boolean>(false);

  useEffect(() => {
    let bypassValidation = false;
    if (dataForms.length > 0 && dataForms[0].fields.length > 0) {
      const firstField = dataForms[0].fields[0];
      if (firstField.input_type === 'DROPDOWN') {
        if (firstField.selected_value === 'No') {
          bypassValidation = true;
          setShowFields(false);
        } else if (firstField.selected_value === 'Si') {
          setShowFields(true);
          setIsFormValid(false);
        }
      }
    }

    if (bypassValidation) {
      setIsFormValid(true);
    } else {
      // Filtrar los formularios que no sean de tipo BUILDER o FILE
      const filteredForms = dataForms.filter(
        (form) =>
          form.type !== 'BUILDER' &&
          form.fields.some((field) => field.type !== 'FILE')
      );

      const allRequiredFieldsFilled = filteredForms.every((form) =>
        form.fields.every((field) => {
          if (!field.mandatory) return true; // Campo no obligatorio, válido por defecto

          // Excluir los campos de tipo FILE de la validación
          if (field.type === 'FILE') return true;

          // Validación general para otros tipos de campos
          return (
            field.selected_value !== undefined &&
            field.selected_value !== null &&
            String(field.selected_value).trim() !== ''
          );
        })
      );

      setIsFormValid(allRequiredFieldsFilled);
    }
  }, [dataForms]);

  return { isFormValid, showFields };
};
