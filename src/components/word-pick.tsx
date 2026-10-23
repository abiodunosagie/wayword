// FILE: components/word-pick.tsx
// One word Claude suggested from a photo: tick it to keep it, or it shows as kept already.
import { memo } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import type { SnapWord } from '@/lib/types';
import { useTheme } from '@/theme/theme';

import { Icon } from './icon';

type Props = { word: SnapWord; picked: boolean; kept: boolean; onToggle: (word: string) => void; onHear: (text: string) => void };

export const WordPick = memo(function WordPick({ word, picked, kept, onToggle, onHear }: Props) {
  const { c, t } = useTheme();
  return (
    <View style={[styles.row, { borderColor: c.line }]}>
      <Pressable
        accessibilityRole="checkbox"
        accessibilityState={{ checked: kept || picked, disabled: kept }}
        accessibilityLabel={`Keep ${word.word}`}
        onPress={kept ? undefined : () => onToggle(word.word)}
        style={styles.main}
      >
        <Icon name={kept || picked ? 'checked' : 'unchecked'} color={kept ? c.muted : picked ? c.accent : c.muted} />
        <View style={styles.text}>
          <Text style={t.heading} selectable>
            {word.word}
          </Text>
          <Text style={t.body}>{word.meaning}</Text>
          {word.pronunciation ? <Text style={t.small}>{word.pronunciation}</Text> : null}
          {kept ? <Text style={[t.small, { color: c.success }]}>Already in your words</Text> : null}
        </View>
      </Pressable>
      <Pressable accessibilityRole="button" accessibilityLabel={`Hear ${word.word}`} hitSlop={10} onPress={() => onHear(word.word)}>
        <Icon name="speak" color={c.accent} />
      </Pressable>
    </View>
  );
});

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'flex-start', gap: 12, paddingVertical: 14, borderBottomWidth: StyleSheet.hairlineWidth },
  main: { flex: 1, flexDirection: 'row', gap: 12 },
  text: { flex: 1, gap: 2 },
});
