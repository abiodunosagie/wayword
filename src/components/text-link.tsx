// FILE: components/text-link.tsx
// A short text action inside content ("Translate", "Meaning"): accent text with a full-size tap
// target and pressed feedback, so it is as easy to hit as a button.
import { Pressable, StyleSheet, Text } from 'react-native';

import { minTap, useTheme } from '@/theme/theme';

type Props = { label: string; onPress: () => void; accessibilityLabel?: string };

export function TextLink({ label, onPress, accessibilityLabel }: Props) {
  const { t } = useTheme();
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
      onPress={onPress}
      style={({ pressed }) => [styles.link, { opacity: pressed ? 0.6 : 1 }]}
    >
      <Text style={t.link}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  link: { minHeight: minTap, justifyContent: 'center', alignSelf: 'flex-start' },
});
