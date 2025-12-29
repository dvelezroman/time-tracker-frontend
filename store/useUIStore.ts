import { create } from 'zustand';
import { persist } from 'zustand/middleware';

type ThemeMode = 'light' | 'dark';
type Locale = 'en' | 'es' | 'fr';

interface UIState {
  themeMode: ThemeMode;
  setThemeMode: (mode: ThemeMode) => void;
  toggleTheme: () => void;
  isLoading: boolean;
  setLoading: (loading: boolean) => void;
  locale: Locale;
  setLocale: (locale: Locale) => void;
}

export const useUIStore = create<UIState>()(
  persist(
    (set) => ({
      themeMode: 'light',
      setThemeMode: (mode) => set({ themeMode: mode }),
      toggleTheme: () =>
        set((state) => ({
          themeMode: state.themeMode === 'light' ? 'dark' : 'light',
        })),
      isLoading: false,
      setLoading: (loading) => set({ isLoading: loading }),
      locale: 'en',
      setLocale: (locale) => set({ locale }),
    }),
    {
      name: 'ui-storage',
      partialize: (state) => ({ themeMode: state.themeMode, locale: state.locale }),
    }
  )
);
