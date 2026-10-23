// Wayword's palette, one set for light mode and one for dark. brand/generate.py draws the icon,
// splash and banners from the same values, so change them in both places.

export type Palette = {
  background: string;
  ink: string;
  muted: string;
  accent: string;
  marigold: string;
};

export const light: Palette = {
  background: '#FFFFFF',
  ink: '#12141A',
  muted: '#5E636E',
  accent: '#2346B5',
  marigold: '#F2A93B',
};

export const dark: Palette = {
  background: '#0E1016',
  ink: '#F4F1EA',
  muted: '#9DA2AD',
  accent: '#8AA2FF',
  marigold: '#F2A93B',
};
