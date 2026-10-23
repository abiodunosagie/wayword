// FILE: theme/theme.ts
// `useTheme()` gives every screen the palette for the phone's light or dark setting, plus the
// shared type styles and spacing, so no screen hard-codes a colour or a size.
import { useColorScheme } from 'react-native';

import { dark, light, type Palette } from './colors';

export const space = { xs: 4, sm: 8, md: 12, lg: 16, xl: 24, xxl: 32 } as const;
export const radius = 14;
export const buttonHeight = 54;

// The brand face for headings; body text stays in the system font, which reads best small.
export const fonts = {
  display: 'SchibstedGrotesk-ExtraBold',
  heading: 'SchibstedGrotesk-SemiBold',
} as const;

export function typeFor(c: Palette) {
  return {
    display: { fontFamily: fonts.display, fontSize: 34, lineHeight: 38, letterSpacing: -0.8, color: c.ink },
    title: { fontFamily: fonts.display, fontSize: 26, lineHeight: 31, letterSpacing: -0.5, color: c.ink },
    heading: { fontFamily: fonts.heading, fontSize: 18, lineHeight: 24, color: c.ink },
    body: { fontSize: 16, lineHeight: 23, color: c.ink },
    muted: { fontSize: 15, lineHeight: 21, color: c.muted },
    small: { fontSize: 13, lineHeight: 18, color: c.muted },
    label: { fontSize: 12, lineHeight: 16, fontWeight: '700' as const, letterSpacing: 0.6, color: c.muted },
  };
}

export type Theme = { c: Palette; t: ReturnType<typeof typeFor>; dark: boolean };

const themes = { light: { c: light, t: typeFor(light), dark: false }, dark: { c: dark, t: typeFor(dark), dark: true } };

export function useTheme(): Theme {
  return useColorScheme() === 'dark' ? themes.dark : themes.light;
}
