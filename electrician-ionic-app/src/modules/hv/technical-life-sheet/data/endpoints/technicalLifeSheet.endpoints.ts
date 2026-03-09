import { IHttpClient } from '@shared/index';

type TechnicalLifeSheetEndpoints = {
  searchContract: IHttpClient;
  getTechnicalLifeDetails: IHttpClient;
  postTechnicalLifeDetails: IHttpClient;
  getTechnicalLifeDetailsPdf: IHttpClient;
};

export const technicalLifeSheetEndpoints: TechnicalLifeSheetEndpoints = {
  searchContract: {
    url: '/ms-electricians-api/technical-cv-ops/contracts/search',
    isMocked: false,
  },
  getTechnicalLifeDetails: {
    url: '/ms-electricians-api/app/technical-cv-ops/hv/details/contract/${CONTRACT_ID}',
    isMocked: false,
  },
  postTechnicalLifeDetails: {
    url: '/ms-electricians-api/app/technical-cv-ops/hv/details/hv',
    isMocked: false,
  },
  getTechnicalLifeDetailsPdf: {
    url: '/ms-technical-cv-ops/hv/pdf/${CV_ID}',
    isMocked: false,
  },
};
