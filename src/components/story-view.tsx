// FILE: components/story-view.tsx
// A story Claude wrote from your words: the title, then each paragraph with its meaning one tap
// away and a speaker to hear it, and the words it used.
import { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { say } from '@/lib/speech';
import type { Story } from '@/lib/types';
import { minTap, space, useTheme } from '@/theme/theme';

import { Icon } from './icon';
import { TextLink } from './text-link';

export function StoryView({ story }: { story: Story }) {
  const { c, t } = useTheme();
  const [open, setOpen] = useState<Set<number>>(new Set());
  const toggle = (i: number) =>
    setOpen((prev) => {
      const next = new Set(prev);
      if (next.has(i)) next.delete(i);
      else next.add(i);
      return next;
    });
  return (
    <View style={styles.wrap}>
      <View>
        <Text style={t.title} selectable>
          {story.title}
        </Text>
        <Text style={t.muted}>{story.title_meaning}</Text>
      </View>
      {story.paragraphs.map((p, i) => (
        <View key={i} style={styles.paragraph}>
          <Text style={t.body} selectable>
            {p.text}
          </Text>
          {open.has(i) ? <Text style={t.muted}>{p.meaning}</Text> : null}
          <View style={styles.tools}>
            <Pressable accessibilityRole="button" accessibilityLabel="Hear this paragraph" style={styles.tap} onPress={() => say(p.text, story.target)}>
              <Icon name="speak" size={20} color={c.accent} />
            </Pressable>
            <TextLink label={open.has(i) ? 'Hide meaning' : 'Meaning'} onPress={() => toggle(i)} />
          </View>
        </View>
      ))}
      {story.used.length > 0 ? (
        <Text style={t.small}>
          Your words in it: <Text style={{ color: c.ink }}>{story.used.join(', ')}</Text>
        </Text>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { gap: space.lg },
  paragraph: { gap: space.sm },
  tools: { flexDirection: 'row', alignItems: 'center', gap: space.lg },
  tap: { minWidth: minTap, minHeight: minTap, justifyContent: 'center' },
});
