import { create } from 'zustand';

interface ScrollStore {
  isScrolling: boolean;
  scrollY: number;
  setIsScrolling: (isScrolling: boolean) => void;
  setScrollY: (scrollY: number) => void;
}

export const useScrollStore = create<ScrollStore>((set) => ({
  isScrolling: false,
  scrollY: 0,
  setIsScrolling: (isScrolling: boolean) => set({ isScrolling }),
  setScrollY: (scrollY: number) => set({ scrollY }),
}));
