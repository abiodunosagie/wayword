// FILE: app/(tabs)/(snap)/index.tsx
// Snap: take or pick a photo of something around you and Claude reads it. Below, every photo read
// so far, newest first.
import { Image } from 'expo-image';
import { router } from 'expo-router';
import { useSQLiteContext } from 'expo-sqlite';
import { useCallback } from 'react';
import { ActivityIndicator, FlatList, StyleSheet, Text, View } from 'react-native';

import { Button } from '@/components/button';
import { Notice } from '@/components/notice';
import { SectionLabel } from '@/components/section-label';
import { PhotoRow } from '@/components/photo-row';
import { listSnaps } from '@/db/snaps';
import { plural, when } from '@/lib/format';
import { languageName } from '@/lib/languages';
import { photoUri } from '@/lib/photos';
import { useFocusLoad } from '@/hooks/use-focus-load';
import { useSnapReader } from '@/hooks/use-snap-reader';
import { useLanguagePair } from '@/state/prefs';
import { useAccount } from '@/state/session';
import { rounded, space, useTheme } from '@/theme/theme';

export default function SnapScreen() {
  const { c, t } = useTheme();
  const db = useSQLiteContext();
  const account = useAccount();
  const prefs = useLanguagePair();
  const reader = useSnapReader(account.id, prefs);
  const [list, reload] = useFocusLoad(useCallback(() => listSnaps(db, account.id, prefs.target), [db, account.id, prefs.target]));
  const snaps = list.state === 'ready' ? list.value : [];

  const open = useCallback((id: string) => router.push({ pathname: '/snap/[id]', params: { id } }), []);
  const { state } = reader;

  const header = (
    <View style={styles.header}>
      <Text style={t.muted}>
        Photograph a sign, a menu or a letter in {languageName(prefs.target)}. Claude reads it, explains it and picks the
        words worth keeping.
      </Text>
      {state.step === 'reading' ? (
        <View style={styles.reading}>
          <Image source={{ uri: state.uri }} style={[styles.preview, { backgroundColor: c.surface }]} contentFit="cover" />
          <View style={styles.readingRow}>
            <ActivityIndicator color={c.accent} />
            <Text style={t.body}>Reading the photo…</Text>
          </View>
          <Button label="Cancel" kind="secondary" onPress={reader.cancel} />
        </View>
      ) : (
        <View style={styles.actions}>
          <Button label="Take a photo" onPress={() => reader.start('camera')} disabled={state.step === 'preparing'} />
          <Button label="Choose a photo" kind="secondary" onPress={() => reader.start('library')} disabled={state.step === 'preparing'} />
        </View>
      )}
      {state.step === 'failed' ? (
        <View style={styles.actions}>
          <Notice message={state.message} />
          {state.photo ? <Button label="Try again" kind="secondary" onPress={reader.retry} /> : null}
        </View>
      ) : null}
      {list.state === 'error' ? (
        <View style={styles.actions}>
          <Notice message="Could not load your photos." />
          <Button label="Try again" kind="secondary" onPress={reload} />
        </View>
      ) : null}
      {snaps.length > 0 ? (
        <View style={styles.listLabel}>
          <SectionLabel>Read so far</SectionLabel>
        </View>
      ) : null}
    </View>
  );

  return (
    <FlatList
      contentInsetAdjustmentBehavior="automatic"
      style={{ backgroundColor: c.background }}
      contentContainerStyle={styles.content}
      data={snaps}
      keyExtractor={(s) => s.id}
      ListHeaderComponent={header}
      ListEmptyComponent={list.state === 'loading' ? <ActivityIndicator color={c.muted} /> : undefined}
      renderItem={({ item }) => (
        <PhotoRow
          uri={photoUri(item.photo)}
          title={item.title}
          detail={`${when(item.created_at)} · ${plural(item.words.length, 'word')}`}
          onPress={() => open(item.id)}
        />
      )}
    />
  );
}

const styles = StyleSheet.create({
  content: { paddingHorizontal: space.xl, paddingBottom: space.xxl },
  header: { gap: space.lg, paddingBottom: space.sm },
  actions: { gap: space.md },
  reading: { gap: space.md },
  preview: { width: '100%', aspectRatio: 4 / 3, ...rounded },
  readingRow: { flexDirection: 'row', alignItems: 'center', gap: space.md },
  listLabel: { marginTop: space.md },
});
