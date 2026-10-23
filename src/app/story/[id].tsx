// FILE: app/story/[id].tsx
// An earlier story, to read again.
import { useLocalSearchParams } from 'expo-router';
import { useSQLiteContext } from 'expo-sqlite';
import { useCallback } from 'react';

import { LoadFailed, Loading, Missing, Page } from '@/components/screen';
import { StoryView } from '@/components/story-view';
import { getStory } from '@/db/stories';
import { useRecord } from '@/hooks/use-record';
import { useAccount } from '@/state/session';

export default function StoryScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const db = useSQLiteContext();
  const account = useAccount();
  const [record, retry] = useRecord(useCallback(() => getStory(db, account.id, id), [db, account.id, id]));

  if (record.state === 'loading') return <Loading />;
  if (record.state === 'error') return <LoadFailed onRetry={retry} />;
  if (record.state === 'missing') return <Missing message="This story is no longer here." />;
  return (
    <Page>
      <StoryView story={record.value} />
    </Page>
  );
}
