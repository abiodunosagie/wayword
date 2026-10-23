// FILE: app/(tabs)/(week)/week.tsx
// This week: the words you kept in the last seven days, and a short story Claude writes from them
// at your level, so you read your own words in context.
import { router } from 'expo-router';
import { ActivityIndicator, ScrollView, StyleSheet, Text, View } from 'react-native';

import { Button } from '@/components/button';
import { ListRow } from '@/components/list-row';
import { Notice } from '@/components/notice';
import { StoryView } from '@/components/story-view';
import { MIN_STORY_WORDS, useWeek } from '@/hooks/use-week';
import { plural, when } from '@/lib/format';
import { useLanguagePair } from '@/state/prefs';
import { useAccount } from '@/state/session';
import { space, useTheme } from '@/theme/theme';

export default function WeekScreen() {
  const { c, t } = useTheme();
  const account = useAccount();
  const prefs = useLanguagePair();
  const week = useWeek(account.id, prefs);

  if (week.words === null) return <ActivityIndicator style={styles.center} color={c.muted} />;
  const [latest, ...older] = week.stories;
  const enough = week.words.length >= MIN_STORY_WORDS;

  return (
    <ScrollView contentInsetAdjustmentBehavior="automatic" style={{ backgroundColor: c.background }} contentContainerStyle={styles.content}>
      <View style={styles.gap}>
        <Text style={t.heading}>{plural(week.words.length, 'word')} kept in the last 7 days</Text>
        {week.words.length > 0 ? (
          <Text style={t.muted} selectable>
            {week.words.map((w) => w.word).join(', ')}
          </Text>
        ) : null}
        <Text style={t.muted}>
          {enough
            ? 'Claude writes a short story at your level with as many of them as fit.'
            : `Keep at least ${MIN_STORY_WORDS} words this week and Claude writes you a story with them.`}
        </Text>
        {enough ? <Button label={latest ? 'Write a new story' : "Write this week's story"} onPress={week.write} busy={week.busy} /> : null}
        {week.error ? <Notice message={week.error} /> : null}
      </View>
      {latest ? <StoryView story={latest} /> : null}
      {older.length > 0 ? (
        <View>
          <Text style={t.label}>EARLIER STORIES</Text>
          {older.map((s) => (
            <ListRow key={s.id} title={s.title} detail={when(s.created_at)} onPress={() => router.push({ pathname: '/story/[id]', params: { id: s.id } })} />
          ))}
        </View>
      ) : null}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  content: { padding: space.xl, gap: space.xxl, paddingBottom: space.xxl * 2 },
  gap: { gap: space.md },
});
