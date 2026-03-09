import { create } from 'zustand';
import { DateRange } from 'react-day-picker';

interface WorkOrdersFiltersState {
  code: string;
  dateRange: DateRange | undefined;
  types: string[];
  status: string[];
  contractor: string[];
  electrician: string[];
  city: string[];
  networkOperator: string[];
  acta: string[];
  page: number;
  setCode: (code: string) => void;
  setDateRange: (dateRange: DateRange | undefined) => void;
  setTypes: (types: string[]) => void;
  setStatus: (status: string[]) => void;
  setContractor: (contractor: string[]) => void;
  setElectrician: (electrician: string[]) => void;
  setCity: (city: string[]) => void;
  setNetworkOperator: (networkOperator: string[]) => void;
  setActa: (acta: string[]) => void;
  setPage: (page: number) => void;
  clearFilters: () => void;
}

const initialState = {
  code: '',
  dateRange: undefined,
  types: ['__all__'],
  status: ['__all__'],
  contractor: ['__all__'],
  electrician: ['__all__'],
  city: ['__all__'],
  networkOperator: ['__all__'],
  acta: ['__all__'],
  page: 0,
};

export const useWorkOrdersFiltersStore = create<WorkOrdersFiltersState>(
  (set) => ({
    ...initialState,
    setCode: (code: string) => set({ code, page: 0 }),
    setDateRange: (dateRange: DateRange | undefined) =>
      set({ dateRange, page: 0 }),
    setTypes: (types: string[]) => set({ types, page: 0 }),
    setStatus: (status: string[]) => set({ status, page: 0 }),
    setContractor: (contractor: string[]) => set({ contractor, page: 0 }),
    setElectrician: (electrician: string[]) => set({ electrician, page: 0 }),
    setCity: (city: string[]) => set({ city, page: 0 }),
    setNetworkOperator: (networkOperator: string[]) =>
      set({ networkOperator, page: 0 }),
    setActa: (acta: string[]) => set({ acta, page: 0 }),
    setPage: (page: number) => set({ page }),
    clearFilters: () => set(initialState),
  })
);
