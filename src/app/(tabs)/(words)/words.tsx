// FILE: app/(tabs)/(words)/words.tsx
// Every word you kept, newest first, with a search box in the header. A marigold dot marks the
// ones due for practice.
import { router, Stack } from 'expo-router';
import { useSQLiteContext } from 'expo-sqlite';
import { useCallback, useMemo, useState } from 'react';
import { ActivityIndicator, FlatList, StyleSheet, Text, View } from 'react-native';

import { Button } from '@/components/button';
import { Notice } from '@/components/notice';
import { WordRow } from '@/components/word-row';
import { listCards } from '@/db/cards';
import { plural } from '@/lib/format';
import { useFocusLoad } from '@/hooks/use-focus-load';
import { useLanguagePair } from '@/state/prefs';
import { useAccount } from '@/state/session';
import { space, useTheme } from '@/theme/theme';

export default function WordsScreen() {
  const { c, t } = useTheme();
  const db = useSQLiteContext();
  const account = useAccount();
  const prefs = useLanguagePair();
  const [query, setQuery] = useState('');
  // The time is taken with the list, so the due dots match the moment it was loaded.
  const [list, reload] = useFocusLoad(
    useCallback(async () => ({ cards: await listCards(db, account.id, prefs.target), now: Date.now() }), [db, account.id, prefs.target]),
  );
  const cards = list.state === 'ready' ? list.value.cards : null;
  const now = list.state === 'ready' ? list.value.now : 0;

  const shown = useMemo(() => {
    const q = query.trim().toLocaleLowerCase();
    if (!cards || !q) return cards ?? [];
    return cards.filter((card) => card.word.toLocaleLowerCase().includes(q) || card.meaning.toLocaleLowerCase().includes(q));
  }, [cards, query]);

  const open = useCallback((id: string) => router.push({ pathname: '/word/[id]', params: { id } }), []);

  const empty =
    list.state === 'error' ? (
      <View style={styles.header}>
        <Notice message="Could not load your words." />
        <Button label="Try again" kind="secondary" onPress={reload} />
      </View>
    ) : cards === null ? (
      <ActivityIndicator color={c.muted} />
    ) : cards.length === 0 ? (
      <Text style={t.muted}>No words yet. Snap a sign or a menu and keep the words you want to learn.</Text>
    ) : (
      <Text style={t.muted}>No word matches “{query.trim()}”.</Text>
    );

  return (
    <>
      <Stack.Screen
        options={{
          headerSearchBarOptions: { placeholder: 'Search your words', onChangeText: (e) => setQuery(e.nativeEvent.text) },
        }}
      />
      <FlatList
        contentInsetAdjustmentBehavior="automatic"
        keyboardShouldPersistTaps="handled"
        style={{ backgroundColor: c.background }}
        contentContainerStyle={styles.content}
        data={shown}
        keyExtractor={(card) => card.id}
        ListHeaderComponent={
          cards && cards.length > 0 ? (
            <View style={styles.header}>
              <Text style={t.small}>{plural(cards.length, 'word')} kept</Text>
            </View>
          ) : undefined
        }
        ListEmptyComponent={empty}
        renderItem={({ item }) => (
          <WordRow id={item.id} word={item.word} meaning={item.meaning} due={item.due <= now} onOpen={open} />
        )}
      />
    </>
  );
}

const styles = StyleSheet.create({
  content: { paddingHorizontal: space.xl, paddingBottom: space.xxl },
  header: { paddingBottom: space.sm, gap: space.md },
});
