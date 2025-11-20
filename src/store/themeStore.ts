import { create } from 'zustand';
import { Appearance } from 'react-native';

type ThemeMode = 'light' | 'dark' | 'auto';

interface ThemeStore {
  themeMode: ThemeMode;
  isDark: boolean;
  setThemeMode: (mode: ThemeMode) => void;
  toggleTheme: () => void;
}

const getSystemTheme = (): boolean => {
  return Appearance.getColorScheme() === 'dark';
};

export const useThemeStore = create<ThemeStore>((set, get) => ({
  themeMode: 'auto',
  isDark: getSystemTheme(),

  setThemeMode: (mode: ThemeMode) => {
    if (mode === 'auto') {
      set({ themeMode: mode, isDark: getSystemTheme() });
    } else {
      set({ themeMode: mode, isDark: mode === 'dark' });
    }
  },

  toggleTheme: () => {
    const currentMode = get().themeMode;
    if (currentMode === 'auto') {
      set({ themeMode: 'dark', isDark: true });
    } else if (currentMode === 'dark') {
      set({ themeMode: 'light', isDark: false });
    } else {
      set({ themeMode: 'dark', isDark: true });
    }
  },
}));

// Subscribe to system theme changes
Appearance.addChangeListener(({ colorScheme }) => {
  const store = useThemeStore.getState();
  if (store.themeMode === 'auto') {
    useThemeStore.setState({ isDark: colorScheme === 'dark' });
  }
});

