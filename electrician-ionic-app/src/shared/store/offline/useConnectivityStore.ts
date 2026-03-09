import { create } from 'zustand';

interface ConnectivityState {
  isOnline: boolean | null;
  setOnlineStatus: (status: boolean | null) => void;
}

export const useConnectivityStore = create<ConnectivityState>((set) => ({
  isOnline: null,
  setOnlineStatus: (status: boolean | null) => set({ isOnline: status }),
}));
