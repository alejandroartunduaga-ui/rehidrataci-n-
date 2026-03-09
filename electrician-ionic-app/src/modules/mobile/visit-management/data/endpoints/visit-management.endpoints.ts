import { IHttpClient } from '@shared/index';

type VisitManagementEndpoints = {
  pagesByActivityId: IHttpClient;
};

export const visitManagementEndpoints: VisitManagementEndpoints = {
  pagesByActivityId: {
    url: '/ms-electricians-api/activities/pages',
    isMocked: false,
  },
};
