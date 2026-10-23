// FILE: components/field.tsx
// A labelled text box with room for its error underneath.
import type { ComponentRef, Ref } from 'react';
import { StyleSheet, Text, TextInput, type TextInputProps, View } from 'react-native';

import { radius, useTheme } from '@/theme/theme';

type Props = TextInputProps & { label: string; error?: string | null; ref?: Ref<ComponentRef<typeof TextInput>> };

export function Field({ label, error, style, ref, ...input }: Props) {
  const { c, t } = useTheme();
  return (
    <View style={styles.wrap}>
      <Text style={t.label}>{label.toUpperCase()}</Text>
      <TextInput
        ref={ref}
        placeholderTextColor={c.muted}
        style={[styles.input, { color: c.ink, backgroundColor: c.surface, borderColor: error ? c.danger : c.surface }, style]}
        accessibilityLabel={label}
        {...input}
      />
      {error ? <Text style={[t.small, { color: c.danger }]}>{error}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { gap: 6 },
  input: { minHeight: 52, borderRadius: radius, borderWidth: 1.5, paddingHorizontal: 14, fontSize: 17 },
});
