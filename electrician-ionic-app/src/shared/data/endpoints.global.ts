import { IHttpClient } from '@shared/httpClient/httpClient.interface';

type GlobalEndpoints = {
  uploadImages: IHttpClient;
  uploadVisitAct: IHttpClient;
  subscribeToNotifications: IHttpClient;
  unsubscribeFromNotifications: IHttpClient;
  getNotifications: IHttpClient;
  readNotification: IHttpClient;
};

export const endpoints: GlobalEndpoints = {
  uploadImages: {
    url: '/api/v1/ms-upload-s3/files?path=${path}',
    isMocked: false,
  },
  uploadVisitAct: {
    url: '/api/v1/ms-upload-s3/files?path=${path}&name=${name}',
    isMocked: false,
  },
  subscribeToNotifications: {
    url: '/ms-electricians-api/app/electricians-users/notifications/subscriptions',
    isMocked: false,
  },
  unsubscribeFromNotifications: {
    url: '/ms-electricians-api/app/electricians-users/notifications/subscriptions/token',
    isMocked: false,
  },
  getNotifications: {
    url: '/ms-electricians-api/app/electricians-users/notifications/list',
    isMocked: false,
  },
  readNotification: {
    url: '/ms-electricians-api/app/electricians-users/notifications/read',
    isMocked: false,
  },
};
