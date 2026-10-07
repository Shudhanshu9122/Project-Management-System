import { useColorScheme } from 'react-native';

// Same indigo/violet palette as the web app so the two feel like one product.
const brand = {
  brand50: '#eef2ff',
  brand100: '#e0e7ff',
  brand300: '#a5b4fc',
  brand500: '#6366f1',
  brand600: '#4f46e5',
  brand700: '#4338ca',
  violet600: '#7c3aed',
  green500: '#10b981',
  green600: '#059669',
  amber500: '#f59e0b',
  amber600: '#d97706',
  red500: '#ef4444',
  red600: '#dc2626',
  blue500: '#3b82f6',
};

const spacing = { xs: 4, sm: 8, md: 12, lg: 16, xl: 24, xxl: 32 };
const radius = { sm: 8, md: 12, lg: 16, pill: 999 };

const light = {
  mode: 'light',
  background: '#f6f7fb',
  surface: '#ffffff',
  surfaceMuted: '#f8fafc',
  border: '#e6e8ef',
  borderStrong: '#d3d7e3',
  text: '#101828',
  textMuted: '#5a6478',
  textSubtle: '#8b93a7',
  tints: {
    neutral: { bg: '#eef0f5', text: '#495065' },
    info: { bg: '#e8effd', text: '#1c4ba8' },
    success: { bg: '#e7f8f0', text: '#05653f' },
    warning: { bg: '#fdf3e1', text: '#8a4b06' },
    danger: { bg: '#fdeaea', text: '#a01a1a' },
  },
};

const dark = {
  mode: 'dark',
  background: '#0c0f1a',
  surface: '#141827',
  surfaceMuted: '#1a1f31',
  border: '#262d43',
  borderStrong: '#333c58',
  text: '#eef1f8',
  textMuted: '#a3abbf',
  textSubtle: '#7b8399',
  tints: {
    neutral: { bg: '#232939', text: '#b3bace' },
    info: { bg: '#151f3a', text: '#8fb4ff' },
    success: { bg: '#10291f', text: '#52d6a0' },
    warning: { bg: '#2c2211', text: '#f0bb62' },
    danger: { bg: '#2e1618', text: '#f79c9c' },
  },
};

export const colours = brand;

// Dark mode follows the device setting; there is no in-app switch on mobile.
export function useAppTheme() {
  const scheme = useColorScheme();
  return { ...(scheme === 'dark' ? dark : light), spacing, radius, brand };
}
