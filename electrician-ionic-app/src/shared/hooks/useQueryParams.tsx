import { useLocation, useHistory } from 'react-router-dom';
import { useMemo, useState, useEffect } from 'react';
import { ActivityStatus } from '@mobile/visits/data/interfaces/visits.interface';

export const useQueryParams = () => {
  const location = useLocation();
  const history = useHistory();
  const [currentSearch, setCurrentSearch] = useState(window.location.search);

  // 🔄 Sincronizar con cambios en window.location
  useEffect(() => {
    const handleLocationChange = () => {
      setCurrentSearch(window.location.search);
    };

    window.addEventListener('popstate', handleLocationChange);
    // También actualizar cuando cambie la location de React Router
    setCurrentSearch(window.location.search);

    return () => {
      window.removeEventListener('popstate', handleLocationChange);
    };
  }, [location]);

  const queryParams = useMemo(() => {
    // 🛡️ Usar fallback a window.location.search si location.search está undefined
    const searchString = location?.search || currentSearch;

    if (!searchString) {
      return new URLSearchParams();
    }

    return new URLSearchParams(searchString);
  }, [location.search, currentSearch]);

  const getQueryParam = (key: string): string | null => {
    return queryParams.get(key);
  };

  const getAllQueryParams = (): Record<string, string> => {
    const params: Record<string, string> = {};
    queryParams.forEach((value, key) => {
      params[key] = value;
    });
    return params;
  };

  // 🧹 Limpiar todos los query parameters usando React Router
  const cleanQueryParams = () => {
    history.replace({
      pathname: location.pathname,
      search: '', // Eliminar todos los query parameters
    });
  };

  return {
    getQueryParam,
    getAllQueryParams,
    queryParams,
    cleanQueryParams,
  };
};

// 🧹 Función standalone para limpiar query parameters (sin React Router)
export const cleanQueryParams = () => {
  // 🧹 Limpiar todos los query parameters de la URL
  const currentUrl = new URL(window.location.href);

  // Eliminar todos los query parameters
  currentUrl.search = '';

  // Actualizar la URL sin recargar la página
  window.history.replaceState(null, '', currentUrl.toString());
};
// Hook específico para obtener activity_status
export const useActivityStatus = (): ActivityStatus | null => {
  const { getQueryParam } = useQueryParams();
  return getQueryParam('activity_status') as ActivityStatus | null;
};

export const useIsFailedVisit = (): string | null => {
  const { getQueryParam } = useQueryParams();
  return getQueryParam('isFailedVisit');
};
