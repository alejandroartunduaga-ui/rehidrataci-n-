import { create } from 'zustand';
import {
  StatusTelemetry,
  StatusTelemetryResponse,
} from '@mobile/forms-management/data/interfaces/telemetry.interface';
import {
  IDataBaseNames,
  IDataBaseTables,
  ITableTelemetry,
} from '@shared/data/IDatabase';
import { fetchTelemetryRead } from '@mobile/forms-management/data/telemetryRead';
import { ITelemetryReadResponse } from '@mobile/forms-management/data/interfaces/telemetry.interface';
import {
  upsertTableData,
  getTableDataByQuery,
} from '@shared/db/databaseService';

type TelemetryState = {
  status: StatusTelemetry;
  serie_del_modem: string;
  marca_del_modem: string;
  ip: string;
  puerto: string;
  ime_modem: string;
  fact_modem: string;
  operador_sim: string;
  input_ime_modem: string;
};

type TelemetryStore = TelemetryState & {
  setTelemetry: (data: Partial<TelemetryState>) => void;
  clearTelemetry: () => void;
  saveTelemetryToDatabase: (params: {
    visitId: string;
    codeField: string;
    idTelemetry: number;
    statusOverride: StatusTelemetryResponse;
    message: string;
    intent?: number;
  }) => Promise<boolean>;
  getTelemetryStatusByCodeField: (
    codeField: string,
    visitId: string
  ) => Promise<StatusTelemetryResponse | null>;
  getTelemetryReadById: (
    id: string,
    isOnline: boolean
  ) => Promise<ITelemetryReadResponse>;
  updateTelemetryFromRead: (params: {
    idTelemetry: number;
    status: StatusTelemetryResponse;
    url: string;
    message: string;
  }) => Promise<boolean>;
  getTelemetryUrlByCodeField: (
    codeField: string,
    visitId: string
  ) => Promise<string | null>;
};

const initialState: TelemetryState = {
  status: StatusTelemetry.PENDING,
  serie_del_modem: '',
  marca_del_modem: '',
  ip: '',
  puerto: '',
  ime_modem: '',
  fact_modem: '',
  operador_sim: '',
  input_ime_modem: '',
};

export const useTelemetryInstaled = create<TelemetryStore>((set) => ({
  ...initialState,
  setTelemetry: (data: Partial<TelemetryState>) => {
    set(() => ({
      ...initialState,
      ...data,
    }));
  },
  clearTelemetry: () => set(() => ({ ...initialState })),
  saveTelemetryToDatabase: async ({
    visitId,
    codeField,
    idTelemetry,
    statusOverride,
    intent,
    message,
  }) => {
    try {
      const payload: ITableTelemetry = {
        idTelemetry: idTelemetry,
        visitId: visitId,
        codeField,
        status: statusOverride,
        url: '',
        intent: intent ?? 0,
        message: message,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      await upsertTableData<ITableTelemetry>(
        IDataBaseNames.OPERACIONES,
        IDataBaseTables.TELEMETRY,
        payload
      );
      return true;
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
    } catch (_error) {
      return false;
    }
  },
  getTelemetryStatusByCodeField: async (
    codeField: string,
    visitId: string
  ): Promise<StatusTelemetryResponse | null> => {
    try {
      const rows = await getTableDataByQuery<ITableTelemetry>(
        IDataBaseNames.OPERACIONES,
        IDataBaseTables.TELEMETRY,
        async (table) =>
          table
            .where('codeField')
            .equals(codeField)
            .filter((record) => record.visitId === visitId)
            .toArray()
      );
      if (!rows || rows.length === 0) return null;
      const latest = rows.reduce((a, b) => (a.updatedAt > b.updatedAt ? a : b));
      return latest.status;
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
    } catch (_error) {
      return null;
    }
  },
  getTelemetryReadById: async (
    id: string,
    isOnline: boolean
  ): Promise<ITelemetryReadResponse> => {
    return await fetchTelemetryRead(id, isOnline);
  },
  updateTelemetryFromRead: async ({ idTelemetry, status, url, message }) => {
    try {
      // Obtener el registro existente por idTelemetry para obtener el codeField
      const existingRecords = await getTableDataByQuery<ITableTelemetry>(
        IDataBaseNames.OPERACIONES,
        IDataBaseTables.TELEMETRY,
        async (table) =>
          table.where('idTelemetry').equals(idTelemetry).toArray()
      );

      if (!existingRecords || existingRecords.length === 0) {
        return false; // No existe el registro
      }

      const existingRecord = existingRecords[0];
      // Actualizar el registro con los nuevos valores
      const updatedPayload: ITableTelemetry = {
        ...existingRecord,
        status,
        url,
        message,
        updatedAt: new Date(),
      };

      await upsertTableData<ITableTelemetry>(
        IDataBaseNames.OPERACIONES,
        IDataBaseTables.TELEMETRY,
        updatedPayload
      );
      return true;
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
    } catch (_error) {
      return false;
    }
  },
  getTelemetryUrlByCodeField: async (codeField: string, visitId: string) => {
    try {
      const rows = await getTableDataByQuery<ITableTelemetry>(
        IDataBaseNames.OPERACIONES,
        IDataBaseTables.TELEMETRY,
        async (table) =>
          table
            .where('codeField')
            .equals(codeField)
            .filter((record) => record.visitId === visitId)
            .toArray()
      );
      if (!rows || rows.length === 0) return null;
      const latest = rows.reduce((a, b) => (a.updatedAt > b.updatedAt ? a : b));
      return latest.url || null;
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
    } catch (_error) {
      return null;
    }
  },
}));

export type { TelemetryState };
