import { create } from 'zustand';
import { IVisit } from '@visits/data/interfaces/visits.interface';

interface VisitState {
  visit: IVisit;
  hydrated: boolean;
  setVisit: (visit: IVisit) => void;
  loadVisit: () => void;
}

export const useVisitStore = create<VisitState>((set) => ({
  visit: {} as IVisit,
  hydrated: false,
  setVisit: async (visit: IVisit) => {
    set({ visit });

    // await storageManager.setItem('visit-storage', JSON.stringify({ visit }));
  },

  loadVisit: async () => {
    // const savedData = await storageManager.getItem('visit-storage');
    // if (savedData) {
    //   const { visit } = JSON.parse(savedData);
    //   set({ visit, hydrated: true });
    // } else {
    //   set({ hydrated: true });
    // }
  },
}));
