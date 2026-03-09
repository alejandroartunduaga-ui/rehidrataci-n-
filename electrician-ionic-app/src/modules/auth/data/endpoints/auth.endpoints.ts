import { IHttpClient } from '@shared/index';

type AuthEndpoints = {
  userDetails: IHttpClient;
};

export const authEndpoints: AuthEndpoints = {
  userDetails: {
    url: '/ms-electricians-api/electrician-users/details',
    isMocked: false,
  },
};
