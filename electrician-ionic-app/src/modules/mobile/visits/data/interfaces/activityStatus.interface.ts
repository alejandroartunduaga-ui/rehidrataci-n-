import { ActivityStatus } from '@mobile/visits';

export interface IChangeActivityStatusRequest {
  states: IActivityStatus[];
}

export interface IChangeActivityStatusResponse {
  succes: boolean;
  message: string;
  data: IActivityStatusRequest[];
}

export interface IActivityStatus {
  status: ActivityStatus;
  created_at_app: string;
  is_online: boolean;
}

export interface IActivityStatusRequest extends IActivityStatus {
  is_update_visit: boolean;
  is_update_steps?: number;
}
