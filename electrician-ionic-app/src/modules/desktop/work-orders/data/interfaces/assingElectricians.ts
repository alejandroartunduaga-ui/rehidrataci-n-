export interface IElectriciansResponse {
  electrician_id: string;
  name: string;
  roles: string[];
  is_assigned: boolean;
}

export interface IElectrician {
  name: string;
  id: string;
  roles: string[];
  is_assigned: boolean;
}

export interface IAssingElectriciansRequest {
  activity_id: string;
  body: {
    contractor_id: string;
    electrician_lead: IElectrician;
    electrician_assistants: IElectrician[];
  };
}

export interface IDeclineOrAssingVisitResponse {
  error?: {
    message: string;
    code: string;
  };
  id?: string;
  electrician_status_id?: string;
}
