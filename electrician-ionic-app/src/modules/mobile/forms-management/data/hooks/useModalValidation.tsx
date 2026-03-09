import { useEffect, useState } from 'react';
import { IFormField } from '@forms-management/data/interfaces/forms.interface';

export const useModalValidation = (fields: IFormField[]) => {
  const [isModalValid, setIsModalValid] = useState(false);

  useEffect(() => {
    const allRequiredFieldsFilled = fields.every((field) => {
      if (!field.mandatory) return true; // Campo no obligatorio, válido por defecto
      return (
        field.selected_value !== undefined &&
        field.selected_value !== null &&
        String(field.selected_value).trim() !== ''
      );
    });

    setIsModalValid(allRequiredFieldsFilled);
  }, [fields]);

  return isModalValid;
};
