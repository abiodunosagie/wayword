// FILE: app/talk/[id].tsx
// A role play in progress: Claude opens the scene, you answer in the language you are learning,
// and it replies in role with your line said naturally underneath when it needed fixing.
import * as Haptics from 'expo-haptics';
import { Stack, useLocalSearchParams } from 'expo-router';
import { useSQLiteContext } from 'expo-sqlite';
import { useCallback, useEffect, useRef, useState } from 'react';
import { ActivityIndicator, FlatList, KeyboardAvoidingView, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';

import { Button } from '@/components/button';
import { Icon } from '@/components/icon';
import { Notice } from '@/components/notice';
import { TalkBubble } from '@/components/talk-bubble';
import { keepWords, keptWords } from '@/db/cards';
import { useTalk } from '@/hooks/use-talk';
import { languageName } from '@/lib/languages';
import { say } from '@/lib/speech';
import { useLanguagePair } from '@/state/prefs';
import { useAccount } from '@/state/session';
import { radius, space, useTheme } from '@/theme/theme';

export default function TalkConversation() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { c, t } = useTheme();
  const db = useSQLiteContext();
  const account = useAccount();
  const prefs = useLanguagePair();
  const { talk, busy, error, send, retry } = useTalk(account.id, prefs, id);
  const [draft, setDraft] = useState('');
  const [kept, setKept] = useState<Set<string>>(new Set());
  const list = useRef<FlatList>(null);

  useEffect(() => {
    keptWords(db, account.id, prefs.target).then(setKept, () => {});
  }, [db, account.id, prefs.target]);

  const hear = useCallback((text: string) => say(text, prefs.target), [prefs.target]);
  const keep = useCallback(
    async (word: { word: string; meaning: string }) => {
      await keepWords(db, account.id, prefs, [word], null);
      if (process.env.EXPO_OS === 'ios') Haptics.selectionAsync();
      setKept((prev) => new Set([...prev, word.word]));
    },
    [db, account.id, prefs],
  );

  if (talk === undefined) return <ActivityIndicator style={styles.center} color={c.muted} />;
  if (talk === null) {
    return (
      <View style={[styles.center, styles.pad]}>
        <Text style={t.muted}>This conversation is no longer here.</Text>
      </View>
    );
  }

  const submit = () => {
    if (!draft.trim() || busy) return;
    send(draft);
    setDraft('');
  };
  const lastIsUser = talk.turns[talk.turns.length - 1]?.role === 'user' || talk.turns.length === 0;

  return (
    <KeyboardAvoidingView
      behavior={process.env.EXPO_OS === 'ios' ? 'padding' : undefined}
      keyboardVerticalOffset={process.env.EXPO_OS === 'ios' ? 100 : 0}
      style={[styles.flex, { backgroundColor: c.background }]}
    >
      <Stack.Screen options={{ title: 'Talk' }} />
      <FlatList
        ref={list}
        contentInsetAdjustmentBehavior="automatic"
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={styles.list}
        data={talk.turns}
        keyExtractor={(_, i) => String(i)}
        onContentSizeChange={() => list.current?.scrollToEnd({ animated: true })}
        ListHeaderComponent={
          <View style={styles.scene}>
            <Text style={t.label}>THE SITUATION</Text>
            <Text style={t.heading}>{talk.title}</Text>
          </View>
        }
        renderItem={({ item }) => <TalkBubble turn={item} kept={kept} onHear={hear} onKeep={keep} />}
        ListFooterComponent={
          <View style={styles.footer}>
            {busy ? <ActivityIndicator color={c.accent} /> : null}
            {error ? <Notice message={error} /> : null}
            {error && lastIsUser ? <Button label="Try again" kind="secondary" onPress={retry} /> : null}
            {talk.finished ? <Notice tone="info" message="That is the end of the scene. Well done. Start another from the Talk tab." /> : null}
          </View>
        }
      />
      {talk.finished ? null : (
        <View style={[styles.composer, { borderColor: c.line, backgroundColor: c.background }]}>
          <TextInput
            value={draft}
            onChangeText={setDraft}
            placeholder={`Answer in ${languageName(prefs.target)}`}
            placeholderTextColor={c.muted}
            style={[styles.input, { color: c.ink, backgroundColor: c.surface }]}
            multiline
            maxLength={1000}
            accessibilityLabel="Your reply"
          />
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Send"
            accessibilityState={{ disabled: busy || !draft.trim() }}
            onPress={submit}
            hitSlop={8}
            style={{ opacity: busy || !draft.trim() ? 0.4 : 1 }}
          >
            <Icon name="send" size={34} color={c.accent} />
          </Pressable>
        </View>
      )}
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  pad: { padding: space.xl },
  list: { padding: space.xl, gap: space.lg },
  scene: { gap: space.xs, paddingBottom: space.sm },
  footer: { gap: space.md },
  composer: { flexDirection: 'row', alignItems: 'flex-end', gap: space.md, padding: space.md, paddingBottom: space.xl, borderTopWidth: StyleSheet.hairlineWidth },
  input: { flex: 1, minHeight: 44, maxHeight: 140, borderRadius: radius, borderCurve: 'continuous', paddingHorizontal: 14, paddingTop: 11, paddingBottom: 11, fontSize: 17 },
});
