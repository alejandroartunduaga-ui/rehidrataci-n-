import { httpClient, useConnectivityStore } from '@shared/index';
import { visitsEndpoints } from '../endpoints/visits.endpoints';
import {
  getTableDataByQuery,
  upsertTableData,
} from '@shared/db/databaseService';
import {
  IDataBaseNames,
  IDataBaseTables,
  ITableVerifyEquipment,
} from '@shared/data/IDatabase';

import {
  IEquipmentCertificate,
  IEquipmentCertificatesResponse,
  IEquipmentCertificatesApiResponse,
  IGetEquipmentCertificatesParams,
  EEquipmentCertificateStatus,
} from '../interfaces/equipmentCertificates.interface';

/**
 * Obtiene los certificados de equipos desde el servidor
 * @param activity_id ID de la actividad
 * @returns Promise con la respuesta del servidor
 */
export const getEquipmentCertificates = async (
  activity_id: string
): Promise<IEquipmentCertificatesResponse> => {
  try {
    const endpoint = { ...visitsEndpoints.equipmentCertificates };
    endpoint.url = endpoint.url.replace('${ACTIVITY_ID}', activity_id);

    const response: IEquipmentCertificatesApiResponse =
      await httpClient.get(endpoint);

    return {
      success: true,
      message: 'Certificados de equipos obtenidos exitosamente',
      data: {
        certificates: response,
      },
    };
  } catch (error) {
    console.error('Error al obtener certificados de equipos:', error);
    return {
      success: false,
      message: 'Error al obtener certificados de equipos',
      data: {
        certificates: [],
      },
    };
  }
};

/**
 * Obtiene los certificados de equipos desde la base de datos local
 * @param activity_id ID de la actividad
 * @returns Promise con respuesta desde BD local
 */
export const getEquipmentCertificatesDB = async (
  activity_id: string
): Promise<IEquipmentCertificatesResponse> => {
  try {
    // Buscar en la tabla VERIFY_EQUIPMENT
    const localData = await getTableDataByQuery(
      IDataBaseNames.OPERACIONES,
      IDataBaseTables.VERIFY_EQUIPMENT,
      (table) => {
        return table.where('visitId').equals(activity_id).toArray();
      }
    );

    if (localData.length > 0) {
      const verifyEquipmentRecord = localData[0] as ITableVerifyEquipment;
      const certificates = verifyEquipmentRecord.verifyEquipment || [];

      return {
        success: true,
        message: 'Certificados obtenidos desde base de datos local',
        data: {
          certificates,
        },
      };
    }

    return {
      success: false,
      message: 'No se encontraron certificados en la base de datos local',
      data: {
        certificates: [],
      },
    };
  } catch (error) {
    console.error('Error al obtener certificados desde DB local:', error);
    return {
      success: false,
      message: 'Error al obtener certificados desde base de datos local',
      data: {
        certificates: [],
      },
    };
  }
};

/**
 * Almacena certificados de equipos en la base de datos local
 * @param activity_id ID de la actividad
 * @param certificates Array de certificados
 * @returns Promise con respuesta de almacenamiento
 */
export const storeEquipmentCertificatesDB = async (
  activity_id: string,
  certificates: IEquipmentCertificate[]
): Promise<IEquipmentCertificatesResponse> => {
  try {
    const now = new Date();

    // Asignar status PENDING por defecto a cada certificado si no tiene status
    const certificatesWithStatus = certificates.map((certificate) => ({
      ...certificate,
      status: certificate.status || EEquipmentCertificateStatus.PENDING,
    }));

    // Crear/actualizar registro en la tabla VERIFY_EQUIPMENT
    const recordToUpsert: ITableVerifyEquipment = {
      visitId: activity_id,
      verifyEquipment: certificatesWithStatus,
      createdAt: now,
      updatedAt: now,
    };

    await upsertTableData(
      IDataBaseNames.OPERACIONES,
      IDataBaseTables.VERIFY_EQUIPMENT,
      recordToUpsert
    );

    return {
      success: true,
      message: 'Certificados almacenados en base de datos local',
      data: {
        certificates: certificatesWithStatus,
      },
    };
  } catch (error) {
    console.error('Error al almacenar certificados en DB local:', error);
    return {
      success: false,
      message: 'Error al almacenar certificados en base de datos local',
      data: {
        certificates: [],
      },
    };
  }
};

/**
 * Obtiene certificados según conectividad (servidor o BD local)
 * Implementa estrategia "cache first": intenta BD local primero, luego servidor
 * @param params Parámetros con activity_id
 * @returns Promise con la respuesta de certificados
 */
export const fetchEquipmentCertificates = async (
  params: IGetEquipmentCertificatesParams
): Promise<IEquipmentCertificatesResponse> => {
  const { activity_id } = params;
  // const activity_id = '31f376c3-92bf-4658-8824-ba5225de06e6';
  const isOnline = useConnectivityStore.getState().isOnline;

  try {
    // Intentar obtener desde BD local primero
    const localResponse = await getEquipmentCertificatesDB(activity_id);

    if (localResponse.success && localResponse.data.certificates.length > 0) {
      return localResponse;
    }

    // Si no hay datos locales y estamos online, obtener del servidor
    if (isOnline) {
      const serverResponse = await getEquipmentCertificates(activity_id);

      // Si la respuesta del servidor es exitosa, almacenar en BD local
      if (
        serverResponse.success &&
        serverResponse.data.certificates.length > 0
      ) {
        await storeEquipmentCertificatesDB(
          activity_id,
          serverResponse.data.certificates
        );
      }

      return serverResponse;
    }

    // Si no estamos online y no hay datos locales
    return {
      success: false,
      message: 'Sin conexión y no hay datos locales disponibles',
      data: {
        certificates: [],
      },
    };
  } catch (error) {
    console.error('Error en fetchEquipmentCertificates:', error);
    return {
      success: false,
      message: 'Error al obtener certificados de equipos',
      data: {
        certificates: [],
      },
    };
  }
};

/**
 * Actualiza el status de un certificado específico en la base de datos local
 * @param activity_id ID de la actividad
 * @param equipment_id ID del equipo a actualizar
 * @param status Nuevo status del equipo
 * @returns Promise con la respuesta de actualización
 */
export const updateEquipmentCertificateStatus = async (
  activity_id: string,
  equipment_id: number,
  status: EEquipmentCertificateStatus
): Promise<IEquipmentCertificatesResponse> => {
  try {
    // Obtener los certificados actuales
    const currentResponse = await getEquipmentCertificatesDB(activity_id);

    if (!currentResponse.success) {
      return {
        success: false,
        message: 'No se encontraron certificados para actualizar',
        data: {
          certificates: [],
        },
      };
    }

    // Actualizar el certificado específico
    const updatedCertificates = currentResponse.data.certificates.map(
      (certificate) => {
        if (certificate.equipment_id === equipment_id) {
          return {
            ...certificate,
            status: status,
          };
        }
        return certificate;
      }
    );

    // Guardar los certificados actualizados
    const storeResponse = await storeEquipmentCertificatesDB(
      activity_id,
      updatedCertificates
    );

    return {
      success: storeResponse.success,
      message: storeResponse.success
        ? `Status del equipo ${equipment_id} actualizado a ${status}`
        : 'Error al actualizar el status del equipo',
      data: {
        certificates: updatedCertificates,
      },
    };
  } catch (error) {
    console.error('Error al actualizar status del certificado:', error);
    return {
      success: false,
      message: 'Error al actualizar status del certificado',
      data: {
        certificates: [],
      },
    };
  }
};
