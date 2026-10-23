// FILE: app/word/[id].tsx
// One kept word: how to say it (and hear it), what it means, an example, the photo it came from,
// and Ask Claude: any question about it, answered as it is written and kept on the card.
import { Image } from 'expo-image';
import { router, useLocalSearchParams } from 'expo-router';
import { useSQLiteContext } from 'expo-sqlite';
import { useCallback, useState } from 'react';
import { ActivityIndicator, KeyboardAvoidingView, Pressable, StyleSheet, Text, View } from 'react-native';

import { Button } from '@/components/button';
import { ConfirmAction } from '@/components/confirm-action';
import { Field } from '@/components/field';
import { Icon } from '@/components/icon';
import { Notice } from '@/components/notice';
import { RichText } from '@/components/rich-text';
import { Row } from '@/components/row';
import { LoadFailed, Loading, Missing, Page } from '@/components/screen';
import { SectionLabel } from '@/components/section-label';
import { deleteCard, getCard } from '@/db/cards';
import { getSnap } from '@/db/snaps';
import { useExplain } from '@/hooks/use-explain';
import { useRecord } from '@/hooks/use-record';
import { photoUri } from '@/lib/photos';
import { say } from '@/lib/speech';
import type { Card, Snap } from '@/lib/types';
import { useLanguagePair } from '@/state/prefs';
import { useAccount } from '@/state/session';
import { minTap, rounded, roundedSmall, space, thumb, useTheme } from '@/theme/theme';

const QUESTIONS = ['Why is it said this way?', 'How formal is it?', 'Give me three more examples.'];

export default function WordScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { c, t } = useTheme();
  const db = useSQLiteContext();
  const account = useAccount();
  const prefs = useLanguagePair();
  const [record, retry] = useRecord<{ card: Card; snap: Snap | null }>(
    useCallback(async () => {
      const card = await getCard(db, account.id, id);
      if (!card) return null;
      return { card, snap: card.snap_id ? await getSnap(db, account.id, card.snap_id) : null };
    }, [db, account.id, id]),
  );
  const ready = record.state === 'ready' ? record.value : null;
  const why = useExplain(account.id, prefs, ready?.card ?? null, ready?.snap?.source_text ?? '');
  const [question, setQuestion] = useState('');

  if (record.state === 'loading') return <Loading />;
  if (record.state === 'error') return <LoadFailed onRetry={retry} />;
  if (record.state === 'missing' || !ready) return <Missing message="This word is no longer in your list." />;
  const { card, snap } = ready;

  const askOwn = () => {
    const q = question.trim();
    if (!q || why.busy) return;
    why.ask(q);
    setQuestion('');
  };

  const remove = async () => {
    await deleteCard(db, account.id, card.id);
    router.back();
  };

  return (
    <KeyboardAvoidingView behavior={process.env.EXPO_OS === 'ios' ? 'padding' : undefined} style={styles.flex}>
      <Page>
        <View style={styles.head}>
          <View style={styles.flex}>
            <Text style={t.display} selectable>
              {card.word}
            </Text>
            {card.pronunciation ? <Text style={t.muted}>{card.pronunciation}</Text> : null}
          </View>
          <Pressable accessibilityRole="button" accessibilityLabel={`Hear ${card.word}`} style={styles.tap} onPress={() => say(card.word, card.target)}>
            <Icon name="speak" size={28} color={c.accent} />
          </Pressable>
        </View>
        <Text style={t.title}>{card.meaning}</Text>
        {card.note ? <Text style={t.body}>{card.note}</Text> : null}

        {card.example ? (
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={`Example: ${card.example}. ${card.example_meaning}`}
            accessibilityHint="Reads the example aloud"
            onPress={() => say(card.example, card.target)}
            style={({ pressed }) => [styles.block, { backgroundColor: c.surface, opacity: pressed ? 0.8 : 1 }]}
          >
            <SectionLabel>Example</SectionLabel>
            <Text style={t.heading} selectable>
              {card.example}
            </Text>
            {card.example_meaning ? <Text style={t.muted}>{card.example_meaning}</Text> : null}
          </Pressable>
        ) : null}

        {snap ? (
          <Row
            onPress={() => router.push({ pathname: '/snap/[id]', params: { id: snap.id } })}
            accessibilityLabel={`Where you found it: ${snap.title}`}
            leading={<Image source={{ uri: photoUri(snap.photo) }} style={[styles.thumb, { backgroundColor: c.surface }]} contentFit="cover" />}
          >
            <Text style={t.small}>Where you found it</Text>
            <Text style={t.heading}>{snap.title}</Text>
          </Row>
        ) : null}

        <View style={styles.gap}>
          <SectionLabel>Ask Claude</SectionLabel>
          {why.answer ? <RichText text={why.answer} /> : null}
          {why.busy && !why.answer ? <ActivityIndicator color={c.accent} accessibilityLabel="Claude is answering" /> : null}
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

        <ConfirmAction
          trigger="Remove this word"
          prompt={`Remove ${card.word} and its practice history?`}
          confirm="Remove word"
          onConfirm={remove}
        />
      </Page>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  head: { flexDirection: 'row', alignItems: 'flex-start', gap: space.md },
  tap: { minWidth: minTap, minHeight: minTap, alignItems: 'center', justifyContent: 'center' },
  block: { ...rounded, padding: space.lg, gap: space.sm },
  thumb: { width: thumb.small, height: thumb.small, ...roundedSmall },
  gap: { gap: space.md },
});
