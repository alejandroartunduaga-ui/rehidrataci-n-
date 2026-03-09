import React from 'react';
import { Route, Redirect, RouteComponentProps } from 'react-router-dom';
import { useAuthStore } from '@shared/index';
import { BiaLoader } from '@entropy/index';

interface PrivateRouteProps {
  component: React.FC<RouteComponentProps>;
  path: string;
  exact?: boolean;
}

export const PrivateRoute: React.FC<PrivateRouteProps> = ({
  component: Component,
  ...rest
}) => {
  const { isAuthenticated, hydrated } = useAuthStore();

  if (!hydrated) return <BiaLoader />;

  return (
    <Route
      {...rest}
      render={(props) =>
        isAuthenticated ? <Component {...props} /> : <Redirect to='/login' />
      }
    />
  );
};
