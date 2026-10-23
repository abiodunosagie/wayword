// FILE: app/talk/[id].tsx
// A role play in progress: Claude opens the scene, you answer in the language you are learning,
// and it replies in role with your line said naturally underneath when it needed fixing.
import * as Haptics from 'expo-haptics';
import { useLocalSearchParams } from 'expo-router';
import { useSQLiteContext } from 'expo-sqlite';
import { useCallback, useEffect, useRef, useState } from 'react';
import { ActivityIndicator, FlatList, KeyboardAvoidingView, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';

import { Loading, Missing } from '@/components/screen';
import { SectionLabel } from '@/components/section-label';

import { Button } from '@/components/button';
import { Icon } from '@/components/icon';
import { Notice } from '@/components/notice';
import { TalkBubble } from '@/components/talk-bubble';
import { keepWords, keptWords } from '@/db/cards';
import { useTalk } from '@/hooks/use-talk';
import { languageName } from '@/lib/languages';
import { needsReply, outOfRoom, yourTurn } from '@/lib/talk-rules';
import { say } from '@/lib/speech';
import { useLanguagePair } from '@/state/prefs';
import { useAccount } from '@/state/session';
import { minTap, rounded, space, useTheme } from '@/theme/theme';

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

  if (talk === undefined) return <Loading />;
  if (talk === null) return <Missing message="This conversation is no longer here." />;

  const canSpeak = yourTurn(talk) && !busy;
  const submit = () => {
    if (!draft.trim() || !canSpeak) return;
    send(draft);
    setDraft('');
  };

  return (
    <KeyboardAvoidingView
      behavior={process.env.EXPO_OS === 'ios' ? 'padding' : undefined}
      // The native header's height, so the composer lifts clear of the keyboard under it.
      keyboardVerticalOffset={process.env.EXPO_OS === 'ios' ? 100 : 0}
      style={[styles.flex, { backgroundColor: c.background }]}
    >
      <FlatList
        ref={list}
        contentInsetAdjustmentBehavior="automatic"
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={styles.list}
        data={talk.turns}
        // Turns are only ever appended, so a turn's position is a stable key.
        keyExtractor={(_, i) => String(i)}
        onContentSizeChange={() => list.current?.scrollToEnd({ animated: true })}
        ListHeaderComponent={
          <View style={styles.scene}>
            <SectionLabel>The situation</SectionLabel>
            <Text style={t.heading}>{talk.title}</Text>
          </View>
        }
        renderItem={({ item }) => <TalkBubble turn={item} kept={kept} onHear={hear} onKeep={keep} />}
        ListFooterComponent={
          <View style={styles.footer}>
            {busy ? <ActivityIndicator color={c.accent} /> : null}
            {error ? <Notice message={error} /> : null}
            {error && needsReply(talk) ? <Button label="Try again" kind="secondary" onPress={retry} /> : null}
            {talk.finished ? <Notice tone="info" message="That is the end of the scene. Well done. Start another from the Talk tab." /> : null}
            {outOfRoom(talk) ? <Notice tone="info" message="This scene is as long as it can get. Start a new one from the Talk tab to keep going." /> : null}
          </View>
        }
      />
      {!yourTurn(talk) && !busy ? null : (
        <View style={[styles.composer, { borderColor: c.line, backgroundColor: c.background }]}>
          <TextInput
            value={draft}
            onChangeText={setDraft}
            placeholder={`Answer in ${languageName(prefs.target)}`}
            placeholderTextColor={c.muted}
            style={[styles.input, t.input, { backgroundColor: c.surface }]}
            multiline
            maxLength={1000}
            accessibilityLabel="Your reply"
          />
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Send"
            accessibilityState={{ disabled: !canSpeak || !draft.trim() }}
            onPress={submit}
            style={[styles.send, { opacity: !canSpeak || !draft.trim() ? 0.4 : 1 }]}
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
  list: { padding: space.xl, gap: space.lg },
  scene: { gap: space.xs, paddingBottom: space.sm },
  footer: { gap: space.md },
  composer: { flexDirection: 'row', alignItems: 'flex-end', gap: space.md, padding: space.md, paddingBottom: space.xl, borderTopWidth: StyleSheet.hairlineWidth },
  input: { flex: 1, minHeight: minTap, maxHeight: 140, ...rounded, paddingHorizontal: space.md + 2, paddingVertical: space.md - 1 },
  send: { minWidth: minTap, minHeight: minTap, alignItems: 'center', justifyContent: 'center' },
});
