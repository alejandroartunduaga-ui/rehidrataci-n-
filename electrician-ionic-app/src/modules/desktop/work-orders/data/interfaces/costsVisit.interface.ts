export interface ICostsVisitGetResponse {
  id: number;
  visit_id: string;
  wo_id: string | null;
  service_cost: number;
  material_cost: number;
  transport_cost: number;
  other_cost: number;
  total_cost: number;
  comments: string;
  consumables_pdf: string | null;
  user_id: string;
  created_at: string;
  updated_at: string;
  enabled: boolean;
}

export interface ICostsVisitGetRequest {
  visit_id: string;
}

export interface ICostsVisitPostResponse {
  id: number;
  visit_id: string;
  wo_id: string | null;
  service_cost: number;
  material_cost: number;
  transport_cost: number;
  other_cost: number;
}

export interface ICostsVisitPostRequest {
  visit_id: string;
  service_cost: number;
  material_cost: number;
  transport_cost: number;
  other_cost: number;
  comments: string;
  consumables_pdf: string;
}
