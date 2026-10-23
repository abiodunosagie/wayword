// FILE: components/notice.tsx
// A short message under a form or a request: what went wrong and what to do next.
import { StyleSheet, Text, View } from 'react-native';

import { rounded, space, useTheme } from '@/theme/theme';

export function Notice({ message, tone = 'error' }: { message: string; tone?: 'error' | 'info' }) {
  const { c, t } = useTheme();
  const color = tone === 'error' ? c.danger : c.ink;
  return (
    <View
      accessibilityRole="alert"
      style={[styles.box, { borderColor: tone === 'error' ? c.danger : c.line, backgroundColor: c.surface }]}
    >
      <Text style={[t.body, { color }]} selectable>
        {message}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  box: { borderWidth: 1, ...rounded, padding: space.md },
});
