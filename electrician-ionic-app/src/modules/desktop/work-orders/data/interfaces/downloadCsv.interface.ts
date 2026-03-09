export interface IDownloadCSVRequest {
  start_from_date: string;
  start_to_date: string;
  service_type_ids: string[];
  group_status: string[];
}

export interface IDownloadCSVResponse {
  url: string;
}
