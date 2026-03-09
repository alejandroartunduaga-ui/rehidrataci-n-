import { IHttpClient } from '@shared/index';

type WorkOrdersEndpoints = {
  getFilters: IHttpClient;
  getWorkOrders: IHttpClient;
  electricianListAssigned: IHttpClient;
  assingElectricians: IHttpClient;
  listContractors: IHttpClient;
  assignContractor: IHttpClient;
  getWorkOrderDetail: IHttpClient;
  uploadActa: IHttpClient;
  reschedule: IHttpClient;
  reasonsCancelClose: IHttpClient;
  cancelCloseOT: IHttpClient;
  confirmRejectOT: IHttpClient;
  downloadCSV: IHttpClient;
  historyVisit: IHttpClient;
  costsVisit: IHttpClient;
  costsVisitPost: IHttpClient;
  resetVisit: IHttpClient;
  revertAct: IHttpClient;
};

export const workOrdersEndpoints: WorkOrdersEndpoints = {
  getFilters: {
    url: '/ms-electricians-api/cms/all/filters',
    isMocked: false,
  },
  getWorkOrders: {
    url: '/ms-electricians-api/cms/search',
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
  listContractors: {
    url: '/ms-electricians-api/contractors/lite',
    isMocked: false,
  },
  assignContractor: {
    url: '/ms-electricians-api/cms/visit/assign/contractor',
    isMocked: false,
  },
  getWorkOrderDetail: {
    url: '/ms-electricians-api/cms/visit/${ACTIVITY_ID}/details',
    isMocked: false,
  },
  uploadActa: {
    url: '/ms-electricians-api/cms/visit/change/report-url',
    isMocked: false,
  },
  reschedule: {
    url: '/ms-electricians-api/cms/visit/rescheduling',
    isMocked: false,
  },
  reasonsCancelClose: {
    url: '/ms-electricians-api/cms/reason',
    isMocked: false,
  },
  cancelCloseOT: {
    url: '/ms-electricians-api/cms/visit/${VISIT_ID}/closed',
    isMocked: false,
  },
  confirmRejectOT: {
    url: '/ms-electricians-api/cms/visit/${VISIT_ID}/approval',
    isMocked: false,
  },
  downloadCSV: {
    url: '/ms-electricians-api/cms/search/export',
    isMocked: false,
  },
  historyVisit: {
    url: '/ms-electricians-api/cms/visit/${VISIT_ID}/history',
    isMocked: false,
  },
  costsVisit: {
    url: '/ms-electricians-api/app/electrician-visits/v1/opex-costs?visit_id=${VISIT_ID}',
    isMocked: false,
  },
  costsVisitPost: {
    url: '/ms-electricians-api/app/electrician-visits/v1/opex-costs',
    isMocked: false,
  },
  resetVisit: {
    url: '/ms-electrician-visits/v2/visits/reset/visit/${VISIT_ID}',
    isMocked: false,
  },
  revertAct: {
    url: '/ms-electricians-api/app/electrician-visits/cms/visit/revert-act',
    isMocked: false,
  },
};
