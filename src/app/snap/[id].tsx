// FILE: app/snap/[id].tsx
// What Claude read in one photo: the photo, what it means for you, the text and its translation,
// and the words worth keeping. Tick the ones you want and keep them; they go straight into practice.
import * as Haptics from 'expo-haptics';
import { Image } from 'expo-image';
import { router, Stack, useLocalSearchParams } from 'expo-router';
import { useSQLiteContext } from 'expo-sqlite';
import { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import { Button } from '@/components/button';
import { Notice } from '@/components/notice';
import { WordPick } from '@/components/word-pick';
import { keepWords, keptWords } from '@/db/cards';
import { deleteSnap, getSnap } from '@/db/snaps';
import { plural } from '@/lib/format';
import { deletePhoto, photoUri } from '@/lib/photos';
import { say } from '@/lib/speech';
import type { Snap } from '@/lib/types';
import { useAccount } from '@/state/session';
import { radius, space, useTheme } from '@/theme/theme';

export default function SnapResult() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { c, t } = useTheme();
  const db = useSQLiteContext();
  const account = useAccount();
  const [snap, setSnap] = useState<Snap | null | undefined>(undefined);
  const [kept, setKept] = useState<Set<string>>(new Set());
  const [picked, setPicked] = useState<Set<string>>(new Set());
  const [showTranslation, setShowTranslation] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState<number | null>(null);
  const [confirmDelete, setConfirmDelete] = useState(false);

  useEffect(() => {
    let alive = true;
    (async () => {
      const found = await getSnap(db, account.id, id);
      const already = found ? await keptWords(db, account.id, found.target) : new Set<string>();
      if (!alive) return;
      setSnap(found);
      setKept(already);
      setPicked(new Set(found?.words.filter((w) => !already.has(w.word)).map((w) => w.word)));
    })().catch(() => alive && setSnap(null));
    return () => {
      alive = false;
    };
  }, [db, account.id, id]);

  const toggle = useCallback((word: string) => {
    setPicked((prev) => {
      const next = new Set(prev);
      if (next.has(word)) next.delete(word);
      else next.add(word);
      return next;
    });
  }, []);

  const hear = useCallback((text: string) => snap && say(text, snap.target), [snap]);

  if (snap === undefined) return <ActivityIndicator style={styles.center} color={c.muted} />;
  if (snap === null) {
    return (
      <View style={[styles.center, styles.pad]}>
        <Text style={t.muted}>This photo is no longer here.</Text>
      </View>
    );
  }

  const keep = async () => {
    if (saving || picked.size === 0) return;
    setSaving(true);
    try {
      const words = snap.words.filter((w) => picked.has(w.word));
      const added = await keepWords(db, account.id, snap, words, snap.id);
      if (process.env.EXPO_OS === 'ios') Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      setKept((prev) => new Set([...prev, ...words.map((w) => w.word)]));
      setPicked(new Set());
      setSaved(added);
    } finally {
      setSaving(false);
    }
  };

  const remove = async () => {
    const photo = await deleteSnap(db, account.id, snap.id);
    if (photo) deletePhoto(photo);
    router.back();
  };

  return (
    <ScrollView
      contentInsetAdjustmentBehavior="automatic"
      style={{ backgroundColor: c.background }}
      contentContainerStyle={[styles.pad, styles.content]}
    >
      <Stack.Screen options={{ title: snap.title }} />
      <Image source={{ uri: photoUri(snap.photo) }} style={[styles.photo, { backgroundColor: c.surface }]} contentFit="cover" />
      <Text style={t.body} selectable>
        {snap.explanation}
      </Text>

      <View style={[styles.block, { backgroundColor: c.surface }]}>
        <View style={styles.blockHead}>
          <Text style={t.label}>{showTranslation ? 'IN YOUR LANGUAGE' : 'WHAT IT SAYS'}</Text>
          <Pressable accessibilityRole="button" onPress={() => setShowTranslation((v) => !v)} hitSlop={8}>
            <Text style={{ color: c.accent, fontWeight: '600' }}>{showTranslation ? 'Show original' : 'Translate'}</Text>
          </Pressable>
        </View>
        <Text style={t.body} selectable>
          {showTranslation ? snap.translation : snap.source_text}
        </Text>
        {showTranslation ? null : (
          <Pressable accessibilityRole="button" onPress={() => hear(snap.source_text)} hitSlop={8}>
            <Text style={{ color: c.accent, fontWeight: '600' }}>Hear it read aloud</Text>
          </Pressable>
        )}
      </View>

      {snap.words.length > 0 ? (
        <View>
          <Text style={t.label}>WORDS WORTH KEEPING</Text>
          {snap.words.map((w) => (
            <WordPick key={w.word} word={w} picked={picked.has(w.word)} kept={kept.has(w.word)} onToggle={toggle} onHear={hear} />
          ))}
        </View>
      ) : null}

      {saved !== null ? (
        <View style={styles.gap}>
          <Notice tone="info" message={saved > 0 ? `Kept ${plural(saved, 'word')}. They are ready to practise.` : 'Those words were already in your list.'} />
          <Button label="Practise now" kind="secondary" onPress={() => router.navigate('/practise')} />
        </View>
      ) : null}
      {picked.size > 0 ? <Button label={`Keep ${plural(picked.size, 'word')}`} onPress={keep} busy={saving} /> : null}

      {confirmDelete ? (
        <View style={styles.gap}>
          <Text style={t.muted}>Delete this photo? Words you kept from it stay in your list.</Text>
          <Button label="Delete photo" kind="danger" onPress={remove} />
          <Button label="Keep it" kind="quiet" onPress={() => setConfirmDelete(false)} />
        </View>
      ) : (
        <Button label="Delete this photo" kind="quiet" onPress={() => setConfirmDelete(true)} />
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  pad: { padding: space.xl },
  content: { gap: space.xl, paddingBottom: space.xxl * 2 },
  photo: { width: '100%', aspectRatio: 4 / 3, borderRadius: radius, borderCurve: 'continuous' },
  block: { borderRadius: radius, borderCurve: 'continuous', padding: space.lg, gap: space.md },
  blockHead: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  gap: { gap: space.md },
});
