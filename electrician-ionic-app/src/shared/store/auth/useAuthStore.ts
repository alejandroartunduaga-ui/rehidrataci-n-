import { create } from 'zustand';
import { ISession, IUserDetailsResponse } from '@auth/index';
import mixpanel from 'mixpanel-browser';
import { clearAllTables, deleteDatabase } from '@shared/db/databaseService';
import { IDataBaseNames } from '@shared/data/IDatabase';
import { MixpanelProps, storageManager } from '@shared/index';

interface AuthState {
  session: ISession | null;
  user: IUserDetailsResponse | null;
  token: string | null;
  refreshToken: string | null;
  isAuthenticated: boolean;
  hydrated: boolean;
  login: (session: ISession, token: string, refreshToken: string) => void;
  saveUser: (user: IUserDetailsResponse, mixpanelProps: MixpanelProps) => void;
  logout: () => void;
  initializeAuth: () => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  session: null,
  user: null,
  token: null,
  refreshToken: null,
  isAuthenticated: false,
  hydrated: false,

  login: async (session: ISession, token: string, refreshToken: string) => {
    const date = new Date().toISOString();
    set({ session, token, refreshToken });
    const savedData = localStorage.getItem('auth-storage');
    const savedDataUsers = await storageManager.getItem('auth-storage-users');
    const propsMixpanel = await storageManager.getItem('propsMixpanel');
    if (savedDataUsers) {
      storageManager.setItem(
        'auth-storage-users',
        JSON.stringify({ ...JSON.parse(savedDataUsers), session })
      );
      storageManager.setItem('propsMixpanel', JSON.stringify(propsMixpanel));
    } else {
      storageManager.setItem('auth-storage-users', JSON.stringify({ session }));
      storageManager.setItem('propsMixpanel', JSON.stringify(propsMixpanel));
    }
    if (savedData) {
      localStorage.setItem(
        'auth-storage',
        JSON.stringify({ ...JSON.parse(savedData), session, date })
      );
    } else {
      localStorage.setItem('auth-storage', JSON.stringify({ session, date }));
    }
  },

  saveUser: async (
    user: IUserDetailsResponse,
    mixpanelProps: MixpanelProps
  ) => {
    const date = new Date().toISOString();
    set({ user, isAuthenticated: true });
    const savedData = localStorage.getItem('auth-storage');
    const savedDataUsers = await storageManager.getItem('auth-storage-users');
    storageManager.setItem(
      'auth-storage-users',
      JSON.stringify({ ...JSON.parse(savedDataUsers!), user })
    );
    storageManager.setItem('propsMixpanel', JSON.stringify(mixpanelProps));
    if (savedData) {
      localStorage.setItem(
        'auth-storage',
        JSON.stringify({ ...JSON.parse(savedData), user, date })
      );
    }
  },

  logout: async () => {
    mixpanel.reset();
    set({
      session: null,
      user: null,
      token: null,
      refreshToken: null,
      isAuthenticated: false,
    });
    // localStorage.removeItem('auth-storage'); // clear local storage
    localStorage.clear();
    sessionStorage.clear();
    await clearAllTables(IDataBaseNames.OPERACIONES);
    await deleteDatabase(IDataBaseNames.OPERACIONES);
  },

  initializeAuth: () => {
    const savedData = localStorage.getItem('auth-storage');
    if (savedData) {
      const { user, session } = JSON.parse(savedData);
      set({ session, user, isAuthenticated: true, hydrated: true });
    } else {
      set({ hydrated: true });
    }
  },
}));
