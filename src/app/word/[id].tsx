// FILE: app/word/[id].tsx
// One kept word: how to say it (and hear it), what it means, an example, the photo it came from,
// and Why?: ask Claude anything about it and read the answer as it is written.
import { Image } from 'expo-image';
import { router, Stack, useLocalSearchParams } from 'expo-router';
import { useSQLiteContext } from 'expo-sqlite';
import { useEffect, useState } from 'react';
import { ActivityIndicator, KeyboardAvoidingView, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import { Button } from '@/components/button';
import { Field } from '@/components/field';
import { Icon } from '@/components/icon';
import { Notice } from '@/components/notice';
import { RichText } from '@/components/rich-text';
import { deleteCard, getCard } from '@/db/cards';
import { getSnap } from '@/db/snaps';
import { useExplain } from '@/hooks/use-explain';
import { photoUri } from '@/lib/photos';
import { say } from '@/lib/speech';
import type { Card, Snap } from '@/lib/types';
import { useLanguagePair } from '@/state/prefs';
import { useAccount } from '@/state/session';
import { radius, space, useTheme } from '@/theme/theme';

const QUESTIONS = ['Why is it said this way?', 'How formal is it?', 'Give me three more examples.'];

export default function WordScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { c, t } = useTheme();
  const db = useSQLiteContext();
  const account = useAccount();
  const prefs = useLanguagePair();
  const [card, setCard] = useState<Card | null | undefined>(undefined);
  const [snap, setSnap] = useState<Snap | null>(null);
  const [question, setQuestion] = useState('');
  const [confirmDelete, setConfirmDelete] = useState(false);
  const why = useExplain(account.id, prefs, card ?? null, snap?.source_text ?? '');

  useEffect(() => {
    let alive = true;
    (async () => {
      const found = await getCard(db, account.id, id);
      const from = found?.snap_id ? await getSnap(db, account.id, found.snap_id) : null;
      if (alive) {
        setCard(found);
        setSnap(from);
      }
    })().catch(() => alive && setCard(null));
    return () => {
      alive = false;
    };
  }, [db, account.id, id]);

  if (card === undefined) return <ActivityIndicator style={styles.center} color={c.muted} />;
  if (card === null) {
    return (
      <View style={[styles.center, styles.pad]}>
        <Text style={t.muted}>This word is no longer in your list.</Text>
      </View>
    );
  }

  const askOwn = () => {
    const q = question.trim();
    if (!q) return;
    why.ask(q);
    setQuestion('');
  };

  const remove = async () => {
    await deleteCard(db, account.id, card.id);
    router.back();
  };

  return (
    <KeyboardAvoidingView behavior={process.env.EXPO_OS === 'ios' ? 'padding' : undefined} style={styles.flex}>
      <ScrollView
        contentInsetAdjustmentBehavior="automatic"
        keyboardShouldPersistTaps="handled"
        style={{ backgroundColor: c.background }}
        contentContainerStyle={[styles.pad, styles.content]}
      >
        <Stack.Screen options={{ title: '' }} />
        <View style={styles.head}>
          <View style={styles.flex}>
            <Text style={t.display} selectable>
              {card.word}
            </Text>
            {card.pronunciation ? <Text style={t.muted}>{card.pronunciation}</Text> : null}
          </View>
          <Pressable accessibilityRole="button" accessibilityLabel="Hear it" hitSlop={12} onPress={() => say(card.word, card.target)}>
            <Icon name="speak" size={28} color={c.accent} />
          </Pressable>
        </View>
        <Text style={t.title}>{card.meaning}</Text>
        {card.note ? <Text style={t.body}>{card.note}</Text> : null}

        {card.example ? (
          <Pressable
            accessibilityRole="button"
            accessibilityHint="Reads the example aloud"
            onPress={() => say(card.example, card.target)}
            style={[styles.block, { backgroundColor: c.surface }]}
          >
            <Text style={t.label}>EXAMPLE</Text>
            <Text style={t.heading} selectable>
              {card.example}
            </Text>
            {card.example_meaning ? <Text style={t.muted}>{card.example_meaning}</Text> : null}
          </Pressable>
        ) : null}

        {snap ? (
          <Pressable
            accessibilityRole="button"
            onPress={() => router.push({ pathname: '/snap/[id]', params: { id: snap.id } })}
            style={styles.from}
          >
            <Image source={{ uri: photoUri(snap.photo) }} style={[styles.thumb, { backgroundColor: c.surface }]} contentFit="cover" />
            <View style={styles.flex}>
              <Text style={t.small}>Where you found it</Text>
              <Text style={t.heading}>{snap.title}</Text>
            </View>
            <Icon name="chevron" size={14} color={c.muted} />
          </Pressable>
        ) : null}

        <View style={styles.gap}>
          <Text style={t.label}>ASK CLAUDE</Text>
          {why.answer ? <RichText text={why.answer} /> : null}
          {why.busy && !why.answer ? <ActivityIndicator color={c.accent} /> : null}
          {why.error ? <Notice message={why.error} /> : null}
          {QUESTIONS.map((q) => (
            <Button key={q} label={q} kind="secondary" disabled={why.busy} onPress={() => why.ask(q)} />
          ))}
          <Field
            label="Or ask your own question"
            value={question}
            onChangeText={setQuestion}
            placeholder={`Can I say ${card.word} to a friend?`}
            returnKeyType="send"
            onSubmitEditing={askOwn}
            maxLength={500}
          />
          {question.trim() ? <Button label="Ask" onPress={askOwn} busy={why.busy} /> : null}
        </View>

        {confirmDelete ? (
          <View style={styles.gap}>
            <Text style={t.muted}>Remove {card.word} and its practice history?</Text>
            <Button label="Remove word" kind="danger" onPress={remove} />
            <Button label="Keep it" kind="quiet" onPress={() => setConfirmDelete(false)} />
          </View>
        ) : (
          <Button label="Remove this word" kind="quiet" onPress={() => setConfirmDelete(true)} />
        )}
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  pad: { padding: space.xl },
  content: { gap: space.xl, paddingBottom: space.xxl * 2 },
  head: { flexDirection: 'row', alignItems: 'flex-start', gap: space.md },
  block: { borderRadius: radius, borderCurve: 'continuous', padding: space.lg, gap: space.sm },
  from: { flexDirection: 'row', alignItems: 'center', gap: space.md },
  thumb: { width: 52, height: 52, borderRadius: 10, borderCurve: 'continuous' },
  gap: { gap: space.md },
});
