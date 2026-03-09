import { DataBaseTables } from '@shared/data/IDatabase';
import { db } from '@shared/db/dbVisits';
import { Dexie, IndexableType, Table } from 'dexie';

export const checkDatabaseExists = async (dbName: string): Promise<boolean> => {
  try {
    // Intentamos abrir la base de datos
    const db = new Dexie(dbName);
    await db.open();

    // Verificamos si podemos acceder a las tablas
    const tables = await db.tables;
    return tables.length > 0; // Retorna true si hay tablas definidas
  } catch (error) {
    console.error(
      'Error al verificar la existencia de la base de datos:',
      error
    );
    return false;
  } finally {
    // Cerramos la conexión
    await db.close();
  }
};

/**
 * Crea una nueva base de datos con el nombre especificado
 * @param dbName Nombre de la base de datos a crear
 * @returns Promise<boolean> - true si la base de datos se creó correctamente
 */
export const createDatabase = async (dbName: string): Promise<boolean> => {
  let db: Dexie | null = null;
  try {
    // Crear una nueva instancia de Dexie con el nombre proporcionado
    db = new Dexie(dbName);

    // Definir la versión inicial de la base de datos
    db.version(1).stores(
      Object.fromEntries(
        DataBaseTables.map((table) => [
          table.name,
          table.columns.map((column) => column.name).join(','),
        ])
      )
    );

    // Abrir la base de datos
    await db.open();

    return true;
  } catch (error) {
    console.error('Error al crear la base de datos:', error);
    return false;
  } finally {
    // Garantizar cierre de conexión
    if (db) {
      await db.close();
    }
  }
};

/**
 * Elimina una base de datos por su nombre
 * @param dbName Nombre de la base de datos a eliminar
 * @returns Promise<boolean> - true si la base de datos se eliminó correctamente
 */
export const deleteDatabase = async (dbName: string): Promise<boolean> => {
  let db: Dexie | null = null;
  try {
    // Crear una instancia temporal de la base de datos
    db = new Dexie(dbName);

    // Cerrar todas las conexiones existentes
    await db.close();

    // Eliminar la base de datos
    await Dexie.delete(dbName);

    return true;
  } catch (error) {
    console.error('Error al eliminar la base de datos:', error);
    return false;
  } finally {
    // Garantizar cierre de conexión si aún está abierta
    if (db && db.isOpen()) {
      await db.close();
    }
  }
};

/**
 * Elimina todas las bases de datos de una lista
 * @param dbNames Lista de nombres de bases de datos a eliminar
 * @returns Promise<boolean[]> - Array de resultados para cada base de datos
 */
export const deleteMultipleDatabases = async (
  dbNames: string[]
): Promise<boolean[]> => {
  try {
    const results = await Promise.all(
      dbNames.map((dbName) => deleteDatabase(dbName))
    );
    return results;
  } catch (error) {
    console.error('Error al eliminar múltiples bases de datos:', error);
    return dbNames.map(() => false);
  }
};

/**
 * Obtiene todos los registros de una tabla específica
 * @param dbName Nombre de la base de datos
 * @param tableName Nombre de la tabla
 * @returns Promise con los registros de la tabla
 */
export const getTableData = async <T>(
  dbName: string,
  tableName: string
): Promise<T[]> => {
  let db: Dexie | null = null;
  try {
    db = new Dexie(dbName);
    await db.open();
    const data = await db.table(tableName).toArray();
    return data as T[];
  } catch (error) {
    console.error(`Error al obtener datos de la tabla ${tableName}:`, error);
    return [];
  } finally {
    if (db && db.isOpen()) {
      await db.close();
    }
  }
};

/**
 * Inserta o actualiza un registro en una tabla específica (upsert)
 * Usa internamente Dexie.put() que inserta si no existe o actualiza si ya existe
 * Recomendado para operaciones donde se desea garantizar que los datos se guarden/actualicen
 * @param dbName Nombre de la base de datos
 * @param tableName Nombre de la tabla
 * @param data Datos a insertar o actualizar
 * @returns Promise con el ID del registro insertado/actualizado
 */
export const upsertTableData = async <T>(
  dbName: string,
  tableName: string,
  data: T
): Promise<IndexableType | undefined> => {
  let db: Dexie | null = null;
  try {
    db = new Dexie(dbName);
    await db.open();
    const id = await db.table(tableName).put(data);
    return id;
  } catch (error) {
    console.error(`Error al hacer upsert en la tabla ${tableName}:`, error);
    return undefined;
  } finally {
    if (db && db.isOpen()) {
      await db.close();
    }
  }
};

/**
 * Actualiza un registro en una tabla específica
 * @param dbName Nombre de la base de datos
 * @param tableName Nombre de la tabla
 * @param id ID del registro a actualizar
 * @param data Nuevos datos
 * @returns Promise con el número de registros actualizados
 */
export const updateTableData = async <T>(
  dbName: string,
  tableName: string,
  id: IndexableType,
  data: Partial<T>
): Promise<number> => {
  let db: Dexie | null = null;
  try {
    db = new Dexie(dbName);
    await db.open();
    const updated = await db.table(tableName).update(id, data);
    return updated;
  } catch (error) {
    console.error(`Error al actualizar datos en la tabla ${tableName}:`, error);
    return 0;
  } finally {
    if (db && db.isOpen()) {
      await db.close();
    }
  }
};

/**
 * Elimina un registro de una tabla específica
 * @param dbName Nombre de la base de datos
 * @param tableName Nombre de la tabla
 * @param id ID del registro a eliminar
 * @returns Promise con el número de registros eliminados
 */
export const deleteTableData = async (
  dbName: string,
  tableName: string,
  id: IndexableType
): Promise<void> => {
  let db: Dexie | null = null;
  try {
    db = new Dexie(dbName);
    await db.open();
    await db.table(tableName).delete(id);
  } catch (error) {
    console.error(`Error al eliminar datos de la tabla ${tableName}:`, error);
  } finally {
    if (db && db.isOpen()) {
      await db.close();
    }
  }
};

/**
 * Elimina todos los registros de una tabla específica
 * @param dbName Nombre de la base de datos
 * @param tableName Nombre de la tabla
 * @returns Promise con el número de registros eliminados
 */
export const clearTableData = async (
  dbName: string,
  tableName: string
): Promise<number> => {
  let db: Dexie | null = null;
  try {
    db = new Dexie(dbName);
    await db.open();
    const count = await db.table(tableName).count();
    await db.table(tableName).clear();
    return count;
  } catch (error) {
    console.error(`Error al limpiar datos de la tabla ${tableName}:`, error);
    return 0;
  } finally {
    if (db && db.isOpen()) {
      await db.close();
    }
  }
};

/**
 * Obtiene datos de una tabla usando un query personalizado
 * @param dbName Nombre de la base de datos
 * @param tableName Nombre de la tabla
 * @param query Función que recibe la tabla y retorna la consulta
 * @returns Promise con los resultados de la consulta
 */
export const getTableDataByQuery = async <T>(
  dbName: string,
  tableName: string,
  query: (table: Table) => Promise<T[]>
): Promise<T[]> => {
  let db: Dexie | null = null;
  try {
    db = new Dexie(dbName);
    await db.open();
    const table = db.table(tableName);
    const results = await query(table);
    return results;
  } catch (error) {
    console.error(`Error al obtener datos de la tabla ${tableName}:`, error);
    return [];
  } finally {
    if (db && db.isOpen()) {
      await db.close();
    }
  }
};

/**
 * Limpia todas las tablas de una base de datos específica
 * @param dbName Nombre de la base de datos
 * @returns Promise con el número total de registros eliminados
 */
export const clearAllTables = async (dbName: string): Promise<number> => {
  let db: Dexie | null = null;
  try {
    db = new Dexie(dbName);
    await db.open();

    let totalDeleted = 0;

    // Limpiar cada tabla
    for (const tableName of db.tables.map((table) => table.name)) {
      const count = await db.table(tableName).count();
      await db.table(tableName).clear();
      totalDeleted += count;
    }

    return totalDeleted;
  } catch (error) {
    console.error('Error al limpiar todas las tablas:', error);
    return 0;
  } finally {
    if (db && db.isOpen()) {
      await db.close();
    }
  }
};

/**
 * Limpia tablas específicas de una base de datos
 * @param dbName Nombre de la base de datos
 * @param tableNames Lista de nombres de tablas a limpiar
 * @returns Promise con el número total de registros eliminados
 */
export const clearSpecificTables = async (
  dbName: string,
  tableNames: string[]
): Promise<number> => {
  let db: Dexie | null = null;
  try {
    db = new Dexie(dbName);
    await db.open();

    let totalDeleted = 0;

    for (const tableName of tableNames) {
      if (db.table(tableName)) {
        const count = await db.table(tableName).count();
        await db.table(tableName).clear();
        totalDeleted += count;
      }
    }

    return totalDeleted;
  } catch (error) {
    console.error('Error al limpiar tablas específicas:', error);
    return 0;
  } finally {
    if (db && db.isOpen()) {
      await db.close();
    }
  }
};

/**
 * GUÍA DE USO DE FUNCIONES DE BASE DE DATOS:
 *
 * upsertTableData() - [RECOMENDADO] Inserta o actualiza registro (comportamiento explícito de upsert)
 * updateTableData() - Actualiza registro existente usando su ID
 * deleteTableData() - Elimina registro específico por ID
 * getTableData() - Obtiene todos los registros de una tabla
 * getTableDataByQuery() - Obtiene registros usando query personalizado
 *
 * CUÁNDO USAR CADA FUNCIÓN:
 * - Usar upsertTableData() cuando no importa si el registro existe o no, se quiere guardar/actualizar
 * - Usar updateTableData() cuando específicamente se quiere actualizar un registro existente
 * - Usar insertTableData() solo para casos legacy (migrar a upsertTableData())
 */
