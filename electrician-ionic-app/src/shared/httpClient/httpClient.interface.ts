export interface IHttpClient {
  url: string;
  isMocked: boolean;
}

export interface RequestOptions {
  headers?: Record<string, string>;
  queryParams?: Record<string, string>;
  timeout?: number;
}
