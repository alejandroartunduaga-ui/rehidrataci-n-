import { IHttpClient } from '@shared/index';

type VisitsEndpoints = {
  getVisitsTechnical: IHttpClient;
  getVisitsManager: IHttpClient;
  getActivitiesDescriptions: IHttpClient;
  changeActivityStatus: IHttpClient;
  declineVisit: IHttpClient;
  electricianListAssigned: IHttpClient;
  assingElectricians: IHttpClient;
  arrivalPhotos: IHttpClient;
  uploadFile: IHttpClient;
  descriptions: IHttpClient;
  equipmentCertificates: IHttpClient;
  equipmentHistory: IHttpClient;
};

export const visitsEndpoints: VisitsEndpoints = {
  getVisitsTechnical: {
    url: '/ms-electricians-api/visit/details',
    isMocked: false,
  },
  getVisitsManager: {
    url: '/ms-electricians-api/visit/manager',
    isMocked: false,
  },
  getActivitiesDescriptions: {
    url: '/ms-electricians-api/activities/descriptions',
    isMocked: false,
  },
  changeActivityStatus: {
    url: '/ms-electricians-api/activities/${ACTIVITY_ID}/multiple-state',
    isMocked: false,
  },
  declineVisit: {
    url: '/ms-electrician-visits/v1/visits/${ACTIVITY_ID}/decline',
    isMocked: false,
  },
  electricianListAssigned: {
    url: '/ms-electricians-api/activities/assignment?activity_id=${ACTIVITY_ID}',
    isMocked: false,
  },
  assingElectricians: {
    url: '/ms-electrician-visits/v1/visits/${ACTIVITY_ID}/electricians',
    isMocked: false,
  },
  arrivalPhotos: {
    url: '/ms-electrician-visits/v1/arrival-photos/visit/${ACTIVITY_ID}',
    isMocked: false,
  },
  uploadFile: {
    url: '/api/v1/ms-upload-s3/files?path=${path}',
    isMocked: false,
  },
  descriptions: {
    url: '/ms-electricians-api/activities/descriptions',
    isMocked: false,
  },
  equipmentCertificates: {
    url: '/ms-electricians-api/device/equipment-certificates/visit/${ACTIVITY_ID}',
    isMocked: false,
  },
  equipmentHistory: {
    url: '/ms-electricians-api/app/electrician-visits/v1/visits/equipment/history',
    isMocked: false,
  },
};
