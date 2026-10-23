// FILE: components/list-row.tsx
// A plain list row: a title and an optional detail line.
import { memo } from 'react';
import { Text } from 'react-native';

import { useTheme } from '@/theme/theme';

import { Row } from './row';

export const ListRow = memo(function ListRow({ title, detail, onPress }: { title: string; detail?: string; onPress: () => void }) {
  const { t } = useTheme();
  return (
    <Row onPress={onPress} accessibilityLabel={detail ? `${title}, ${detail}` : title}>
      <Text style={t.body}>{title}</Text>
      {detail ? <Text style={t.small}>{detail}</Text> : null}
    </Row>
  );
});
