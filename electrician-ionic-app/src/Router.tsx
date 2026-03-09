// Ionic React Router imports
import { IonReactRouter } from '@ionic/react-router';
import { IonRouterOutlet } from '@ionic/react';
import { Route, Switch, Redirect } from 'react-router-dom';

// Auth
import { LoginPage, RolesEnum } from '@auth/index';
import { ForgotPasswordPage } from '@auth/ui/pages/forgot-password-page/ForgotPasswordPage';

// Desktop
import {
  LayoutDesktop,
  ViewDocument,
  WorkOrderDetail,
  WorkOrders,
} from '@desktop/index';
// HV
import {
  LayoutHv,
  HomeHv,
  TechnicalLifeSheet,
  ViewDocumentHv,
  DetailTechnicalLifeSheet,
  Scopes,
  DetailScope,
} from '@hv/index';
// Mobile
import {
  AssingVisit,
  Documents,
  EquipmentsPage,
  ScopePage,
  VisitDetail,
  Visits,
} from '@mobile/visits';
import { VisitFailed } from '@mobile/visits/ui/pages/VisitFailed';
import { ArrivalVisit } from '@mobile/visits/ui/pages/Arrival';
import { HistoryPage } from '@mobile/visit-management';
import { FormsPage } from '@mobile/forms-management';
import TelemetryInstaled from '@mobile/forms-management/ui/components/DynamicForm/TelemetryInstaled/TelemetryInstaled';
import { RedirectDesktop } from '@mobile/redirect-desktop/ui/pages/RedirectDesktop';
import { TelemetryVisualizer } from '@mobile/forms-management/ui/components/DynamicForm/telemetryVisualizer/telemetryVisualizer';

// Shared
import { PrivateRoute, PublicRoute, useAuthStore } from './shared';
import {
  URLPersistence,
  RoleRedirect,
  NotificationHandler,
} from './shared/routes';

// Entropy (UI)
import { BiaLoader } from '@entropy/index';
import { CheckingEquipmentPage } from '@mobile/visits/ui/pages/CheckingEquipment';

export const Router = () => {
  const { user, hydrated } = useAuthStore();

  // 🎯 Calcular isDesktopUser directamente (sin estado adicional)
  const isDesktopUser =
    user?.user?.role === RolesEnum.COORDINATOR_BIA ||
    user?.user?.role === RolesEnum.CONTRACTOR;
  const isHvUser =
    user?.user?.role === RolesEnum.REGULATORY_MEASUREMENT_ENGINEER;

  if (!hydrated) {
    return <BiaLoader />;
  }

  return (
    <IonReactRouter>
      <RoleRedirect>
        <URLPersistence>
          <NotificationHandler />
          <IonRouterOutlet>
            {/* Desktop Routes */}
            <Route
              path='/admin'
              render={() => (
                <LayoutDesktop>
                  <Switch>
                    {/* 🎯 Rutas más específicas primero */}
                    <PrivateRoute
                      exact
                      path='/admin/ots'
                      component={WorkOrders}
                    />
                    <PrivateRoute
                      exact
                      path='/admin/ots/:workOrderId'
                      component={WorkOrderDetail}
                    />
                    <PrivateRoute
                      exact
                      path='/admin/ots/:workOrderId/view-document'
                      component={ViewDocument}
                    />

                    <PrivateRoute
                      exact
                      path='/admin/home'
                      component={WorkOrders}
                    />
                    {/* 🔄 Redirect default para /admin */}
                    <Route
                      exact
                      path='/admin'
                      render={() => <Redirect to='/admin/home' />}
                    />
                  </Switch>
                </LayoutDesktop>
              )}
            />

            <Route
              path='/admin-regulatory'
              render={() => (
                <LayoutHv>
                  <Switch>
                    {/* 🎯 Rutas más específicas primero */}
                    <PrivateRoute
                      exact
                      path='/admin-regulatory/home'
                      component={HomeHv}
                    />
                    <PrivateRoute
                      exact
                      path='/admin-regulatory/technical-life-sheet/view-document/:version/:url'
                      component={ViewDocumentHv}
                    />
                    <PrivateRoute
                      exact
                      path='/admin-regulatory/technical-life-sheet/:cvId/:contract_id'
                      component={DetailTechnicalLifeSheet}
                    />
                    <PrivateRoute
                      exact
                      path='/admin-regulatory/technical-life-sheet'
                      component={TechnicalLifeSheet}
                    />
                    <PrivateRoute
                      exact
                      path='/admin-regulatory/scopes'
                      component={Scopes}
                    />
                    <PrivateRoute
                      exact
                      path='/admin-regulatory/scopes/:scopeId/:biaCode'
                      component={DetailScope}
                    />
                    {/* 🔄 Redirect default para /admin-regulatory */}
                    <Route
                      exact
                      path='/admin-regulatory'
                      render={() => (
                        <Redirect to='/admin-regulatory/technical-life-sheet' />
                      )}
                    />
                  </Switch>
                </LayoutHv>
              )}
            />

            {/* 📱 Mobile Routes - Organizadas por especificidad */}

            {/* 🏠 Página principal móvil */}
            <PrivateRoute
              exact
              path='/home'
              component={Visits}
            />

            {/* 📋 Gestión de formularios - Ruta más específica */}
            <PrivateRoute
              exact
              path='/forms-managment/:activity_id/:page_code/:name_form/:index'
              component={FormsPage}
            />

            <PrivateRoute
              exact
              path='/forms-managment/:activity_id/:page_code/:name_form/:index/telemetry/:codeField'
              component={TelemetryInstaled}
            />

            <PrivateRoute
              exact
              path='/telemetry-visualizer/:url'
              component={TelemetryVisualizer}
            />

            {/* 📄 Documentos de visita - Ruta específica */}
            <PrivateRoute
              exact
              path='/visit/documents/:document_url/:title'
              component={Documents}
            />

            {/* 📍 Llegada a visita - Ruta específica */}
            <PrivateRoute
              exact
              path='/visit/arrival/:id'
              component={ArrivalVisit}
            />

            {/* 👥 Asignación de electricistas - Ruta específica */}
            <PrivateRoute
              exact
              path='/visit/:activity_id/electrician_assignment'
              component={AssingVisit}
            />

            {/* ❌ Visita fallida - Ruta específica */}
            <PrivateRoute
              exact
              path='/visit/:activity_id/failed-visit'
              component={VisitFailed}
            />

            {/* 📊 Historial de visita - Ruta específica */}
            <PrivateRoute
              exact
              path='/visit-managment/history/:activity_id'
              component={HistoryPage}
            />

            {/* 📝 Detalle de visita - Ruta general (al final) */}
            <PrivateRoute
              exact
              path='/visit/:id'
              component={VisitDetail}
            />

            <PrivateRoute
              exact
              path='/visit/:id/scope'
              component={ScopePage}
            />

            <PrivateRoute
              exact
              path='/visit/:id/equipments'
              component={EquipmentsPage}
            />

            <PrivateRoute
              exact
              path='/visit/:id/checking-equipment'
              component={CheckingEquipmentPage}
            />

            {/* 🔒 Public Routes */}
            <PublicRoute
              exact
              path='/login'
              component={LoginPage}
            />

            <PublicRoute
              exact
              path='/forgot-password'
              component={ForgotPasswordPage}
            />

            {/* 🔄 Utility Routes */}
            <PrivateRoute
              exact
              path='/redirect-desktop'
              component={RedirectDesktop}
            />

            {/* 🏠 Default Redirect - Basado en rol */}
            <Route
              exact
              path='/'
              render={() => {
                if (isDesktopUser) {
                  return <Redirect to='/admin/ots' />;
                }
                if (isHvUser) {
                  return <Redirect to='/admin-regulatory' />;
                }
                return <Redirect to='/home' />;
              }}
            />
          </IonRouterOutlet>
        </URLPersistence>
      </RoleRedirect>
    </IonReactRouter>
  );
};
