// FILE: app/(tabs)/(talk)/talk.tsx
// Rehearse real situations with Claude playing the other person: ones made from your own photos
// first, then everyday ones, then the conversations you already had.
import { router, useFocusEffect } from 'expo-router';
import { useSQLiteContext } from 'expo-sqlite';
import { useCallback, useState } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';

import { ListRow } from '@/components/list-row';
import { listSnaps } from '@/db/snaps';
import { createTalk, listTalks } from '@/db/talks';
import { plural, when } from '@/lib/format';
import { languageName } from '@/lib/languages';
import { EVERYDAY, fromSnaps, type Scenario } from '@/lib/scenarios';
import type { Talk } from '@/lib/types';
import { useLanguagePair } from '@/state/prefs';
import { useAccount } from '@/state/session';
import { space, useTheme } from '@/theme/theme';

export default function TalkScreen() {
  const { c, t } = useTheme();
  const db = useSQLiteContext();
  const account = useAccount();
  const prefs = useLanguagePair();
  const [mine, setMine] = useState<Scenario[]>([]);
  const [talks, setTalks] = useState<Talk[]>([]);

  useFocusEffect(
    useCallback(() => {
      listSnaps(db, account.id, prefs.target, 20).then((s) => setMine(fromSnaps(s)), () => setMine([]));
      listTalks(db, account.id, prefs.target).then(setTalks, () => setTalks([]));
    }, [db, account.id, prefs.target]),
  );

  const start = async (scenario: Scenario) => {
    const id = await createTalk(db, account.id, prefs, scenario);
    router.push({ pathname: '/talk/[id]', params: { id } });
  };

  const section = (label: string, rows: React.ReactNode) => (
    <View>
      <Text style={t.label}>{label}</Text>
      {rows}
    </View>
  );

  return (
    <ScrollView contentInsetAdjustmentBehavior="automatic" style={{ backgroundColor: c.background }} contentContainerStyle={styles.content}>
      <Text style={t.muted}>
        Claude plays the other person in {languageName(prefs.target)}, keeps it at your level and fixes your sentences as you go.
      </Text>
      {mine.length > 0
        ? section('FROM YOUR PHOTOS', mine.map((s) => <ListRow key={s.key} title={s.title} onPress={() => start(s)} />))
        : null}
      {section('EVERYDAY', EVERYDAY.map((s) => <ListRow key={s.key} title={s.title} onPress={() => start(s)} />))}
      {talks.some((x) => x.turns.length > 0)
        ? section(
            'YOUR CONVERSATIONS',
            talks
              .filter((x) => x.turns.length > 0)
              .map((x) => (
                <ListRow
                  key={x.id}
                  title={x.title}
                  detail={`${when(x.updated_at)} · ${plural(x.turns.length, 'line')}${x.finished ? ' · finished' : ''}`}
                  onPress={() => router.push({ pathname: '/talk/[id]', params: { id: x.id } })}
                />
              )),
          )
        : null}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  content: { padding: space.xl, gap: space.xl, paddingBottom: space.xxl * 2 },
});
