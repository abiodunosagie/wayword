// FILE: app/(tabs)/(practise)/practise.tsx
// Practise the words that are due, one card at a time, fully offline. See the word, try to recall
// it, show the answer, then say how well you knew it; each button shows when the card comes back.
// A card you missed comes round again before the session ends.
import * as Haptics from 'expo-haptics';
import { Image } from 'expo-image';
import { useFocusEffect } from 'expo-router';
import { useSQLiteContext } from 'expo-sqlite';
import { useCallback, useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import { Button } from '@/components/button';
import { Icon } from '@/components/icon';
import { dueCards, gradeCard } from '@/db/cards';
import { getSnap } from '@/db/snaps';
import { plural } from '@/lib/format';
import { photoUri } from '@/lib/photos';
import { say } from '@/lib/speech';
import { type Grade, whenNext } from '@/lib/srs';
import type { Card } from '@/lib/types';
import { useLanguagePair } from '@/state/prefs';
import { useAccount } from '@/state/session';
import { radius, space, useTheme } from '@/theme/theme';

const GRADES: { grade: Grade; label: string }[] = [
  { grade: 'again', label: 'Again' },
  { grade: 'hard', label: 'Hard' },
  { grade: 'good', label: 'Good' },
  { grade: 'easy', label: 'Easy' },
];

// [at] is when the current card came up, for the "comes back in" labels.
type Session = { queue: Card[]; done: number; photo: string | null; at: number };

export default function PractiseScreen() {
  const { c, t } = useTheme();
  const db = useSQLiteContext();
  const account = useAccount();
  const prefs = useLanguagePair();
  const [session, setSession] = useState<Session | null>(null);
  const [revealed, setRevealed] = useState(false);
  const [grading, setGrading] = useState(false);

  const photoFor = useCallback(
    async (card: Card | undefined) => {
      if (!card?.snap_id) return null;
      const snap = await getSnap(db, account.id, card.snap_id);
      return snap ? photoUri(snap.photo) : null;
    },
    [db, account.id],
  );

  const load = useCallback(async () => {
    const now = Date.now();
    const queue = await dueCards(db, account.id, prefs.target, now);
    setRevealed(false);
    setSession({ queue, done: 0, photo: await photoFor(queue[0]), at: now });
  }, [db, account.id, prefs.target, photoFor]);

  // A session in progress stays as it is when you switch tabs and come back.
  useFocusEffect(
    useCallback(() => {
      if (!session || session.queue.length === 0) load().catch(() => setSession({ queue: [], done: 0, photo: null, at: 0 }));
    }, [session, load]),
  );

  if (!session) return <ActivityIndicator style={styles.center} color={c.muted} />;
  const card = session.queue[0];

  const grade = async (g: Grade) => {
    if (!card || grading) return;
    setGrading(true);
    try {
      const next = await gradeCard(db, account.id, card, g);
      if (process.env.EXPO_OS === 'ios') Haptics.selectionAsync();
      const rest = session.queue.slice(1);
      const queue = g === 'again' ? [...rest, next] : rest;
      setRevealed(false);
      setSession({ queue, done: session.done + (g === 'again' ? 0 : 1), photo: await photoFor(queue[0]), at: Date.now() });
    } finally {
      setGrading(false);
    }
  };

  if (!card) {
    return (
      <ScrollView contentInsetAdjustmentBehavior="automatic" style={{ backgroundColor: c.background }} contentContainerStyle={styles.pad}>
        <View style={styles.gap}>
          <Text style={t.title}>{session.done > 0 ? 'Done for now.' : 'Nothing to practise yet.'}</Text>
          <Text style={t.muted}>
            {session.done > 0
              ? `You practised ${plural(session.done, 'word')}. Each one comes back when you are about to forget it.`
              : 'Keep words from a photo and they show up here when they are due.'}
          </Text>
          {session.done > 0 ? <Button label="Check for more" kind="secondary" onPress={() => load()} /> : null}
        </View>
      </ScrollView>
    );
  }

  return (
    <ScrollView contentInsetAdjustmentBehavior="automatic" style={{ backgroundColor: c.background }} contentContainerStyle={[styles.pad, styles.gap]}>
      <Text style={[t.small, styles.count]}>
        {session.done} done · {session.queue.length} left
      </Text>
      <View style={[styles.card, { backgroundColor: c.surface }]}>
        {session.photo ? <Image source={{ uri: session.photo }} style={styles.photo} contentFit="cover" /> : null}
        <View style={styles.cardBody}>
          <View style={styles.wordRow}>
            <Text style={[t.display, styles.flex]}>{card.word}</Text>
            <Pressable accessibilityRole="button" accessibilityLabel="Hear it" hitSlop={12} onPress={() => say(card.word, card.target)}>
              <Icon name="speak" size={28} color={c.accent} />
            </Pressable>
          </View>
          {revealed ? (
            <View style={styles.gap}>
              {card.pronunciation ? <Text style={t.muted}>{card.pronunciation}</Text> : null}
              <Text style={t.title}>{card.meaning}</Text>
              {card.example ? (
                <View style={styles.example}>
                  <Text style={t.body}>{card.example}</Text>
                  {card.example_meaning ? <Text style={t.muted}>{card.example_meaning}</Text> : null}
                </View>
              ) : null}
            </View>
          ) : (
            <Text style={t.muted}>What does it mean? Say it out loud, then check.</Text>
          )}
        </View>
      </View>
      {revealed ? (
        <View style={styles.grid}>
          {GRADES.map(({ grade: g, label }) => (
            <View key={g} style={styles.cell}>
              <Button label={label} kind={g === 'good' ? 'primary' : 'secondary'} onPress={() => grade(g)} disabled={grading} />
              <Text style={[t.small, styles.when]}>{whenNext(card, g, session.at)}</Text>
            </View>
          ))}
        </View>
      ) : (
        <Button label="Show the answer" onPress={() => setRevealed(true)} />
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  pad: { padding: space.xl, paddingBottom: space.xxl * 2 },
  gap: { gap: space.lg },
  flex: { flex: 1 },
  count: { fontVariant: ['tabular-nums'] },
  card: { borderRadius: radius, borderCurve: 'continuous', overflow: 'hidden' },
  photo: { width: '100%', aspectRatio: 16 / 9 },
  cardBody: { padding: space.xl, gap: space.lg },
  wordRow: { flexDirection: 'row', alignItems: 'flex-start', gap: space.md },
  example: { gap: space.xs },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: space.md },
  cell: { flexBasis: '46%', flexGrow: 1, gap: space.xs },
  when: { textAlign: 'center' },
});
