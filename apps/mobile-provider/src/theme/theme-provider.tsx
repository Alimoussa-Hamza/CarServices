import { createContext, useContext, type ReactNode } from 'react';
import { theme, type AppTheme } from './theme';

const ThemeContext = createContext<AppTheme>(theme);

type ThemeProviderProps = {
  children: ReactNode;
};

export function ThemeProvider({ children }: ThemeProviderProps) {
  return (
    <ThemeContext.Provider value={theme}>{children}</ThemeContext.Provider>
  );
}

export function useTheme(): AppTheme {
  return useContext(ThemeContext);
}
