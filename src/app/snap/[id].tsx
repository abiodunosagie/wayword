// FILE: app/snap/[id].tsx
// What Claude read in one photo: the photo, what it means for you, the text and its translation,
// and the words worth keeping. Tick the ones you want and keep them; they go straight into practice.
import * as Haptics from 'expo-haptics';
import { Image } from 'expo-image';
import { router, Stack, useLocalSearchParams } from 'expo-router';
import { useSQLiteContext } from 'expo-sqlite';
import { useCallback, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { Button } from '@/components/button';
import { ConfirmAction } from '@/components/confirm-action';
import { Notice } from '@/components/notice';
import { LoadFailed, Loading, Missing, Page } from '@/components/screen';
import { SectionLabel } from '@/components/section-label';
import { TextLink } from '@/components/text-link';
import { WordPick } from '@/components/word-pick';
import { keepWords, keptWords } from '@/db/cards';
import { deleteSnap, getSnap } from '@/db/snaps';
import { useRecord } from '@/hooks/use-record';
import { plural } from '@/lib/format';
import { deletePhoto, photoUri } from '@/lib/photos';
import { say } from '@/lib/speech';
import type { Snap } from '@/lib/types';
import { useAccount } from '@/state/session';
import { rounded, space, useTheme } from '@/theme/theme';

type Loaded = { snap: Snap; kept: Set<string> };

export default function SnapResult() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { c, t } = useTheme();
  const db = useSQLiteContext();
  const account = useAccount();
  const [record, retry] = useRecord<Loaded>(
    useCallback(async () => {
      const snap = await getSnap(db, account.id, id);
      return snap ? { snap, kept: await keptWords(db, account.id, snap.target) } : null;
    }, [db, account.id, id]),
  );
  // What you have changed on this screen; until then the ticks follow what is already kept.
  const [picked, setPicked] = useState<Set<string> | null>(null);
  const [keptNow, setKeptNow] = useState<Set<string>>(new Set());
  const [showTranslation, setShowTranslation] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState<number | null>(null);

  const hear = useCallback((text: string) => {
    if (record.state === 'ready') say(text, record.value.snap.target);
  }, [record]);

  const toggle = useCallback(
    (word: string) =>
      setPicked((prev) => {
        const base = prev ?? new Set(record.state === 'ready' ? record.value.snap.words.map((w) => w.word) : []);
        const next = new Set(base);
        if (next.has(word)) next.delete(word);
        else next.add(word);
        return next;
      }),
    [record],
  );

  if (record.state === 'loading') return <Loading />;
  if (record.state === 'error') return <LoadFailed onRetry={retry} />;
  if (record.state === 'missing') return <Missing message="This photo is no longer here." />;

  const { snap } = record.value;
  const kept = new Set([...record.value.kept, ...keptNow]);
  const chosen = new Set([...(picked ?? snap.words.map((w) => w.word))].filter((w) => !kept.has(w)));

  const keep = async () => {
    if (saving || chosen.size === 0) return;
    setSaving(true);
    try {
      const words = snap.words.filter((w) => chosen.has(w.word));
      const added = await keepWords(db, account.id, snap, words, snap.id);
      if (process.env.EXPO_OS === 'ios') Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      setKeptNow((prev) => new Set([...prev, ...words.map((w) => w.word)]));
      setPicked(new Set());
      setSaved(added);
    } catch {
      setSaved(-1);
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
    <Page>
      <Stack.Screen options={{ title: snap.title }} />
      <Image source={{ uri: photoUri(snap.photo) }} style={[styles.photo, { backgroundColor: c.surface }]} contentFit="cover" />
      <Text style={t.body} selectable>
        {snap.explanation}
      </Text>

      <View style={[styles.block, { backgroundColor: c.surface }]}>
        <SectionLabel>{showTranslation ? 'In your language' : 'What it says'}</SectionLabel>
        <Text style={t.body} selectable>
          {showTranslation ? snap.translation : snap.source_text}
        </Text>
        <View style={styles.links}>
          <TextLink label={showTranslation ? 'Show original' : 'Translate'} onPress={() => setShowTranslation((v) => !v)} />
          {showTranslation ? null : <TextLink label="Hear it read aloud" onPress={() => hear(snap.source_text)} />}
        </View>
      </View>

      {snap.words.length > 0 ? (
        <View>
          <SectionLabel>Words worth keeping</SectionLabel>
          {snap.words.map((w) => (
            <WordPick key={w.word} word={w} picked={chosen.has(w.word)} kept={kept.has(w.word)} onToggle={toggle} onHear={hear} />
          ))}
        </View>
      ) : null}

      {saved === -1 ? <Notice message="Could not keep those words. Try again." /> : null}
      {saved !== null && saved >= 0 ? (
        <View style={styles.gap}>
          <Notice
            tone="info"
            message={saved > 0 ? `Kept ${plural(saved, 'word')}. They are ready to practise.` : 'Those words were already in your list.'}
          />
          <Button label="Practise now" kind="secondary" onPress={() => router.navigate('/practise')} />
        </View>
      ) : null}
      {chosen.size > 0 ? <Button label={`Keep ${plural(chosen.size, 'word')}`} onPress={keep} busy={saving} /> : null}

      <ConfirmAction
        trigger="Delete this photo"
        prompt="Delete this photo? Words you kept from it stay in your list."
        confirm="Delete photo"
        onConfirm={remove}
      />
    </Page>
  );
}

const styles = StyleSheet.create({
  photo: { width: '100%', aspectRatio: 4 / 3, ...rounded },
  block: { ...rounded, padding: space.lg, gap: space.sm },
  links: { flexDirection: 'row', flexWrap: 'wrap', columnGap: space.xl },
  gap: { gap: space.md },
});
