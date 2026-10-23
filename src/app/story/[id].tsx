// FILE: app/story/[id].tsx
// An earlier story, to read again.
import { useLocalSearchParams } from 'expo-router';
import { useSQLiteContext } from 'expo-sqlite';
import { useEffect, useState } from 'react';
import { ActivityIndicator, ScrollView, StyleSheet, Text } from 'react-native';

import { StoryView } from '@/components/story-view';
import { getStory } from '@/db/stories';
import type { Story } from '@/lib/types';
import { useAccount } from '@/state/session';
import { space, useTheme } from '@/theme/theme';

export default function StoryScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { c, t } = useTheme();
  const db = useSQLiteContext();
  const account = useAccount();
  const [story, setStory] = useState<Story | null | undefined>(undefined);

  useEffect(() => {
    getStory(db, account.id, id).then(setStory, () => setStory(null));
  }, [db, account.id, id]);

  if (story === undefined) return <ActivityIndicator style={styles.center} color={c.muted} />;
  return (
    <ScrollView contentInsetAdjustmentBehavior="automatic" style={{ backgroundColor: c.background }} contentContainerStyle={styles.content}>
      {story ? <StoryView story={story} /> : <Text style={t.muted}>This story is no longer here.</Text>}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  content: { padding: space.xl, paddingBottom: space.xxl * 2 },
});
