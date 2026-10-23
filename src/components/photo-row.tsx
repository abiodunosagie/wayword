// FILE: components/photo-row.tsx
// One photo Claude has read, in a list: the photo, its title and when.
import { Image } from 'expo-image';
import { memo } from 'react';
import { StyleSheet, Text } from 'react-native';

import { roundedSmall, thumb, useTheme } from '@/theme/theme';

import { Row } from './row';

type Props = { uri: string; title: string; detail: string; onPress: () => void };

export const PhotoRow = memo(function PhotoRow({ uri, title, detail, onPress }: Props) {
  const { c, t } = useTheme();
  return (
    <Row
      onPress={onPress}
      accessibilityLabel={`${title}, ${detail}`}
      leading={<Image source={{ uri }} style={[styles.thumb, { backgroundColor: c.surface }]} contentFit="cover" />}
    >
      <Text style={t.heading} numberOfLines={2}>
        {title}
      </Text>
      <Text style={t.small}>{detail}</Text>
    </Row>
  );
});

const styles = StyleSheet.create({ thumb: { width: thumb.medium, height: thumb.medium, ...roundedSmall } });
