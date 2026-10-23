// FILE: components/notice.tsx
// A short message under a form or a request: what went wrong and what to do next.
import { StyleSheet, Text, View } from 'react-native';

import { radius, useTheme } from '@/theme/theme';

export function Notice({ message, tone = 'error' }: { message: string; tone?: 'error' | 'info' }) {
  const { c } = useTheme();
  const color = tone === 'error' ? c.danger : c.ink;
  return (
    <View
      accessibilityRole="alert"
      style={[styles.box, { borderColor: tone === 'error' ? c.danger : c.line, backgroundColor: c.surface }]}
    >
      <Text style={[styles.text, { color }]}>{message}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  box: { borderWidth: 1, borderRadius: radius, padding: 12 },
  text: { fontSize: 15, lineHeight: 21 },
});
