import { IHttpClient } from '@shared/index';

type FormsManagementEndpoints = {
  formById: IHttpClient;
  saveForms: IHttpClient;
  uploadFile: IHttpClient;
  telemetryReadMeter: IHttpClient;
  telemetryRead: IHttpClient;
};

export const formsManagementEndpoints: FormsManagementEndpoints = {
  formById: {
    url: '/ms-electricians-api/v2/activities/pages/widgets',
    isMocked: false,
  },
  saveForms: {
    url: '/ms-electricians-api/v2/activities/widgets/values',
    isMocked: false,
  },
  uploadFile: {
    url: '/api/v1/ms-upload-s3/files?path=${path}',
    isMocked: false,
  },
  telemetryReadMeter: {
    url: '/ms-electricians-api/app/tools-telemetry/read-meter',
    isMocked: false,
  },
  telemetryRead: {
    url: '/ms-electricians-api/app/tools-telemetry/meter-reading/${id}',
    isMocked: false,
  },
};
