import { Preferences } from '@capacitor/preferences';

export const storageManager = {
  getItem: async (key: string): Promise<string | null> => {
    try {
      const { value } = await Preferences.get({ key });
      return value;
    } catch (error) {
      console.error('Error al obtener el item del storage:', error);
      return null;
    }
  },
  setItem: async (key: string, value: string): Promise<void> => {
    try {
      await Preferences.set({ key, value });
    } catch (error) {
      console.error('Error al guardar el item en el storage:', error);
    }
  },
  removeItem: async (key: string): Promise<void> => {
    await Preferences.remove({ key });
  },
  clear: async (): Promise<void> => {
    await Preferences.clear();
  },
};
