import { IPagesByActivityIdResponse } from '@mobile/visit-management';
import { IArrivalPhoto, IVisitDetail, IVisitNew } from '@mobile/visits';
import { IActivityStatus } from '@mobile/visits/data/interfaces/activityStatus.interface';
import { IFormSubmissionData } from '@shared/store/forms/dataStore.interface';
import { StatusTelemetryResponse } from '@mobile/forms-management/data/interfaces/telemetry.interface';
import { IEquipmentCertificate } from '@mobile/visits/data/interfaces/equipmentCertificates.interface';

export enum IDataBaseNames {
  OPERACIONES = 'opsDatabase',
}

export enum IDataBaseTables {
  VISITS = 'visits',
  VISITS_DETAIL = 'visits_detail',
  VISITS_STEPS = 'visits_steps',
  ANSWERS = 'answers',
  ARRIVAL_PHOTOS = 'arrival_photos',
  LOGS = 'logs',
  FORMS = 'forms',
  TELEMETRY = 'telemetry',
  VERIFY_EQUIPMENT = 'verify_equipment',
}

export interface ITableVisit {
  visitId: string;
  data: IVisitNew;
  detail: IVisitDetail;
  steps: IPagesByActivityIdResponse;
  stepsFailed: IPagesByActivityIdResponse;
  isComplete: boolean;
  createdAt: Date;
  updatedAt: Date;
  arrivalPhotos?: string[]; // Array de base64 strings de fotos de llegada
}

export interface ITableAnswers {
  visitId_pageCode: string;
  value: IFormSubmissionData;
  isComplete: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface ITableLogs {
  data: string;
  request: string;
  response: string;
  message: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface ITableForms {
  visitId_pageCode: string;
  type: string;
  data: object;
  createdAt: Date;
  updatedAt: Date;
}

export interface ITableVisitsSteps {
  visitId: string;
  steps: IActivityStatus[];
  createdAt: Date;
  updatedAt: Date;
}

export interface ITableArrivalPhotos {
  visitId: string;
  photos: IArrivalPhoto[];
  createdAt: Date;
  updatedAt: Date;
}

export interface ITableTelemetry {
  idTelemetry: number;
  codeField: string;
  visitId: string;
  status: StatusTelemetryResponse;
  intent: number;
  url: string;
  message: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface ITableVerifyEquipment {
  visitId: string;
  verifyEquipment: IEquipmentCertificate[];
  createdAt: Date;
  updatedAt: Date;
}

export const DataBaseTables = [
  {
    name: IDataBaseTables.VISITS,
    columns: [
      { name: 'visitId', type: 'string', unique: true, primaryKey: true },
      { name: 'data', type: 'object' },
      { name: 'detail', type: 'object' },
      { name: 'steps', type: 'object' },
      { name: 'cardInformation', type: 'object' },
      { name: 'isComplete', type: 'boolean' },
      { name: 'createdAt', type: 'date' },
      { name: 'updatedAt', type: 'date' },
    ],
  },
  {
    name: IDataBaseTables.ANSWERS,
    columns: [
      {
        name: 'visitId_pageCode',
        type: 'string',
        primaryKey: true,
        unique: true,
      },
      { name: 'isComplete', type: 'boolean' },
      { name: 'value', type: 'object' },
      { name: 'createdAt', type: 'date' },
      { name: 'updatedAt', type: 'date' },
    ],
  },
  {
    name: IDataBaseTables.LOGS,
    columns: [
      { name: 'data', type: 'string' },
      { name: 'request', type: 'string' },
      { name: 'response', type: 'string' },
      { name: 'message', type: 'string' },
      { name: 'createdAt', type: 'date' },
      { name: 'updatedAt', type: 'date' },
    ],
  },
  {
    name: IDataBaseTables.FORMS,
    columns: [
      {
        name: 'visitId_pageCode',
        type: 'string',
        primaryKey: true,
        unique: true,
      },
      { name: 'type', type: 'string' },
      { name: 'data', type: 'object' },
      { name: 'createdAt', type: 'date' },
      { name: 'updatedAt', type: 'date' },
    ],
  },
  {
    name: IDataBaseTables.VISITS_STEPS,
    columns: [
      { name: 'visitId', type: 'string', primaryKey: true },
      { name: 'steps', type: 'object' },
      { name: 'createdAt', type: 'date' },
      { name: 'updatedAt', type: 'date' },
    ],
  },
  {
    name: IDataBaseTables.ARRIVAL_PHOTOS,
    columns: [
      { name: 'visitId', type: 'string', primaryKey: true },
      { name: 'photos', type: 'object' },
      { name: 'createdAt', type: 'date' },
      { name: 'updatedAt', type: 'date' },
    ],
  },
  {
    name: IDataBaseTables.TELEMETRY,
    columns: [
      { name: 'codeField', type: 'string', primaryKey: true },
      { name: 'visitId', type: 'string' },
      { name: 'idTelemetry', type: 'number' },
      { name: 'status', type: 'string' },
      { name: 'url', type: 'string' },
      { name: 'intent', type: 'number' },
      { name: 'message', type: 'string' },
      { name: 'createdAt', type: 'date' },
      { name: 'updatedAt', type: 'date' },
    ],
  },
  {
    name: IDataBaseTables.VERIFY_EQUIPMENT,
    columns: [
      { name: 'visitId', type: 'string', primaryKey: true },
      { name: 'verifyEquipment', type: 'object' },
      { name: 'createdAt', type: 'date' },
      { name: 'updatedAt', type: 'date' },
    ],
  },
];
