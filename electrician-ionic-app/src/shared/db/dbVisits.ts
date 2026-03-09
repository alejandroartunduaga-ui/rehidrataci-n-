import { Dexie, Table } from 'dexie';
import { IPagesByActivityIdResponse } from '@visit-management/index';
import { IVisit, IVisitDetail } from '@visits/index';

export interface Visit {
  id: string; // activity_id
  data: IVisit;
  downloadedAt: Date;
}

export interface DetailVisit {
  id: string; // activity_id
  data: IVisitDetail;
  downloadedAt: Date;
}

export interface StepsVisit {
  id: string; // activity_id
  data: IPagesByActivityIdResponse;
  downloadedAt: Date;
}

export interface formStepVisit {
  id: string; // activity_id-page_code
  data: object;
  downloadedAt: Date;
}

export interface SyncQueueItem {
  id: string; // Identificador único de la petición uuidv4
  activityId: string;
  endpoint: string;
  method: 'POST' | 'PUT' | 'DELETE';
  body: object;
  createdAt: Date;
}

export class VisitsDatabase extends Dexie {
  visits!: Table<Visit>;
  detailVisits!: Table<DetailVisit>;
  stepsVisits!: Table<StepsVisit>;
  formStepVisits!: Table<formStepVisit>;
  syncQueue!: Table<SyncQueueItem>;

  constructor() {
    super('VisitsDatabase');
    this.version(1).stores({
      visits: 'id, downloadedAt',
      detailVisits: 'id, downloadedAt',
      stepsVisits: 'id, downloadedAt',
      formStepVisits: 'id, downloadedAt',
      syncQueue: 'id, activityId, createdAt',
    });
  }
}

export const db = new VisitsDatabase();

export async function clearDatabaseById() {
  /* const steps = await db.stepsVisits.get(activity_id);
  if (!steps) return;

  await Promise.all([
    ...steps.data.pages.map((page) =>
      db.formStepVisits.delete(`${activity_id}-${page.code}`)
    ),
    db.visits.delete(activity_id),
    db.detailVisits.delete(activity_id),
    db.stepsVisits.delete(activity_id),
  ]); */
}

export async function clearAllData() {
  await Promise.all([
    db.visits.clear(),
    db.detailVisits.clear(),
    db.stepsVisits.clear(),
    db.formStepVisits.clear(),
    db.syncQueue.clear(),
  ]);
}
