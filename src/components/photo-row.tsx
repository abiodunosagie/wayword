// FILE: components/photo-row.tsx
// One photo Claude has read, in a list: the photo, its title and when.
import { Image } from 'expo-image';
import { memo } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { useTheme } from '@/theme/theme';

import { Icon } from './icon';

type Props = { uri: string; title: string; detail: string; onPress: () => void };

export const PhotoRow = memo(function PhotoRow({ uri, title, detail, onPress }: Props) {
  const { c, t } = useTheme();
  return (
    <Pressable
      accessibilityRole="button"
      onPress={onPress}
      style={({ pressed }) => [styles.row, { borderColor: c.line, opacity: pressed ? 0.7 : 1 }]}
    >
      <Image source={{ uri }} style={[styles.thumb, { backgroundColor: c.surface }]} contentFit="cover" />
      <View style={styles.text}>
        <Text style={t.heading} numberOfLines={2}>
          {title}
        </Text>
        <Text style={t.small}>{detail}</Text>
      </View>
      <Icon name="chevron" size={14} color={c.muted} />
    </Pressable>
  );
});

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', gap: 14, paddingVertical: 12, borderBottomWidth: StyleSheet.hairlineWidth },
  thumb: { width: 64, height: 64, borderRadius: 10, borderCurve: 'continuous' },
  text: { flex: 1, gap: 2 },
});
