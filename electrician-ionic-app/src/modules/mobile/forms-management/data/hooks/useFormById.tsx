import { useEffect, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { httpClient, db, useConnectivityStore } from '@shared/index';
import { formsManagementEndpoints } from '../endpoints/forms-management.endpoints';
import {
  IFormsByIdRequest,
  IFormsByIdResponse,
  IFormData,
  IMappedFormsResponse,
} from '../interfaces/forms.interface';
import { mapFormsResponse } from '../mappers/mapFormsResponse.mapper';

export const useFormById = ({
  activity_id,
  page_code,
}: IFormsByIdRequest): {
  formData: IFormData | null;
  isLoading: boolean;
} => {
  const currentIsOnline = useConnectivityStore((state) => state.isOnline);
  const [localFormData, setLocalFormData] = useState<IFormData | null>(null);
  const [isLocalLoading, setIsLocalLoading] = useState<boolean>(true);

  // 1. Intenta cargar datos locales (desde Dexie) primero
  useEffect(() => {
    const fetchLocalData = async () => {
      setIsLocalLoading(true);
      setLocalFormData(null);
      const key = `${activity_id}-${page_code}`;
      try {
        const storedData = await db.formStepVisits.get(key);

        if (storedData && storedData.data) {
          if (
            typeof storedData.data === 'object' &&
            storedData.data !== null &&
            Object.prototype.hasOwnProperty.call(storedData.data, 'dataForms')
          ) {
            setLocalFormData(storedData.data as IFormData);
          } else if (Array.isArray(storedData.data)) {
            const convertedData: IFormData = {
              dataForms: storedData.data as IMappedFormsResponse[],
              addInfo: [],
              photos: [],
            };
            setLocalFormData(convertedData);
          } else {
            console.warn(
              `[useFormById] Data for key ${key} has UNKNOWN structure. Setting localFormData to null.`,
              storedData.data
            );
            setLocalFormData(null);
          }
        } else {
          setLocalFormData(null);
        }
      } catch (error) {
        console.error(
          `[useFormById] Error fetching data from db.formStepVisits for key ${key}:`,
          error
        );
        setLocalFormData(null);
      } finally {
        setIsLocalLoading(false);
      }
    };

    if (activity_id && page_code) {
      fetchLocalData();
    } else {
      setIsLocalLoading(false);
    }
  }, [activity_id, page_code]);

  // 2. Define endpoint y query para datos de la API (si es necesario)
  const endpoint = { ...formsManagementEndpoints.formById };
  endpoint.url = endpoint.url
    .replace('${ACTIVITY_ID}', activity_id)
    .replace('${PAGE_CODE}', page_code);

  // 3. Usa useQuery para buscar datos de la API SÓLO si estamos online
  //    y si NO encontramos datos locales previamente (o si queremos forzar refresh online).
  //    Actualmente, sólo depende de isOnline.
  const { data: apiData, isLoading: isApiLoading } = useQuery<
    IFormsByIdResponse[],
    Error,
    IFormsByIdResponse[],
    readonly [string, string, string]
  >({
    queryKey: ['formById', activity_id, page_code],
    queryFn: () => httpClient.get<IFormsByIdResponse[]>(endpoint),
    enabled: (currentIsOnline ?? false) && !!activity_id && !!page_code,
    staleTime: 1000 * 60 * 5, // Considerar datos frescos por 5 minutos online
  });

  // 4. Mapea los datos de la API si existen y formatea como IFormData
  const formattedApiData: IFormData | null = apiData
    ? {
        dataForms: mapFormsResponse(apiData as IFormsByIdResponse[]),
        addInfo: [],
        photos: [],
      }
    : null;

  // 5. Determina los datos finales y el estado de carga
  //    Prioridad: Datos locales si existen, si no, datos de la API formateados.
  const finalFormData = localFormData ?? formattedApiData;
  const isLoading =
    isLocalLoading || ((currentIsOnline ?? false) && isApiLoading);
  // END OF EDIT

  return { formData: finalFormData, isLoading };
};
