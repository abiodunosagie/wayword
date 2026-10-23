// FILE: components/section-label.tsx
// The small heading over a group of rows, read out as a heading by screen readers.
import { Text } from 'react-native';

import { useTheme } from '@/theme/theme';

export function SectionLabel({ children }: { children: string }) {
  const { t } = useTheme();
  return (
    <Text style={t.label} accessibilityRole="header">
      {children}
    </Text>
  );
}
