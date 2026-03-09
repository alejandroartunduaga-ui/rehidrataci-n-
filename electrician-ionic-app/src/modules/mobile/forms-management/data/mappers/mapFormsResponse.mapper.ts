import {
  IBuildWidget,
  IFormsByIdResponse,
  IMappedFormsResponse,
} from '../interfaces/forms.interface';

/**
 * Mapper forms
 * @param {Array} data - Array de objetos de la respuesta de la API
 * @returns {Array} - Array de objetos transformados
 */
export const mapFormsResponse = (
  data: IFormsByIdResponse[]
): IMappedFormsResponse[] => {
  return data.map((form) => ({
    code: form.code,
    name: form.name,
    description: form.description,
    type: form.type,
    built_widgets: form.built_widgets.map((widgetGroup) =>
      widgetGroup.map(({ field_code, values, index }) => ({
        field_code,
        index,
        values,
      }))
    ) as [IBuildWidget[]], // Garantiza el tipo esperado
    fields: form.fields.map((field) => {
      return {
        code: field.code,
        name: field.name,
        title: field.title,
        mandatory: field.mandatory,
        input_type: field.input_type,
        type: field.type,
        selected_value: field.selected_value?.[0] || '',
        options: field.options?.options || null,
        option_tags: field.options?.option_tags || [],
        condition: field.condition,
      };
    }),
  }));
};
