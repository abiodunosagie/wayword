// FILE: components/mark.tsx
// The Wayword tag, from the same files the splash screen uses, in the right colours for light or
// dark mode.
import { Image } from 'react-native';

import { useTheme } from '@/theme/theme';

const LIGHT = require('../../assets/splash-icon.png');
const DARK = require('../../assets/splash-icon-dark.png');

export function Mark({ size = 56 }: { size?: number }) {
  const { dark } = useTheme();
  // The tag fills the middle 80% of its square file; the negative margin lines its edge up with text.
  return (
    <Image
      source={dark ? DARK : LIGHT}
      style={{ width: size, height: size, marginLeft: -size * 0.1 }}
      accessibilityLabel="Wayword"
    />
  );
}
