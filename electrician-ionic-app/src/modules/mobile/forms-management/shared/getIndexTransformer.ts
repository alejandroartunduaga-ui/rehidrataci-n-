import { IMappedFormsResponse } from '@forms-management/data/interfaces/forms.interface';

export const getIndexTransformer = (
  index: number,
  dataForms: IMappedFormsResponse[]
) => {
  return dataForms
    .slice(0, index ?? undefined)
    .filter((form) => form.type === 'BUILDER').length;
};
