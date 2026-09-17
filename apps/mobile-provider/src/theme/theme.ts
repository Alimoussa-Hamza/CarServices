import { colors as tokenColors, radius, spacing, typography } from '@carservice/ui-tokens';

/** Navy & Steel — overlay local. Do not mutate shared ui-tokens (client stays green). */
export const theme = {
  colors: {
    ...tokenColors,
    brand: {
      ...tokenColors.brand,
      primary: '#0B5FA5',
      primaryLight: '#E7F0FA',
      primaryDark: '#0B1F33',
      secondary: '#0B1F33',
    },
    neutral: {
      ...tokenColors.neutral,
      900: '#0B1F33',
      100: '#F5F7FA',
    },
    semantic: {
      ...tokenColors.semantic,
      success: '#1B8A5A',
      warning: '#B7791E',
      error: '#BE3B33',
    },
  },
  radius,
  spacing,
  typography,
} as const;

export type AppTheme = typeof theme;
