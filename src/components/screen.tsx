// FILE: components/screen.tsx
// The pieces every screen shares: the scrolling page with the standard padding, and the loading,
// not-found and failed states, so no screen invents its own.
import type { ReactNode } from 'react';
import { ActivityIndicator, ScrollView, type ScrollViewProps, StyleSheet, Text, View } from 'react-native';

import { space, useTheme } from '@/theme/theme';

import { Button } from './button';

export function Page({ children, gap = space.xl, ...scroll }: ScrollViewProps & { children: ReactNode; gap?: number }) {
  const { c } = useTheme();
  return (
    <ScrollView
      contentInsetAdjustmentBehavior="automatic"
      keyboardShouldPersistTaps="handled"
      style={{ backgroundColor: c.background }}
      contentContainerStyle={[styles.page, { gap }]}
      {...scroll}
    >
      {children}
    </ScrollView>
  );
}

export function Loading() {
  const { c } = useTheme();
  return <ActivityIndicator style={styles.center} color={c.muted} accessibilityLabel="Loading" />;
}

export function Missing({ message }: { message: string }) {
  const { c, t } = useTheme();
  return (
    <View style={[styles.center, styles.pad, { backgroundColor: c.background }]}>
      <Text style={t.muted}>{message}</Text>
    </View>
  );
}

export function LoadFailed({ onRetry }: { onRetry: () => void }) {
  const { c, t } = useTheme();
  return (
    <View style={[styles.center, styles.pad, styles.gap, { backgroundColor: c.background }]}>
      <Text style={t.muted}>Could not open this. Try again.</Text>
      <Button label="Try again" kind="secondary" onPress={onRetry} />
    </View>
  );
}

const styles = StyleSheet.create({
  page: { padding: space.xl, paddingBottom: space.xxl * 2 },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  pad: { padding: space.xl },
  gap: { gap: space.lg, alignSelf: 'stretch' },
});
