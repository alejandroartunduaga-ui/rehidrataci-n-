import { IMappedFormsResponse } from '@forms-management/data/interfaces/forms.interface';

export const getFormIndex = (
  form: IMappedFormsResponse,
  dataForms: IMappedFormsResponse[]
): number => {
  return dataForms.findIndex((f) => f.code === form.code);
};
