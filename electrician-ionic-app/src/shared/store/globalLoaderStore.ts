import { create } from 'zustand';

interface GlobalLoaderState {
  forceHide: boolean;
  setForceHide: (hide: boolean) => void;
}

export const useGlobalLoaderStore = create<GlobalLoaderState>((set) => ({
  forceHide: false,
  setForceHide: (hide) => set({ forceHide: hide }),
}));
