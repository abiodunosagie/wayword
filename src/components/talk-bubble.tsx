// FILE: components/talk-bubble.tsx
// One line of a role play. The other person's lines sit left with a speaker button and their
// meaning one tap away, plus any new words to keep; yours sit right, with Claude's correction
// underneath when the line needed one.
import { memo, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import type { TalkTurn } from '@/lib/types';
import { radius, useTheme } from '@/theme/theme';

import { Icon } from './icon';

type Props = {
  turn: TalkTurn;
  kept: ReadonlySet<string>;
  onHear: (text: string) => void;
  onKeep: (word: { word: string; meaning: string }) => void;
};

export const TalkBubble = memo(function TalkBubble({ turn, kept, onHear, onKeep }: Props) {
  const { c, t } = useTheme();
  const [showMeaning, setShowMeaning] = useState(false);

  if (turn.role === 'user') {
    return (
      <View style={styles.right}>
        <View style={[styles.bubble, { backgroundColor: c.accent }]}>
          <Text style={[t.body, { color: c.onAccent }]} selectable>
            {turn.text}
          </Text>
        </View>
        {turn.corrected ? (
          <View style={[styles.fix, { borderColor: c.marigold }]}>
            <Text style={t.small}>More natural</Text>
            <Text style={t.body} selectable>
              {turn.corrected}
            </Text>
            {turn.why ? <Text style={t.small}>{turn.why}</Text> : null}
          </View>
        ) : null}
      </View>
    );
  }

  return (
    <View style={styles.left}>
      <View style={[styles.bubble, { backgroundColor: c.surface }]}>
        <Text style={t.body} selectable>
          {turn.text}
        </Text>
        {showMeaning && turn.meaning ? <Text style={t.muted}>{turn.meaning}</Text> : null}
        <View style={styles.tools}>
          <Pressable accessibilityRole="button" accessibilityLabel="Hear it" hitSlop={10} onPress={() => onHear(turn.text)}>
            <Icon name="speak" size={20} color={c.accent} />
          </Pressable>
          {turn.meaning ? (
            <Pressable accessibilityRole="button" hitSlop={10} onPress={() => setShowMeaning((v) => !v)}>
              <Text style={{ color: c.accent, fontWeight: '600' }}>{showMeaning ? 'Hide meaning' : 'Meaning'}</Text>
            </Pressable>
          ) : null}
        </View>
      </View>
      {turn.words?.map((w) => {
        const done = kept.has(w.word);
        return (
          <Pressable
            key={w.word}
            accessibilityRole="button"
            accessibilityState={{ disabled: done }}
            onPress={done ? undefined : () => onKeep(w)}
            style={[styles.word, { borderColor: c.line }]}
          >
            <Icon name={done ? 'checked' : 'unchecked'} size={18} color={done ? c.success : c.accent} />
            <Text style={[t.small, styles.flex]}>
              <Text style={{ color: c.ink, fontWeight: '600' }}>{w.word}</Text> · {w.meaning}
            </Text>
            <Text style={[t.small, { color: done ? c.success : c.accent }]}>{done ? 'Kept' : 'Keep'}</Text>
          </Pressable>
        );
      })}
    </View>
  );
});

const styles = StyleSheet.create({
  left: { alignSelf: 'flex-start', maxWidth: '88%', gap: 6 },
  right: { alignSelf: 'flex-end', maxWidth: '88%', gap: 6, alignItems: 'flex-end' },
  bubble: { borderRadius: radius, borderCurve: 'continuous', paddingHorizontal: 14, paddingVertical: 10, gap: 6 },
  fix: { borderLeftWidth: 3, paddingLeft: 10, gap: 2, alignSelf: 'stretch' },
  tools: { flexDirection: 'row', alignItems: 'center', gap: 16 },
  word: { flexDirection: 'row', alignItems: 'center', gap: 8, borderWidth: StyleSheet.hairlineWidth, borderRadius: 10, paddingHorizontal: 10, paddingVertical: 8 },
  flex: { flex: 1 },
});
