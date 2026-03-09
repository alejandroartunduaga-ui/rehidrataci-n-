export enum CategoryName {
  POR_SYNCRONIZAR = 'Por sincronizar',
  POR_ASIGNAR = 'Por asignar',
  PROXIMAS = 'Asignadas',
  COMPLETADAS = 'Completadas',
  FALLIDAS = 'Fallidas',
  DEVUELTAS = 'Devueltas',
} 

export enum ActivityStatus {
  PENDING_ASSIGNMENT = 'PENDING_ASSIGNMENT',
  REASSIGNED = 'REASSIGNED',
  ASSIGNED = 'ASSIGNED',
  IN_ROUTE = 'IN_ROUTE',
  IN_ADDRESS = 'IN_ADDRESS',
  ACTIVITY_STARTED = 'ACTIVITY_STARTED',
  INIT_FORM = 'INIT_FORM',
  COMPLETED = 'COMPLETED',
  CANCELLED = 'CANCELLED',
  SITE_ACCESS_FAILED = 'SITE_ACCESS_FAILED',
  START_ACTIVITY_FAILED = 'START_ACTIVITY_FAILED',
  CONTINUE_ACTIVITY_FAILED = 'CONTINUE_ACTIVITY_FAILED',
  ASSIGNED_CONTRACTOR = 'ASSIGNED_CONTRACTOR',
  CHANGE_CONTRACTOR = 'CHANGE_CONTRACTOR',
  ACCEPTED_CONTRACTOR = 'ACCEPTED_CONTRACTOR',
  PRE_VISIT = 'PRE_VISIT',
  GENERIC_VISIT_V2 = 'GENERIC_VISIT_V2',
  INSTALLATION_VISIT = 'INSTALLATION_VISIT',
  FAILED = 'FAILED',
  ELECTRICIAN_FAILED_VISIT = 'ELECTRICIAN_FAILED_VISIT',
  CHECKING_EQUIPMENT = 'CHECKING_EQUIPMENT',
  COMPLETED_EQUIPMENT = 'COMPLETED_EQUIPMENT',
  EQUIPMENT_VERIFICATION_FAILED = 'EQUIPMENT_VERIFICATION_FAILED',
}
export const ICTActivityStatus: {
  color: Record<string, string>;
  text: Record<string, string>;
} = {
  color: {
    [ActivityStatus.ASSIGNED]: '#105635',
    [ActivityStatus.IN_ROUTE]: '#8C2D55',
    [ActivityStatus.IN_ADDRESS]: '#16625E',
    [ActivityStatus.ACTIVITY_STARTED]: '#00C47A',
    [ActivityStatus.INIT_FORM]: '#C48F33',
    [ActivityStatus.CANCELLED]: '#C43333',
    [ActivityStatus.SITE_ACCESS_FAILED]: '#C46833',
    [ActivityStatus.START_ACTIVITY_FAILED]: '#C46833',
    [ActivityStatus.CONTINUE_ACTIVITY_FAILED]: '#C46833',
    [ActivityStatus.ASSIGNED_CONTRACTOR]: '#C43333',
    [ActivityStatus.CHANGE_CONTRACTOR]: '#C43333',
    [ActivityStatus.ACCEPTED_CONTRACTOR]: '#C43333',
    [ActivityStatus.ELECTRICIAN_FAILED_VISIT]: '#C43333',
    [ActivityStatus.COMPLETED]: '#00A86C',
    [ActivityStatus.CHECKING_EQUIPMENT]: '#114bb0',
    [ActivityStatus.COMPLETED_EQUIPMENT]: '#114bb0',
    [ActivityStatus.EQUIPMENT_VERIFICATION_FAILED]: '#C43333',
  },
  text: {
    [ActivityStatus.ASSIGNED]: 'Asignada',
    [ActivityStatus.IN_ROUTE]: 'En camino',
    [ActivityStatus.IN_ADDRESS]: 'En curso',
    [ActivityStatus.ACTIVITY_STARTED]: 'Dentro de sitio',
    [ActivityStatus.INIT_FORM]: 'Completando documentos',
    [ActivityStatus.CANCELLED]: 'Cancelada',
    [ActivityStatus.SITE_ACCESS_FAILED]: 'Fallida en curso',
    [ActivityStatus.START_ACTIVITY_FAILED]: 'Fallida en curso',
    [ActivityStatus.CONTINUE_ACTIVITY_FAILED]: 'Fallida en curso',
    [ActivityStatus.ASSIGNED_CONTRACTOR]: 'Aceptado por contratista',
    [ActivityStatus.CHANGE_CONTRACTOR]: 'Aceptado por contratista',
    [ActivityStatus.ACCEPTED_CONTRACTOR]: 'Aceptado por contratista',
    [ActivityStatus.ELECTRICIAN_FAILED_VISIT]: 'Fallida',
    [ActivityStatus.COMPLETED]: 'Completada',
    [ActivityStatus.CHECKING_EQUIPMENT]: 'Verificando equipos',
    [ActivityStatus.COMPLETED_EQUIPMENT]: 'Equipos verificados',
    [ActivityStatus.EQUIPMENT_VERIFICATION_FAILED]: 'Fallida en curso',
  },
};
export interface Ivisits {
  title: string;
  categories: ICategory[];
}

export interface ICategory {
  name: CategoryName;
  type: 'TO_DO' | 'DONE' | 'CANCELLED';
  activities: IActivity[];
}

export interface IActivity {
  date: string;
  visits: IVisit[];
}

export interface IVisit {
  activity_id: string;
  card_information: ICardInformation;
  date?: string;
  nameActivity?: string;
  typeActivity?: string;
}

export interface ICardInformation {
  contract_id: number;
  activity_status: ActivityStatus;
  activity_status_title: string;
  activity_status_color: string;
  network_operator: string;
  address_icon: string;
  address: string;
  user_icon: string;
  user_name: string;
  business_icon: string;
  business_name: string;
  activity_date: string;
  measurement_type: string;
  measurement_type_id: string;
  time_slot: string;
  city: string;
  activity_type: string;
  activity_type_id: ActivityStatus;
  activity_color: string;
  assigned_role: string;
  internal_bia_code?: string;
  work_order?: string;
}

export interface IchangeActivityStatusRequest {
  activity_id: string;
  activity_status: ActivityStatus;
}

export interface IMiniCardActivity {
  activity_id: string;
  card_information: {
    activity_type: string;
    network_operator: string;
    user_name: string;
    address: string;
    activity_date: string;
    time_slot: string;
  };
}

export interface IDeclineOrAssingVisitResponse {
  error?: {
    message: string;
    code: string;
  };
  id?: string;
  electrician_status_id?: ActivityStatus;
}

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

export interface IVisitNew {
  activity_id: string;
  card_information: ICardInformation;
  nameActivity?: string;
  typeActivity: string;
  date: string;
}

export interface IVisitNewByDate {
  date: string;
  visits: IVisitNew[];
}
