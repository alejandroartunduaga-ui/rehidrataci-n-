import { IHttpClient } from '@shared/index';

type ScopesEndpoints = {
  getNetworkOperatorRegistry: IHttpClient;
  postRequirementsSearch: IHttpClient;
  getRequirementDetail: IHttpClient;
  getHistoryScope: IHttpClient;
  getSkus: IHttpClient;
  saveScopeDefinition: IHttpClient;
};

export const scopesEndpoints: ScopesEndpoints = {
  getNetworkOperatorRegistry: {
    url: '/ms-electricians-api/app/electrician-scopes/catalog',
    isMocked: false,
  },
  postRequirementsSearch: {
    url: '/ms-electricians-api/app/electrician-scopes/requirements/search',
    isMocked: false,
  },
  getRequirementDetail: {
    url: '/ms-electricians-api/app/electrician-scopes/requirements/${SCOPE_ID}',
    isMocked: false,
  },
  getHistoryScope: {
    url: '/ms-electricians-api/app/electrician-scopes/requirements/${SCOPE_ID}/history',
    isMocked: false,
  },
  getSkus: {
    url: '/ms-electricians-api/bi-savings/skus',
    isMocked: false,
  },
  saveScopeDefinition: {
    url: '/ms-electricians-api/app/electrician-scopes/requirements/${SCOPE_ID}/scope-definition',
    isMocked: false,
  },
};
