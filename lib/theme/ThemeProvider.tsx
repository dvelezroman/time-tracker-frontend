'use client';

import { ThemeProvider as MUIThemeProvider } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import { useUIStore } from '@/store/useUIStore';
import { lightTheme, darkTheme } from './theme';

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const { themeMode } = useUIStore();
  const theme = themeMode === 'dark' ? darkTheme : lightTheme;

  return (
    <MUIThemeProvider theme={theme}>
      <CssBaseline />
      {children}
    </MUIThemeProvider>
  );
}
