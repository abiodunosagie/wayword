// FILE: components/list-row.tsx
// A plain tappable row: a title, an optional detail line, and a chevron.
import { memo } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { useTheme } from '@/theme/theme';

import { Icon } from './icon';

export const ListRow = memo(function ListRow({ title, detail, onPress }: { title: string; detail?: string; onPress: () => void }) {
  const { c, t } = useTheme();
  return (
    <Pressable
      accessibilityRole="button"
      onPress={onPress}
      style={({ pressed }) => [styles.row, { borderColor: c.line, opacity: pressed ? 0.7 : 1 }]}
    >
      <View style={styles.text}>
        <Text style={t.body}>{title}</Text>
        {detail ? <Text style={t.small}>{detail}</Text> : null}
      </View>
      <Icon name="chevron" size={14} color={c.muted} />
    </Pressable>
  );
});

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 14, borderBottomWidth: StyleSheet.hairlineWidth },
  text: { flex: 1, gap: 2 },
});
