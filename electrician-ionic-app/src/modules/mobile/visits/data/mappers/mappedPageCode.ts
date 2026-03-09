import { IFormsMap } from '@mobile/forms-management';
import { IPage } from '@mobile/visit-management';

/**
 * Utilidades para mapear resultados de promesas con sus páginas correspondientes
 *
 * Permite relacionar cada resultado de formulario con su página original, facilitando
 * el procesamiento de datos que requieren tanto la información del formulario como
 * los metadatos de la página (código, nombre, índice, estado de completitud, etc.)
 */

// Interfaz para mapear resultados de promesas con sus páginas correspondientes
export interface IMappedFormResult {
  result: IFormsMap;
  page: IPage;
  promise: Promise<IFormsMap>;
}

// Tipo para array de resultados mapeados
export type MappedFormResults = IMappedFormResult[];

// Función utilitaria para crear mapeos entre resultados y páginas
export const createMappedFormResults = (
  results: IFormsMap[],
  pages: IPage[],
  promises: Promise<IFormsMap>[]
): MappedFormResults => {
  return results.map((result, index) => ({
    result,
    page: pages[index],
    promise: promises[index],
  }));
};

// Función utilitaria para filtrar mapeos por criterios específicos
export const filterMappedFormResults = (
  mappedResults: MappedFormResults,
  filter: (item: IMappedFormResult) => boolean
): MappedFormResults => {
  return mappedResults.filter(filter);
};

// Función utilitaria para obtener mapeos por código de página
export const getMappedResultByPageCode = (
  mappedResults: MappedFormResults,
  pageCode: string
): IMappedFormResult | undefined => {
  return mappedResults.find((item) => item.page.code === pageCode);
};

// Función utilitaria para obtener mapeos completados
export const getCompletedMappedResults = (
  mappedResults: MappedFormResults
): MappedFormResults => {
  return filterMappedFormResults(
    mappedResults,
    (item) => item.page.isComplete || false
  );
};

// Función utilitaria para obtener mapeos pendientes
export const getPendingMappedResults = (
  mappedResults: MappedFormResults
): MappedFormResults => {
  return filterMappedFormResults(
    mappedResults,
    (item) => !(item.page.isComplete || false)
  );
};

// Función utilitaria para obtener mapeos por índice de página
export const getMappedResultsByPageIndex = (
  mappedResults: MappedFormResults,
  pageIndex: number
): MappedFormResults => {
  return filterMappedFormResults(
    mappedResults,
    (item) => item.page.index === pageIndex
  );
};

// Función utilitaria para insertar formularios mapeados en la tabla FORMS
export const insertMappedFormsIntoDatabase = async (
  mappedResults: MappedFormResults,
  type: 'normal' | 'failed',
  activityId: string,
  upsertFunction: (
    dbName: string,
    tableName: string,
    data: unknown | undefined
  ) => Promise<unknown | undefined>,
  dbNames: { database: string; table: string }
) => {
  const insertPromises = mappedResults.map(async (item) => {
    const formsData = {
      visitId_pageCode: `${activityId}__${item.page.code}`,
      type: type,
      data: item.result,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    try {
      const formId = await upsertFunction(
        dbNames.database,
        dbNames.table,
        formsData
      );
      return formId;
    } catch (error) {
      console.error('Error al insertar formulario en la base de datos:', error);
      return null;
    }
  });

  return await Promise.all(insertPromises);
};

// Función utilitaria para insertar ambos tipos de formularios (normal y failed)
export const insertBothMappedFormsTypes = async (
  normalForms: MappedFormResults,
  failedForms: MappedFormResults,
  activityId: string,
  upsertFunction: (
    dbName: string,
    tableName: string,
    data: unknown | undefined
  ) => Promise<unknown | undefined>,
  dbNames: { database: string; table: string }
) => {
  const normalFormsIds = await insertMappedFormsIntoDatabase(
    normalForms,
    'normal',
    activityId,
    upsertFunction,
    dbNames
  );

  const failedFormsIds = await insertMappedFormsIntoDatabase(
    failedForms,
    'failed',
    activityId,
    upsertFunction,
    dbNames
  );

  const results = {
    normal: normalFormsIds.filter((id) => id !== null).length,
    failed: failedFormsIds.filter((id) => id !== null).length,
    totalNormal: normalForms.length,
    totalFailed: failedForms.length,
    normalIds: normalFormsIds,
    failedIds: failedFormsIds,
  };

  return results;
};
