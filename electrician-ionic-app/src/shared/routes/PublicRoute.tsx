import React, { useEffect, useState } from 'react';
import { Route, Redirect, RouteComponentProps } from 'react-router-dom';
import { RolesEnum } from '@auth/index';
import { useAuthStore } from '@shared/index';

interface PublicRouteProps {
  component: React.FC<RouteComponentProps>;
  path: string;
  exact?: boolean;
}

export const PublicRoute: React.FC<PublicRouteProps> = ({
  component: Component,
  ...rest
}) => {
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const { user } = useAuthStore();
  const [isDesktopUser, setIsDesktopUser] = useState(false);
  const [isHvUser, setIsHvUser] = useState(false);

  useEffect(() => {
    if (user && user !== null) {
      setIsDesktopUser(
        user.user.role === RolesEnum.COORDINATOR_BIA ||
          user.user.role === RolesEnum.CONTRACTOR
      );
      setIsHvUser(user.user.role === RolesEnum.REGULATORY_MEASUREMENT_ENGINEER);
    }
  }, [user]);

  return (
    <Route
      {...rest}
      render={(props) =>
        !isAuthenticated ? (
          <Component {...props} />
        ) : isDesktopUser ? (
          <Redirect to='/admin/ots' />
        ) : isHvUser ? (
          <Redirect to='/admin-regulatory' />
        ) : (
          <Redirect to='/home' />
        )
      }
    />
  );
};
