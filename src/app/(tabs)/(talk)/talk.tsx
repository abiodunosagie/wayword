// FILE: app/(tabs)/(talk)/talk.tsx
// Rehearse real situations with Claude playing the other person: ones made from your own photos
// first, then everyday ones, then the conversations you already had.
import { router } from 'expo-router';
import { useSQLiteContext } from 'expo-sqlite';
import { useCallback, useRef, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { Button } from '@/components/button';
import { ListRow } from '@/components/list-row';
import { Notice } from '@/components/notice';
import { Page } from '@/components/screen';
import { SectionLabel } from '@/components/section-label';
import { listSnaps } from '@/db/snaps';
import { createTalk, listTalks } from '@/db/talks';
import { useFocusLoad } from '@/hooks/use-focus-load';
import { plural, when } from '@/lib/format';
import { languageName } from '@/lib/languages';
import { EVERYDAY, fromSnaps, type Scenario } from '@/lib/scenarios';
import { useLanguagePair } from '@/state/prefs';
import { useAccount } from '@/state/session';
import { space, useTheme } from '@/theme/theme';

export default function TalkScreen() {
  const { t } = useTheme();
  const db = useSQLiteContext();
  const account = useAccount();
  const prefs = useLanguagePair();
  const [error, setError] = useState<string | null>(null);
  // One conversation at a time: a double tap must not start two.
  const starting = useRef(false);

  const [data, reload] = useFocusLoad(
    useCallback(async () => {
      const [snaps, talks] = await Promise.all([listSnaps(db, account.id, prefs.target, 20), listTalks(db, account.id, prefs.target)]);
      return { mine: fromSnaps(snaps), talks: talks.filter((x) => x.turns.length > 0) };
    }, [db, account.id, prefs.target]),
  );

  const start = async (scenario: Scenario) => {
    if (starting.current) return;
    starting.current = true;
    setError(null);
    try {
      const id = await createTalk(db, account.id, prefs, scenario);
      router.push({ pathname: '/talk/[id]', params: { id } });
    } catch {
      setError('Could not start that conversation. Try again.');
    } finally {
      starting.current = false;
    }
  };

  const mine = data.state === 'ready' ? data.value.mine : [];
  const talks = data.state === 'ready' ? data.value.talks : [];

  return (
    <Page>
      <Text style={t.muted}>
        Claude plays the other person in {languageName(prefs.target)}, keeps it at your level and fixes your sentences as you go.
      </Text>
      {error ? <Notice message={error} /> : null}
      {data.state === 'error' ? (
        <View style={styles.gap}>
          <Notice message="Could not load your photos and conversations." />
          <Button label="Try again" kind="secondary" onPress={reload} />
        </View>
      ) : null}
      {mine.length > 0 ? (
        <View>
          <SectionLabel>From your photos</SectionLabel>
          {mine.map((s) => (
            <ListRow key={s.key} title={s.title} onPress={() => start(s)} />
          ))}
        </View>
      ) : null}
      <View>
        <SectionLabel>Everyday</SectionLabel>
        {EVERYDAY.map((s) => (
          <ListRow key={s.key} title={s.title} onPress={() => start(s)} />
        ))}
      </View>
      {talks.length > 0 ? (
        <View>
          <SectionLabel>Your conversations</SectionLabel>
          {talks.map((x) => (
            <ListRow
              key={x.id}
              title={x.title}
              detail={`${when(x.updated_at)} · ${plural(x.turns.length, 'line')}${x.finished ? ' · finished' : ''}`}
              onPress={() => router.push({ pathname: '/talk/[id]', params: { id: x.id } })}
            />
          ))}
        </View>
      ) : null}
    </Page>
  );
}

const styles = StyleSheet.create({ gap: { gap: space.md } });
