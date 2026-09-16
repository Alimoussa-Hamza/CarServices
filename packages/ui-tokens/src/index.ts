export const colors = {
  brand: {
    primary: '#0D6E4F',
    primaryLight: '#E8F5F0',
    primaryDark: '#094D38',
    secondary: '#1A3A5C',
    accent: '#F5A623',
  },
  neutral: {
    900: '#1A1A2E',
    700: '#4A4A68',
    500: '#8E8EA9',
    300: '#D1D1DE',
    100: '#F4F4F8',
    0: '#FFFFFF',
  },
  semantic: {
    success: '#2E7D4F',
    warning: '#E67E22',
    error: '#D32F2F',
    info: '#1976D2',
  },
} as const;

export const spacing = {
  2: 4,
  3: 8,
  4: 12,
  5: 16,
  6: 20,
  7: 24,
  8: 32,
  9: 40,
  10: 48,
} as const;

export const radius = {
  sm: 8,
  md: 12,
  lg: 16,
  full: 999,
} as const;

export const typography = {
  fontFamily: {
    /** Web / admin fallback stack */
    sans: 'Inter, system-ui, sans-serif',
    /** RN: loaded via expo-font (Inter until brand fonts land) */
    display: 'Inter',
    body: 'Inter',
  },
  size: {
    display: 32,
    title: 24,
    body: 16,
    caption: 14,
    label: 12,
  },
  lineHeight: {
    display: 40,
    title: 32,
    body: 24,
    caption: 20,
    label: 16,
  },
} as const;
