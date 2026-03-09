import React, { useEffect } from 'react';
import { useHistory, useLocation } from 'react-router-dom';
import { useAuthStore } from '@shared/index';
import { RolesEnum } from '@auth/index';

interface RoleRedirectProps {
  children: React.ReactNode;
}

export const RoleRedirect: React.FC<RoleRedirectProps> = ({ children }) => {
  const { user } = useAuthStore();
  const history = useHistory();
  const location = useLocation();

  const isDesktopUser =
    user?.user?.role === RolesEnum.COORDINATOR_BIA ||
    user?.user?.role === RolesEnum.CONTRACTOR;

  const isHvUser =
    user?.user?.role === RolesEnum.REGULATORY_MEASUREMENT_ENGINEER;

  useEffect(() => {
    // 🛡️ Validar que location.pathname existe antes de proceder
    if (!location?.pathname) {
      return;
    }

    // Define public routes that don't require authentication
    const publicRoutes = ['/login', '/forgot-password'];
    const isPublicRoute = publicRoutes.includes(location.pathname);

    // Only redirect to login if user is not authenticated AND not in a public route
    if (!user && !isPublicRoute) {
      history.replace('/login');
      return;
    }

    // Only apply role-based redirects if user is authenticated
    if (user) {
      const currentPath = location.pathname;

      // Usuario HV solo puede acceder a /admin-regulatory
      if (isHvUser) {
        if (!currentPath.startsWith('/admin-regulatory')) {
          history.replace('/admin-regulatory');
        }
        return;
      }

      // Usuarios desktop (COORDINATOR_BIA, CONTRACTOR) solo pueden acceder a /admin
      if (isDesktopUser) {
        if (!currentPath.startsWith('/admin')) {
          history.replace('/admin');
        }
        return;
      }
    }
  }, [user, isDesktopUser, isHvUser, location.pathname, history]);

  return <>{children}</>;
};
