// FILE: app/(tabs)/(practise)/practise.tsx
// Practise the words that are due, one card at a time, fully offline. See the word, try to recall
// it, show the answer, then say how well you knew it; each button says when the card comes back.
// A card you missed comes round again before the session ends.
import * as Haptics from 'expo-haptics';
import { Image } from 'expo-image';
import { useFocusEffect } from 'expo-router';
import { useSQLiteContext } from 'expo-sqlite';
import { useCallback, useEffect, useRef, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { Button } from '@/components/button';
import { Icon } from '@/components/icon';
import { LoadFailed, Loading, Page } from '@/components/screen';
import { dueCards, gradeCard } from '@/db/cards';
import { getSnap } from '@/db/snaps';
import { plural } from '@/lib/format';
import { photoUri } from '@/lib/photos';
import { say } from '@/lib/speech';
import { type Grade, whenNext } from '@/lib/srs';
import type { Card } from '@/lib/types';
import { useLanguagePair } from '@/state/prefs';
import { useAccount } from '@/state/session';
import { minTap, rounded, space, useTheme } from '@/theme/theme';

const GRADES: { grade: Grade; label: string }[] = [
  { grade: 'again', label: 'Again' },
  { grade: 'hard', label: 'Hard' },
  { grade: 'good', label: 'Good' },
  { grade: 'easy', label: 'Easy' },
];

// [target] is the language the cards are in, so switching language starts a fresh session.
// [at] is when the current card came up, for the "comes back" labels.
type Session = { target: string; queue: Card[]; done: number; photo: string | null; at: number };

export default function PractiseScreen() {
  const { c, t } = useTheme();
  const db = useSQLiteContext();
  const account = useAccount();
  const prefs = useLanguagePair();
  const [session, setSession] = useState<Session | null>(null);
  const [failed, setFailed] = useState(false);
  const [revealed, setRevealed] = useState(false);
  const [grading, setGrading] = useState(false);
  // Read by the focus effect without making it re-run every time the session changes.
  const latest = useRef<Session | null>(null);
  useEffect(() => {
    latest.current = session;
  }, [session]);

  const photoFor = useCallback(
    async (card: Card | undefined) => {
      if (!card?.snap_id) return null;
      const snap = await getSnap(db, account.id, card.snap_id);
      return snap ? photoUri(snap.photo) : null;
    },
    [db, account.id],
  );

  /** Fills the queue with what is due; the count of cards done carries on within one language. */
  const load = useCallback(async () => {
    setFailed(false);
    try {
      const now = Date.now();
      const queue = await dueCards(db, account.id, prefs.target, now);
      const prev = latest.current;
      const done = prev && prev.target === prefs.target ? prev.done : 0;
      setRevealed(false);
      setSession({ target: prefs.target, queue, done, photo: await photoFor(queue[0]), at: now });
    } catch {
      setFailed(true);
    }
  }, [db, account.id, prefs.target, photoFor]);

  // On every visit: keep a session in progress, refill an empty one, start over after a language
  // change. It runs once per focus, because nothing it depends on changes while you practise.
  useFocusEffect(
    useCallback(() => {
      const prev = latest.current;
      if (!prev || prev.queue.length === 0 || prev.target !== prefs.target) load();
    }, [load, prefs.target]),
  );

  if (failed) return <LoadFailed onRetry={load} />;
  if (!session) return <Loading />;
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
      setSession({
        ...session,
        queue,
        done: session.done + (g === 'again' ? 0 : 1),
        photo: await photoFor(queue[0]),
        at: Date.now(),
      });
    } finally {
      setGrading(false);
    }
  };

  if (!card) {
    return (
      <Page gap={space.lg}>
        <Text style={t.title}>{session.done > 0 ? 'Done for now.' : 'Nothing to practise yet.'}</Text>
        <Text style={t.muted}>
          {session.done > 0
            ? `You practised ${plural(session.done, 'word')}. Each one comes back just before you would forget it.`
            : 'Keep words from a photo and they show up here when they are due.'}
        </Text>
        {session.done > 0 ? <Button label="Check for more" kind="secondary" onPress={load} /> : null}
      </Page>
    );
  }

  return (
    <Page gap={space.lg}>
      <Text style={[t.small, styles.count]}>
        {session.done} done · {session.queue.length} left
      </Text>
      <View style={[styles.card, { backgroundColor: c.surface }]}>
        {session.photo ? <Image source={{ uri: session.photo }} style={styles.photo} contentFit="cover" /> : null}
        <View style={styles.cardBody}>
          <View style={styles.wordRow}>
            <Text style={[t.display, styles.flex]}>{card.word}</Text>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={`Hear ${card.word}`}
              style={styles.tap}
              onPress={() => say(card.word, card.target)}
            >
              <Icon name="speak" size={28} color={c.accent} />
            </Pressable>
          </View>
          {revealed ? (
            <View style={styles.answer}>
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
        GRADES.map(({ grade: g, label }) => (
          <Button
            key={g}
            label={`${label}, back ${whenNext(card, g, session.at)}`}
            kind={g === 'good' ? 'primary' : 'secondary'}
            onPress={() => grade(g)}
            disabled={grading}
          />
        ))
      ) : (
        <Button label="Show the answer" onPress={() => setRevealed(true)} />
      )}
    </Page>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  count: { fontVariant: ['tabular-nums'] },
  card: { ...rounded, overflow: 'hidden' },
  photo: { width: '100%', aspectRatio: 16 / 9 },
  cardBody: { padding: space.xl, gap: space.lg },
  wordRow: { flexDirection: 'row', alignItems: 'flex-start', gap: space.md },
  tap: { minWidth: minTap, minHeight: minTap, alignItems: 'center', justifyContent: 'center' },
  answer: { gap: space.lg },
  example: { gap: space.xs },
});
