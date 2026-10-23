// FILE: theme/navigation.ts
// The native headers, tab bar and screen backgrounds in Wayword's colours instead of the platform
// defaults, for light and dark mode.
import { DarkTheme, DefaultTheme, type Theme as NavTheme } from 'expo-router/react-navigation';

import type { Palette } from './colors';

export function navigationTheme(c: Palette, dark: boolean): NavTheme {
  const base = dark ? DarkTheme : DefaultTheme;
  return {
    ...base,
    colors: {
      ...base.colors,
      primary: c.accent,
      background: c.background,
      card: c.background,
      text: c.ink,
      border: c.line,
      notification: c.marigold,
    },
  };
}
