// FILE: components/word-row.tsx
// One kept word in the Words list: the word, what it means, and a marigold dot when it is due.
import { memo } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { useTheme } from '@/theme/theme';

import { Row } from './row';

type Props = { id: string; word: string; meaning: string; due: boolean; onOpen: (id: string) => void };

export const WordRow = memo(function WordRow({ id, word, meaning, due, onOpen }: Props) {
  const { c, t } = useTheme();
  return (
    <Row
      onPress={() => onOpen(id)}
      accessibilityLabel={`${word}, ${meaning}${due ? ', due for practice' : ''}`}
      trailing={due ? <View style={[styles.dot, { backgroundColor: c.marigold }]} /> : undefined}
    >
      <Text style={t.heading}>{word}</Text>
      <Text style={t.muted} numberOfLines={1}>
        {meaning}
      </Text>
    </Row>
  );
});

const styles = StyleSheet.create({ dot: { width: 8, height: 8, borderRadius: 4 } });
