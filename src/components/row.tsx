// FILE: components/row.tsx
// The tappable list row every list uses: content on the left, a chevron on the right, a hairline
// underneath and pressed feedback. Lists pass their own content as children.
import { memo, type ReactNode } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import { minTap, space, useTheme } from '@/theme/theme';

import { Icon } from './icon';

type Props = { onPress: () => void; accessibilityLabel: string; leading?: ReactNode; trailing?: ReactNode; children: ReactNode };

export const Row = memo(function Row({ onPress, accessibilityLabel, leading, trailing, children }: Props) {
  const { c } = useTheme();
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
      onPress={onPress}
      style={({ pressed }) => [styles.row, { borderColor: c.line, opacity: pressed ? 0.7 : 1 }]}
    >
      {leading}
      <View style={styles.text}>{children}</View>
      {trailing}
      <Icon name="chevron" size={14} color={c.muted} />
    </Pressable>
  );
});

/** A plain row with the same hairline, for rows that hold their own controls. */
export function Divided({ children }: { children: ReactNode }) {
  const { c } = useTheme();
  return <View style={[styles.row, { borderColor: c.line }]}>{children}</View>;
}

const styles = StyleSheet.create({
  row: {
    minHeight: minTap + space.md,
    flexDirection: 'row',
    alignItems: 'center',
    gap: space.md,
    paddingVertical: space.md,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  text: { flex: 1, gap: 2 },
});
