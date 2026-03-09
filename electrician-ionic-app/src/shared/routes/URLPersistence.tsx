import React from 'react';
import { useURLPersistence } from '@shared/hooks/useURLPersistence';

interface URLPersistenceProps {
  children: React.ReactNode;
}

/**
 * Component que integra la persistencia de URL
 * Debe ejecutarse dentro del contexto de React Router
 */
export const URLPersistence: React.FC<URLPersistenceProps> = ({ children }) => {
  // 🔗 Activar la persistencia de URL
  useURLPersistence();

  return <>{children}</>;
};
