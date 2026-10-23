// FILE: components/word-row.tsx
// One kept word in the Words list: the word, what it means, and whether it is due for practice.
import { memo } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { useTheme } from '@/theme/theme';

import { Icon } from './icon';

type Props = { id: string; word: string; meaning: string; due: boolean; onOpen: (id: string) => void };

export const WordRow = memo(function WordRow({ id, word, meaning, due, onOpen }: Props) {
  const { c, t } = useTheme();
  return (
    <Pressable
      accessibilityRole="button"
      onPress={() => onOpen(id)}
      style={({ pressed }) => [styles.row, { borderColor: c.line, opacity: pressed ? 0.7 : 1 }]}
    >
      <View style={styles.text}>
        <Text style={t.heading}>{word}</Text>
        <Text style={t.muted} numberOfLines={1}>
          {meaning}
        </Text>
      </View>
      {due ? <View accessibilityLabel="Due for practice" style={[styles.dot, { backgroundColor: c.marigold }]} /> : null}
      <Icon name="chevron" size={14} color={c.muted} />
    </Pressable>
  );
});

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 14, borderBottomWidth: StyleSheet.hairlineWidth },
  text: { flex: 1, gap: 2 },
  dot: { width: 8, height: 8, borderRadius: 4 },
});
