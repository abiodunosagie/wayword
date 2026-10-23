// FILE: theme/colors.ts
// Wayword's palette, one set for light mode and one for dark. brand/generate.py draws the icon,
// splash and banners from the same values, so change them in both places.

export type Palette = {
  background: string;
  surface: string;
  line: string;
  ink: string;
  muted: string;
  accent: string;
  onAccent: string;
  accentSoft: string;
  marigold: string;
  danger: string;
  success: string;
};

export const light: Palette = {
  background: '#FFFFFF',
  surface: '#F5F4F0',
  line: '#E6E4DE',
  ink: '#12141A',
  muted: '#5E636E',
  accent: '#2346B5',
  onAccent: '#FFFFFF',
  accentSoft: '#E8EDFB',
  marigold: '#F2A93B',
  danger: '#B3261E',
  success: '#1F7A4D',
};

export const dark: Palette = {
  background: '#0E1016',
  surface: '#171A22',
  line: '#272B35',
  ink: '#F4F1EA',
  muted: '#9DA2AD',
  accent: '#8AA2FF',
  onAccent: '#0E1016',
  accentSoft: '#1C2440',
  marigold: '#F2A93B',
  danger: '#F2B8B5',
  success: '#7FD1A6',
};
