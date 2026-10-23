// FILE: components/field.tsx
// A labelled text box with room for its error underneath.
import type { ComponentRef, Ref } from 'react';
import { StyleSheet, Text, TextInput, type TextInputProps, View } from 'react-native';

import { minTap, rounded, space, useTheme } from '@/theme/theme';

type Props = TextInputProps & { label: string; error?: string | null; ref?: Ref<ComponentRef<typeof TextInput>> };

export function Field({ label, error, style, ref, ...input }: Props) {
  const { c, t } = useTheme();
  return (
    <View style={styles.wrap}>
      <Text style={[t.label, { color: c.muted }]}>{label}</Text>
      <TextInput
        ref={ref}
        placeholderTextColor={c.muted}
        style={[styles.input, t.input, { backgroundColor: c.surface, borderColor: error ? c.danger : c.surface }, style]}
        accessibilityLabel={label}
        {...input}
      />
      {error ? <Text style={[t.small, { color: c.danger }]}>{error}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { gap: space.xs + 2 },
  input: { minHeight: minTap + space.sm, ...rounded, borderWidth: 1.5, paddingHorizontal: space.md + 2 },
});
