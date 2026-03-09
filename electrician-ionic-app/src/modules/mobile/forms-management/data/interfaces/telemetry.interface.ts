export enum StatusTelemetry {
  PENDING = 'Pendiente',
  SUCCESS = 'Exitosa',
  FAILED = 'Fallida',
  PROCESS = 'En proceso',
}

export enum StatusTelemetryResponse {
  PENDING = 'PENDING',
  SUCCESS = 'SUCCESS',
  FAILED = 'FAILED',
  PROCESS = 'PROCESS',
}

export interface ITelemetryRequest {
  brand: string;
  ip: string;
  serial_number: string;
  client_number: string;
  meter_factor: string;
  visit_id: string;
}

export interface ITelemetryResponse {
  id: number;
  status: StatusTelemetryResponse;
  message: string;
  url: string;
  status_details: string;
}

export interface ITelemetryReadResponse {
  id: number;
  status: StatusTelemetryResponse;
  message: string;
  url: string;
  status_details: string;
}

export interface ITelemetryLocalRecord {
  visitId: string;
  data: ITelemetryRequest;
  savedAt: Date;
  synced: boolean;
}
