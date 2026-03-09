export enum RolesEnum {
  TECHNICAL = 'TECHNICAL',
  CONTRACTOR_MANAGER = 'CONTRACTOR_MANAGER',
  COORDINATOR_BIA = 'COORDINATOR_BIA',
  CONTRACTOR = 'CONTRACTOR',
  REGULATORY_MEASUREMENT_ENGINEER = 'REGULATORY_MEASUREMENT_ENGINEER',
}

export class ISession {
  constructor(
    public token: string,
    public refreshToken: string
  ) {}
}

export interface ILoginCredentials {
  username: string;
  password: string;
}

export interface IForgotPasswordRequest {
  email: string;
}

interface Permission {
  name: string;
  id: string;
}

interface Contractor {
  code: string;
  name: string;
  description: string;
  identification_number: string;
  identification_type: string;
  email: string;
  contact_phone: string;
  image_url: string | null;
  country_code: string;
  department: string;
  parafiscal_url: string;
  status: string;
  electricians: string | null;
  created_at: string;
  updated_at: string;
}

interface User {
  electrician_id: string;
  contractor: Contractor;
  name: string;
  last_name: string;
  identification_number: string;
  identification_type: string;
  email: string;
  phone: string | null;
  image_url: string;
  country_code: string;
  status: string;
  created_at: string;
  updated_at: string;
  role: RolesEnum;
  role_description: string;
  stores: string | null;
}

export interface IUserDetailsResponse {
  permissions: Permission[];
  user: User;
  version_app: string[];
  version_db: string;
}
